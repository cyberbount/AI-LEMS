from typing import Annotated
from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_

from app.deps import Db, current_user
from app.models import AuditLog, User
from app.schemas import AuditLogOut

router = APIRouter(prefix="/api/audit-logs", tags=["audit-logs"])


@router.get("", response_model=list[AuditLogOut])
def get_audit_logs(
    db: Db,
    user: Annotated[User, Depends(current_user)],
    target_type: str | None = Query(None),
    action: str | None = Query(None),
    limit: int = Query(200, ge=1, le=1000),
):
    query = db.query(AuditLog)

    # Phân quyền truy cập log
    if user.role in ["admin", "manager"]:
        pass  # Quản lý xem toàn bộ
    elif user.role == "technician":
        # Kỹ thuật viên xem các hoạt động bảo trì, thiết bị hoặc do chính mình thao tác
        query = query.filter(
            or_(
                AuditLog.target_type.in_(["MAINTENANCE", "DEVICE"]),
                AuditLog.user_id == user.id,
            )
        )
    else:
        # User thông thường chỉ xem log do chính mình thực hiện
        query = query.filter(AuditLog.user_id == user.id)

    if target_type:
        query = query.filter(AuditLog.target_type == target_type)
    if action:
        query = query.filter(AuditLog.action == action)

    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()

