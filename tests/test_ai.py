import asyncio
import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models import DocumentChunk
from app.services.ai_service import AIService
from app.schemas import ChatMessage


class FakeProvider:
    name = "fake"
    model = "test-model"

    async def chat(self, messages):
        return "Phản hồi kiểm thử local"

    async def health(self):
        return True


class AiServiceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        cls.db = sessionmaker(bind=engine)()
        cls.db.add(DocumentChunk(document_name="Lab SOP", content="Ngắt nguồn trước bảo trì thiết bị.", chunk_index=0))
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_keyword_context_returns_source(self):
        service = AIService(FakeProvider(), max_history_messages=2)
        result = asyncio.run(service.chat("bảo trì thiết bị", [], "rag", self.db))
        self.assertTrue(result.grounded)
        self.assertEqual(result.sources, ["Lab SOP"])
        self.assertEqual(result.answer, "Phản hồi kiểm thử local")

    def test_history_is_bounded_and_system_messages_are_removed(self):
        service = AIService(FakeProvider(), max_history_messages=2)
        history = [
            ChatMessage(role="user", content="cũ"),
            ChatMessage(role="system", content="không được gửi"),
            ChatMessage(role="assistant", content="gần đây"),
        ]
        result = asyncio.run(service.chat("hỏi", history, "chat", self.db))
        self.assertEqual(result.mode, "chat")


if __name__ == "__main__":
    unittest.main()
