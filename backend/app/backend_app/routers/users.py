from typing import Annotated
from fastapi import APIRouter, Depends
from app.deps import Db, require_roles
from app.models import User
from app.schemas import UserOut

router = APIRouter(prefix="/api/users", tags=["users"])

@router.get("", response_model=list[UserOut])
def users(db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    return db.query(User).all()
