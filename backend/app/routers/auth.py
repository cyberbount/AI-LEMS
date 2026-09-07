from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.auth import create_access_token, hash_password, verify_password
from app.deps import Db, current_user
from app.models import User
from app.schemas import PasswordChange, Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Db):
    if db.query(User).filter((User.username == data.username) | (User.email == data.email)).first():
        raise HTTPException(409, "Username or email already exists")
    if data.role != "user":
        raise HTTPException(403, "Public registration creates user accounts only")
    user = User(username=data.username, email=data.email, full_name=data.full_name, password_hash=hash_password(data.password), role="user", is_active=True)
    db.add(user); db.commit(); db.refresh(user); return user

@router.post("/login", response_model=Token)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: Db):
    user = db.query(User).filter(User.username == form.username).first()
    if not user or not user.is_active or not verify_password(form.password, user.password_hash):
        raise HTTPException(401, "Incorrect username or password")
    return Token(access_token=create_access_token(user.username, user.role))

@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(current_user)]): return user


@router.patch("/password", status_code=204)
def change_password(data: PasswordChange, db: Db, user: Annotated[User, Depends(current_user)]):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(400, "Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(400, "New password must differ from current password")
    user.password_hash = hash_password(data.new_password)
    db.commit()
