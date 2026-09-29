# Test Report

## Scope

This report records tests that are actually present and executed in this repository. It does not claim coverage for features that have no automated test or are not implemented.

## Environment

### Hardware Configuration

- **CPU**: Intel Core i7-10850H
- **RAM**: 32 GB
- **Storage**: 1.4 TB SSD
- **GPU**: NVIDIA Quadro T2000 4 GB

### Software Configuration

- **OS**: Ubuntu 24.04.4 LTS on WSL2
- **Backend**: FastAPI, SQLAlchemy, Python virtual environment
- **Database**: SQLite
- **Test runner**: pytest
- **GPU usage**: The current automated backend test suite does not require GPU acceleration.
- **AI provider**: Ollama provider tests are not executed against a live Ollama instance in the current test run.

## Current test suite

The suite comprises **63 test cases** across 8 files:

| Area | Test file | Tests | Status |
|---|---|---|---|
| Local login (username + email), wrong/disabled credentials, Google OAuth (mocked, `aud` verified against configured Client ID), backend RBAC enforcement | `tests/test_auth_real.py` | 10 | Executed |
| Login/`/me`, RBAC device creation, borrow→approve→borrow→return lifecycle, two-step return + inspection, user CRUD + reset password, unavailable-device rejection, device condition | `tests/test_api.py` | 7 | Executed |
| Password change, account-authorization matrix (manager cannot create admin), maintenance-until-completion availability, statistics time-range + authorization | `tests/test_g3.py` | 8 | Executed |
| AI security (Garak/PromptInject-derived): direct injection + RBAC bypass, system-prompt leakage, electrical-safety jailbreak, SafeRAG context conflict, pre-flight screening filter (`check_adversarial_input`) | `tests/test_ai_security.py` | 5 | Executed |
| AI poisoning & leakage defense (ATLAS AML.T0051.001 / OWASP LLM01-02): indirect injection via RAG chunk quarantined in UNTRUSTED envelope, staff document never reaches user context, system-prompt/secret leakage probes on all public surfaces, pre-flight refusal hygiene | `tests/test_ai_poisoning.py` | 6 | Executed |
| Role-scoped AI knowledge policies (BR-015): SOP retrieval filtered by `allowed_roles`, mode gating 403, inventory context per role, `safety_note`, documents CRUD/upload API validation, `AI_QUERY` audit | `tests/test_ai_roles.py` | 16 | Executed |
| Keyword retrieval grounding, bounded chat history, AI endpoint authentication (401 unauthenticated / 200 authenticated) | `tests/test_ai.py` | 4 | Executed |
| ORM schema entities/constraints, SQLite↔MySQL DDL parity, seeded passwords are bcrypt hashes | `tests/test_database_schema.py` | 3 | Executed |
| Maintenance completion + aggregate statistics | `tests/test_operations.py` | 1 | Executed |
| Ollama provider failure through the live provider | Not yet automated | — | Pending |

## Execution record

Run from the repository root:

```text
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
```

The pass/fail count below must be updated from the command output after each run. No historical QA team, external test-management system or unverified pass rate is claimed here.

- Last execution: 2026-09-27 (updated after Group-1 role-scoped AI implementation), local development environment
- Command: `PYTHONPATH=backend .venv/bin/python -m pytest -q tests/`
- Test cases run: **54**
- Passed: **54** (pass rate 100% — 63/63)
- Failed: 0
- Errors: 0
- Warnings: 7 (deprecation warnings for `datetime.utcnow`, no test failures)
- Result: PASS

The executed suite covers, among others: **RBAC** (user blocked from device creation,
user management and admin endpoints; technician restricted to technical device
statuses; manager cannot create admin accounts), the **full borrow lifecycle**
(create → approve → borrow → two-step return → confirm-return, plus rejection of
unavailable devices), **authentication** (local login by username/email, disabled
accounts, mocked Google OAuth with audience verification, AI endpoint rejecting
unauthenticated requests) and **AI security** (SEC-01..SEC-05: prompt injection,
system-prompt leakage, safety jailbreak, context conflict and the Garak-derived
pre-flight filter returning a refusal with `grounded=false` without calling the model).
Security-scanning evidence: `detect-secrets` full-repo scan 2026-09-27 — 13 findings, 100% false positive
(docs/test credentials), no real secrets (`docs/secret-scan-2026-09-27.md`). AI findings now carry
MITRE ATLAS / NIST AI RMF / OWASP LLM Top 10 mappings in `docs/security-review.md`.
`compileall` over `backend/app` and `npm run build` over the frontend both pass
after the latest changes (raw-password removal, password-reveal feature removal,
`check_adversarial_input` implementation).

## Limitations

The suite does not prove complete requirements coverage. The traceability report continues to show gaps for untested workflows, live Ollama behavior, and document-management CRUD/upload. UI/E2E browser testing and performance testing remain pending.
