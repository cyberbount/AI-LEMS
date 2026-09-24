from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import BorrowRequest, Device, User
from app.schemas import DeviceCreate, DeviceOut, DeviceStatus, DeviceUpdate
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("", response_model=list[DeviceOut])
def list_devices(db: Db, status: DeviceStatus | None = None, _: Annotated[User, Depends(current_user)] = None):
    query = db.query(Device)
    return query.filter(Device.status == status).all() if status else query.all()


@router.post("", response_model=DeviceOut, status_code=201)
def create_device(data: DeviceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    device = Device(**data.model_dump())
    db.add(device)
    db.commit()
    db.refresh(device)
    record_audit_log(
        db=db,
        user=user,
        action="CREATE",
        target_type="DEVICE",
        target_id=device.id,
        target_name=f"{device.name} ({device.asset_code})",
        details=f"Tạo mới thiết bị: {device.name}, Loại: {device.category}, Tình trạng: {device.condition}",
    )
    db.commit()
    return device


@router.patch("/{device_id}/status", response_model=DeviceOut)
def update_status(
    device_id: int,
    status: DeviceStatus,
    db: Db,
    condition: str | None = None,
    user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))] = None,
):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(404, "Device not found")
    old_status = device.status
    old_condition = device.condition
    device.status = status
    if condition:
        device.condition = condition

    details = f"Đổi trạng thái: {old_status} -> {status}"
    if condition and condition != old_condition:
        details += f", Tình trạng: {old_condition} -> {condition}"

    record_audit_log(
        db=db,
        user=user,
        action="STATUS_CHANGE",
        target_type="DEVICE",
        target_id=device.id,
        target_name=f"{device.name} ({device.asset_code})",
        details=details,
    )
    db.commit()
    db.refresh(device)
    return device


@router.patch("/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: int,
    data: DeviceUpdate,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))] = None,
):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(404, "Device not found")

    update_dict = data.model_dump(exclude_unset=True)
    changes = []
    for field, val in update_dict.items():
        old_val = getattr(device, field, None)
        if old_val != val:
            changes.append(f"{field}: {old_val} -> {val}")
            setattr(device, field, val)

    if changes:
        record_audit_log(
            db=db,
            user=user,
            action="UPDATE",
            target_type="DEVICE",
            target_id=device.id,
            target_name=f"{device.name} ({device.asset_code})",
            details="Cập nhật: " + ", ".join(changes),
        )

    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}")
def delete_device(
    device_id: int,
    db: Db,
    user: Annotated[User, Depends(require_roles("admin", "manager"))],
):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(404, "Device not found")

    if device.status == "borrowed":
        raise HTTPException(400, "Không thể xóa hoặc thanh lý thiết bị đang được mượn.")

    device_name = f"{device.name} ({device.asset_code})"
    details = f"Thanh lý/Xóa thiết bị khỏi hệ thống: {device.name}, Mã: {device.asset_code}, Tình trạng: {device.condition}"

    record_audit_log(
        db=db,
        user=user,
        action="DELETE",
        target_type="DEVICE",
        target_id=device.id,
        target_name=device_name,
        details=details,
    )
    db.delete(device)
    db.commit()
    return {"message": f"Đã thanh lý/xóa thiết bị {device_name} thành công."}

