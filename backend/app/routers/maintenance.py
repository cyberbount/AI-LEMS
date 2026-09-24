from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import Device, MaintenanceRecord, MaintenanceSchedule, User
from app.schemas import MaintenanceCreate, MaintenanceOut, MaintenanceScheduleCreate, MaintenanceScheduleOut, MaintenanceUpdate
router = APIRouter(prefix="/api/maintenance", tags=["maintenance"])
@router.get("", response_model=list[MaintenanceOut])
def maintenance(db: Db, _: Annotated[User, Depends(current_user)]): return db.query(MaintenanceRecord).all()
@router.post("", response_model=MaintenanceOut, status_code=201)
def create(data: MaintenanceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, data.device_id)
    if not device: raise HTTPException(404, "Device not found")
    
    item = MaintenanceRecord(**data.model_dump(), technician_id=user.id)
    from datetime import datetime
    
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
    return item
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

@router.patch("/{item_id}", response_model=MaintenanceOut)
def update(item_id: int, data: MaintenanceUpdate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = db.get(MaintenanceRecord, item_id)
    if not item: raise HTTPException(404, "Maintenance record not found")
    
    item.status = data.status
    if data.notes is not None:
        item.notes = data.notes

    from datetime import datetime
    if data.status in ["completed", "replace_full", "replace_partial"]:
        if data.status == "completed":
            item.completed_at = datetime.utcnow()
        device = db.get(Device, item.device_id)
        # Nếu hoàn thành thì thiết bị sẵn sàng. Còn nếu thay thế thì cứ giữ maintenance
        if device and device.status == "maintenance" and data.status == "completed":
            device.status = "available"
    
    db.commit(); db.refresh(item); return item

@router.delete("/{item_id}")
def delete(item_id: int, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = db.get(MaintenanceRecord, item_id)
    if not item: raise HTTPException(404, "Maintenance record not found")
    db.delete(item)
    db.commit()
    return {"message": "Deleted"}


@router.get("/schedules", response_model=list[MaintenanceScheduleOut])
def schedules(db: Db, _: Annotated[User, Depends(current_user)]): return db.query(MaintenanceSchedule).all()


@router.post("/schedules", response_model=MaintenanceScheduleOut, status_code=201)
def create_schedule(data: MaintenanceScheduleCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    item = MaintenanceSchedule(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
