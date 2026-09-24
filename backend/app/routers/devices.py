from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import BorrowRequest, Device, User
from app.schemas import DeviceCreate, DeviceOut, DeviceStatus, DeviceUpdate
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/devices", tags=["devices"])


@router.get("", response_model=list[DeviceOut])
def list_devices(db: Db, status: DeviceStatus | None = None, _: Annotated[User, Depends(current_user)] = None):
    query = db.query(Device).order_by(Device.id.desc())
    return query.filter(Device.status == status).all() if status else query.all()


@router.post("", response_model=DeviceOut, status_code=201)
def create_device(data: DeviceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager"))]):
    # Kiểm tra ràng buộc chống trùng lặp mã tài sản
    existing_asset = db.query(Device).filter(Device.asset_code == data.asset_code).first()
    if existing_asset:
        raise HTTPException(400, f"Mã tài sản '{data.asset_code}' đã tồn tại trong hệ thống ({existing_asset.name}). Vui lòng nhập mã khác.")

    # Kiểm tra ràng buộc chống trùng lặp số Serial / Mã nhà sản xuất
    if data.serial_number and data.serial_number.strip():
        existing_sn = db.query(Device).filter(Device.serial_number == data.serial_number.strip()).first()
        if existing_sn:
            raise HTTPException(400, f"Số Serial/Mã NSX '{data.serial_number}' đã được sử dụng cho thiết bị '{existing_sn.name}' ({existing_sn.asset_code}).")

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
        
    if user and user.role == "technician":
        allowed_tech_statuses = ["inspection", "in_progress", "replace_partial", "replace_full", "maintenance"]
        if status not in allowed_tech_statuses:
            raise HTTPException(403, f"Kỹ thuật viên không được cấp quyền chuyển thiết bị sang trạng thái '{status}'. Vui lòng sử dụng chức năng 'Hoàn tất bảo trì' để trả thiết bị về trạng thái Sẵn sàng.")

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
    user: Annotated[User, Depends(require_roles("admin", "manager"))] = None,
):
    device = db.get(Device, device_id)
    if not device:
        raise HTTPException(404, "Device not found")

    update_dict = data.model_dump(exclude_unset=True)

    # Kiểm tra trùng lặp mã tài sản nếu có sửa
    if "asset_code" in update_dict and update_dict["asset_code"] and update_dict["asset_code"] != device.asset_code:
        conflict_asset = db.query(Device).filter(Device.asset_code == update_dict["asset_code"], Device.id != device_id).first()
        if conflict_asset:
            raise HTTPException(400, f"Mã tài sản '{update_dict['asset_code']}' đã tồn tại cho thiết bị '{conflict_asset.name}'.")

    # Kiểm tra trùng lặp số serial nếu có sửa
    if "serial_number" in update_dict and update_dict["serial_number"] and update_dict["serial_number"].strip() and update_dict["serial_number"].strip() != device.serial_number:
        conflict_sn = db.query(Device).filter(Device.serial_number == update_dict["serial_number"].strip(), Device.id != device_id).first()
        if conflict_sn:
            raise HTTPException(400, f"Số Serial/Mã NSX '{update_dict['serial_number']}' đã tồn tại cho thiết bị '{conflict_sn.name}'.")

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

