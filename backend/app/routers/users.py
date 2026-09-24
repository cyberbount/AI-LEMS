from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, require_roles
from app.auth import hash_password
from app.models import Role, User
from app.schemas import UserCreate, UserOut, UserUpdate, UserResetPassword
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def users(db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    return db.query(User).order_by(User.id.desc()).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Db, admin: Annotated[User, Depends(require_roles("admin", "manager"))]):
    allowed_roles = {"admin", "manager", "user", "technician"}
    allowed_roles_by_creator = {
        "admin": allowed_roles,
        "manager": {"user", "technician"},
    }
    creator_allowed_roles = allowed_roles_by_creator[admin.role]
    if data.role not in creator_allowed_roles:
        raise HTTPException(403, "Insufficient permissions for requested role")
    if data.role not in allowed_roles or not db.get(Role, data.role):
        raise HTTPException(400, "Unsupported role")
    if db.query(User).filter((User.username == data.username) | (User.email == data.email)).first():
        raise HTTPException(409, "Username or email already exists")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role=data.role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    record_audit_log(
        db=db,
        user=admin,
        action="CREATE",
        target_type="USER",
        target_id=user.id,
        target_name=f"@{user.username} ({user.full_name})",
        details=f"Tạo tài khoản mới: @{user.username}, Role: {user.role}, Email: {user.email}",
    )
    db.commit()
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Db, admin: Annotated[User, Depends(require_roles("admin", "manager"))]):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    changes = []
    if data.username is not None and data.username.strip() and data.username.strip() != user.username:
        new_uname = data.username.strip()
        existing = db.query(User).filter(User.username == new_uname, User.id != user.id).first()
        if existing:
            raise HTTPException(400, "Tên đăng nhập đã tồn tại trong hệ thống.")
        changes.append(f"Tên đăng nhập: {user.username} -> {new_uname}")
        user.username = new_uname
    if data.full_name is not None and data.full_name.strip() != user.full_name:
        changes.append(f"Họ tên: {user.full_name} -> {data.full_name.strip()}")
        user.full_name = data.full_name.strip()
    if data.email is not None and data.email.strip() != user.email:
        changes.append(f"Email: {user.email} -> {data.email.strip()}")
        user.email = data.email.strip()
    if data.role is not None and data.role != user.role:
        if data.role not in {"admin", "manager", "user", "technician"}:
            raise HTTPException(400, "Invalid role")
        changes.append(f"Vai trò: {user.role} -> {data.role}")
        user.role = data.role
    if data.is_active is not None and data.is_active != user.is_active:
        status_text = "Mở khóa tài khoản" if data.is_active else "Khóa tài khoản"
        changes.append(f"Trạng thái: {status_text}")
        user.is_active = data.is_active
    if data.password is not None and data.password.strip():
        pwd = data.password.strip()
        if len(pwd) < 8:
            raise HTTPException(400, "Mật khẩu mới phải có tối thiểu 8 ký tự.")
        user.password_hash = hash_password(pwd)
        changes.append("Đặt lại mật khẩu mới")

    if changes:
        record_audit_log(
            db=db,
            user=admin,
            action="UPDATE",
            target_type="USER",
            target_id=user.id,
            target_name=f"@{user.username} ({user.full_name})",
            details=", ".join(changes),
        )

    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Db, admin: Annotated[User, Depends(require_roles("admin", "manager"))]):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == admin.id:
        raise HTTPException(400, "Cannot delete currently logged-in account")

    user_name = f"@{user.username} ({user.full_name})"
    snapshot = f"Xóa tài khoản @{user.username} (Email: {user.email}, Role: {user.role})"

    record_audit_log(
        db=db,
        user=admin,
        action="DELETE",
        target_type="USER",
        target_id=user.id,
        target_name=user_name,
        details=snapshot,
    )

    db.delete(user)
    db.commit()


@router.post("/{user_id}/reset-password", status_code=204)
def reset_user_password(user_id: int, data: UserResetPassword, db: Db, admin: Annotated[User, Depends(require_roles("admin", "manager"))]):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.password_hash = hash_password(data.new_password)

    record_audit_log(
        db=db,
        user=admin,
        action="RESET_PASSWORD",
        target_type="USER",
        target_id=user.id,
        target_name=f"@{user.username} ({user.full_name})",
        details="Đặt lại mật khẩu cho tài khoản.",
    )
    db.commit()

