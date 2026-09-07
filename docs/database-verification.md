# Database Verification

## Scope and evidence

This document verifies the existing database design. It does not redesign the schema, add entities, or claim MySQL runtime execution. Evidence was taken from `backend/app/models.py`, `database/schema.sql`, `backend/init.sql`, `docs/database-design.md`, `backend/app/deps.py`, the protected routers, and `tests/test_database_schema.py`.

Verification command:

```text
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/test_database_schema.py
```

The test checks ORM metadata and DDL text. It does not connect to MySQL.

## Entity and requirements coverage

| Entity set | FR traceability | Result |
|---|---|---|
| `roles`, `users` | FR-001, FR-002, FR-016 | PASS |
| `device_groups`, `locations`, `devices` | FR-003, FR-004 | PASS |
| `borrow_requests`, `usage_history` | FR-005, FR-006, FR-007, FR-009 | PASS |
| `maintenance_schedules`, `maintenance_records` | FR-008, FR-013 | PASS |
| `documents`, `document_chunks` | FR-011, FR-014 | PASS |
| FR-010 AI authentication/advisory behavior | Application layer, not a database entity | NOT APPLICABLE at entity level |
| FR-012 summary and FR-015 password change | Existing data is reused; no new entity is required | PARTIAL |

No vector, embedding, or unrelated business entity is present or added.

## Schema property verification

| Property | Actual evidence | Result |
|---|---|---|
| Primary keys | ORM mappings and DDL `PRIMARY KEY` definitions | PASS |
| Foreign keys | ORM `ForeignKey` declarations and DDL foreign keys | PASS |
| NOT NULL | Required ORM columns and `NOT NULL` in both DDL files | PASS for declared required fields |
| UNIQUE | ORM unique fields and DDL uniqueness for usernames, emails, asset codes, group/location/document names | PASS |
| Indexes | ORM indexes and canonical DDL lookup indexes | PASS/PARTIAL: `backend/init.sql` does not explicitly repeat every non-unique lookup index |
| Normalization | Separate role, user, catalog, workflow, maintenance, history and document/chunk tables | PASS at relational design level |
| Password handling | `password_hash`, hashing in `backend/app/auth.py`, bcrypt-formatted initializer values | PASS |
| Status validation | API schemas and router transitions; DDL status columns have no complete CHECK sets | PARTIAL; application-layer boundary |

## ORM and DDL parity

| Comparison | Result | Detail |
|---|---|---|
| Entity/table set | PASS | All 11 expected tables exist in ORM, `database/schema.sql` and `backend/init.sql`. |
| PK/FK structure | PASS | Declared relationships are represented in ORM and DDL. |
| Required and unique columns | PASS | Core required fields and identifiers match. |
| ID generation | PARTIAL | SQLite/ORM integer keys versus MySQL `AUTO_INCREMENT`. |
| Explicit indexes | PARTIAL | Canonical DDL/ORM expose lookup indexes; MySQL initializer does not explicitly repeat all non-unique indexes. |
| Seed data | PARTIAL | `backend/app/db.py` seeds admin/user/technician; `backend/init.sql` also inserts manager. |

## SQLite and MySQL parity

- Same 11 entity tables and relationships: **PASS** based on ORM and DDL inspection.
- SQLite default: `sqlite:///./lab.db`; Docker Compose MySQL: `mysql+pymysql://lab:lab@mysql:3306/lab`: **PASS** based on configuration.
- Runtime execution against MySQL: **NOT VERIFIED**.
- Full cross-dialect behavior, collation and foreign-key enforcement: **NOT VERIFIED**.

## Role and authorization mapping

| Technical role | Business mapping | Evidence | Result |
|---|---|---|---|
| `admin` | Default technical role for seeded Lab Manager | `backend/app/db.py`, `backend/init.sql`, protected routers | PASS |
| `manager` | Supported Lab Manager role, not seeded by default in `backend/app/db.py` | `require_roles("admin", "manager")`, `backend/init.sql` | PASS/PARTIAL |
| `technician` | Maintenance Technician | seed data and maintenance role checks | PASS |
| `user` | Lab User | seed data and request behavior | PASS |

Frontend role checks are presentation-level; backend `current_user` and `require_roles` enforce authorization.

## Limitations

1. The test uses in-memory SQLite and reads repository DDL; it does not execute `backend/init.sql` against MySQL.
2. No full SQLite/MySQL runtime matrix was run.
3. Status constraints remain primarily API/business-layer constraints rather than database CHECK constraints.
4. The manager seed mismatch remains documented and unresolved.
5. This verification does not claim document CRUD/upload, semantic/vector retrieval, or new database entities.
