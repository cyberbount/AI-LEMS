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


if __name__ == "__main__":
    unittest.main()
