from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

from app.config import get_settings


class Base(DeclarativeBase):
    pass


url = get_settings().database_url
engine = create_engine(url, connect_args={"check_same_thread": False} if url.startswith("sqlite") else {})
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    from app import models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    seed_defaults()


def seed_defaults() -> None:
    from app.models import Group, Location, Role, User
    from app.auth import hash_password

    with SessionLocal() as db:
        if db.query(Role).count() == 0:
            db.add_all([
                Role(name="admin", description="System administrator"),
                Role(name="user", description="Lab user"),
                Role(name="technician", description="Maintenance technician"),
            ])
        if db.query(User).count() == 0:
            db.add_all([
                User(username="admin", email="admin@lab.local", full_name="Lab Manager",
                     password_hash=hash_password("admin123"), role="admin", is_active=True),
                User(username="user", email="user@lab.local", full_name="Lab User",
                     password_hash=hash_password("user123"), role="user", is_active=True),
                User(username="technician", email="tech@lab.local", full_name="Maintenance Technician",
                     password_hash=hash_password("tech123"), role="technician", is_active=True),
            ])
        if db.query(Group).count() == 0:
            db.add_all([
                Group(name="IoT", description="IoT devices"),
                Group(name="Embedded", description="Embedded systems"),
                Group(name="Electronics", description="Electronics"),
                Group(name="Measurement", description="Measurement equipment"),
                Group(name="Safety", description="Safety equipment"),
            ])
        if db.query(Location).count() == 0:
            db.add_all([
                Location(name="Lab A", building="Building A"),
                Location(name="Lab B", building="Building A"),
                Location(name="Storage", building="Building B"),
            ])
        db.commit()
