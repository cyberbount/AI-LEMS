from typing import Annotated
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import Device, MaintenanceRecord, MaintenanceSchedule, User
from app.schemas import MaintenanceCreate, MaintenanceOut, MaintenanceScheduleCreate, MaintenanceScheduleOut, MaintenanceUpdate
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])


@router.get("", response_model=list[MaintenanceOut])
def maintenance(db: Db, _: Annotated[User, Depends(current_user)]):
    return db.query(MaintenanceRecord).all()


@router.post("", response_model=MaintenanceOut, status_code=201)
def create(data: MaintenanceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, data.device_id)
    if not device:
        raise HTTPException(404, "Device not found")

    item = MaintenanceRecord(**data.model_dump(), technician_id=user.id)

    if data.status in ["completed", "replace_full", "replace_partial"]:
        if data.status == "completed":
            item.completed_at = datetime.utcnow()
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

    if data.status in ["completed", "replace_full", "replace_partial"]:
        if data.status == "completed":
            item.completed_at = datetime.utcnow()
        if device and device.status == "maintenance" and data.status == "completed":
            device.status = "available"

    # Cập nhật tình trạng vật lý (condition) nếu KTV đánh giá lại
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
        details=f"Cập nhật bảo trì: Trạng thái {old_status} -> {data.status}, Ghi chú: {item.notes}{condition_detail}",
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

