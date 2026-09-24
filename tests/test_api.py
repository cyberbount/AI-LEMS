import time
import unittest

from fastapi.testclient import TestClient

from app.main import app
from app.db import SessionLocal
from app.models import Device


class ApiWorkflowTests(unittest.TestCase):
    """Executable evidence for the implemented local API workflow."""

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        suffix = str(time.time_ns())[-8:]
        cls.asset_prefix = f"TEST-{suffix}"
        cls.admin = cls._login("admin", "admin123")
        cls.user = cls._login("user", "user123")
        cls.tech = cls._login("technician", "tech123")

    @classmethod
    def tearDownClass(cls):
        with SessionLocal() as db:
            items = db.query(Device).filter(Device.asset_code.like(f"{cls.asset_prefix}%")).all()
            for item in items:
                db.delete(item)
            db.commit()

    @classmethod
    def _login(cls, username, password):
        response = cls.client.post(
            "/api/auth/login",
            data={"username": username, "password": password},
        )
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    def test_login_and_me(self):
        response = self.client.get("/api/auth/me", headers=self.user)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["username"], "user")

    def test_rbac_rejects_user_creating_device(self):
        asset_code = f"{self.asset_prefix}-RBAC"
        response = self.client.post(
            "/api/devices",
            headers=self.user,
            json={"asset_code": asset_code, "name": "Test device", "category": "test"},
        )
        self.assertEqual(response.status_code, 403)

    def test_device_and_borrow_return_lifecycle(self):
        asset_code = f"{self.asset_prefix}-FLOW"
        created = self.client.post(
            "/api/devices",
            headers=self.admin,
            json={"asset_code": asset_code, "name": "Test device", "category": "test"},
        )
        self.assertEqual(created.status_code, 201, created.text)
        device_id = created.json()["id"]

        request = self.client.post(
            "/api/requests",
            headers=self.user,
            json={"device_id": device_id, "purpose": "API workflow test"},
        )
        self.assertEqual(request.status_code, 201, request.text)
        request_id = request.json()["id"]

        approved = self.client.patch(f"/api/requests/{request_id}/approve", headers=self.admin)
        self.assertEqual(approved.status_code, 200)
        borrowed = self.client.patch(f"/api/requests/{request_id}/borrow", headers=self.user)
        self.assertEqual(borrowed.status_code, 200)
        returned = self.client.patch(f"/api/requests/{request_id}/return", headers=self.user)
        self.assertEqual(returned.status_code, 200)
        self.assertEqual(returned.json()["status"], "returned")

    def test_user_management_crud_and_reset_password(self):
        suffix = str(time.time_ns())[-6:]
        username = f"testuser_{suffix}"
        created = self.client.post(
            "/api/users",
            headers=self.admin,
            json={
                "username": username,
                "email": f"{username}@test.vn",
                "full_name": "Test User",
                "role": "user",
                "password": "initialpassword123",
            },
        )
        self.assertEqual(created.status_code, 201)
        uid = created.json()["id"]

        # Update user
        updated = self.client.patch(
            f"/api/users/{uid}",
            headers=self.admin,
            json={"full_name": "Updated Name", "is_active": True},
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["full_name"], "Updated Name")

        # Reset password
        reset = self.client.post(
            f"/api/users/{uid}/reset-password",
            headers=self.admin,
            json={"new_password": "newsecretpassword123"},
        )
        self.assertEqual(reset.status_code, 204)

        # Login with new password
        login_res = self.client.post(
            "/api/auth/login",
            data={"username": username, "password": "newsecretpassword123"},
        )
        self.assertEqual(login_res.status_code, 200)

        # Deactivate / delete
        deactivated = self.client.delete(f"/api/users/{uid}", headers=self.admin)
        self.assertEqual(deactivated.status_code, 204)

    def test_unavailable_device_is_rejected(self):
        asset_code = f"{self.asset_prefix}-BUSY"
        created = self.client.post(
            "/api/devices",
            headers=self.admin,
            json={"asset_code": asset_code, "name": "Busy test device", "category": "test"},
        )
        self.assertEqual(created.status_code, 201)
        device_id = created.json()["id"]
        self.client.patch(f"/api/devices/{device_id}/status?status=maintenance", headers=self.tech)
        response = self.client.post(
            "/api/requests",
            headers=self.user,
            json={"device_id": device_id, "purpose": "Unavailable test"},
        )
        self.assertEqual(response.status_code, 409)


    def test_device_condition_and_research_category(self):
        asset_code = f"{self.asset_prefix}-COND"
        created = self.client.post(
            "/api/devices",
            headers=self.admin,
            json={
                "asset_code": asset_code,
                "name": "ESP32 DevKit V4",
                "category": "Mạch nhúng & Vi điều khiển",
                "condition": "Mới nguyên hộp",
            },
        )
        self.assertEqual(created.status_code, 201)
        data = created.json()
        self.assertEqual(data["category"], "Mạch nhúng & Vi điều khiển")
        self.assertEqual(data["condition"], "Mới nguyên hộp")

        # Update condition & status
        dev_id = data["id"]
        updated = self.client.patch(
            f"/api/devices/{dev_id}/status?status=available&condition=Đã qua sử dụng - Hoạt động tốt",
            headers=self.admin,
        )
        self.assertEqual(updated.status_code, 200)
        self.assertEqual(updated.json()["condition"], "Đã qua sử dụng - Hoạt động tốt")


if __name__ == "__main__":
    unittest.main()


