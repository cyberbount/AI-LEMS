from datetime import datetime, timedelta
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import BorrowRequest, Device, MaintenanceRecord, UsageHistory, User
from app.schemas import IncidentReportCreate, RequestCreate, RequestOut, RequestStatus
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/requests", tags=["requests"])


@router.get("", response_model=list[RequestOut])
def requests(db: Db, user: Annotated[User, Depends(current_user)]):
    return db.query(BorrowRequest).filter(BorrowRequest.user_id == user.id if user.role == "user" else True).all()


@router.post("", response_model=RequestOut, status_code=201)
def create_request(data: RequestCreate, db: Db, user: Annotated[User, Depends(current_user)]):
    device = db.get(Device, data.device_id)
    if not device:
        raise HTTPException(404, "Device not found")
    if device.status != "available":
        raise HTTPException(409, "Thiết bị hiện không khả dụng để mượn.")

    now = datetime.utcnow()
    if data.requested_from and data.requested_from < now - timedelta(minutes=15):
        raise HTTPException(400, "Thời gian bắt đầu mượn không thể ở trong quá khứ. Vui lòng chọn từ thời điểm hiện tại trở đi.")
    if data.requested_to and data.requested_from and data.requested_to <= data.requested_from:
        raise HTTPException(400, "Thời gian hẹn trả máy phải sau thời gian bắt đầu mượn.")
    if data.requested_to and data.requested_to <= now - timedelta(minutes=5):
        raise HTTPException(400, "Thời gian hẹn trả máy không thể ở trong quá khứ.")

    item = BorrowRequest(**data.model_dump(), user_id=user.id)
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
    elif status == "returned":
        device.status = "available"

    item.status = status
    db.add(UsageHistory(user_id=item.user_id, device_id=item.device_id, borrow_request_id=item.id, action=status))

    action_map = {
        "approved": "APPROVE",
        "rejected": "REJECT",
        "borrowed": "HANDOVER",
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


@router.patch("/{request_id}/return", response_model=RequestOut)
def return_device(request_id: int, db: Db, user: Annotated[User, Depends(current_user)]):
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != user.id and user.role not in {"admin", "manager"}):
        raise HTTPException(404, "Request not found")
    if item.status != "borrowed":
        raise HTTPException(409, "Yêu cầu mượn này chưa ở trạng thái đang mượn.")

    device = db.get(Device, item.device_id)
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

    # 1. Chuyển thiết bị sang bảo trì khẩn cấp
    device.status = "maintenance"
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

