# AI-LEMS Requirements Baseline

## Status and authority

- Business source: `BaoCao_UDTTNT.docx`.
- Candidate SDLC baseline: this file.
- Supporting input: `de_tai_23 (1).txt`.
- `docs/customer-requirement.md` is a non-authoritative input artifact.
- Human Gate G1: **PENDING**. This document does not approve G1.

## Scope and actors

AI-LEMS manages equipment for Electronics, IoT and Embedded Systems laboratories, including accounts/access, equipment, groups/locations, borrowing/returning, condition, maintenance, usage statistics, instructional documents and AI decision support.

Business actors:

- Lab User
- Lab Manager
- Maintenance Technician
- AI Assistant (system actor)

`admin` is a technical RBAC role found in the implementation. Its mapping to Lab Manager is unresolved; it is not a separate business actor.

## Functional requirements

| ID | Requirement | Actor | Type | Status and evidence |
|---|---|---|---|---|
| FR-001 | The system authenticates a user with credentials and establishes a session. | Lab User, Lab Manager, Maintenance Technician | Source Requirement | Code: `backend/app/routers/auth.py`; test exists/executed/passed: `tests/test_api.py` |
| FR-002 | The system enforces access for the three human business roles. | System | Source Requirement | Code: `backend/app/deps.py`; RBAC test exists/executed/passed; business mapping NOT VERIFIED |
| FR-003 | Lab Manager manages equipment records; Lab User can view equipment needed for borrowing. | Lab Manager, Lab User | Source Requirement | Code: `backend/app/routers/devices.py`; creation/RBAC test passed; full view matrix NOT VERIFIED |
| FR-004 | The system manages equipment groups, locations and catalog information. | Lab User, Lab Manager | Source Requirement | Code: `backend/app/routers/catalog.py`; complete catalog test: TEST NOT AVAILABLE |
| FR-005 | Lab User creates a borrow request only for an available device. | Lab User | Source Requirement | Code/test: `backend/app/routers/requests.py`, `tests/test_api.py`; TEST PASSED |
| FR-006 | Lab Manager approves or rejects a pending borrow request. | Lab Manager | Source Requirement | Code exists; approval test PASSED; rejection test: TEST NOT AVAILABLE |
| FR-007 | The system records receive/borrow, return and usage-history transitions. | Lab User, Lab Manager, System | Source Requirement | Code exists in `backend/app/routers/requests.py`; borrow/return test PASSED; handover NOT VERIFIED |
| FR-008 | Lab Manager and Maintenance Technician manage maintenance schedules and records. | Lab Manager, Maintenance Technician | Source Requirement | Code/test: `backend/app/routers/maintenance.py`, `tests/test_operations.py`; completion PASSED; schedule TEST NOT AVAILABLE |
| FR-009 | The system provides usage statistics, including supported time-range and usage-frequency views. | Lab Manager and authorized users | Source Requirement | Aggregate code/test exists and PASSED; time-range/frequency implementation: NOT IMPLEMENTED |
| FR-010 | Human actors can ask the AI Assistant laboratory-related questions. | Lab User, Lab Manager, Maintenance Technician | Source Requirement | Code exists in `backend/app/routers/ai.py`; live Ollama test: TEST NOT AVAILABLE |
| FR-011 | AI Assistant uses managed instructional-document context and identifies sources where available. | AI Assistant | Source Requirement | Code/test: `backend/app/services/ai_service.py`, `tests/test_ai.py`; keyword test PASSED |
| FR-012 | AI Assistant summarizes available official equipment, usage and maintenance data. | AI Assistant, requested by Lab Manager/Maintenance Technician | Source Requirement | Summary code exists; dedicated test: TEST NOT AVAILABLE |
| FR-013 | AI Assistant produces evidence-based inspection suggestions from available data. | AI Assistant, reviewed by Lab Manager/Maintenance Technician | Source Requirement | Alert code exists; dedicated test: TEST NOT AVAILABLE |
| FR-014 | The system manages instructional-document data used as retrieval sources. | Lab Manager, authorized staff, System | Source Requirement | Tables/retrieval exist; document-management API: NOT IMPLEMENTED |
| FR-015 | An authenticated actor can change the password of their own account. | Lab User, Lab Manager, Maintenance Technician | Source Requirement | Endpoint: NOT FOUND; test: TEST NOT AVAILABLE |
| FR-016 | Lab Manager can create accounts and assign approved business roles. | Lab Manager | Source Requirement | Management endpoint: NOT FOUND; test: TEST NOT AVAILABLE |

## Non-functional requirements

| ID | Requirement | External verification boundary | Evidence/status |
|---|---|---|---|
| NFR-001 | Passwords are not stored as plaintext. | Inspect stored values and exercise login. | `backend/app/auth.py`; login test PASSED |
| NFR-002 | Backend authorization protects business operations; frontend role state is not authorization. | Call protected endpoints with unauthorized tokens and verify 403. | `backend/app/deps.py`; RBAC test PASSED |
| NFR-003 | API inputs are validated before business processing. | Send invalid payloads and verify validation without state mutation. | `backend/app/schemas.py`; comprehensive test: TEST NOT AVAILABLE |
| NFR-004 | Authentication, authorization, input validation, database access and AI data handling receive an explicit security review. | Checklist names each control, evidence and result. | `docs/security-review.md`; automated scan NOT VERIFIED |
| NFR-005 | Required relational integrity is enforced through keys, constraints and transactions. | Inspect schema/models and run lifecycle consistency tests. | `backend/app/models.py`, `database/schema.sql`; partial evidence |
| NFR-006 | Supported frontend workflows expose loading, error and degraded/offline state. | Verify success, API-error and API-unavailable states. | `frontend/src/App.jsx`; UI test: TEST NOT AVAILABLE |
| NFR-007 | Approval, receive, return and maintenance actions identify actor/time where supported by the model. | Inspect persisted records after each action. | Partial model evidence; audit test: TEST NOT AVAILABLE |
| NFR-008 | AI uses bounded official context and states limitations when evidence is unavailable. | Run matching/no-context cases and inspect returned answer/source data. | Matching test PASSED; no-context test: TEST NOT AVAILABLE |
| NFR-009 | Secrets are not exposed in frontend code, committed configuration or runtime logs. | Scan tracked files, frontend inputs and logs. | NOT VERIFIED; development-secret risk documented |

Human review before operational action is classified as BR-014, not duplicated as an NFR.

## Business and AI safety rules

| ID | Rule | Evidence/status |
|---|---|---|
| BR-001 | Each account has an approved business role. | Technical mapping unresolved |
| BR-002 | Only Lab Manager creates accounts and assigns roles. | Endpoint NOT FOUND |
| BR-003 | An actor changes only the authenticated account password. | Endpoint NOT FOUND |
| BR-004 | A device is available before a borrow request is created. | Code/test PASSED |
| BR-005 | A request is approved before handover. | Code exists; handover TEST NOT AVAILABLE |
| BR-006 | Borrowed/unavailable equipment cannot be issued to a new request. | Code/test PASSED |
| BR-007 | Handover records usage and updates the lifecycle state. | Partial code; test NOT AVAILABLE |
| BR-008 | Return records the event and resulting equipment state. | Partial code; condition test NOT AVAILABLE |
| BR-009 | A maintenance record identifies its device and responsible actor where applicable. | Code/test PASSED for completion path |
| BR-010 | Maintenance status affects equipment availability. | Partial code; test NOT AVAILABLE |
| BR-011 | AI cannot approve/reject, change equipment state or confirm failure autonomously. | No AI mutation endpoint found; negative test NOT AVAILABLE |
| BR-012 | RAG uses context from managed instructional documents. | Keyword retrieval test PASSED |
| BR-013 | AI states limitations when official evidence is insufficient. | Prompt exists; no-context test NOT AVAILABLE |
| BR-014 | Summary and Inspection Alert are advisory and require human review before action. | Documentation exists; workflow test NOT AVAILABLE |

## Constraints and implementation context

These are not business requirements: FastAPI/Python/SQLAlchemy, React/Vite, SQLite local, MySQL Docker, local Ollama, `qwen2.5:3b`, keyword retrieval over `document_chunks`, and the absence of embeddings/vector database in the current implementation.

## Out of scope

Generic electronic-store requirements; chemical/biological samples; whole-campus facilities; direct physical equipment control; autonomous AI decisions or state mutation; mandatory semantic/vector retrieval; external cloud AI; and numeric performance targets not supported by the authoritative source.

## Classification vocabulary

Source Requirement, Derived Requirement, Constraint, Business Rule, Implementation Detail, Implementation Status and Human Decision are distinct categories. Source code is evidence of implementation, not authority for business scope.

## G1

**PENDING.** Human review is required for the role mapping, FR-009 metric boundary, document operation boundary, source-file availability and final baseline acceptance.
