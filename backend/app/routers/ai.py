from fastapi import APIRouter, Depends, HTTPException
import logging

from typing import Annotated

from app.deps import Db, current_user
from app.models import User
from app.main import service
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/ai", tags=["ai"])
logger = logging.getLogger(__name__)


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Db, _: Annotated[User, Depends(current_user)]) -> ChatResponse:
    try:
        result = await service.chat(request.message, request.history, request.mode, db)
    except Exception:
        logger.exception("AI provider request failed")
        raise HTTPException(status_code=502, detail="AI provider is unavailable") from None
    return ChatResponse(answer=result.answer, model=service.provider.model, provider=service.provider.name, mode=result.mode, grounded=result.grounded, sources=result.sources or [])
