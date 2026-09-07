# Implementation Notes

## Implemented

- IMP-001: FastAPI application starts from `backend/app/main.py` and includes the authentication, users, devices, requests, maintenance, catalog, stats and AI routers.
- IMP-002: JWT authentication and role checks are implemented in `backend/app/auth.py` and `backend/app/deps.py`.
- IMP-003: SQLAlchemy models and local database initialization are implemented in `backend/app/models.py` and `backend/app/db.py`.
- IMP-004: Device, catalog, borrow/return and maintenance endpoints are implemented under `backend/app/routers/`.
- IMP-005: Statistics are returned from database aggregates by `backend/app/routers/stats.py`.
- IMP-006: Ollama local integration, bounded history and database-aware context are implemented in `backend/app/services/`.
- IMP-007: React dashboards and AI panels are implemented in `frontend/src/App.jsx`.
- IMP-008: The frontend now renders dashboard counts from API data and does not record a business action when the API is offline.

## Partial or not implemented

- IMP-009: Equipment creation exists as an API endpoint, but the current dashboard does not expose a completed creation form.
- IMP-010: Document and document-chunk tables exist and retrieval reads them, but document upload and CRUD endpoints are not implemented.
- IMP-011: The current retrieval is keyword matching, not semantic search or vector retrieval.
- IMP-012: There is no separate change-password endpoint in the current backend.
- IMP-013: Automated unit and integration test files are not present yet; test cases are recorded in `docs/test-plan.md` as not run.
- IMP-014: Database initialization uses `create_all` and static SQL; no Alembic migration history exists.

## Deliberate non-goals

No cloud AI provider, payment flow, procurement flow, predictive-maintenance model, vector database or new laboratory workflow was added. These are outside the currently implemented project scope.

## Traceability

- API-001 → IMP-002
- API-002 → IMP-002
- API-003 → IMP-004
- API-004 → IMP-004
- API-005 → IMP-004
- API-006 → IMP-004
- API-007 → IMP-005
- API-008 → IMP-006
- API-009 → IMP-001
