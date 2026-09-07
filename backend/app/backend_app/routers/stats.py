from typing import Annotated
from fastapi import APIRouter, Depends
from sqlalchemy import func
from app.deps import Db, current_user
from app.models import BorrowRequest, Device, MaintenanceRecord, UsageHistory, User
router = APIRouter(prefix="/api/stats", tags=["stats"])
@router.get("")
def stats(db: Db, _: Annotated[User, Depends(current_user)]):
    return {"users": db.query(func.count(User.id)).scalar(), "devices": db.query(func.count(Device.id)).scalar(), "requests": db.query(func.count(BorrowRequest.id)).scalar(), "maintenance_open": db.query(func.count(MaintenanceRecord.id)).filter(MaintenanceRecord.status == "open").scalar(), "usage": db.query(func.count(UsageHistory.id)).scalar(), "usage_by_action": {row.action: row.total for row in db.query(UsageHistory.action, func.count(UsageHistory.id).label("total")).group_by(UsageHistory.action).all()}}
