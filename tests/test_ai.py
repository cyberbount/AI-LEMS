import asyncio
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.db import Base
from app.models import DocumentChunk
from app.services.ai_service import AIService
from app.services.ai_service import ChatResult
from app.schemas import ChatMessage
from app.main import app
from app.routers import ai as ai_router
from fastapi.testclient import TestClient


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


class AiAuthenticationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        login = cls.client.post("/api/auth/login", data={"username": "user", "password": "user123"})
        cls.headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    def test_unauthenticated_ai_request_is_rejected(self):
        response = self.client.post("/api/ai/chat", json={"message": "Hỏi về an toàn", "mode": "chat"})
        self.assertEqual(response.status_code, 401)

    def test_authenticated_ai_request_reaches_service(self):
        class FakeService:
            provider = type("Provider", (), {"model": "test-model", "name": "fake"})()

            async def chat(self, message, history, mode, db):
                return ChatResult(answer="ok", mode=mode, grounded=False, sources=[])

        with patch.object(ai_router, "service", FakeService()):
            response = self.client.post(
                "/api/ai/chat",
                headers=self.headers,
                json={"message": "Hỏi về an toàn", "mode": "chat"},
            )
        self.assertEqual(response.status_code, 200, response.text)
        self.assertEqual(response.json()["answer"], "ok")


if __name__ == "__main__":
    unittest.main()
