from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import Device, User
from app.schemas import DeviceCreate, DeviceOut
router = APIRouter(prefix="/api/devices", tags=["devices"])
@router.get("", response_model=list[DeviceOut])
def list_devices(db: Db, status: str | None = None, _: Annotated[User, Depends(current_user)] = None):
    query = db.query(Device)
    return query.filter(Device.status == status).all() if status else query.all()
@router.post("", response_model=DeviceOut, status_code=201)
def create_device(data: DeviceCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    device = Device(**data.model_dump()); db.add(device); db.commit(); db.refresh(device); return device
@router.patch("/{device_id}/status", response_model=DeviceOut)
def update_status(device_id: int, status: str, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, device_id)
    if not device: raise HTTPException(404, "Device not found")
    device.status = status; db.commit(); db.refresh(device); return device
