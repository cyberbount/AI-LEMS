from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, require_roles
from app.auth import hash_password
from app.models import Role, User
from app.schemas import UserCreate, UserOut

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=list[UserOut])
def users(db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    return db.query(User).all()


@router.post("", response_model=UserOut, status_code=201)
def create_user(data: UserCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    allowed_roles = {"admin", "manager", "user", "technician"}
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
