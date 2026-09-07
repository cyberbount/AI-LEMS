from datetime import datetime
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from app.deps import Db, current_user
from app.models import BorrowRequest, Device, MaintenanceRecord, UsageHistory, User
router = APIRouter(prefix="/api/stats", tags=["stats"])
@router.get("")
def stats(
    db: Db,
    _: Annotated[User, Depends(current_user)],
    start: datetime | None = Query(default=None),
    end: datetime | None = Query(default=None),
):
    if (start is None) != (end is None):
        raise HTTPException(422, "start and end must be provided together")
    if start and end and start > end:
        raise HTTPException(422, "start must be before or equal to end")

    usage_query = db.query(UsageHistory)
    if start and end:
        usage_query = usage_query.filter(UsageHistory.occurred_at >= start, UsageHistory.occurred_at <= end)
    usage_events = usage_query.count()
    action_rows = usage_query.with_entities(
        UsageHistory.action,
        func.count(UsageHistory.id).label("total"),
    ).group_by(UsageHistory.action).all()
    return {
        "users": db.query(func.count(User.id)).scalar(),
        "devices": db.query(func.count(Device.id)).scalar(),
        "requests": db.query(func.count(BorrowRequest.id)).scalar(),
        "maintenance_open": db.query(func.count(MaintenanceRecord.id)).filter(MaintenanceRecord.status == "open").scalar(),
        "usage": db.query(func.count(UsageHistory.id)).scalar(),
        "usage_frequency": usage_events,
        "selected_from": start,
        "selected_to": end,
        "usage_by_action": {row.action: row.total for row in action_rows},
    }
