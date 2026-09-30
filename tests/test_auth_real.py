import time
import unittest
from unittest.mock import AsyncMock, patch, MagicMock

from fastapi.testclient import TestClient
import httpx

from app.main import app
from app.db import SessionLocal
from app.models import User
from app.auth import hash_password
from app.config import get_settings


class RealAuthenticationTests(unittest.TestCase):
    """End-to-end tests for production authentication flows."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        suffix = str(time.time_ns())[-6:]
        cls.suffix = suffix
        cls.active_user_name = f"realuser_{suffix}"
        cls.active_user_email = f"realuser_{suffix}@lab.local"
        cls.inactive_user_name = f"disabled_{suffix}"
        cls.inactive_user_email = f"disabled_{suffix}@lab.local"
        cls.plain_password = "SecretPassword123!"

        with SessionLocal() as db:
            active_user = User(
                username=cls.active_user_name,
                email=cls.active_user_email,
                full_name="Active Lab User",
                password_hash=hash_password(cls.plain_password),
                role="user",
                is_active=True,
            )
            inactive_user = User(
                username=cls.inactive_user_name,
                email=cls.inactive_user_email,
                full_name="Disabled User",
                password_hash=hash_password(cls.plain_password),
                role="user",
                is_active=False,
            )
            db.add_all([active_user, inactive_user])
            db.commit()

    @classmethod
    def tearDownClass(cls):
        from app.models import AuditLog
        with SessionLocal() as db:
            items = db.query(User).filter(
                User.username.in_([cls.active_user_name, cls.inactive_user_name])
            ).all()
            for item in items:
                db.query(AuditLog).filter(AuditLog.user_id == item.id).delete()
                db.delete(item)
            db.commit()

    def test_local_login_by_username_success(self):
        resp = self.client.post(
            "/api/auth/login",
            data={"username": self.active_user_name, "password": self.plain_password},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["token_type"], "bearer")

        # Verify token allows accessing /api/auth/me and returns correct role
        me_resp = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        self.assertEqual(me_resp.status_code, 200)
        me_data = me_resp.json()
        self.assertEqual(me_data["username"], self.active_user_name)
        self.assertEqual(me_data["role"], "user")

    def test_local_login_by_email_success(self):
        resp = self.client.post(
            "/api/auth/login",
            data={"username": self.active_user_email, "password": self.plain_password},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)

    def test_local_login_wrong_password_rejected(self):
        resp = self.client.post(
            "/api/auth/login",
            data={"username": self.active_user_name, "password": "WrongPassword999"},
        )
        self.assertEqual(resp.status_code, 401)

    def test_local_login_unknown_user_rejected(self):
        resp = self.client.post(
            "/api/auth/login",
            data={"username": f"nonexistent_{self.suffix}", "password": self.plain_password},
        )
        self.assertEqual(resp.status_code, 401)

    def test_local_login_disabled_user_rejected_with_403(self):
        resp = self.client.post(
            "/api/auth/login",
            data={"username": self.inactive_user_name, "password": self.plain_password},
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("bị khóa", resp.json()["detail"])

    def _patched_settings(self):
        stub = MagicMock()
        stub.google_client_id = "test-google-client-id"
        return stub

    @patch("app.routers.auth.get_settings")
    @patch("httpx.AsyncClient.get")
    def test_google_login_authorized_user_success(self, mock_get, mock_settings):
        mock_settings.return_value = self._patched_settings()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": self.active_user_email,
            "email_verified": "true",
            "name": "Active Lab User",
            "aud": "test-google-client-id",  # khop voi _patched_settings
        }
        mock_get.return_value = mock_resp

        resp = self.client.post(
            "/api/auth/google",
            json={"id_token": "valid_google_token_123"},
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)

        # Token identity verification
        me_resp = self.client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {data['access_token']}"},
        )
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["email"], self.active_user_email)
        self.assertEqual(me_resp.json()["role"], "user")

    @patch("app.routers.auth.get_settings")
    @patch("httpx.AsyncClient.get")
    def test_google_login_unknown_user_rejected_with_403(self, mock_get, mock_settings):
        mock_settings.return_value = self._patched_settings()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": f"stranger_{self.suffix}@unknown.com",
            "email_verified": True,
            "name": "Stranger",
            "aud": "test-google-client-id",  # khop voi _patched_settings
        }
        mock_get.return_value = mock_resp

        resp = self.client.post(
            "/api/auth/google",
            json={"id_token": "valid_google_token_unknown_user"},
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("chưa được phân quyền", resp.json()["detail"])

    @patch("app.routers.auth.get_settings")
    @patch("httpx.AsyncClient.get")
    def test_google_login_disabled_user_rejected_with_403(self, mock_get, mock_settings):
        mock_settings.return_value = self._patched_settings()
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": self.inactive_user_email,
            "email_verified": True,
            "name": "Disabled User",
            "aud": "test-google-client-id",  # khop voi _patched_settings
        }
        mock_get.return_value = mock_resp

        resp = self.client.post(
            "/api/auth/google",
            json={"id_token": "valid_google_token_disabled_user"},
        )
        self.assertEqual(resp.status_code, 403)
        self.assertIn("bị vô hiệu hóa", resp.json()["detail"])

    @patch("httpx.AsyncClient.get")
    def test_google_login_invalid_token_rejected_with_401(self, mock_get):
        mock_resp = MagicMock()
        mock_resp.status_code = 400
        mock_get.return_value = mock_resp

        resp = self.client.post(
            "/api/auth/google",
            json={"id_token": "fake_expired_token"},
        )
        self.assertEqual(resp.status_code, 401)

    @patch("app.routers.auth.get_settings")
    @patch("httpx.AsyncClient.get")
    def test_google_login_fail_closed_without_client_id(self, mock_get, mock_settings):
        stub = MagicMock()
        stub.google_client_id = ""  # chua cau hinh -> tu choi, khong bo qua kiem tra aud
        mock_settings.return_value = stub
        mock_resp = MagicMock()
        mock_resp.status_code = 200
        mock_resp.json.return_value = {
            "email": f"anyone_{self.suffix}@gmail.com",
            "email_verified": "true",
            "name": "Anyone",
            "aud": "some-other-app-client-id",
        }
        mock_get.return_value = mock_resp

        resp = self.client.post("/api/auth/google", json={"id_token": "valid_looking_token"})
        self.assertEqual(resp.status_code, 503)

    def test_rbac_backend_enforcement_blocks_unauthorized_roles(self):
        # Login as user
        user_login = self.client.post(
            "/api/auth/login",
            data={"username": self.active_user_name, "password": self.plain_password},
        )
        user_headers = {"Authorization": f"Bearer {user_login.json()['access_token']}"}

        # User tries to create device (requires admin/manager) -> 403
        device_resp = self.client.post(
            "/api/devices",
            headers=user_headers,
            json={"asset_code": f"FORBIDDEN-{self.suffix}", "name": "Illegal Device", "category": "test"},
        )
        self.assertEqual(device_resp.status_code, 403)

        # User tries to access user management (requires admin) -> 403
        users_resp = self.client.get("/api/users", headers=user_headers)
        self.assertEqual(users_resp.status_code, 403)


if __name__ == "__main__":
    unittest.main()

