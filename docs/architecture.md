# AI-LEMS Architecture Design

## Status and boundary

- Derived from the locked G1 requirements baseline at commit `ccfa98d`.
- This document describes both the current implementation and the target architecture needed to satisfy the baseline.
- Human Gate G2: **READY FOR HUMAN APPROVAL**. This is not an approval.
- No source-code change is implied by this document.

## System architecture

```text
React/Vite frontend
    -> FastAPI routers
    -> JWT authentication and backend RBAC dependencies
    -> domain/router operations
    -> SQLAlchemy sessions and models
    -> SQLite in local development or MySQL in Docker

AI panel
    -> /api/ai/chat
    -> AIService
    -> bounded history and database context
    -> keyword matching over DocumentChunk
    -> safety system prompt
    -> OllamaProvider
    -> local Ollama HTTP service
```

The system is a modular monolith. The frontend is a client, not an authorization boundary. The backend is the business authorization boundary.

## Components

| ID | Component | Current implementation | Target architecture status |
|---|---|---|---|
| ARC-01 | Frontend | `frontend/src/App.jsx` provides login, role dashboards, equipment, borrowing, maintenance and AI views. | VERIFIED for current screens; complete workflow coverage PARTIAL |
| ARC-02 | FastAPI application | `backend/app/main.py` registers routers and health/capability endpoints. | VERIFIED |
| ARC-03 | Authentication/RBAC | `backend/app/routers/auth.py`, `backend/app/auth.py`, `backend/app/deps.py`; JWT and `require_roles`. | VERIFIED with resolved mapping: admin/manager -> Lab Manager, user -> Lab User, technician -> Maintenance Technician |
| ARC-04 | Equipment/catalog domain | Device and catalog routers plus SQLAlchemy models. | PARTIAL: account management and some catalog workflow gaps remain |
| ARC-05 | Borrow/usage domain | Request router changes request/device state and creates UsageHistory. | PARTIAL: handover semantics require clarification |
| ARC-06 | Maintenance domain | Maintenance records/schedules routers and models. | PARTIAL: availability impact is a G3 implementation gap |
| ARC-07 | Statistics | `/api/stats` returns aggregate counts and action counts. | PARTIAL: selected time range and usage-event frequency are G3 implementation gaps |
| ARC-08 | AI service/provider | `AIService` bounds history, builds context and calls `OllamaProvider`. | PARTIAL: Summary/Alert evidence and live provider verification incomplete |
| ARC-09 | Local model boundary | `OllamaProvider` calls configured local Ollama HTTP service. | VERIFIED as current implementation; model is configuration, not business scope |
| ARC-10 | Document retrieval persistence | `Document`/`DocumentChunk` tables and keyword retrieval exist. | GAP for document-management operations |

## Authentication flow

1. A client submits credentials to `POST /api/auth/login`.
2. The backend verifies the stored password hash and active status.
3. The backend returns a JWT containing the username and technical role.
4. Protected routes resolve the token with `current_user`.
5. Role-restricted routes apply `require_roles`.
6. Invalid credentials or invalid tokens return an authentication error; insufficient roles return HTTP 403.

Resolved G2 technical mapping: `admin` and any technical `manager` role map to Lab Manager; `user` maps to Lab User; `technician` maps to Maintenance Technician. No additional business actor is introduced.

## Authorization flow

The backend performs authorization. Frontend role state controls presentation and navigation only. It must not be treated as a security boundary.

Current role enforcement is route-specific:

- Manager-style operations: `admin`, `manager`.
- Maintenance operations: `admin`, `manager`, `technician`.
- Authenticated read operations: any active authenticated user where a dependency is present.

The mapping to Lab User/Lab Manager/Maintenance Technician is resolved at the architecture level. The source-code role names are unchanged in G2.

## Request lifecycle

1. Frontend sends an HTTP request.
2. FastAPI validates path, query and body data through dependencies/Pydantic schemas.
3. Authentication and role dependencies run where declared.
4. Router reads or mutates SQLAlchemy entities.
5. The session commits successful mutations and returns a response model.
6. Validation, authorization, not-found and conflict errors are converted to HTTP responses.

## Maintenance lifecycle

Current flow:

```text
authorized actor -> POST /api/maintenance -> open record
authorized actor -> PATCH /api/maintenance/{id}/complete -> completed record
authorized actor -> POST /api/maintenance/schedules -> schedule
```

The current implementation does not fully model every condition-to-device-state effect described in the business source. That is a GAP, not an assumed capability.

## Statistics flow

Current flow:

```text
authenticated actor -> GET /api/stats
  -> SQL count queries over users/devices/requests/maintenance/usage_history
  -> aggregate response
```

FR-009 is defined as selected time-range statistics where usage frequency equals the number of usage events within that selected range. The current endpoint does not implement these parameters or calculations. Target status: G3 implementation GAP.

## AI/RAG flow

Current flow:

```text
caller -> POST /api/ai/chat
  -> ChatRequest validation
  -> AIService.chat
  -> bounded non-system history
  -> keyword matching over DocumentChunk
  -> summary/inspection database context where selected
  -> safety system prompt
  -> OllamaProvider
  -> ChatResponse
```

Current retrieval is lexical keyword matching, not semantic/vector RAG. No vector database is required by the current baseline.

Important current security fact: `backend/app/routers/ai.py` injects `Db` but does not inject `current_user` or `require_roles`. Therefore `/api/ai/chat` is **not backend-authenticated in the current implementation**. G2 resolves the target architecture: the endpoint must require a valid JWT for an active human role. Implementing that target is a G3 source-code gap.

The AI service is advisory/read-only. It has no business mutation call for approval, rejection, equipment state or maintenance-failure confirmation. Summary and Inspection Alert require human review before action.

## Error and offline boundaries

- Authentication failure: HTTP 401.
- Authorization failure: HTTP 403.
- Missing entity: HTTP 404.
- Invalid lifecycle or unavailable device: HTTP 409 where implemented.
- Request validation: FastAPI/Pydantic validation response.
- AI provider failure: `/api/ai/chat` converts provider exceptions to HTTP 502.
- Health reports provider availability through `/health`.
- Frontend contains fallback/degraded display behavior, but offline behavior is not covered by an automated UI test.

## FR traceability

| FR | Actor | Architecture component | Backend module/service | Database entities | API endpoints | AI/RAG component | Current status | Target status |
|---|---|---|---|---|---|---|---|---|
| FR-001 | Lab User, Lab Manager, Maintenance Technician | ARC-03 | `routers/auth.py`, `auth.py` | `users`, `roles` | `/api/auth/login`, `/api/auth/me` | — | VERIFIED API | VERIFIED |
| FR-002 | System | ARC-03 | `deps.py` | `users`, `roles` | Protected routes | — | PARTIAL role mapping | VERIFIED after mapping decision |
| FR-003 | Lab Manager, Lab User | ARC-04 | `routers/devices.py` | `devices`, `device_groups`, `locations` | `/api/devices` | — | PARTIAL | PARTIAL pending full permission matrix |
| FR-004 | Lab User, Lab Manager | ARC-04 | `routers/catalog.py` | `device_groups`, `locations`, `devices` | `/api/groups`, `/api/locations`, `/api/devices` | — | PARTIAL | VERIFIED after catalog verification |
| FR-005 | Lab User | ARC-05 | `routers/requests.py` | `borrow_requests`, `devices` | `POST /api/requests` | — | VERIFIED tested | VERIFIED |
| FR-006 | Lab Manager | ARC-05 | `routers/requests.py` | `borrow_requests`, `devices` | `/api/requests/{id}/approve`, `/api/requests/{id}/status` | — | PARTIAL; reject test unavailable | VERIFIED after rejection contract/test |
| FR-007 | Lab User, Lab Manager, System | ARC-05 | `routers/requests.py` | `borrow_requests`, `devices`, `usage_history` | borrow/return/status routes | — | PARTIAL handover | PARTIAL pending handover definition |
| FR-008 | Lab Manager, Maintenance Technician | ARC-06 | `routers/maintenance.py` | `maintenance_schedules`, `maintenance_records`, `devices`, `users` | maintenance routes | — | PARTIAL | PARTIAL pending schedule/availability verification |
| FR-009 | Lab Manager, authorized users | ARC-07 | `routers/stats.py` | usage and operational entities | `GET /api/stats` | — | Aggregate only | G3 gap: selected range and usage-event frequency |
| FR-010 | Lab User, Lab Manager, Maintenance Technician | ARC-08/09 | `routers/ai.py`, `AIService`, `OllamaProvider` | optional context reads | `POST /api/ai/chat` | local chat | PARTIAL; endpoint currently public | G3 gap: JWT authentication |
| FR-011 | AI Assistant | ARC-08/10 | `AIService` | `documents`, `document_chunks` | `/api/ai/chat` | keyword retrieval/context | PARTIAL | PARTIAL; no semantic requirement |
| FR-012 | AI Assistant, Lab Manager/Maintenance Technician | ARC-08 | `AIService` | `devices`, `maintenance_records` | `/api/ai/chat` mode | summary context | PARTIAL | PARTIAL pending evidence contract |
| FR-013 | AI Assistant, Lab Manager/Maintenance Technician | ARC-08 | `AIService` | `maintenance_records`, `devices` | `/api/ai/chat` mode | inspection context | PARTIAL | PARTIAL pending evidence contract |
| FR-014 | Lab Manager, authorized staff, System | ARC-10 | models and `AIService` | `documents`, `document_chunks` | No document-management endpoint | persistence and retrieval source | PARTIAL; persistence/retrieval is baseline | G3 gap: document CRUD/upload API |
| FR-015 | Human actors | ARC-03 | No password-change module | `users` | Endpoint not found | — | GAP | GAP until API contract and implementation exist |
| FR-016 | Lab Manager | ARC-03/04 | User listing only; account management absent | `users`, `roles` | Endpoint not found | — | GAP | GAP until API contract and implementation exist |

## G2 status

**READY FOR HUMAN APPROVAL.** G2 is not approved automatically.

## Remaining architecture gaps

- Current `/api/ai/chat` authentication does not yet match the resolved JWT target.
- Current statistics endpoint lacks selected time-range and usage-event frequency behavior.
- Current document persistence/retrieval has no document CRUD/upload API.
- Maintenance impact on device availability is not fully enforced.
- Database migration strategy remains static initialization/create_all; future migration work is not required for G2.
