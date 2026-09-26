import re
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
    source_details: list[dict] | None = None


@dataclass
class AIService:
    provider: AIProvider
    max_history_messages: int

    async def chat(self, message: str, history: Sequence[ChatMessage], mode: str = "chat", db: Session | None = None) -> ChatResult:
        context, sources, source_details = self._context(message, mode, db)

        bounded_history = [item for item in list(history)[-self.max_history_messages :] if item.role != "system"]
        messages = [
            ChatMessage(
                role="system",
                content=self._system_prompt() + (
                    "\n\n--- DỮ LIỆU THAM KHẢO TỪ HỆ THỐNG PHÒNG THÍ NGHIỆM ---\n"
                    f"{context}\n"
                    "--- HẾT DỮ LIỆU THAM KHẢO ---"
                    if context else ""
                ),
            ),
            *bounded_history,
            ChatMessage(role="user", content=message),
        ]
        raw_answer = await self.provider.chat(messages)

        # Bộ lọc an toàn ngôn ngữ (Language Sanitizer): Loại bỏ triệt để ký tự chữ Hán / tiếng Trung nếu mô hình bị rò rỉ token
        cleaned_lines = []
        for line in raw_answer.split("\n"):
            clean_line = re.sub(r'[\u4e00-\u9fff]+', '', line).strip()
            if clean_line:
                cleaned_lines.append(clean_line)
        answer = "\n".join(cleaned_lines) if cleaned_lines else raw_answer

        return ChatResult(
            answer=answer,
            mode=mode,
            grounded=bool(context),
            sources=sources,
            source_details=source_details,
        )

    @staticmethod
    def _context(message: str, mode: str, db: Session | None) -> tuple[str, list[str], list[dict]]:
        if not db:
            return "", [], []

        if mode == "summary":
            dev_count = db.query(Device).count()
            maint_count = db.query(MaintenanceRecord).filter(MaintenanceRecord.status == "open").count()
            context = f"Tổng số thiết bị trong hệ thống: {dev_count}. Số lượng phiếu bảo trì đang mở: {maint_count}."
            sources = ["database:devices", "database:maintenance"]
            source_details = [
                {"title": "database:devices", "snippet": f"Tổng số thiết bị phòng Lab: {dev_count} thiết bị", "score": 1.0},
                {"title": "database:maintenance", "snippet": f"Số phiếu bảo trì đang mở: {maint_count} phiếu", "score": 1.0},
            ]
            return context, sources, source_details

        if mode == "inspection_alert":
            items = db.query(MaintenanceRecord).filter(MaintenanceRecord.status == "open").all()
            lines = [f"Thiết bị #{item.device_id}: loại {item.kind} - ghi chú: {item.notes}" for item in items]
            context = "\n".join(lines)
            sources = ["database:maintenance"]
            source_details = [
                {"title": "database:maintenance", "snippet": line[:150], "score": 1.0} for line in lines[:3]
            ]
            return context, sources, source_details

        STOPWORDS = {
            "và", "hoặc", "cho", "của", "tại", "với", "trong", "trên", "dưới", "là",
            "có", "được", "bị", "khi", "nào", "gì", "sao", "thế", "này", "đó", "một",
            "các", "những", "làm", "như", "để", "vào", "ra", "thì", "mà", "bởi"
        }
        raw_words = message.lower().replace("?", " ").replace("!", " ").replace(".", " ").replace(",", " ").split()
        terms = [w for w in raw_words if len(w) > 1 and w not in STOPWORDS]
        if not terms:
            terms = [w for w in raw_words if len(w) > 1]

        chunks = db.query(DocumentChunk).all()
        scored_chunks = []
        full_query = " ".join(terms)

        for chunk in chunks:
            c_text = chunk.content.lower()
            d_name = chunk.document_name.lower()
            score = 0.0

            # 1. Khớp nguyên cụm từ khóa (n-gram bonus)
            if full_query and full_query in c_text:
                score += 8.0
            if full_query and full_query in d_name:
                score += 10.0

            # 2. Khớp từng từ khóa (Tiêu đề tài liệu trọng số x3.0, Nội dung trọng số x1.0)
            for term in terms:
                if term in d_name:
                    score += 3.0
                if term in c_text:
                    cnt = c_text.count(term)
                    score += min(cnt * 1.0, 4.0)

            if score > 0:
                scored_chunks.append((score, chunk))

        # Sắp xếp theo mức độ phù hợp cao nhất (Relevance Ranking)
        scored_chunks.sort(key=lambda x: x[0], reverse=True)

        # Tối ưu hóa phần cứng i7 + T2000 (4GB VRAM): Giới hạn tối đa Top 2 đoạn trích dẫn ngắn để prompt phản hồi tức thì
        top_matches = scored_chunks[:2]
        if not top_matches:
            return "", [], []

        context_parts = []
        sources = []
        source_details = []

        for score, chunk in top_matches:
            context_parts.append(f"[{chunk.document_name} - Phần #{chunk.chunk_index + 1}]\n{chunk.content}")
            if chunk.document_name not in sources:
                sources.append(chunk.document_name)
            snippet = chunk.content[:160] + "..." if len(chunk.content) > 160 else chunk.content
            source_details.append({
                "title": chunk.document_name,
                "snippet": snippet,
                "score": round(score, 2),
            })

        return "\n\n".join(context_parts), sources, source_details

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
Bạn là Trợ lý AI chuyên trách của Hệ thống Quản lý Thiết bị Phòng Lab Điện tử - IoT (Đề tài 23).

YÊU CẦU NGÔN NGỮ BẮT BUỘC:
- 100% câu trả lời BẮT BUỘC PHẢI LÀ TIẾNG VIỆT CHUẨN XÁC.
- TUYỆT ĐỐI KHÔNG dùng tiếng Trung, tiếng Anh hay bất kỳ chữ Hán nào. Không được xuất hiện chữ Hán trong câu trả lời.

NGUYÊN TẮC AN TOÀN BẮT BUỘC (TUÂN THỦ BR-011 & BR-014):
1. KHÔNG tự phê duyệt/từ chối phiếu mượn trả thiết bị (Quyền hạn duy nhất của Lab Manager).
2. KHÔNG tự ý đổi trạng thái thiết bị hay xác nhận kết luận sửa chữa (Quyền hạn của Kỹ thuật viên/Manager).
3. KHÔNG bịa đặt dữ liệu (Zero-hallucination). Chỉ sử dụng dữ liệu được cung cấp trong phần DỮ LIỆU THAM KHẢO. Nếu không có dữ liệu, nói rõ "Chưa có dữ liệu chính thức cho nội dung này".

TÍNH NĂNG XUẤT BÁO CÁO (.TXT / PDF):
- Khi người dùng muốn xuất file hoặc tải báo cáo dưới dạng .txt hoặc PDF: Hãy thông báo cho người dùng rằng họ có thể bấm ngay nút "Tải về .txt" (biểu tượng mũi tên tải xuống) hoặc nút "In / PDF" (biểu tượng máy in) ở góc trên bên phải của khung câu trả lời này để tải file về máy tính ngay lập tức.

CẤU TRÚC PHẢN HỒI (CÔ ĐỌNG, DƯỚI 150 TỪ):
- Trả lời trực diện, chuẩn xác và lịch sự.
- Với câu hỏi thống kê số lượng: Báo chính xác con số từ Dữ liệu tham khảo.
- Với câu hỏi kỹ thuật/sự cố: Trả lời 2-3 gạch đầu dòng rõ ràng theo SOP an toàn phòng lab.
""".strip()


def build_ai_service(settings: Settings) -> AIService:
    if settings.ai_provider != "ollama":
        raise ValueError(f"Unsupported AI_PROVIDER: {settings.ai_provider}")

    from app.services.ollama_provider import OllamaProvider

    return AIService(
        provider=OllamaProvider(settings),
        max_history_messages=settings.max_history_messages,
    )
