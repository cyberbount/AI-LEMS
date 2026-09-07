from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.schemas import ChatRequest, ChatResponse, HealthResponse
from app.services.ai_service import AIService, build_ai_service
from app.db import init_db
from app.deps import Db
from app.routers import auth, users, devices, requests, maintenance, stats, catalog

settings = get_settings()
service: AIService = build_ai_service(settings)
from app.routers import ai

app = FastAPI(title="Local Laboratory AI", version="0.1.0")
app.include_router(auth.router); app.include_router(users.router); app.include_router(devices.router)
app.include_router(requests.router); app.include_router(maintenance.router); app.include_router(stats.router)
app.include_router(catalog.router)
app.include_router(ai.router)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    ollama_available = await service.health()
    return HealthResponse(
        status="ok" if ollama_available else "degraded",
        ollama=ollama_available,
        model=service.provider.model,
        provider=service.provider.name,
        capabilities=service.capabilities(),
    )


@app.get("/")
async def root() -> dict[str, str]:
    return {"name": "Local Laboratory AI", "docs": "/docs", "health": "/health"}


@app.get("/api/capabilities")
async def capabilities() -> dict[str, list[str] | str]:
    return {
        "provider": service.provider.name,
        "model": service.provider.model,
        "capabilities": service.capabilities(),
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    try:
        result = await service.chat(request.message, request.history, request.mode)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"AI provider error: {exc}") from exc
    return ChatResponse(
        answer=result.answer,
        model=service.provider.model,
        provider=service.provider.name,
        mode=result.mode,
        grounded=result.grounded,
        sources=result.sources or [],
    )

@app.on_event("startup")
def startup() -> None:
    init_db()
