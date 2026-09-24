import asyncio
from app.db import SessionLocal
from app.models import User
from app.auth import create_access_token
import httpx

async def main():
    db = SessionLocal()
    admin = db.query(User).filter_by(role="admin").first()
    token = create_access_token(admin.id, admin.role)
    db.close()
    
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        for ep in ["/api/devices", "/api/maintenance", "/api/requests", "/api/stats", "/api/users"]:
            res = await client.get(ep, headers=headers)
            print(f"{ep}: {res.status_code}")
            if res.status_code != 200:
                print(res.text)

asyncio.run(main())
