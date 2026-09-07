# AI-LEMS Requirements Traceability Report

## Baseline

- Authoritative business source: `BaoCao_UDTTNT.docx`
- Candidate SDLC baseline: `docs/requirements.md`
- Supporting input: `de_tai_23 (1).txt`
- Non-authoritative input: `docs/customer-requirement.md`
- Human Gate G1: **PENDING**
- G3 implementation verification: **PENDING HUMAN REVIEW**
- Latest full test command: `PYTHONPATH=backend .venv/bin/python -m pytest -q tests/`
- Latest result: **16 passed**

## Counts

- FR: 16 (`FR-001`–`FR-016`)
- NFR: 9 (`NFR-001`–`NFR-009`)
- BR/AI safety rules: 14 (`BR-001`–`BR-014`)
- US: 13 (`US-001`–`US-013`)
- AC: 20 (`AC-001`–`AC-020`)

## Evidence vocabulary

`CODE EXISTS`, `TEST EXISTS`, `TEST EXECUTED`, `TEST PASSED`, `NOT VERIFIED`, `NOT IMPLEMENTED`, and `TEST NOT AVAILABLE` are separate states. Code existence alone is not test evidence.

## FR -> US -> AC -> Evidence/Code -> Test Status

| FR | US | AC | Evidence/Code | Test status |
|---|---|---|---|---|
| FR-001 | US-001 | AC-001 | `backend/app/routers/auth.py`; `tests/test_api.py` | TEST EXISTS; TEST EXECUTED; TEST PASSED |
| FR-002 | US-001 | AC-002 | `backend/app/deps.py`; protected routers; `tests/test_api.py` | TEST PASSED; business mapping NOT VERIFIED |
| FR-003 | US-002, US-003 | AC-005 | `backend/app/routers/devices.py`; `frontend/src/App.jsx`; `tests/test_api.py` | Creation/RBAC PASSED; full view matrix NOT VERIFIED |
| FR-004 | US-002, US-003 | AC-006 | `backend/app/routers/catalog.py` | TEST NOT AVAILABLE |
| FR-005 | US-002 | AC-003, AC-004 | `backend/app/routers/requests.py`; `tests/test_api.py` | TEST EXECUTED; TEST PASSED |
| FR-006 | US-004 | AC-007, AC-008 | `backend/app/routers/requests.py` | Approval PASSED; rejection TEST NOT AVAILABLE |
| FR-007 | US-004, US-005 | AC-009, AC-010 | `backend/app/routers/requests.py`; `backend/app/models.py`; `tests/test_api.py` | Borrow/return PASSED; handover NOT VERIFIED |
| FR-008 | US-006 | AC-011, AC-012 | `backend/app/routers/maintenance.py`; `tests/test_operations.py`; `tests/test_g3.py` | Availability transition TEST PASSED; schedule TEST NOT AVAILABLE |
| FR-009 | US-007 | AC-013 | `backend/app/routers/stats.py`; `tests/test_g3.py` | Selected range and usage frequency TEST PASSED; aggregate behavior covered by existing tests |
| FR-010 | US-008 | AC-014 | `backend/app/routers/ai.py`; `backend/app/services/ai_service.py`; `tests/test_ai.py` | JWT rejection and authenticated service reach TEST PASSED; live Ollama TEST NOT AVAILABLE |
| FR-011 | US-008 | AC-015 | `backend/app/services/ai_service.py`; `tests/test_ai.py` | TEST EXECUTED; TEST PASSED for keyword retrieval |
| FR-012 | US-009 | AC-016 | `backend/app/services/ai_service.py` | Dedicated TEST NOT AVAILABLE |
| FR-013 | US-010 | AC-017 | `backend/app/services/ai_service.py` | Dedicated TEST NOT AVAILABLE |
| FR-014 | US-011 | AC-018 | `backend/app/models.py`; `DocumentChunk`; `backend/app/services/ai_service.py` | Retrieval exists; management API NOT IMPLEMENTED |
| FR-015 | US-012 | AC-019 | `backend/app/routers/auth.py`; `backend/app/schemas.py`; `tests/test_g3.py` | IMPLEMENTED + VERIFIED; password workflow TEST PASSED |
| FR-016 | US-013 | AC-020 | `backend/app/routers/users.py`; `backend/app/auth.py`; `tests/test_g3.py` | IMPLEMENTED + VERIFIED for manager-only account creation authorization; broader role operations remain NOT VERIFIED |

## NFR evidence

| NFR | Evidence/Code | Verification status |
|---|---|---|
| NFR-001 | `backend/app/auth.py`; `tests/test_api.py` | TEST EXECUTED; TEST PASSED |
| NFR-002 | `backend/app/deps.py`; `tests/test_api.py` | TEST EXECUTED; TEST PASSED |
| NFR-003 | `backend/app/schemas.py` | CODE EXISTS; comprehensive TEST NOT AVAILABLE |
| NFR-004 | `docs/security-review.md` | Review exists; automated scan NOT VERIFIED |
| NFR-005 | `backend/app/models.py`; `database/schema.sql`; workflow tests | Partial; full integrity NOT VERIFIED |
| NFR-006 | `frontend/src/App.jsx` | CODE EXISTS; UI TEST NOT AVAILABLE |
| NFR-007 | `backend/app/models.py` | Partial; audit TEST NOT AVAILABLE |
| NFR-008 | `backend/app/services/ai_service.py`; `tests/test_ai.py` | Matching TEST PASSED; no-context TEST NOT AVAILABLE |
| NFR-009 | `.env`, Docker configuration and security review | Secret scan NOT VERIFIED |

## BR evidence

| BR | Evidence/Code | Verification status |
|---|---|---|
| BR-001–BR-003 | Account endpoints/models | BR-001 partial; BR-002/BR-003 NOT IMPLEMENTED |
| BR-004–BR-006 | `backend/app/routers/requests.py`; `tests/test_api.py` | Covered paths TEST PASSED |
| BR-007–BR-008 | `backend/app/routers/requests.py`; `UsageHistory` | Partial code; handover/condition TEST NOT AVAILABLE |
| BR-009–BR-010 | `backend/app/routers/maintenance.py`; `tests/test_operations.py` | Completion TEST PASSED; availability impact NOT VERIFIED |
| BR-011–BR-014 | `backend/app/services/ai_service.py`; `docs/security-review.md` | Advisory behavior documented; negative/workflow tests NOT AVAILABLE |

## Missing traceability links

- FR-004 catalog behavior has no executed test.
- FR-006 rejection has no executed test.
- FR-007 handover has no executed test.
- FR-008 schedule creation has no executed test.
- FR-009 selected time-range and usage-frequency behavior is implemented and tested; broader statistics semantics remain limited to the locked contract.
- FR-010 has no live Ollama test.
- FR-012 and FR-013 have no dedicated tests.
- FR-014 has no document-management API evidence.
- FR-015 is implemented and verified by `tests/test_g3.py`.
- FR-016 manager-only account creation authorization is implemented and verified; complete account/role operation coverage remains open.
- NFR-003 through NFR-009 do not all have executed evidence.
- BR-001 through BR-003 and BR-007 through BR-014 are not fully covered by executed tests.

## Unresolved human decisions

- Final human acceptance of the technical `admin`/`manager` mapping in the implementation.
- Final human acceptance of the implemented FR-009 query contract.
- Final human acceptance of the Document Management operation boundary.
- Availability of `Hướng dẫn quản lý dự án.txt`.
- Final human acceptance of the normalized requirements baseline.

## G1

**PENDING.** This report does not approve Human Gate G1.

## G3 implementation verification

| Scope | Implementation evidence | Test evidence | Status |
|---|---|---|---|
| AI chat authentication | `backend/app/routers/ai.py` | `tests/test_ai.py` | IMPLEMENTED + VERIFIED |
| FR-009 selected range and usage frequency | `backend/app/routers/stats.py` | `tests/test_g3.py` | IMPLEMENTED + VERIFIED |
| Maintenance availability transition | `backend/app/routers/maintenance.py` | `tests/test_g3.py` | IMPLEMENTED + VERIFIED for available -> maintenance -> available |
| FR-015 password change | `backend/app/routers/auth.py`; `backend/app/schemas.py` | `tests/test_g3.py` | IMPLEMENTED + VERIFIED |
| FR-016 account authorization | `backend/app/routers/users.py` | `tests/test_g3.py` | PARTIAL: manager-only creation authorization verified |
| FR-014 document management | Existing `Document`/`DocumentChunk` persistence and retrieval | No new document-management test | PARTIAL: CRUD/upload remains not implemented |

G3 status: **PENDING HUMAN REVIEW**
