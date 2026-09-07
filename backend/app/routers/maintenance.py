from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import Device, MaintenanceRecord, MaintenanceSchedule, User
from app.schemas import MaintenanceCreate, MaintenanceOut, MaintenanceScheduleCreate, MaintenanceScheduleOut
router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])
@router.get("", response_model=list[MaintenanceOut])
def maintenance(db: Db, _: Annotated[User, Depends(current_user)]): return db.query(MaintenanceRecord).all()
@router.post("", response_model=MaintenanceOut, status_code=201)
def create(data: MaintenanceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, data.device_id)
    if not device: raise HTTPException(404, "Device not found")
    if device.status == "available":
        device.status = "maintenance"
    item = MaintenanceRecord(**data.model_dump(), technician_id=user.id); db.add(item); db.commit(); db.refresh(item); return item
@router.patch("/{item_id}/complete", response_model=MaintenanceOut)
def complete(item_id: int, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = db.get(MaintenanceRecord, item_id)
    if not item: raise HTTPException(404, "Maintenance record not found")
    from datetime import datetime
    item.status = "completed"; item.completed_at = datetime.utcnow()
    device = db.get(Device, item.device_id)
    if device and device.status == "maintenance":
        device.status = "available"
    db.commit(); db.refresh(item); return item


@router.get("/schedules", response_model=list[MaintenanceScheduleOut])
def schedules(db: Db, _: Annotated[User, Depends(current_user)]): return db.query(MaintenanceSchedule).all()


@router.post("/schedules", response_model=MaintenanceScheduleOut, status_code=201)
def create_schedule(data: MaintenanceScheduleCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = MaintenanceSchedule(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
