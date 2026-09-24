from typing import Annotated
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import BorrowRequest, Device, MaintenanceRecord, MaintenanceSchedule, User
from app.schemas import MaintenanceCreate, MaintenanceOut, MaintenanceScheduleCreate, MaintenanceScheduleOut, MaintenanceUpdate
from app.services.audit_service import record_audit_log
from app.utils.tz import hanoi_now_naive

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("", response_model=list[MaintenanceOut])
def maintenance(db: Db, _: Annotated[User, Depends(current_user)]):
    return db.query(MaintenanceRecord).order_by(MaintenanceRecord.id.desc()).all()


@router.post("", response_model=MaintenanceOut, status_code=201)
def create(data: MaintenanceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, data.device_id)
    if not device:
        raise HTTPException(404, "Device not found")

    item = MaintenanceRecord(**data.model_dump(), technician_id=user.id)

    if data.status in ["completed", "replace_full", "replace_partial"]:
        if data.status == "completed":
            item.completed_at = hanoi_now_naive()
        if device.status == "maintenance" and data.status == "completed":
            device.status = "available"
        elif device.status == "available" and data.status != "completed":
            device.status = "maintenance"
    else:
        if device.status == "available":
            device.status = "maintenance"

    db.add(item)
    db.commit()
    db.refresh(item)

    status_labels = {
        "open": "Lên lịch bảo trì (Đang mở)",
        "completed": "Bảo trì hoàn tất",
        "replace_full": "Phải thay thế mới",
        "replace_partial": "Thay thế một phần",
    }
    record_audit_log(
        db=db,
        user=user,
        action="CREATE",
        target_type="MAINTENANCE",
        target_id=item.id,
        target_name=f"Thiết bị #{device.id} - {device.name}",
        details=f"Tạo tác vụ bảo trì: {status_labels.get(item.status, item.status)}. Ghi chú: {item.notes}",
    )
    db.commit()
    return item


@router.patch("/{item_id}/complete", response_model=MaintenanceOut)
def complete(item_id: int, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = db.get(MaintenanceRecord, item_id)
    if not item:
        raise HTTPException(404, "Maintenance record not found")
    item.status = "completed"
    item.completed_at = datetime.utcnow()
    item.completed_at = hanoi_now_naive()
    device = db.get(Device, item.device_id)
    if device and device.status == "maintenance":
        device.status = "available"

    record_audit_log(
        db=db,
        user=user,
        action="UPDATE",
        target_type="MAINTENANCE",
        target_id=item.id,
        target_name=f"Thiết bị #{item.device_id} - {device.name if device else ''}",
        details="Hoàn thành công việc bảo trì.",
    )
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}/accept", response_model=MaintenanceOut)
def accept_incident(
    item_id: int,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))],
):
    """Kĩ thuật viên tiếp nhận sự cố → chuyển thiết bị từ pending_inspection sang in_progress (Đang kiểm tra sự cố)."""
    item = db.get(MaintenanceRecord, item_id)
    if not item:
        raise HTTPException(404, "Bản ghi bảo trì không tồn tại.")
    if item.status != "open" or item.kind != "incident":
        raise HTTPException(400, "Chỉ có thể tiếp nhận sự cố đang mở (open).")

    device = db.get(Device, item.device_id)
    if not device:
        raise HTTPException(404, "Thiết bị không tồn tại.")
    if device.status not in ["pending_inspection", "maintenance", "borrowed"]:
        raise HTTPException(400, f"Thiết bị không ở trạng thái chờ tiếp nhận sự cố (hiện tại: {device.status}).")

    # Chuyển thiết bị sang trạng thái Đang kiểm tra sự cố (in_progress)
    device.status = "in_progress"
    # Gán kĩ thuật viên và chuyển trạng thái bản ghi sang in_progress
    item.technician_id = user.id
    item.status = "in_progress"

    record_audit_log(
        db=db,
        user=user,
        action="ACCEPT_INCIDENT",
        target_type="MAINTENANCE",
        target_id=item.id,
        target_name=f"Thiết bị #{item.device_id} - {device.name if device else ''}",
        details=f"Tiếp nhận sự cố #{item.id}: {device.name} ({device.asset_code}). Chuyển trạng thái: Chờ tiếp nhận -> Đang kiểm tra sự cố.",
    )

    db.commit()
    db.refresh(item)
    return item


@router.patch("/{item_id}", response_model=MaintenanceOut)
def update(
    item_id: int,
    data: MaintenanceUpdate,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))],
):
    item = db.get(MaintenanceRecord, item_id)
    if not item:
        raise HTTPException(404, "Maintenance record not found")

    old_status = item.status
    item.status = data.status
    if data.notes is not None:
        item.notes = data.notes

    device = db.get(Device, item.device_id)

    # Đồng bộ trạng thái thiết bị theo kết quả đánh giá kỹ thuật
    if device:
        if data.status == "completed":
            item.completed_at = hanoi_now_naive()
            device.status = "available"
            if not data.device_condition:
                device.condition = "Đã qua sử dụng - Hoạt động tốt"
            # Tự động chốt hoàn tất lượt mượn liên quan (nếu thiết bị trước đó đang mượn mà bị sự cố)
            open_borrow = db.query(BorrowRequest).filter(
                BorrowRequest.device_id == device.id,
                BorrowRequest.status.in_(["borrowed", "return_pending"])
            ).order_by(BorrowRequest.id.desc()).first()
            if open_borrow:
                open_borrow.status = "returned"

        elif data.status == "replace_partial":
            device.status = "replace_partial"
            if not data.device_condition:
                device.condition = "Đang sửa chữa / Thay thế một phần"
            # Kết thúc lượt mượn vì máy đã thu hồi về xưởng kỹ thuật sửa chữa
            open_borrow = db.query(BorrowRequest).filter(
                BorrowRequest.device_id == device.id,
                BorrowRequest.status.in_(["borrowed", "return_pending"])
            ).order_by(BorrowRequest.id.desc()).first()
            if open_borrow:
                open_borrow.status = "returned"

        elif data.status == "replace_full":
            device.status = "replace_full"
            if not data.device_condition:
                device.condition = "Hỏng hóc nặng / Chờ thanh lý hoặc thay mới"
            # Kết thúc lượt mượn
            open_borrow = db.query(BorrowRequest).filter(
                BorrowRequest.device_id == device.id,
                BorrowRequest.status.in_(["borrowed", "return_pending"])
            ).order_by(BorrowRequest.id.desc()).first()
            if open_borrow:
                open_borrow.status = "returned"

        elif data.status == "in_progress":
            device.status = "in_progress"

        elif data.status == "open":
            if device.status == "available":
                device.status = "maintenance"

    # Cập nhật tình trạng vật lý (condition) nếu KTV đánh giá riêng
    condition_detail = ""
    if data.device_condition and device:
        old_condition = device.condition
        device.condition = data.device_condition
        condition_detail = f", Tình trạng thiết bị: {old_condition} -> {data.device_condition}"

    record_audit_log(
        db=db,
        user=user,
        action="UPDATE",
        target_type="MAINTENANCE",
        target_id=item.id,
        target_name=f"Thiết bị #{item.device_id} - {device.name if device else ''}",
        details=f"Cập nhật bảo trì: Trạng thái {old_status} -> {data.status}, Thiết bị: {device.status if device else 'N/A'}, Ghi chú: {item.notes}{condition_detail}",
    )

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{item_id}")
def delete(item_id: int, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = db.get(MaintenanceRecord, item_id)
    if not item:
        raise HTTPException(404, "Maintenance record not found")

    device = db.get(Device, item.device_id)
    device_name = f"Thiết bị #{item.device_id} - {device.name if device else ''}"
    snapshot = f"Xóa bản ghi bảo trì #{item.id} (Trạng thái: {item.status}, Loại: {item.kind}, Ghi chú: {item.notes})"

    record_audit_log(
        db=db,
        user=user,
        action="DELETE",
        target_type="MAINTENANCE",
        target_id=item.id,
        target_name=device_name,
        details=snapshot,
    )

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


@router.get("/schedules", response_model=list[MaintenanceScheduleOut])
def schedules(db: Db, _: Annotated[User, Depends(current_user)]):
    return db.query(MaintenanceSchedule).all()


@router.post("/schedules", response_model=MaintenanceScheduleOut, status_code=201)
def create_schedule(
    data: MaintenanceScheduleCreate,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))],
):
    item = MaintenanceSchedule(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    record_audit_log(
        db=db,
        user=user,
        action="CREATE",
        target_type="MAINTENANCE",
        target_id=item.id,
        target_name=f"Lịch bảo trì thiết bị #{item.device_id}",
        details=f"Lên lịch định kỳ {item.interval_days} ngày. Đến hạn: {item.next_due_at}",
    )
    db.commit()
    return item

