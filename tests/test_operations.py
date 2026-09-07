import time
import unittest

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import Device, MaintenanceRecord


class OperationsApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        suffix = str(time.time_ns())[-8:]
        cls.asset_code = f"OPS-{suffix}"
        login = cls.client.post("/api/auth/login", data={"username": "admin", "password": "admin123"})
        cls.admin = {"Authorization": f"Bearer {login.json()['access_token']}"}
        login = cls.client.post("/api/auth/login", data={"username": "technician", "password": "tech123"})
        cls.technician = {"Authorization": f"Bearer {login.json()['access_token']}"}

    @classmethod
    def tearDownClass(cls):
        with SessionLocal() as db:
            device = db.query(Device).filter(Device.asset_code == cls.asset_code).first()
            if device:
                db.query(MaintenanceRecord).filter(MaintenanceRecord.device_id == device.id).delete()
                db.delete(device)
                db.commit()

    def test_maintenance_completion_and_stats(self):
        device = self.client.post(
            "/api/devices",
            headers=self.admin,
            json={"asset_code": self.asset_code, "name": "Operations test device", "category": "test"},
        )
        self.assertEqual(device.status_code, 201, device.text)
        device_id = device.json()["id"]
        maintenance = self.client.post(
            "/api/maintenance",
            headers=self.technician,
            json={"device_id": device_id, "kind": "inspection", "notes": "Test inspection"},
        )
        self.assertEqual(maintenance.status_code, 201, maintenance.text)
        item_id = maintenance.json()["id"]
        completed = self.client.patch(f"/api/maintenance/{item_id}/complete", headers=self.technician)
        self.assertEqual(completed.status_code, 200)
        self.assertEqual(completed.json()["status"], "completed")
        stats = self.client.get("/api/stats", headers=self.admin)
        self.assertEqual(stats.status_code, 200)
        self.assertIn("maintenance_open", stats.json())


if __name__ == "__main__":
    unittest.main()
