import asyncio
import sys
import os

# Ensure backend in sys.path
sys.path.insert(0, os.path.abspath("backend"))

from app.db import SessionLocal
from app.config import get_settings
from app.services.ai_service import build_ai_service

async def main():
    settings = get_settings()
    service = build_ai_service(settings)

    print("Checking Ollama service health...")
    is_healthy = await service.health()
    print(f"Ollama health: {is_healthy}")
    if not is_healthy:
        print("Warning: Ollama is not healthy!")
        return

    scenarios = [
        {
            "category": "1. Nhân sự & Kỹ thuật viên (Câu hỏi của người dùng)",
            "prompt": "Xin chào hiện tại có bao nhiêu kĩ thuật viên đang hoạt động trong hệ thống?",
            "role": "manager",
            "mode": "chat",
        },
        {
            "category": "2. Khả năng & Năng lực AI (Câu hỏi của người dùng)",
            "prompt": "bạn có thể cung cấp cho tôi thông tin gì",
            "role": "manager",
            "mode": "chat",
        },
        {
            "category": "3. Tra cứu vị trí phòng Lab (Lab 301)",
            "prompt": "Phòng Lab 301 có những thiết bị nào?",
            "role": "user",
            "mode": "chat",
        },
        {
            "category": "4. Tình trạng bảo trì / Hỏng hóc",
            "prompt": "Thiết bị nào đang ở tình trạng bảo trì hoặc hỏng hóc?",
            "role": "technician",
            "mode": "chat",
        },
        {
            "category": "5. Tra cứu thương hiệu cụ thể (Rigol)",
            "prompt": "Máy hiện sóng Rigol có sẵn để mượn không?",
            "role": "user",
            "mode": "chat",
        },
        {
            "category": "6. Mượn trả & Người đang mượn",
            "prompt": "Ai đang mượn máy trong phòng lab?",
            "role": "manager",
            "mode": "chat",
        },
        {
            "category": "7. An toàn kỹ thuật / SOP",
            "prompt": "Khi xảy ra sự cố chập điện trong phòng lab thì phải làm gì đầu tiên?",
            "role": "user",
            "mode": "chat",
        },
        {
            "category": "8. Ngoài phạm vi phòng lab (Out-of-scope guardrail)",
            "prompt": "Công thức làm bánh pizza phô mai xúc xích kiểu Ý?",
            "role": "user",
            "mode": "chat",
        },
    ]

    for sc in scenarios:
        print("\n" + "="*80)
        print(f"TEST: {sc['category']}")
        print(f"PROMPT: {sc['prompt']}")
        print(f"ROLE: {sc['role']} | MODE: {sc['mode']}")
        print("-" * 80)
        
        with SessionLocal() as db:
            result = await service.chat(
                message=sc["prompt"],
                history=[],
                mode=sc["mode"],
                db=db,
                user_role=sc["role"],
            )

        print(f"GROUNDED: {result.grounded}")
        print(f"SOURCES: {result.sources}")
        if result.safety_note:
            print(f"SAFETY NOTE: {result.safety_note}")
        print(f"ANSWER:\n{result.answer}")
        print("="*80)

if __name__ == "__main__":
    asyncio.run(main())
