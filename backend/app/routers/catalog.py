from typing import Annotated
from fastapi import APIRouter, Depends
from app.deps import Db, current_user, require_roles
from app.models import Group, Location, User
from app.schemas import GroupCreate, LocationCreate

router = APIRouter(prefix="/api", tags=["catalog"])

@router.get("/groups")
def groups(db: Db, _: Annotated[User, Depends(current_user)]): return db.query(Group).all()

@router.post("/groups", status_code=201)
def create_group(data: GroupCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    item = Group(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item

@router.get("/locations")
def locations(db: Db, _: Annotated[User, Depends(current_user)]): return db.query(Location).all()

@router.post("/locations", status_code=201)
def create_location(data: LocationCreate, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    item = Location(**data.model_dump()); db.add(item); db.commit(); db.refresh(item); return item
