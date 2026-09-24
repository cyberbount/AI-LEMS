from typing import Annotated
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.auth import create_access_token, hash_password, verify_password
from app.config import get_settings
from app.deps import Db, current_user
from app.models import User
from app.schemas import GoogleLoginRequest, PasswordChange, Token, UserCreate, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=UserOut, status_code=201)
def register(data: UserCreate, db: Db):
    if db.query(User).filter((User.username == data.username) | (User.email == data.email)).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Username or email already exists")
    if data.role != "user":
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Public registration creates user accounts only")
    user = User(
        username=data.username,
        email=data.email,
        full_name=data.full_name,
        password_hash=hash_password(data.password),
        role="user",
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

@router.post("/login", response_model=Token)
def login(form: Annotated[OAuth2PasswordRequestForm, Depends()], db: Db):
    identifier = form.username.strip()
    user = db.query(User).filter((User.username == identifier) | (User.email == identifier)).first()
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tên đăng nhập hoặc mật khẩu không chính xác")
    if not user.is_active:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Người quản lý phòng lab.")
    if not verify_password(form.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Tên đăng nhập hoặc mật khẩu không chính xác")
    return Token(access_token=create_access_token(user.username, user.role))

@router.post("/google", response_model=Token)
async def google_login(payload: GoogleLoginRequest, db: Db):
    id_token = payload.id_token.strip()
    if not id_token:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google ID token is required")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://oauth2.googleapis.com/tokeninfo",
                params={"id_token": id_token}
            )
    except Exception as exc:
        raise HTTPException(status.HTTP_503_SERVICE_UNAVAILABLE, "Cannot connect to Google verification service") from exc

    if resp.status_code != 200:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired Google token")

    data = resp.json()
    google_email = data.get("email")
    email_verified = data.get("email_verified")

    if not google_email or str(email_verified).lower() not in ("true", "1"):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Google account email is not verified")

    settings = get_settings()
    if settings.google_client_id:
        token_aud = data.get("aud")
        if token_aud != settings.google_client_id:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Google token audience mismatch")

    user = db.query(User).filter(User.email == google_email).first()
    if not user:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Tài khoản Google ({google_email}) chưa được phân quyền trong hệ thống phòng lab. Vui lòng liên hệ Người quản lý phòng lab để được cấp tài khoản."
        )

    if not user.is_active:
        raise HTTPException(
            status.HTTP_403_FORBIDDEN,
            f"Tài khoản {google_email} đã bị vô hiệu hóa. Vui lòng liên hệ Người quản lý phòng lab."
        )

    return Token(access_token=create_access_token(user.username, user.role))

@router.get("/me", response_model=UserOut)
def me(user: Annotated[User, Depends(current_user)]):
    return user

@router.patch("/password", status_code=204)
def change_password(data: PasswordChange, db: Db, user: Annotated[User, Depends(current_user)]):
    if not verify_password(data.current_password, user.password_hash):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "New password must differ from current password")
    user.password_hash = hash_password(data.new_password)
    db.commit()
