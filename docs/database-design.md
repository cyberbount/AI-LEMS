# Database Design

The current schema is defined by SQLAlchemy models in `backend/app/models.py` and by the Docker initialization script `backend/init.sql`. SQLite is used by the local `.env`; MySQL is used by Docker.

## Entities

- DBT-001: `users` and `roles` store accounts, password hashes, active state and roles.
- DBT-002: `device_groups`, `locations` and `devices` store equipment catalog data.
- DBT-003: `borrow_requests` stores request status and requested equipment.
- DBT-004: `usage_history` stores lifecycle actions for a user, device and request.
- DBT-005: `maintenance_schedules` and `maintenance_records` store planned and executed maintenance.
- DBT-006: `documents` and `document_chunks` store retrieval documents and chunk content.

## Constraints present in the current schema

- Primary keys exist on every entity.
- Usernames, emails, asset codes, group names, location names and document names are unique.
- Foreign keys connect users, roles, devices, requests, usage history, maintenance and document chunks.
- Device and request statuses are constrained at the API schema boundary to the values currently used by the application.

## Traceability

- ARC-03 → DBT-001
- ARC-04 → DBT-002
- ARC-05 → DBT-003
- ARC-05 → DBT-004
- ARC-06 → DBT-005
- ARC-08 → DBT-006

The project does not currently contain Alembic migrations. `create_all` and the static Docker SQL initializer are the current schema setup mechanisms.
