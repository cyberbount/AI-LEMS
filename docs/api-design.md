# API Design

The API uses JSON responses, JWT bearer authentication for business routes and FastAPI validation. The route implementation is under `backend/app/routers/`.

## Endpoint groups

- API-001: `/api/auth/login` and `/api/auth/me` authenticate and identify a user.
- API-002: `/api/users` lists users for authorized manager roles.
- API-003: `/api/devices` lists and creates devices; `/api/devices/{id}/status` updates a device status.
- API-004: `/api/groups` and `/api/locations` expose catalog data and manager creation endpoints.
- API-005: `/api/requests` creates and lists requests and exposes lifecycle transition endpoints.
- API-006: `/api/maintenance` exposes records, completion and schedule endpoints.
- API-007: `/api/stats` exposes aggregate counts and usage action counts.
- API-008: `/api/ai/chat` sends a bounded chat request through the database-aware AI service.
- API-009: `/health` and `/api/capabilities` expose provider health and capability information.

The former duplicate `/api/chat` route was removed so the frontend and API documentation use the database-aware `/api/ai/chat` contract consistently.

## Traceability

- DBT-001 → API-001
- DBT-001 → API-002
- DBT-002 → API-003
- DBT-002 → API-004
- DBT-003 → API-005
- DBT-004 → API-005
- DBT-005 → API-006
- DBT-006 → API-008

`API-008` does not mutate the database. It reads database context and calls Ollama.
