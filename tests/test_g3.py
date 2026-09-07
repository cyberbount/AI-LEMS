from datetime import datetime, timedelta
import time
import unittest

from fastapi.testclient import TestClient

from app.db import SessionLocal
from app.main import app
from app.models import BorrowRequest, Device, MaintenanceRecord, UsageHistory, User


class G3ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.suffix = str(time.time_ns())[-9:]
        cls.asset_code = f"G3-{cls.suffix}"
        cls.username = f"g3user{cls.suffix}"
        cls.email = f"{cls.username}@lab.local"
        cls.admin = cls._login("admin", "admin123")
        cls.user = cls._login("user", "user123")
        cls.tech = cls._login("technician", "tech123")
        created = cls.client.post(
            "/api/users",
            headers=cls.admin,
            json={
                "username": cls.username,
                "email": cls.email,
                "full_name": "G3 Test User",
                "password": "initial123",
                "role": "user",
            },
        )
        assert created.status_code == 201, created.text
        cls.test_user = cls._login(cls.username, "initial123")

    @classmethod
    def tearDownClass(cls):
        with SessionLocal() as db:
            user = db.query(User).filter(User.username == cls.username).first()
            devices = db.query(Device).filter(Device.asset_code.like(f"{cls.asset_code}%")).all()
            if user:
                db.query(UsageHistory).filter(UsageHistory.user_id == user.id).delete()
                db.query(BorrowRequest).filter(BorrowRequest.user_id == user.id).delete()
                db.delete(user)
            for device in devices:
                db.query(UsageHistory).filter(UsageHistory.device_id == device.id).delete()
                db.query(BorrowRequest).filter(BorrowRequest.device_id == device.id).delete()
                db.query(MaintenanceRecord).filter(MaintenanceRecord.device_id == device.id).delete()
                db.delete(device)
            db.commit()

    @classmethod
    def _login(cls, username, password):
        response = cls.client.post("/api/auth/login", data={"username": username, "password": password})
        assert response.status_code == 200, response.text
        return {"Authorization": f"Bearer {response.json()['access_token']}"}

    def test_password_change_success_and_old_password_rejected(self):
        changed = self.client.patch(
            "/api/auth/password",
            headers=self.test_user,
            json={"current_password": "initial123", "new_password": "changed123"},
        )
        self.assertEqual(changed.status_code, 204)
        old_login = self.client.post("/api/auth/login", data={"username": self.username, "password": "initial123"})
        self.assertEqual(old_login.status_code, 401)
        new_login = self.client.post("/api/auth/login", data={"username": self.username, "password": "changed123"})
        self.assertEqual(new_login.status_code, 200)

    def test_password_change_rejects_wrong_current_password(self):
        response = self.client.patch(
            "/api/auth/password",
            headers=self.test_user,
            json={"current_password": "wrong123", "new_password": "changed456"},
        )
        self.assertEqual(response.status_code, 400)

    def test_password_change_rejects_invalid_new_password(self):
        response = self.client.patch(
            "/api/auth/password",
            headers=self.test_user,
            json={"current_password": "initial123", "new_password": "short"},
        )
        self.assertEqual(response.status_code, 422)

    def test_password_change_requires_authentication(self):
        response = self.client.patch(
            "/api/auth/password",
            json={"current_password": "initial123", "new_password": "changed789"},
        )
        self.assertEqual(response.status_code, 401)

    def test_only_lab_manager_mapping_can_manage_accounts(self):
        payload = {
            "username": f"denied{self.suffix}",
            "email": f"denied{self.suffix}@lab.local",
            "full_name": "Denied",
            "password": "password123",
            "role": "user",
        }
        self.assertEqual(self.client.post("/api/users", headers=self.user, json=payload).status_code, 403)
        self.assertEqual(self.client.post("/api/users", headers=self.tech, json=payload).status_code, 403)

    def test_maintenance_device_is_unavailable_until_completion(self):
        created = self.client.post(
            "/api/devices",
            headers=self.admin,
            json={"asset_code": self.asset_code, "name": "G3 maintenance device", "category": "test"},
        )
        self.assertEqual(created.status_code, 201)
        device_id = created.json()["id"]
        record = self.client.post(
            "/api/maintenance",
            headers=self.tech,
            json={"device_id": device_id, "kind": "inspection", "notes": "G3"},
        )
        self.assertEqual(record.status_code, 201)
        blocked = self.client.post(
            "/api/requests",
            headers=self.user,
            json={"device_id": device_id, "purpose": "While maintained"},
        )
        self.assertEqual(blocked.status_code, 409)
        completed = self.client.patch(f"/api/maintenance/{record.json()['id']}/complete", headers=self.tech)
        self.assertEqual(completed.status_code, 200)
        allowed = self.client.post(
            "/api/requests",
            headers=self.user,
            json={"device_id": device_id, "purpose": "After maintenance"},
        )
        self.assertEqual(allowed.status_code, 201)

    def test_statistics_time_range_frequency_and_authorization(self):
        stats_asset = f"{self.asset_code}-STATS"
        created = self.client.post(
            "/api/devices",
            headers=self.admin,
            json={"asset_code": stats_asset, "name": "G3 statistics device", "category": "test"},
        )
        self.assertEqual(created.status_code, 201)
        device_id = created.json()["id"]
        now = datetime.utcnow()
        with SessionLocal() as db:
            window_start = now - timedelta(days=1)
            window_end = now + timedelta(minutes=1)
            baseline = db.query(UsageHistory).filter(
                UsageHistory.occurred_at >= window_start,
                UsageHistory.occurred_at <= window_end,
            ).count()
            db.add_all([
                UsageHistory(user_id=2, device_id=device_id, action="borrowed", occurred_at=now - timedelta(hours=1)),
                UsageHistory(user_id=2, device_id=device_id, action="returned", occurred_at=now),
                UsageHistory(user_id=2, device_id=device_id, action="borrowed", occurred_at=now - timedelta(days=10)),
            ])
            db.commit()
        start = window_start.isoformat()
        end = window_end.isoformat()
        response = self.client.get(f"/api/stats?start={start}&end={end}", headers=self.admin)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["usage_frequency"], baseline + 2)
        empty = self.client.get(
            f"/api/stats?start={(now + timedelta(days=1)).isoformat()}&end={(now + timedelta(days=2)).isoformat()}",
            headers=self.admin,
        )
        self.assertEqual(empty.status_code, 200)
        self.assertEqual(empty.json()["usage_frequency"], 0)
        invalid = self.client.get(f"/api/stats?start={end}&end={start}", headers=self.admin)
        self.assertEqual(invalid.status_code, 422)
        incomplete = self.client.get(f"/api/stats?start={start}", headers=self.admin)
        self.assertEqual(incomplete.status_code, 422)
        unauthorized = self.client.get(f"/api/stats?start={start}&end={end}")
        self.assertEqual(unauthorized.status_code, 401)


if __name__ == "__main__":
    unittest.main()
