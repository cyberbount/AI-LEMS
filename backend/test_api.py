import asyncio
from app.db import SessionLocal
from app.models import User
from app.auth import create_access_token
import httpx

async def main():
    db = SessionLocal()
    admin = db.query(User).filter_by(role="admin").first()
    token = create_access_token(admin.id)
    db.close()
    
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000") as client:
        res = await client.get("/api/devices", headers=headers)
        print("Devices:", res.status_code, res.text[:100])
        
        res = await client.get("/api/maintenance", headers=headers)
        print("Maintenance:", res.status_code, res.text[:100])
        
        res = await client.get("/api/requests", headers=headers)
        print("Requests:", res.status_code, res.text[:100])
        
        res = await client.get("/api/stats", headers=headers)
        print("Stats:", res.status_code, res.text[:100])

asyncio.run(main())
