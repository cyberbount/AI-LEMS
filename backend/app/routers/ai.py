from fastapi import APIRouter, Depends, HTTPException
import logging

from typing import Annotated

from app.deps import Db, current_user
from app.models import User
from app.main import service
from app.schemas import ChatRequest, ChatResponse
from app.services.ai_service import MODE_ALLOWED_ROLES
from app.services.audit_service import record_audit_log

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Db, user: Annotated[User, Depends(current_user)]) -> ChatResponse:
    # RBAC tri thức: mode bị giới hạn theo vai trò (summary = quản lý, inspection_alert = kỹ thuật/cán bộ)
    allowed = MODE_ALLOWED_ROLES.get(request.mode, set())
    if user.role not in allowed:
        raise HTTPException(status_code=403, detail=f"Mode '{request.mode}' không được phép cho vai trò '{user.role}'")

    record_audit_log(
        db=db,
        user=user,
        action="AI_QUERY",
        target_type="AI",
        target_name=f"mode:{request.mode}",
        details=f"Hỏi AI (mode={request.mode}): {request.message[:120]}",
    )
    db.commit()

    try:
        result = await service.chat(request.message, request.history, request.mode, db, user_role=user.role)
    except PermissionError as exc:
        raise HTTPException(status_code=403, detail=str(exc)) from None
    except Exception:
        logger.exception("AI provider request failed")
        raise HTTPException(status_code=502, detail="AI provider is unavailable") from None
    return ChatResponse(
        answer=result.answer,
        model=service.provider.model,
        provider=service.provider.name,
        mode=result.mode,
        grounded=result.grounded,
        sources=result.sources or [],
        safety_note=result.safety_note,
        user_role=getattr(result, "user_role", None) or user.role,
        suggestions=getattr(result, "suggestions", None) or [],
    )
