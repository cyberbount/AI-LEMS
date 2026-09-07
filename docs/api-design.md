# AI-LEMS API Design

## Status and boundary

- Current implementation source: `backend/app/routers/` and `backend/app/main.py`.
- This document specifies only endpoints verified in the current source.
- Missing capabilities are recorded as gaps, not invented endpoints.
- Human Gate G2: **READY FOR HUMAN APPROVAL**. This is not an approval.

## Authentication and response conventions

- Business authentication uses OAuth2 form login at `/api/auth/login` and JWT bearer tokens.
- Protected routes resolve `current_user`; role-restricted routes use `require_roles`.
- Request bodies are validated by Pydantic schemas.
- Common errors: 401 unauthenticated, 403 unauthorized, 404 missing entity, 409 invalid state/conflict, 422 validation error, 502 AI provider error.
- Response models are defined in `backend/app/schemas.py` where applicable.

## Endpoint specification

| ID | Method/path | Purpose | Authentication | Allowed technical roles | Request | Response | Validation/errors | FR |
|---|---|---|---|---|---|---|---|---|
| API-001 | POST `/api/auth/register` | Register a user account | Public | Public registration forces `user` | `UserCreate` | `UserOut`, 201 | Duplicate 409; non-user role 403; schema 422 | FR-001 |
| API-002 | POST `/api/auth/login` | Verify credentials and issue JWT | Public | — | OAuth2 username/password form | `Token` | Invalid/inactive credentials 401 | FR-001 |
| API-003 | GET `/api/auth/me` | Return authenticated identity | Bearer JWT required | Any active seeded role | No body | `UserOut` | Invalid token 401 | FR-001, FR-002 |
| API-004 | GET `/api/users` | List users | Bearer JWT required | `admin`, `manager` | No body | `list[UserOut]` | 401/403 | FR-016 partial |
| API-005 | GET `/api/devices` | List/filter devices | Bearer JWT required | Any active user | Optional `status` | `list[DeviceOut]` | Status validation 422 | FR-003, FR-004 |
| API-006 | POST `/api/devices` | Create device | Bearer JWT required | `admin`, `manager` | `DeviceCreate` | `DeviceOut`, 201 | Validation/DB constraint errors | FR-003 |
| API-007 | PATCH `/api/devices/{device_id}/status` | Change device status | Bearer JWT required | `admin`, `manager`, `technician` | `status` query enum | `DeviceOut` | 404; invalid status 422 | FR-007, FR-008 |
| API-008 | GET `/api/groups` | List groups | Bearer JWT required | Any active user | No body | Group list | 401 | FR-004 |
| API-009 | POST `/api/groups` | Create group | Bearer JWT required | `admin`, `manager` | `GroupCreate` | Created group, 201 | Validation/constraint errors | FR-004 |
| API-010 | GET `/api/locations` | List locations | Bearer JWT required | Any active user | No body | Location list | 401 | FR-004 |
| API-011 | POST `/api/locations` | Create location | Bearer JWT required | `admin`, `manager` | `LocationCreate` | Created location, 201 | Validation/constraint errors | FR-004 |
| API-012 | GET `/api/requests` | List requests; users see own requests | Bearer JWT required | Any active user | No body | `list[RequestOut]` | 401 | FR-005–FR-007 |
| API-013 | POST `/api/requests` | Create borrow request | Bearer JWT required | Any active user in current code | `RequestCreate` | `RequestOut`, 201 | Device missing 404; unavailable 409; validation 422 | FR-005 |
| API-014 | PATCH `/api/requests/{request_id}/status` | Apply a lifecycle status | Bearer JWT required | `admin`, `manager` in current implementation | `status` query enum | `RequestOut` | 404; invalid transition/unavailable 409 | FR-006, FR-007 |
| API-015 | PATCH `/api/requests/{request_id}/approve` | Approve request | Bearer JWT required | `admin`, `manager` | No body | `RequestOut` | 404/409 | FR-006 |
| API-016 | PATCH `/api/requests/{request_id}/borrow` | Mark approved request borrowed | Bearer JWT required | Owner, `admin`, `manager` | No body | `RequestOut` | 404/409 | FR-007 |
| API-017 | PATCH `/api/requests/{request_id}/return` | Return borrowed request | Bearer JWT required | Owner, `admin`, `manager` | No body | `RequestOut` | 404/409 | FR-007 |
| API-018 | GET `/api/maintenance` | List maintenance records | Bearer JWT required | Any active user | No body | `list[MaintenanceOut]` | 401 | FR-008 |
| API-019 | POST `/api/maintenance` | Create maintenance record | Bearer JWT required | `admin`, `manager`, `technician` | `MaintenanceCreate` | `MaintenanceOut`, 201 | Validation/DB errors | FR-008 |
| API-020 | PATCH `/api/maintenance/{item_id}/complete` | Complete maintenance record | Bearer JWT required | `admin`, `manager`, `technician` | No body | `MaintenanceOut` | 404 | FR-008 |
| API-021 | GET `/api/maintenance/schedules` | List schedules | Bearer JWT required | Any active user | No body | `list[MaintenanceScheduleOut]` | 401 | FR-008 |
| API-022 | POST `/api/maintenance/schedules` | Create schedule | Bearer JWT required | `admin`, `manager`, `technician` | `MaintenanceScheduleCreate` | `MaintenanceScheduleOut`, 201 | Validation/DB errors | FR-008 |
| API-023 | GET `/api/stats` | Return aggregate statistics | Bearer JWT required | Any active user | No body | JSON counts/action counts | 401 | FR-009 |
| API-024 | POST `/api/ai/chat` | Send AI request | **Public in current source; target requires Bearer JWT** | Target: active `admin`/`manager`/`user`/`technician` technical roles | `ChatRequest` | `ChatResponse` | Current: schema 422/provider 502; target adds 401 for missing/invalid JWT | FR-010–FR-013 |
| API-025 | GET `/health` | Report service/provider health | Public | — | No body | `HealthResponse` | Provider may produce degraded status | System health |
| API-026 | GET `/api/capabilities` | Report provider/capabilities | Public | — | No body | Provider/capabilities JSON | Public endpoint | System health |

## Verified route gaps

The following endpoints are required by the G1 baseline but are not present in the current source:

- Password change endpoint for FR-015: **NOT FOUND**.
- Lab Manager account creation/role assignment endpoint for FR-016: **NOT FOUND**.
- Document upload/list/update/delete or equivalent management API for FR-014: **NOT FOUND**.
- Time-range/frequency parameters and response contract for FR-009: **NOT FOUND in current source**; target is selected range with usage frequency equal to usage-event count in that range.

## API architecture issues

1. `/api/ai/chat` is currently unauthenticated because `backend/app/routers/ai.py` depends on `Db` only. The G2 target requires JWT authentication; implementation is a G3 source-code gap.
2. The technical `admin` and `manager` role names now map to the business Lab Manager actor for architecture purposes; source-code behavior is unchanged.
3. `/api/requests/{id}/status` accepts a lifecycle status, while dedicated approve/borrow/return routes also exist. The authoritative transition contract should be kept consistent.
4. `/api/stats` exposes aggregate counts only; selected time-range and usage-event frequency are G3 implementation gaps.
5. No API exposes document CRUD/upload despite document persistence and retrieval being part of the FR-014 baseline.

## G2 API status

- Current endpoint inventory: **VERIFIED** against `backend/app/routers/`.
- FR coverage: **PARTIAL**.
- Missing FR-014, FR-015 and FR-016 operations: **GAP**.
- AI authentication boundary: **CURRENT PUBLIC GAP; TARGET JWT REQUIREMENT RESOLVED**.
- Human Gate G2: **READY FOR HUMAN APPROVAL**. G2 is not approved automatically.

## G3 implementation gaps

- Add the approved JWT authentication boundary to `/api/ai/chat`.
- Extend statistics to accept a selected time range and calculate usage frequency as usage-event count in that range.
- Add document CRUD/upload only if the approved FR-014 operation boundary requires it.
- Add password-change and Lab Manager account/role-management endpoints from the locked G1 baseline.
