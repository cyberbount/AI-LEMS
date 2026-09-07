# Test Plan

## Purpose

This plan records the current executable verification for the laboratory equipment management system after G1, G2, G3 and G4. It distinguishes executed evidence from partial coverage and unverified behavior.

## Verified commands

Backend test suite:

```text
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
```

Latest result: **20 passed, 20 warnings**.

Backend compilation:

```text
python -m compileall -q backend/app
```

Result: **PASS**.

Frontend production build:

```text
cd frontend && npm run build
```

Result: **PASS**. The Vite production build completed successfully.

The pytest warnings are deprecation warnings, not test failures.

## Automated test suite

| Test file | Current coverage | Result |
|---|---|---|
| `tests/test_api.py` | Authentication, `/me`, device creation, RBAC device access, borrow/approve/borrow/return lifecycle and unavailable-device behavior | PASS / TESTED |
| `tests/test_operations.py` | Maintenance completion and aggregate statistics behavior | PASS / TESTED |
| `tests/test_ai.py` | Keyword retrieval, bounded history, unauthenticated AI rejection and authenticated service reach using a controlled fake service | PASS / TESTED |
| `tests/test_g3.py` | Password change, account authorization, maintenance availability transition and statistics time-range behavior | PASS / TESTED |
| `tests/test_database_schema.py` | ORM entities, PK/FK/unique/index evidence, DDL entity-set parity and password seed hashing evidence using in-memory SQLite and repository files | PASS / TESTED |

The suite contains 20 executed tests. It does not represent complete requirements coverage.

## Test classification

| Classification | Evidence | Status |
|---|---|---|
| Unit-style/database metadata | `tests/test_database_schema.py` | PASS / TESTED |
| Integration/API | `tests/test_api.py`, `tests/test_operations.py`, `tests/test_g3.py` | PASS / TESTED for covered workflows |
| Database schema evidence | `tests/test_database_schema.py` | PASS / TESTED; MySQL runtime not executed |
| AI offline/mock | `tests/test_ai.py` | PASS / TESTED; no live Ollama |
| G4 system validation | `docs/g4-system-validation.md` and route/build inspection | PARTIAL; not the same as pytest evidence |
| UI/browser/E2E | No browser test suite executed | PENDING |
| Performance | No performance test executed | PENDING |
| UAT | No user acceptance session executed | PENDING |

## Requirements traceability

| Requirement | Test coverage | Status |
|---|---|---|
| FR-001 | Login and `/api/auth/me` tests in `tests/test_api.py` | PASS / TESTED |
| FR-002 | Protected endpoint and manager-only access tests | PARTIAL: not every role/endpoint combination is covered |
| FR-003 | Device creation and status workflow tests | PARTIAL: complete view matrix is not tested |
| FR-004 | Catalog route exists | PENDING: dedicated group/location tests are unavailable |
| FR-005 | Borrow request and unavailable-device tests | PASS / TESTED for covered paths |
| FR-006 | Approval path is tested | PARTIAL: rejection workflow is not fully covered by a dedicated test |
| FR-007 | Borrow and return lifecycle is tested | PARTIAL: handover variants are not separately verified |
| FR-008 | Maintenance availability transition and completion are tested | PARTIAL: maintenance schedule workflow is not tested |
| FR-009 | Selected time range, empty range, invalid range and usage frequency are tested | PASS / TESTED for the locked contract |
| FR-010 | Authenticated AI endpoint reaches the service; unauthenticated request is rejected | PARTIAL: live Ollama is not tested |
| FR-011 | Keyword retrieval and bounded history are tested | PASS / TESTED for current implementation |
| FR-012 | AI summary behavior | PENDING: dedicated behavior test is unavailable |
| FR-013 | AI inspection alert behavior | PENDING: dedicated behavior test is unavailable |
| FR-014 | Existing document/document_chunk retrieval is exercised through AI tests | PARTIAL: document CRUD/upload is NOT IMPLEMENTED |
| FR-015 | Successful password change, wrong current password, invalid new password, unauthorized access and old-password rejection | PASS / TESTED |
| FR-016 | Manager-only account creation authorization; Lab User and Maintenance Technician rejection | PARTIAL: complete account/role operations are not fully tested |

## G4 integration scenarios verified

| Scenario | Evidence | Status |
|---|---|---|
| Login and JWT-protected API access | `tests/test_api.py`, `tests/test_g3.py` | PASS / TESTED |
| AI authentication boundary | `tests/test_ai.py` | PASS / TESTED |
| Equipment availability during maintenance | `tests/test_g3.py` | PASS / TESTED |
| Device state restoration after maintenance completion | Backend test plus frontend build; frontend refresh fix is in `frontend/src/App.jsx` | PARTIAL: no browser/E2E test |
| Frontend API route and bearer-header consistency | `frontend/src/lib/api.js`, route inspection and build | PARTIAL: build tested, browser workflow not executed |
| Backend/frontend production compatibility | Backend tests, compile and Vite build | PASS / TESTED at build/API level |

## Resolved integration defect

**DEF-G4-001** was detected during G4 review: after maintenance completion, the frontend updated only the maintenance record and could display a stale device status.

The defect was resolved in `frontend/src/App.jsx` by reloading the device list from the backend after successful completion. This was a manual integration fix and was not part of the original 16-test automated suite. No browser-level test claims this behavior as fully tested.

## Current implementation boundaries

- AI retrieval is keyword-based. Semantic/vector RAG is not implemented or tested.
- Ollama live availability and live model behavior are not tested.
- Document persistence/retrieval exists; document CRUD/upload is NOT IMPLEMENTED.
- Password reset is not implemented.
- No complete browser/E2E suite exists.
- No full RBAC role-by-endpoint matrix has been executed.
- Maintenance schedules and catalog mutation workflows lack dedicated tests.
- No performance target or performance result is claimed.

## Status definitions

- **PASS / TESTED**: executable evidence ran and passed.
- **PARTIAL**: only part of the requirement or scenario has executable evidence.
- **PENDING**: relevant behavior or dedicated evidence has not been executed.
- **NOT IMPLEMENTED**: the capability is not present in the current implementation.

## Evidence consistency

This plan is consistent with:

- `docs/test-report.md`: 20 tests passed, compile/build verification and current limitations.
- `traceability-report.md`: FR statuses, AI/live-Ollama limitation, document-management boundary and remaining evidence gaps.

Human review remains required. This document does not approve G4.
