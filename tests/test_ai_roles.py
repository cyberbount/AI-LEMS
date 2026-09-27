"""Kiểm thử chính sách phân quyền tri thức AI (BR-015, mục 2.9/2.11 Báo cáo).

Phủ: lọc SOP theo allowed_roles, chặn mode theo vai trò (router + service),
ngữ cảnh liệt kê thiết bị theo phạm vi vai trò, safety_note, API quản lý
tài liệu (FR-014) với kiểm tra loại/kích thước file, và audit AI_QUERY.
"""

import asyncio
import unittest
from unittest.mock import patch

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from fastapi.testclient import TestClient

from app.db import Base, SessionLocal
from app.models import AuditLog, Device, Document, DocumentChunk, User
from app.services.ai_service import AIService, ChatResult


class FakeCapturingProvider:
    """Provider giả ghi lại system message để kiểm chứng ngữ cảnh nạp cho model."""

    name = "fake-roles"
    model = "test-roles-model"

    def __init__(self):
        self.last_messages = None

    async def chat(self, messages):
        self.last_messages = [m.content for m in messages]
        return "Phản hồi kiểm thử theo ngữ cảnh được cung cấp."

    async def health(self):
        return True


def _make_service():
    return AIService(FakeCapturingProvider(), max_history_messages=4)


class RoleScopedRetrievalTests(unittest.TestCase):
    """Lớp 1 — lọc SOP theo documents.allowed_roles (mục 2.11 Báo cáo)."""

    @classmethod
    def setUpClass(cls):
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        cls.db = sessionmaker(bind=engine)()
        cls.db.add(Document(
            name="SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD",
            description="Nội bộ kỹ thuật", allowed_roles="admin,manager,technician",
        ))
        cls.db.flush()
        cls.db.add(DocumentChunk(
            document_id=1,
            document_name="SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD",
            content="Nhiệt độ hàn SMD chuẩn 320-350 độ, bắt buộc đeo vòng chống tĩnh điện ESD.",
            chunk_index=0,
        ))
        cls.db.commit()
        cls.staff_sop_name = "SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD"

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_user_cannot_retrieve_staff_sop(self):
        service = _make_service()
        result = asyncio.run(service.chat(
            "Nhiệt độ hàn SMD và quy định ESD?", [], "rag", self.db, user_role="user",
        ))
        self.assertFalse(result.grounded)
        self.assertEqual(result.sources, [])
        self.assertNotIn(self.staff_sop_name, result.sources)

    def test_technician_can_retrieve_staff_sop(self):
        service = _make_service()
        result = asyncio.run(service.chat(
            "Nhiệt độ hàn SMD và quy định ESD?", [], "rag", self.db, user_role="technician",
        ))
        self.assertTrue(result.grounded)
        self.assertIn(self.staff_sop_name, result.sources)

    def test_summary_mode_rejected_for_user_at_service_level(self):
        service = _make_service()
        with self.assertRaises(PermissionError):
            asyncio.run(service.chat("tổng quan?", [], "summary", self.db, user_role="user"))


class InventoryContextTests(unittest.TestCase):
    """Lớp 2 — ngữ cảnh liệt kê thiết bị theo phạm vi vai trò."""

    @classmethod
    def setUpClass(cls):
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        cls.db = sessionmaker(bind=engine)()
        cls.db.add(Device(asset_code="EQ-900", name="Xe robot TurtleBot", category="Robot", status="available"))
        cls.db.add(Device(asset_code="EQ-901", name="Máy hiện sóng hỏng", category="Máy đo", status="maintenance", condition="Hỏng mạch nguồn"))
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def _ask_inventory(self, role: str):
        service = _make_service()
        result = asyncio.run(service.chat(
            "Hãy liệt kê tất cả các thiết bị trong hệ thống cho tôi", [], "chat", self.db, user_role=role,
        ))
        provider = service.provider
        system_content = provider.last_messages[0] if provider.last_messages else ""
        return result, system_content

    def test_manager_inventory_lists_all_devices(self):
        result, system_content = self._ask_inventory("manager")
        self.assertTrue(result.grounded)
        self.assertIn("database:devices", result.sources)
        self.assertIn("EQ-900", system_content)
        self.assertIn("EQ-901", system_content)

    def test_user_inventory_only_available_devices(self):
        result, system_content = self._ask_inventory("user")
        self.assertIn("EQ-900", system_content)
        self.assertNotIn("EQ-901", system_content)

    def test_technician_inventory_focuses_on_technical_statuses(self):
        result, system_content = self._ask_inventory("technician")
        self.assertIn("EQ-901", system_content)
        self.assertNotIn("EQ-900 —", system_content)


class SafetyNoteTests(unittest.TestCase):
    def test_safety_note_on_electrical_question(self):
        service = _make_service()
        result = asyncio.run(service.chat("Xử lý chập cháy điện thế nào?", [], "chat", None, user_role="user"))
        self.assertIsNotNone(result.safety_note)

    def test_no_safety_note_on_general_question(self):
        service = _make_service()
        result = asyncio.run(service.chat("Quy định mượn trả thiết bị?", [], "chat", None, user_role="user"))
        self.assertIsNone(result.safety_note)


class AIModeAuthorizationApiTests(unittest.TestCase):
    """Lớp 3 — router chặn mode theo vai trò (403) + audit AI_QUERY."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(__import__("app.main", fromlist=["app"]).app)

    def _login(self, username, password):
        resp = self.client.post("/api/auth/login", data={"username": username, "password": password})
        self.assertEqual(resp.status_code, 200, resp.text)
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    def test_user_summary_mode_is_403(self):
        headers = self._login("user", "user123")
        resp = self.client.post("/api/ai/chat", headers=headers, json={"message": "tổng quan?", "mode": "summary"})
        self.assertEqual(resp.status_code, 403)

    def test_technician_summary_mode_is_403(self):
        headers = self._login("technician", "tech123")
        resp = self.client.post("/api/ai/chat", headers=headers, json={"message": "tổng quan?", "mode": "summary"})
        self.assertEqual(resp.status_code, 403)

    def test_ai_query_is_audited(self):
        headers = self._login("user", "user123")

        class FakeService:
            provider = type("Provider", (), {"model": "test-model", "name": "fake"})()

            async def chat(self, message, history, mode, db, user_role="user"):
                return ChatResult(answer="ok", mode=mode, grounded=False, sources=[])

        with patch("app.routers.ai.service", FakeService()):
            resp = self.client.post(
                "/api/ai/chat", headers=headers,
                json={"message": "Câu hỏi kiểm thử audit AI_QUERY", "mode": "chat"},
            )
        self.assertEqual(resp.status_code, 200, resp.text)
        db = SessionLocal()
        try:
            logged = db.query(AuditLog).filter(
                AuditLog.action == "AI_QUERY", AuditLog.details.like("%Câu hỏi kiểm thử audit AI_QUERY%"),
            ).first()
            self.assertIsNotNone(logged)
        finally:
            db.close()


class DocumentsApiTests(unittest.TestCase):
    """Lớp 4 — API quản lý tài liệu (FR-014) + kiểm tra loại/kích thước file."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(__import__("app.main", fromlist=["app"]).app)
        admin_headers = cls._login_static(cls.client, "admin", "admin123")
        suffix = str(int(__import__("time").time_ns() % 1_000_000))
        cls.manager_username = f"docmgr_{suffix}"
        resp = cls.client.post(
            "/api/users", headers=admin_headers,
            json={"username": cls.manager_username, "email": f"{cls.manager_username}@lab.local",
                  "full_name": "Manager Kiểm thử", "password": "matkhau123456", "role": "manager"},
        )
        assert resp.status_code == 201, resp.text
        cls.manager_headers = cls._login_static(cls.client, cls.manager_username, "matkhau123456")
        cls.user_headers = cls._login_static(cls.client, "user", "user123")
        cls.created_ids = []

    @classmethod
    def _login_static(cls, client, username, password):
        resp = client.post("/api/auth/login", data={"username": username, "password": password})
        assert resp.status_code == 200, resp.text
        return {"Authorization": f"Bearer {resp.json()['access_token']}"}

    @classmethod
    def tearDownClass(cls):
        # Dọn tài liệu do test tạo để không ô nhiễm tri thức RAG của lab.db thật
        for doc_id in getattr(cls, "created_ids", []):
            try:
                cls.client.delete(f"/api/documents/{doc_id}", headers=cls.manager_headers)
            except Exception:
                pass
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == cls.manager_username).first()
            if user:
                db.delete(user)
            db.commit()
        finally:
            db.close()

    def _cleanup(self, doc_id):
        if doc_id:
            self.client.delete(f"/api/documents/{doc_id}", headers=self.manager_headers)

    def test_user_cannot_create_document(self):
        resp = self.client.post(
            "/api/documents", headers=self.user_headers,
            json={"name": f"Tài liệu user tự tạo {__import__('time').time_ns()}"},
        )
        self.assertEqual(resp.status_code, 403)

    def test_manager_creates_document_with_auto_chunking(self):
        suffix = __import__("time").time_ns()
        name = f"SOP-KT: Tài liệu kiểm thử {suffix}"
        content = "Nội dung đoạn một về kiểm thử tài liệu.\n\nNội dung đoạn hai chi tiết hơn về quy trình kiểm thử RAG trong hệ thống phòng lab."
        resp = self.client.post(
            "/api/documents", headers=self.manager_headers,
            json={"name": name, "description": "Tài liệu tạo bởi test", "content": content, "allowed_roles": "admin,manager,technician"},
        )
        self.assertEqual(resp.status_code, 201, resp.text)
        body = resp.json()
        self.assertGreaterEqual(body["chunk_count"], 1)
        self.assertEqual(body["allowed_roles"], "admin,manager,technician")
        self.created_ids.append(body["id"])
        listing = self.client.get("/api/documents", headers=self.manager_headers).json()
        self.assertIn(name, [d["name"] for d in listing])

    def test_upload_rejects_non_text_extension(self):
        resp = self.client.post(
            "/api/documents/upload", headers=self.manager_headers,
            files={"file": ("malware.exe", b"MZ fake binary", "application/octet-stream")},
        )
        self.assertEqual(resp.status_code, 400)

    def test_upload_accepts_markdown_within_size_limit(self):
        suffix = __import__("time").time_ns()
        content = "# SOP kiểm thử upload\n\nĐoạn văn bản markdown dùng để kiểm tra pipeline nạp tài liệu RAG."
        resp = self.client.post(
            "/api/documents/upload", headers=self.manager_headers,
            files={"file": (f"sop-test-{suffix}.md", content.encode("utf-8"), "text/markdown")},
            data={"allowed_roles": "admin,manager"},
        )
        self.assertEqual(resp.status_code, 201, resp.text)
        body = resp.json()
        self.assertGreaterEqual(body["chunk_count"], 1)
        self.assertEqual(body["allowed_roles"], "admin,manager")
        self.created_ids.append(body["id"])

    def test_delete_document_removes_chunks(self):
        suffix = __import__("time").time_ns()
        resp = self.client.post(
            "/api/documents", headers=self.manager_headers,
            json={"name": f"SOP-Xóa: {suffix}", "content": "Nội dung sẽ bị xóa hoàn toàn khỏi RAG."},
        )
        self.assertEqual(resp.status_code, 201)
        doc_id = resp.json()["id"]
        del_resp = self.client.delete(f"/api/documents/{doc_id}", headers=self.manager_headers)
        self.assertEqual(del_resp.status_code, 204)
        db = SessionLocal()
        try:
            from app.models import DocumentChunk
            leftover = db.query(DocumentChunk).filter(DocumentChunk.document_id == doc_id).count()
            self.assertEqual(leftover, 0)
            self.assertIsNone(db.get(Document, doc_id))
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()


class InventoryAcrossModesTests(unittest.TestCase):
    """Sửa lỗi thực tế 2026-09-27: hỏi 'liệt kê thiết bị' trong mode summary
    phải vẫn nhận ngữ cảnh danh sách thiết bị, không chỉ con số đếm."""

    @classmethod
    def setUpClass(cls):
        engine = create_engine("sqlite+pysqlite:///:memory:")
        Base.metadata.create_all(engine)
        cls.db = sessionmaker(bind=engine)()
        cls.db.add(Device(asset_code="EQ-950", name="Bộ phát tín hiệu Siglent", category="Máy đo", status="available"))
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.close()

    def test_summary_mode_with_inventory_keyword_lists_devices(self):
        service = _make_service()
        result = asyncio.run(service.chat(
            "liệt kê tên thiết bị", [], "summary", self.db, user_role="manager",
        ))
        self.assertTrue(result.grounded)
        self.assertIn("database:devices", result.sources)
        system_content = service.provider.last_messages[0]
        self.assertIn("EQ-950", system_content)
        self.assertIn("Bộ phát tín hiệu Siglent", system_content)

    def test_inventory_keyword_with_typo_still_matches(self):
        service = _make_service()
        result = asyncio.run(service.chat(
            "liệt kê tênm thiết bị", [], "chat", self.db, user_role="manager",
        ))
        self.assertTrue(result.grounded)
        self.assertIn("database:devices", result.sources)
