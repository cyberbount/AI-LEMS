from datetime import datetime
from sqlalchemy.orm import Session
from app.models import AuditLog, User
from app.utils.tz import hanoi_now_naive


def record_audit_log(
    db: Session,
    user: User | None,
    action: str,
    target_type: str,
    target_id: int | None = None,
    target_name: str = "",
    details: str = "",
) -> AuditLog:
    """Ghi nhận nhật ký kiểm toán hành vi người dùng trên hệ thống."""
    """Ghi nhận nhật ký kiểm toán hành vi người dùng trên hệ thống theo giờ thực tế Hà Nội (UTC+7)."""
    username = user.username if user else "system"
    user_role = user.role if user else "system"
    user_id = user.id if user else None

    log_entry = AuditLog(
        user_id=user_id,
        username=username,
        user_role=user_role,
        action=action,
        target_type=target_type,
        target_id=target_id,
        target_name=target_name,
        details=details,
        created_at=hanoi_now_naive(),
    )
    db.add(log_entry)
    return log_entry

