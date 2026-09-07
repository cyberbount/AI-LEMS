from dataclasses import dataclass
from typing import Protocol, Sequence
from sqlalchemy.orm import Session
from app.models import DocumentChunk, Device, MaintenanceRecord

from app.config import Settings
from app.schemas import ChatMessage


class AIProvider(Protocol):
    name: str
    model: str

    async def chat(self, messages: Sequence[ChatMessage]) -> str: ...

    async def health(self) -> bool: ...


@dataclass(frozen=True)
class ChatResult:
    answer: str
    mode: str
    grounded: bool | None = None
    sources: list[str] | None = None


@dataclass
class AIService:
    provider: AIProvider
    max_history_messages: int

    async def chat(self, message: str, history: Sequence[ChatMessage], mode: str = "chat", db: Session | None = None) -> ChatResult:
        context, sources = self._context(message, mode, db)

        bounded_history = [item for item in list(history)[-self.max_history_messages :] if item.role != "system"]
        messages = [
            ChatMessage(role="system", content=self._system_prompt() + (f"\nDữ liệu chính thức:\n{context}" if context else "")),
            *bounded_history,
            ChatMessage(role="user", content=message),
        ]
        answer = await self.provider.chat(messages)
        return ChatResult(answer=answer, mode=mode, grounded=bool(context), sources=sources)

    @staticmethod
    def _context(message: str, mode: str, db: Session | None) -> tuple[str, list[str]]:
        if not db: return "", []
        terms = {word.lower() for word in message.split() if len(word) > 2}
        chunks = db.query(DocumentChunk).all()
        matches = [chunk for chunk in chunks if any(term in chunk.content.lower() for term in terms)][:5]
        if mode == "summary":
            context = f"Thiết bị: {db.query(Device).count()}; bảo trì đang mở: {db.query(MaintenanceRecord).filter(MaintenanceRecord.status == 'open').count()}"
            return context, ["database:devices", "database:maintenance"]
        if mode == "inspection_alert":
            items = db.query(MaintenanceRecord).filter(MaintenanceRecord.status == "open").all()
            return "\n".join(f"Thiết bị {item.device_id}: {item.kind} - {item.notes}" for item in items), ["database:maintenance"]
        return "\n".join(chunk.content for chunk in matches), [chunk.document_name for chunk in matches]

    async def health(self) -> bool:
        return await self.provider.health()

    def capabilities(self) -> list[str]:
        return [
            "local_chat",
            "provider_abstraction",
            "bounded_chat_history",
            "rag_ready_contract",
            "summary_ready_contract",
            "inspection_alert_ready_contract",
        ]

    @staticmethod
    def _system_prompt() -> str:
        return """
Bạn là trợ lý AI chạy local cho hệ thống quản lý thiết bị phòng thí nghiệm Điện tử, IoT và Hệ thống nhúng.

Nguyên tắc bắt buộc:
- Trả lời bằng tiếng Việt, rõ ràng, ngắn gọn.
- Không tự phê duyệt yêu cầu mượn/trả.
- Không tự đổi trạng thái thiết bị.
- Không tự xác nhận thiết bị hỏng hoặc đã bảo trì.
- Nếu người dùng hỏi dữ liệu nghiệp vụ cụ thể nhưng backend chưa cung cấp dữ liệu, hãy nói rõ là chưa có dữ liệu chính thức.
- Với câu hỏi vận hành/an toàn thiết bị, luôn nhắc tuân thủ SOP, tài liệu thiết bị và quy định an toàn phòng lab.
- Chỉ sử dụng dữ liệu chính thức được cung cấp từ database; không bịa dữ liệu.
""".strip()


def build_ai_service(settings: Settings) -> AIService:
    if settings.ai_provider != "ollama":
        raise ValueError(f"Unsupported AI_PROVIDER: {settings.ai_provider}")

    from app.services.ollama_provider import OllamaProvider

    return AIService(
        provider=OllamaProvider(settings),
        max_history_messages=settings.max_history_messages,
    )
