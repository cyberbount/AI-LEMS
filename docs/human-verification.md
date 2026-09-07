# Human Verification Register

## Purpose

This register is for independent human review of the AI-LEMS SDLC evidence. It does not approve, reject or disposition any gate. The reviewer must inspect the listed artifacts and make the final decision.

## Review rules

- Do not treat documentation claims as proof without checking the referenced code, tests or Git evidence.
- Distinguish current implementation from historical G2 baseline statements.
- Treat AI as advisory and read-only: it must not approve/reject requests, change device status, modify maintenance records or confirm failure autonomously.
- Confirm that current retrieval is keyword-based, not semantic/vector RAG.
- Preserve all limitations that remain unverified.

## G1 Requirements

### Gate name

G1 Requirements

### Required human checks

- Confirm the business scope is laboratory equipment management, not the generic electronic-store example.
- Confirm authoritative business source and actor model: Lab User, Lab Manager, Maintenance Technician and AI Assistant.
- Confirm FR-001 through FR-016, NFRs, BRs, user stories and acceptance criteria are consistent.
- Confirm password change, Lab Manager account/role management, selected-range statistics, document persistence/retrieval, AI summary and inspection alert are in scope.
- Confirm local Ollama/model details are implementation context, not business requirements.
- Confirm AI cannot autonomously mutate business state.
- Confirm unresolved requirements decisions were not silently removed.

### Artifact/evidence to inspect

- `BaoCao_UDTTNT.docx`
- `docs/requirements.md`
- `docs/user-stories.md`
- `docs/acceptance-criteria.md`
- `docs/requirements-issues.md`
- `docs/customer-requirement.md` as non-authoritative input
- `traceability-report.md`
- G1 commit `ccfa98d`

### Verification commands/evidence already available

```text
git show --stat ccfa98d
git log --oneline --decorate
```

The requirements artifacts contain FR/NFR/BR identifiers and traceability sections. The current full automated suite is recorded in `docs/test-report.md`, but it is not a substitute for requirements review.

### Known limitations

- Some requirements have partial or pending executable coverage.
- Human acceptance of scope and traceability cannot be inferred from file existence.
- The register does not reproduce the business report; the reviewer must inspect the authoritative documents.

### Human decision

[x] APPROVED

[ ] REJECTED

[ ] APPROVED WITH DOCUMENTED GAPS

Reviewer: ____________________  Date: ____________________

Notes: ________________________________________________________________

## G2 Architecture

### Gate name

G2 Architecture

### Required human checks

- Confirm the actual architecture is React/Vite -> FastAPI -> JWT/RBAC -> SQLAlchemy -> SQLite/MySQL.
- Confirm AI flow is AIService -> keyword retrieval from `DocumentChunk` -> context -> Ollama.
- Confirm the system does not claim semantic/vector RAG.
- Confirm `/api/ai/chat` is JWT-protected in the current implementation.
- Confirm architecture mappings distinguish current implementation from target/historical G2 status.
- Confirm database entities and API mappings are consistent with the locked requirements.
- Confirm no document CRUD/upload or vector tables are claimed as implemented.
- Confirm role mapping: admin -> default seeded Lab Manager, manager -> supported Lab Manager role, technician -> Maintenance Technician, user -> Lab User.

### Artifact/evidence to inspect

- `docs/architecture.md`
- `docs/database-design.md`
- `docs/api-design.md`
- `docs/architecture-decisions.md`
- `backend/app/main.py`
- `backend/app/routers/`
- `backend/app/services/ai_service.py`
- `backend/app/services/ollama_provider.py`
- `backend/app/models.py`
- `database/schema.sql`
- `backend/init.sql`
- G2 commit `7591ea3`

### Verification commands/evidence already available

```text
python -m compileall -q backend/app
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/test_database_schema.py
```

Database evidence is documented in `docs/database-verification.md`. The architecture document contains a historical G2 note where later G3 implementation changed status.

### Known limitations

- MySQL runtime parity was not executed.
- No semantic/vector retrieval exists.
- Document CRUD/upload remains unimplemented.
- Some G2 artifacts intentionally retain historical baseline claims.

### Human decision

[ ] APPROVED

[ ] REJECTED

[x] APPROVED WITH DOCUMENTED GAPS

Reviewer: ____________________  Date: ____________________

Notes: ________________________________________________________________

## G3 Implementation & Verification

### Gate name

G3 Implementation & Verification

### Required human checks

- Confirm implementation changes remain within the locked requirements and architecture.
- Verify JWT AI authentication, selected-range statistics, maintenance availability, password change and account authorization.
- Confirm the role assignment policy: admin may create all approved roles; manager may create user/technician only; user/technician cannot create accounts.
- Confirm AI remains advisory/read-only and has no business mutation path.
- Confirm database schema evidence covers ORM entities, PK/FK, required fields, uniqueness, indexes, password hashing and DDL entity parity.
- Confirm test evidence is actual execution evidence, not merely existing test files.
- Confirm no test was weakened or modified to force a pass.

### Artifact/evidence to inspect

- `backend/app/`
- `tests/`
- `tests/test_database_schema.py`
- `tests/test_g3.py`
- `docs/test-plan.md`
- `docs/test-report.md`
- `docs/database-verification.md`
- `traceability-report.md`
- G3 commit `081ccdf`

### Verification commands/evidence already available

```bash
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
python -m compileall -q backend/app
```

Latest recorded full-suite result:

```text
20 passed, 20 warnings
```

### Known limitations

- Live Ollama behavior is not tested.
- Full role-by-endpoint matrix is not tested.
- Document CRUD/upload is not implemented.
- UI/E2E, performance and UAT are not verified.
- Warnings remain in the test output.

### Human decision

[ ] APPROVED

[ ] REJECTED

[x] APPROVED WITH DOCUMENTED GAPS

Reviewer: ____________________  Date: ____________________

Notes: ________________________________________________________________

## G4 Integration & System Validation

### Gate name

G4 Integration & System Validation

### Required human checks

- Confirm frontend API paths, HTTP methods and bearer-token handling match backend routes.
- Confirm equipment, borrow/return, approval, maintenance and statistics workflows are integrated as documented.
- Confirm DEF-G4-001 was fixed by refreshing device data after maintenance completion.
- Confirm the fix was not claimed as browser/E2E-tested.
- Confirm AI authentication and read-only behavior at the integration boundary.
- Confirm known gaps are retained rather than converted into PASS.

### Artifact/evidence to inspect

- `docs/g4-system-validation.md`
- `docs/test-plan.md`
- `frontend/src/lib/api.js`
- `frontend/src/App.jsx`
- `backend/app/routers/`
- `tests/`
- G4 commit `e6c91ae`

### Verification commands/evidence already available

```bash
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
cd frontend && npm run build
```

Recorded integration evidence includes backend/API tests, route inspection and successful Vite production build.

### Known limitations

- No browser/E2E execution.
- No live Ollama execution.
- Docker and live MySQL startup were not verified.
- Frontend maintenance refresh has build-level evidence, not browser-level evidence.

### Human decision

[ ] APPROVED

[ ] REJECTED

[x] APPROVED WITH DOCUMENTED GAPS

Reviewer: ____________________  Date: ____________________

Notes: ________________________________________________________________

## G5 Documentation & Deployment

### Gate name

G5 Documentation & Deployment

### Required human checks

- Confirm README, deployment, test, code-review, security-review and database evidence match the current implementation.
- Confirm implemented versus planned functionality is clearly separated.
- Confirm Ollama is described as local and live verification is not falsely claimed.
- Confirm keyword retrieval is not described as semantic/vector RAG.
- Confirm SQLite local development and MySQL Docker configuration are distinguished.
- Confirm document CRUD/upload, performance, UAT, browser/E2E and production security are not falsely claimed.
- Confirm security remediation is documented with residual limitations.
- Confirm Tools/MCP evidence says MCP was not used where no evidence exists.
- Confirm Git history and phase commits are inspectable.

### Artifact/evidence to inspect

- `README.md`
- `docs/deployment.md`
- `docs/test-plan.md`
- `docs/test-report.md`
- `docs/code-review.md`
- `docs/security-review.md`
- `docs/tools-mcp-evidence.md`
- `.agents/skills/documentation/SKILL.md`
- `git log --oneline --decorate`

### Verification commands/evidence already available

```bash
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
python -m compileall -q backend/app
cd frontend && npm run build
git status --short
git diff --name-only
```

Documentation audit evidence records the current test result as 20 passed, 20 warnings. Tools/MCP evidence explicitly records: **MCP: NOT USED / NO EVIDENCE**.

### Known limitations

- Docker deployment was documented from repository configuration but not claimed as runtime-verified.
- No live MySQL/Ollama deployment verification.
- No production security, backup, TLS, performance or UAT evidence.
- Human G5 review itself is not represented by this checklist.

### Human decision

[ ] APPROVED

[ ] REJECTED

[x] APPROVED WITH DOCUMENTED GAPS

Reviewer: ____________________  Date: ____________________

Notes: ________________________________________________________________

## Final human review notes

Overall reviewer: ____________________  Date: ____________________

Cross-gate observations: ______________________________________________

Required follow-up actions: ____________________________________________
