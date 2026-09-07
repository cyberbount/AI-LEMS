from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException
from app.deps import Db, current_user, require_roles
from app.models import BorrowRequest, Device, UsageHistory, User
from app.schemas import RequestCreate, RequestOut, RequestStatus
router = APIRouter(prefix="/api/requests", tags=["requests"])
@router.get("", response_model=list[RequestOut])
def requests(db: Db, user: Annotated[User, Depends(current_user)]):
    return db.query(BorrowRequest).filter(BorrowRequest.user_id == user.id if user.role == "user" else True).all()
@router.post("", response_model=RequestOut, status_code=201)
def create_request(data: RequestCreate, db: Db, user: Annotated[User, Depends(current_user)]):
    device = db.get(Device, data.device_id)
    if not device: raise HTTPException(404, "Device not found")
    if device.status != "available": raise HTTPException(409, "Device is not available")
    item = BorrowRequest(**data.model_dump(), user_id=user.id); db.add(item); db.commit(); db.refresh(item); return item
@router.patch("/{request_id}/status", response_model=RequestOut)
def set_status(request_id: int, status: RequestStatus, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    item = db.get(BorrowRequest, request_id)
    if not item: raise HTTPException(404, "Request not found")
    transitions = {"pending": {"approved", "rejected"}, "approved": {"borrowed", "rejected"}, "borrowed": {"returned"}}
    if status not in transitions.get(item.status, set()): raise HTTPException(409, f"Invalid transition {item.status} -> {status}")
    device = db.get(Device, item.device_id)
    if status == "approved" and device.status != "available": raise HTTPException(409, "Device is not available")
    if status == "approved": device.status = "reserved"
    elif status == "borrowed": device.status = "borrowed"
    elif status == "returned": device.status = "available"
    item.status = status
    db.add(UsageHistory(user_id=item.user_id, device_id=item.device_id, borrow_request_id=item.id, action=status))
    db.commit(); db.refresh(item); return item


@router.patch("/{request_id}/approve", response_model=RequestOut)
def approve(request_id: int, db: Db, _: Annotated[User, Depends(require_roles("admin", "manager"))]):
    return set_status(request_id, "approved", db, _)


@router.patch("/{request_id}/borrow", response_model=RequestOut)
def borrow(request_id: int, db: Db, _: Annotated[User, Depends(current_user)]):
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != _.id and _.role not in {"admin", "manager"}): raise HTTPException(404, "Request not found")
    return set_status(request_id, "borrowed", db, _)


@router.patch("/{request_id}/return", response_model=RequestOut)
def return_device(request_id: int, db: Db, user: Annotated[User, Depends(current_user)]):
    item = db.get(BorrowRequest, request_id)
    if not item or (item.user_id != user.id and user.role not in {"admin", "manager"}): raise HTTPException(404, "Request not found")
    if item.status != "borrowed": raise HTTPException(409, "Request is not borrowed")
    item.status = "returned"; db.get(Device, item.device_id).status = "available"
    db.add(UsageHistory(user_id=item.user_id, device_id=item.device_id, borrow_request_id=item.id, action="returned"))
    db.commit(); db.refresh(item); return item
