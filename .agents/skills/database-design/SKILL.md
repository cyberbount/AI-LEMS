---
name: database-design
description: Use when starting the database design phase after architecture Gate G2 is approved, or when asked to design the relational data model for local-lab-ai, deriving entities, relationships, keys, constraints, indexes, sensitive data and SQLite/MySQL parity from approved requirements and architecture.
---

# Database Design Skill

## Objective
Produce a normalized data design consistent with approved requirements and architecture, matching the real dual-dialect deployment (SQLite for dev, MySQL 8 via docker-compose).

## Inputs
Read only approved artifacts:
- `docs/requirements.md`, `docs/architecture.md`

## Process
1. PROPOSE FIRST: Create a proposed database design document before reviewing the actual codebase.
2. Derive entities from requirements and check them against the real schema (`backend/app/models.py`): roles, users, devices, device_groups, locations, borrow_requests, usage_history, maintenance_schedules, maintenance_records, documents, document_chunks.
3. Define relationships: users 1—N borrow_requests, devices 1—N borrow_requests, borrow_requests 1—N usage_history, devices 1—N maintenance_records/schedules, documents 1—N document_chunks, roles 1—N users, device_groups/locations 1—N devices.
4. Specify PK/FK, UNIQUE, NOT NULL and CHECK constraints. Status columns (`devices.status`, `borrow_requests.status`, `maintenance_records.status`) are currently free strings — propose validated value sets (available/reserved/borrowed/maintenance; pending/approved/rejected/borrowed/returned; open/completed) and propose CHECK vs application-level enforcement for human to decide.
5. Define indexes: unique lookups (`users.username`, `users.email`, `devices.asset_code`) and filtered queries (`devices.status`, `borrow_requests.status`, `document_chunks.document_name`).
6. Check normalization; document any deliberate denormalization (e.g. `document_chunks.document_name` duplicated for retrieval provenance) with a reason.
7. Mark security-sensitive columns (`users.password_hash`, `users.email`) as never-exposed fields.
8. Verify parity between SQLAlchemy models (`Base.metadata.create_all`) and `backend/init.sql` (MySQL). Known seed mismatch: `db.py` seeds roles admin/user/technician while `init.sql` also inserts `manager` — resolve and document.
9. Assign IDs (`DBT-001`, ...) mapping entities to FRs.

## Rules
- Do not design anything independent of approved requirements.
- Do not write application code.
- Do not add tables/columns for unimplemented features (e.g. embeddings) without an approved requirement.
- Keep both dialects valid; one schema, no dialect-only constructs unless documented.
- **Why these rules prevent hallucination**: By requiring direct traceability from requirements to database entities, we prevent unnecessary data structures. By prohibiting application code in this skill, we maintain clear separation of concerns. By restricting features to approved requirements, we avoid over-engineering. By maintaining dialect parity, we prevent deployment issues.

## Outputs
Create or update:
- `docs/database-design.md` (ERD description, constraints, indexes, DBT→FR traceability, findings)
- `database/schema.sql` (canonical DDL)

## Verification
PASS if: every entity traces to ≥1 FR; PK/FK/NOT NULL/UNIQUE defined; status value sets decided; sensitive columns marked; models and schema.sql consistent; seed mismatch resolved or logged in findings.
FAIL if: an entity has no requirement source, a key/constraint is missing, or dialect parity is broken.

## Human Gate (G3)
A human reviewer confirms the entity list covers all requirements and accepts the constraint decisions.
- PASS → api-design may start. FAIL → stay in this phase with named issues.
