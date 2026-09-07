# AI-LEMS Database Design

> Historical note: this document records the G2 database baseline. G3 subsequently implemented several workflows that were listed as gaps; those historical G2 statements are retained for traceability.

## Status and sources

- Current ORM source: `backend/app/models.py`.
- Current MySQL initializer: `backend/init.sql`.
- Canonical documented DDL: `database/schema.sql`.
- Local runtime: SQLite through `DATABASE_URL`.
- Docker runtime: MySQL through `docker-compose.yml`.
- Human Gate G2: **READY FOR HUMAN APPROVAL**. This is not an approval.

The three schema sources are compared below. No conflict is silently resolved.

## Entity design

| DBT | Entity | Purpose | PK | FK | Important constraints | Relationships | Requirements |
|---|---|---|---|---|---|---|---|
| DBT-001 | `roles`, `users` | Technical roles and account identity | `roles.name`, `users.id` | `users.role -> roles.name` | username/email unique, password hash, active flag | Role to users; users own requests/history | FR-001, FR-002, FR-016; NFR-001 |
| DBT-002 | `device_groups`, `locations`, `devices` | Equipment catalog and placement | Each `id` | device group/location FKs | names and asset_code unique; status API enum | Groups/locations have many devices | FR-003, FR-004 |
| DBT-003 | `borrow_requests` | Borrow workflow and requested period | `id` | user/device | status lifecycle; user/device required | Belongs to user/device; produces history | FR-005–FR-007; BR-004–BR-008 |
| DBT-004 | `usage_history` | Lifecycle action audit records | `id` | user/device/request | action and timestamp required | Links actor, device and request | FR-007, FR-009; NFR-007 |
| DBT-005 | `maintenance_schedules`, `maintenance_records` | Planned and executed maintenance | Each `id` | device/technician | interval/due date; status/device required | Belongs to device and responsible user | FR-008, FR-013; BR-009/010 |
| DBT-006 | `documents`, `document_chunks` | Retrieval document metadata and chunks | Each `id` | optional document FK | document name/content required; chunk index | Document has many chunks | FR-011, FR-014; BR-012 |

## Current schema comparison

| Area | `backend/app/models.py` | `backend/init.sql` | `database/schema.sql` | Result |
|---|---|---|---|---|
| Core entities | Defines all listed ORM entities | Creates all listed MySQL tables | Defines all listed canonical tables | CONSISTENT in entity set |
| Role seed | Seeds admin/user/technician in `db.py` | Inserts admin/manager/technician/user roles | DDL only; no seed rows | Technical mapping resolved for architecture; seed behavior remains a G3 implementation concern |
| IDs | SQLAlchemy integer PKs | MySQL `AUTO_INCREMENT` | Portable integer PK definitions | Runtime-specific generation differs but is expected |
| Constraints | Unique/index declarations in models | Unique/FK declarations | Unique/FK/index declarations | PARTIAL; verify parity during G2 review |
| Status values | Pydantic API literals for device/request | String columns without CHECK constraints | String columns without complete CHECK sets | Status validation is API-level, not fully DB-level |
| Document links | Nullable `document_id` | Nullable `document_id` | Nullable `document_id` | CONSISTENT |
| Migrations | No Alembic | Static initialization | Static canonical DDL | No migration history; future/implementation concern, not a G2 blocker |

## Relationships

```text
roles 1 -> many users
users 1 -> many borrow_requests
users 1 -> many usage_history
users 1 -> many maintenance_records (as technician)
device_groups 1 -> many devices
locations 1 -> many devices
devices 1 -> many borrow_requests
devices 1 -> many usage_history
devices 1 -> many maintenance_schedules
devices 1 -> many maintenance_records
documents 1 -> many document_chunks (nullable link in current model)
borrow_requests 1 -> many usage_history (nullable link)
```

## Lifecycle relevance

- Device status is changed by request lifecycle and maintenance operations.
- Borrow request status is controlled by explicit API transitions.
- Usage history records transition actions but is not a complete event-sourcing model.
- Maintenance records distinguish open/completed work; G2 recorded the availability effect as a G3 implementation gap, and G3 subsequently implemented the covered lifecycle transition.
- Documents/chunks are read by retrieval; document management operations are not exposed by the current API.

## Architecture issues

1. `database/schema.sql` is canonical documentation, while `backend/init.sql` includes MySQL-specific seed data. They must be kept synchronized manually because Alembic is absent; a migration system is a future implementation concern.
2. `db.py` seeds no `manager` user, while several routes allow the technical `manager` role. The architecture maps both `admin` and any technical `manager` role to Lab Manager; source-code seed behavior remains unchanged.
3. Current DDL does not fully encode status CHECK constraints; Pydantic/API validation carries part of that responsibility.
4. `document_chunks.document_id` is nullable, so orphan chunk behavior is possible and has not been resolved by a business decision.
5. No tables exist for password-change history, account administration events, or date-range statistic materialization. These are G3 implementation/design gaps, not silently added entities.

## G2 database status

Current entity model coverage: **VERIFIED/PARTIAL**.

Target coverage for FR-001–FR-016 at G2: **PARTIAL** because FR-009 time/frequency statistics, FR-015 password change and FR-016 account/role management were not represented by complete implemented workflows at that gate. G3 later implemented these workflows without adding new database entities.

Human Gate G2: **READY FOR HUMAN APPROVAL**. G2 is not approved automatically.

## G3 implementation gaps recorded at the G2 baseline

- Implement selected time-range and usage-event frequency statistics using the existing usage history model.
- Implement maintenance effects on device availability according to the approved business lifecycle.
- Decide and implement migration/versioning strategy if required after G2.
- Implement password-change and Lab Manager account/role-management workflows without adding unapproved entities.
