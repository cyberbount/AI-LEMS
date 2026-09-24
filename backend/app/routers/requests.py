from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import BorrowRequest, Device, MaintenanceRecord, UsageHistory, User
from app.schemas import IncidentReportCreate, RequestCreate, RequestOut, RequestStatus
from app.schemas import IncidentReportCreate, RequestCreate, RequestOut, RequestStatus, ReturnConfirmRequest
from app.services.audit_service import record_audit_log
from app.utils.tz import VIETNAM_TZ, hanoi_now_naive

router = APIRouter(prefix="/api/requests", tags=["requests"])


@router.get("", response_model=list[RequestOut])
def requests(db: Db, user: Annotated[User, Depends(current_user)]):
    return db.query(BorrowRequest).filter(BorrowRequest.user_id == user.id if user.role == "user" else True).order_by(BorrowRequest.id.desc()).all()


@router.post("", response_model=RequestOut, status_code=201)
def create_request(data: RequestCreate, db: Db, user: Annotated[User, Depends(current_user)]):
    device = db.get(Device, data.device_id)
    if not device:
        raise HTTPException(404, "Device not found")
    if device.status != "available":
        raise HTTPException(409, "Thiết bị hiện không khả dụng để mượn.")

    now = hanoi_now_naive()
    req_from = data.requested_from.astimezone(VIETNAM_TZ).replace(tzinfo=None) if data.requested_from and data.requested_from.tzinfo else data.requested_from
    req_to = data.requested_to.astimezone(VIETNAM_TZ).replace(tzinfo=None) if data.requested_to and data.requested_to.tzinfo else data.requested_to

    if req_from and req_from < now - timedelta(minutes=15):
        raise HTTPException(400, "Thời gian bắt đầu mượn không thể ở trong quá khứ. Vui lòng chọn từ thời điểm hiện tại trở đi.")
    if req_to and req_from and req_to <= req_from:
        raise HTTPException(400, "Thời gian hẹn trả máy phải sau thời gian bắt đầu mượn.")
    if req_to and req_to <= now - timedelta(minutes=5):
        raise HTTPException(400, "Thời gian hẹn trả máy không thể ở trong quá khứ.")

    item = BorrowRequest(**data.model_dump(), user_id=user.id)
    item = BorrowRequest(
        user_id=user.id,
        device_id=data.device_id,
        purpose=data.purpose,
        requested_from=req_from,
        requested_to=req_to,
        created_at=now,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    date_str = ""
    if item.requested_to:
        date_str = f", Hẹn trả: {item.requested_to.strftime('%d/%m/%Y %H:%M')}"

    record_audit_log(
        db=db,
        user=user,
        action="BORROW_REQUEST",
        target_type="REQUEST",
        target_id=item.id,
        target_name=f"Thiết bị #{device.id} - {device.name}",
        details=f"Gửi yêu cầu mượn: {item.purpose}{date_str}",
    )
    db.commit()
    return item


@router.patch("/{request_id}/status", response_model=RequestOut)
def set_status(request_id: int, status: RequestStatus, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    item = db.get(BorrowRequest, request_id)
    if not item:
        raise HTTPException(404, "Request not found")
    transitions = {"pending": {"approved", "rejected"}, "approved": {"borrowed", "rejected"}, "borrowed": {"returned"}}
    transitions = {
        "pending": {"approved", "rejected"},
        "approved": {"borrowed", "rejected"},
        "borrowed": {"return_pending", "returned"},
        "return_pending": {"returned"},
    }
    if status not in transitions.get(item.status, set()):
        raise HTTPException(409, f"Không thể chuyển trạng thái từ {item.status} sang {status}")
    device = db.get(Device, item.device_id)
    if status == "approved" and device.status != "available":
        raise HTTPException(409, "Thiết bị không còn ở trạng thái sẵn sàng")

    old_status = item.status
    if status == "approved":
        device.status = "reserved"
    elif status == "borrowed":
        device.status = "borrowed"
    elif status == "return_pending":
        device.status = "returning"
    elif status == "returned":
        device.status = "available"

    item.status = status
    db.add(UsageHistory(user_id=item.user_id, device_id=item.device_id, borrow_request_id=item.id, action=status))

    action_map = {
        "approved": "APPROVE",
        "rejected": "REJECT",
        "borrowed": "HANDOVER",
        "return_pending": "RETURN_REQUESTED",
        "returned": "RETURN",
    }
    record_audit_log(
        db=db,
        user=user,
        action=action_map.get(status, "STATUS_CHANGE"),
        target_type="REQUEST",
        target_id=item.id,
        target_name=f"Thiết bị #{device.id} - {device.name}",
        details=f"Đổi trạng thái yêu cầu #{item.id}: {old_status} -> {status}",
    )
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{request_id}/approve", response_model=RequestOut)
def approve(request_id: int, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    return set_status(request_id, "approved", db, user)


@router.patch("/{request_id}/borrow", response_model=RequestOut)
def borrow(request_id: int, db: Db, user: Annotated[User, Depends(current_user)]):
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != user.id and user.role not in {"admin", "manager"}):
        raise HTTPException(404, "Request not found")
    return set_status(request_id, "borrowed", db, user)


@router.patch("/{request_id}/request-return", response_model=RequestOut)
def request_return(request_id: int, db: Db, user: Annotated[User, Depends(current_user)]):
    """Bước 1: Người dùng gửi yêu cầu hoàn trả thiết bị, chờ Quản lý/KTV kiểm tra."""
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != user.id and user.role not in {"admin", "manager"}):
        raise HTTPException(404, "Yêu cầu mượn không tồn tại.")
    if item.status != "borrowed":
        raise HTTPException(409, f"Không thể báo hoàn trả khi đơn đang ở trạng thái '{item.status}'.")

    device = db.get(Device, item.device_id)
    item.status = "return_pending"
    if device:
        device.status = "returning"

    record_audit_log(
        db=db,
        user=user,
        action="RETURN_REQUESTED",
        target_type="REQUEST",
        target_id=item.id,
        target_name=f"Thiết bị #{item.device_id} - {device.name if device else ''}",
        details=f"Người dùng @{user.username} đã gửi yêu cầu hoàn trả thiết bị, chờ Quản lý/KTV kiểm tra nghiệm thu.",
    )
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{request_id}/confirm-return", response_model=RequestOut)
def confirm_return(
    request_id: int,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))],
    data: ReturnConfirmRequest | None = None,
):
    """Bước 2: Quản lý hoặc Kỹ thuật viên kiểm tra tình trạng máy và xác nhận nhận trả vào kho."""
    item = db.get(BorrowRequest, request_id)
    if not item:
        raise HTTPException(404, "Yêu cầu mượn không tồn tại.")
    if item.status not in {"borrowed", "return_pending"}:
        raise HTTPException(409, f"Không thể xác nhận hoàn trả cho đơn ở trạng thái '{item.status}'.")

    device = db.get(Device, item.device_id)

    # Chặn hoàn trả thông thường nếu thiết bị đang trong quy trình xử lý sự cố kỹ thuật
    if device and device.status in ["pending_inspection", "in_progress", "replace_partial", "replace_full"]:
        open_incident = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.device_id == device.id,
            MaintenanceRecord.kind == "incident",
            MaintenanceRecord.status.in_(["open", "in_progress"])
        ).first()
        if open_incident:
            raise HTTPException(
                400,
                f"Thiết bị '{device.name}' ({device.asset_code}) đang có báo cáo sự cố chưa được Kỹ thuật viên nghiệm thu xong. "
                "Không thể xác nhận hoàn trả nhập kho thông thường. Vui lòng chuyển giao cho Kỹ thuật viên tiếp nhận và xử lý sự cố trước."
            )

    condition = data.condition if data and data.condition else (device.condition if device else "Đã qua sử dụng - Hoạt động tốt")
    notes = data.notes if data and data.notes else ""

    item.status = "returned"
    is_faulty = any(kw in condition.lower() for kw in ["hỏng", "lỗi", "sự cố", "damaged", "faulty"])

    if device:
        device.condition = condition
        if is_faulty:
            device.status = "maintenance"
            maint = MaintenanceRecord(
                device_id=device.id,
                technician_id=user.id if user.role == "technician" else None,
                kind="inspection",
                notes=f"[Nghiệm thu hoàn trả từ @{item.user.username if item.user else 'user'}]: {condition}. Ghi chú: {notes}",
                status="open",
            )
            db.add(maint)
        else:
            device.status = "available"

    db.add(UsageHistory(user_id=item.user_id, device_id=item.device_id, borrow_request_id=item.id, action="returned"))

    borrower_name = item.user.username if item.user else f"User #{item.user_id}"
    audit_details = f"Cán bộ @{user.username} ({user.role}) đã kiểm tra và xác nhận nhận trả thiết bị từ @{borrower_name}. Tình trạng: {condition}."
    if notes:
        audit_details += f" Ghi chú kiểm tra: {notes}."
    if is_faulty:
        audit_details += " [CẢNH BÁO]: Thiết bị phát hiện lỗi, hệ thống đã tự động chuyển sang chế độ bảo trì."

    record_audit_log(
        db=db,
        user=user,
        action="RETURN_CONFIRMED",
        target_type="REQUEST",
        target_id=item.id,
        target_name=f"Thiết bị #{item.device_id} - {device.name if device else ''}",
        details=audit_details,
    )
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{request_id}/return", response_model=RequestOut)
def return_device(request_id: int, db: Db, user: Annotated[User, Depends(current_user)]):
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != user.id and user.role not in {"admin", "manager", "technician"}):
        raise HTTPException(404, "Request not found")
    if item.status not in {"borrowed", "return_pending"}:
        raise HTTPException(409, "Yêu cầu mượn này chưa ở trạng thái đang mượn.")

    device = db.get(Device, item.device_id)
    if device and device.status in ["pending_inspection", "in_progress", "replace_partial", "replace_full"]:
        open_incident = db.query(MaintenanceRecord).filter(
            MaintenanceRecord.device_id == device.id,
            MaintenanceRecord.kind == "incident",
            MaintenanceRecord.status.in_(["open", "in_progress"])
        ).first()
        if open_incident:
            raise HTTPException(
                400,
                f"Thiết bị '{device.name}' đang có báo cáo sự cố chưa được Kỹ thuật viên nghiệm thu xong. "
                "Không thể hoàn trả nhập kho thông thường."
            )

    item.status = "returned"
    if device:
        device.status = "available"
    db.add(UsageHistory(user_id=item.user_id, device_id=item.device_id, borrow_request_id=item.id, action="returned"))

    record_audit_log(
        db=db,
        user=user,
        action="RETURN",
        target_type="REQUEST",
        target_id=item.id,
        target_name=f"Thiết bị #{item.device_id} - {device.name if device else ''}",
        details=f"Xác nhận hoàn trả thiết bị về phòng thí nghiệm an toàn.",
    )
    db.commit()
    db.refresh(item)
    return item


@router.post("/{request_id}/incident", response_model=RequestOut)
def report_incident(
    request_id: int,
    data: IncidentReportCreate,
    db: Db,
    user: Annotated[User, Depends(current_user)],
):
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != user.id and user.role not in {"admin", "manager", "technician"}):
        raise HTTPException(404, "Yêu cầu mượn không tồn tại.")
    if item.status != "borrowed":
        raise HTTPException(400, "Chỉ có thể báo cáo sự cố khi thiết bị đang trong trạng thái mượn.")

    device = db.get(Device, item.device_id)
    if not device:
        raise HTTPException(404, "Thiết bị không tồn tại.")

    # 1. Chuyển thiết bị sang chờ tiếp nhận kiểm tra (Technician phải xác nhận)
    device.status = "pending_inspection"
    device.condition = "Hỏng hóc / Lỗi phần cứng"

    # 2. Tạo bản ghi bảo trì khẩn cấp
    maint = MaintenanceRecord(
        device_id=device.id,
        technician_id=None,
        kind="incident",
        notes=f"[BÁO CÁO SỰ CỐ KHẨN CẤP TỪ @{user.username}]: {data.description}",
        status="open",
    )
    db.add(maint)

    # 3. Ghi log kiểm toán
    record_audit_log(
        db=db,
        user=user,
        action="INCIDENT_REPORT",
        target_type="DEVICE",
        target_id=device.id,
        target_name=f"{device.name} ({device.asset_code})",
        details=f"Báo cáo sự cố khi đang sử dụng: {data.description}",
    )

    db.commit()
    db.refresh(item)
    return item

