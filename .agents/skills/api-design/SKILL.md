---
name: api-design
description: Use when starting the API design phase after database Gate G3 is approved, or when asked to define/verify the REST API contract for local-lab-ai, specifying endpoints, methods, request/response schemas, validation, errors, authentication and authorization with full traceability to requirements.
---

# API Design Skill

## Objective
Produce the API contract for the FastAPI backend so every endpoint traces to a requirement, and reconcile it with the implemented routers.

## Inputs
Read only approved artifacts and the real code:
- `docs/requirements.md`, `docs/architecture.md`, `docs/database-design.md`
- actual routers: `backend/app/routers/` (auth, users, devices, requests, maintenance, catalog, stats, ai), `backend/app/schemas.py`

## Process
1. Enumerate every endpoint as a contract row with ID (`API-001`, ...): method, path, auth (JWT?), allowed roles, request schema, response schema, status codes, error responses.
   Real inventory to reconcile: `POST /api/auth/register|login`, `GET /api/auth/me`, `GET /api/users`, `GET|POST /api/devices`, `PATCH /api/devices/{id}/status`, `GET|POST /api/requests`, `PATCH /api/requests/{id}/status|approve|borrow|return`, `GET|POST /api/maintenance`, `GET|POST /api/maintenance/schedules`, `GET|POST /api/groups`, `GET|POST /api/locations`, `GET /api/stats`, `POST /api/ai/chat`, `POST /api/chat`, `GET /health`, `GET /api/capabilities`.
2. Specify validation rules (Pydantic limits, enum values) and error conventions (401 unauthenticated, 403 wrong role, 404 missing, 409 state conflict, 502 AI provider failure).
3. Specify role matrix per endpoint from `require_roles(...)` and propose the expected matrix per FR — flag any difference for human to decide.
4. Propose pagination/filtering: device list supports `status` filter; large lists currently have no pagination — document a proposal, do not silently omit it.
5. Flag known design issues as findings, e.g. `PATCH /api/devices/{id}/status` takes an unvalidated query string; `/api/chat` (main.py) is unauthenticated and DB-less while `/api/ai/chat` is the real pipeline — propose to deprecate or fix for human to decide.
6. Build traceability: every FR ↔ ≥1 endpoint; every endpoint ↔ ≥1 FR.

## Rules
- Follow the existing REST conventions of the codebase; do not invent a new API style.
- No endpoint without an owning FR; no FR without a supporting endpoint.
- Do not implement code in this skill; discrepancies become findings, not fixes.
- Authentication/authorization is part of the contract, never an afterthought.
- **Why these rules prevent hallucination**: By requiring traceability between endpoints and requirements, we ensure no unauthorized features are added. By following existing codebase conventions, we prevent invention of non-existent patterns. By treating discrepancies as findings rather than fixing them, we maintain clear separation between design and implementation.

## Outputs
Create or update:
- `docs/api-design.md` (contract table, validation, error model, role matrix, API→FR traceability, findings)

## Verification
PASS if: every endpoint has method/path/auth/roles/request/response/errors; every FR has ≥1 endpoint; all discrepancies with the real routers are listed as findings; pagination decision documented.
FAIL if: any endpoint lacks auth or role spec, any FR is unsupported, or a discrepancy is silently ignored.

## Human Gate (G4)
A human reviewer confirms the contract and decides each finding (fix now, defer, or accept).
- PASS → implementation may start. FAIL → stay in this phase.
