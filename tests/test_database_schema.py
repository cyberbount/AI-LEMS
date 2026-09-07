import re
from pathlib import Path

from sqlalchemy import create_engine, inspect

from app.db import Base
from app import models  # noqa: F401


ROOT = Path(__file__).resolve().parents[1]
EXPECTED_TABLES = {
    "roles",
    "users",
    "device_groups",
    "locations",
    "devices",
    "borrow_requests",
    "usage_history",
    "maintenance_schedules",
    "maintenance_records",
    "documents",
    "document_chunks",
}


def test_orm_schema_has_expected_entities_and_constraints():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    inspector = inspect(engine)

    assert set(inspector.get_table_names()) == EXPECTED_TABLES
    assert {table.name for table in Base.metadata.tables.values()} == EXPECTED_TABLES

    for table_name in EXPECTED_TABLES:
        columns = {column["name"]: column for column in inspector.get_columns(table_name)}
        assert "id" in columns or table_name == "roles"
        assert inspector.get_pk_constraint(table_name)["constrained_columns"]
        assert all(foreign_key["constrained_columns"] for foreign_key in inspector.get_foreign_keys(table_name))

    users = {column["name"]: column for column in inspector.get_columns("users")}
    assert users["password_hash"]["nullable"] is False
    user_unique = {column for constraint in inspector.get_unique_constraints("users") for column in constraint["column_names"]}
    user_unique |= {column for index in inspector.get_indexes("users") if index["unique"] for column in index["column_names"]}
    assert user_unique >= {"username", "email"}

    devices = {column["name"]: column for column in inspector.get_columns("devices")}
    assert devices["asset_code"]["nullable"] is False
    device_unique = {column for constraint in inspector.get_unique_constraints("devices") for column in constraint["column_names"]}
    device_unique |= {column for index in inspector.get_indexes("devices") if index["unique"] for column in index["column_names"]}
    assert device_unique >= {"asset_code"}

    indexed_columns = {index["column_names"][0] for index in inspector.get_indexes("devices")}
    assert "status" in indexed_columns


def test_canonical_and_mysql_schema_contain_the_same_entity_set():
    table_pattern = re.compile(r"CREATE TABLE(?: IF NOT EXISTS)?\s+(\w+)", re.IGNORECASE)
    canonical = (ROOT / "database/schema.sql").read_text()
    mysql = (ROOT / "backend/init.sql").read_text()
    assert set(table_pattern.findall(canonical)) == EXPECTED_TABLES
    assert set(table_pattern.findall(mysql)) == EXPECTED_TABLES


def test_password_seed_values_are_hashes_not_plaintext():
    init_sql = (ROOT / "backend/init.sql").read_text()
    assert "admin123" not in init_sql
    assert "user123" not in init_sql
    assert "tech123" not in init_sql
    assert "$2b$" in init_sql
