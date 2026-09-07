from fastapi import APIRouter, HTTPException

from app.deps import Db
from app.main import service
from app.schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest, db: Db) -> ChatResponse:
    try:
        result = await service.chat(request.message, request.history, request.mode, db)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc
    return ChatResponse(answer=result.answer, model=service.provider.model, provider=service.provider.name, mode=result.mode, grounded=result.grounded, sources=result.sources or [])
