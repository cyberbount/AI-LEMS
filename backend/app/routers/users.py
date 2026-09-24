from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, require_roles
from app.auth import hash_password
from app.models import Role, User
from app.schemas import UserCreate, UserOut
from app.schemas import UserCreate, UserOut, UserUpdate, UserResetPassword

router = APIRouter(prefix="/api/users", tags=["users"])


@router.get("", response_model=list[UserOut])
def users(db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    return db.query(User).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    allowed_roles = {"admin", "manager", "user", "technician"}
    allowed_roles_by_creator = {
        "admin": allowed_roles,
        "manager": {"user", "technician"},
    }
    creator_allowed_roles = allowed_roles_by_creator[_.role]
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
    db.add(user); db.commit(); db.refresh(user); return user
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.patch("/{user_id}", response_model=UserOut)
def update_user(user_id: int, data: UserUpdate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if data.full_name is not None:
        user.full_name = data.full_name.strip()
    if data.email is not None:
        user.email = data.email.strip()
    if data.role is not None:
        if data.role not in {"admin", "manager", "user", "technician"}:
            raise HTTPException(400, "Invalid role")
        user.role = data.role
    if data.is_active is not None:
        user.is_active = data.is_active
    db.commit()
    db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=204)
def delete_user(user_id: int, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    if user.id == _.id:
        raise HTTPException(400, "Cannot delete currently logged-in account")
    db.delete(user)
    db.commit()


@router.post("/{user_id}/reset-password", status_code=204)
def reset_user_password(user_id: int, data: UserResetPassword, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(404, "User not found")
    user.password_hash = hash_password(data.new_password)
    db.commit()
