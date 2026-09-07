# Security Review

## Scope

Static review of the active backend/frontend implementation, configuration, dependency declarations and existing verification evidence. No exploit attempts, production assessment, live MySQL test or live Ollama security test was performed.

## Checklist

| Area | Result | Evidence and limits |
|---|---|---|
| SQL Injection | PASS for inspected active code | SQLAlchemy ORM queries are used; no raw SQL construction was found in active routers/services. This is static inspection, not penetration testing. |
| XSS | PASS for inspected active code | No `dangerouslySetInnerHTML` or direct HTML injection was found in `frontend/src`. Browser testing was not executed. |
| CSRF | NOT VERIFIED | Bearer JWT is used by the API, but no dedicated CSRF analysis or browser-origin test was executed. |
| Authentication | PARTIAL | JWT decode/expiry and bcrypt password verification exist; targeted configuration check confirmed no placeholder fallback. Persistent deployment secret handling remains NOT VERIFIED. |
| Authorization | PARTIAL | `current_user` and `require_roles` protect active endpoints; role assignment matrix has regression evidence, but not every endpoint matrix is tested. |
| Secrets | PARTIAL | JWT and Compose credentials now come from ephemeral/environment configuration; production secret handling remains NOT VERIFIED. |
| Input validation | PARTIAL | Pydantic schemas and enum-like status validation exist; complete boundary/error matrix was not tested. |
| File upload | NOT VERIFIED / NOT IMPLEMENTED | No document upload endpoint was found. There is no upload attack surface in the current API, but no future-upload security control can be claimed. |
| Dependency vulnerability | NOT VERIFIED | `backend/requirements.txt` and `frontend/package.json` were inspected. No vulnerability scanner was available/executed. |
| Information leakage | PARTIAL | AI endpoint now returns controlled error text; `/health` and `/api/capabilities` still expose provider/model metadata. |
| CORS/configuration | PARTIAL | CORS origins are configurable and credentials are enabled; no production-origin review was executed. |
| AI/RAG prompt injection | PARTIAL | Retrieved context now has an explicit untrusted-reference delimiter. No live model security test or adversarial model evaluation was executed. |
| Document poisoning | PASS for current surface / NOT VERIFIED for future surface | No upload or document mutation API was found; seed/database content is the current insertion path. |
| Data leakage to AI | PARTIAL | Current context queries devices, maintenance and chunks, not password hashes; no live model output audit was performed. |

## Findings

### SEC-001 — Placeholder JWT signing secret

- Severity: HIGH
- Location: `backend/app/config.py:8`, `docker-compose.yml`.
- Original finding: default and Compose value were `change-me-in-production`.
- Remediation implemented: local fallback is ephemeral; Docker requires an environment-provided `JWT_SECRET_KEY`.
- Verification evidence: targeted configuration check passed.
- Impact: token forgery risk if deployed without overriding the setting.
- Current disposition: MITIGATED; deployment secret storage and rotation remain NOT VERIFIED.
- Verification after fix: start with missing/placeholder secret and confirm fail-closed behavior; verify tokens with a deployment-provided secret.

### SEC-002 — Privileged role assignment boundary is too broad

- Severity: HIGH
- Location: `backend/app/routers/users.py:15-29`.
- Original finding: `manager` could assign privileged roles.
- Remediation implemented: `admin` may assign all approved roles; `manager` may assign only `user` and `technician`.
- Verification evidence: `tests/test_g3.py::G3ApiTests::test_account_role_assignment_matrix`; full suite passed.
- Impact: privilege escalation through an authorized account if that role-assignment policy is not intended.
- Current disposition: MITIGATED + REGRESSION TESTED; broader endpoint matrix remains incomplete.
- Verification after fix: API tests for every manager/admin role-assignment combination.

### SEC-003 — Raw AI provider exception disclosure

- Severity: MEDIUM
- Location: `backend/app/routers/ai.py:15-18`.
- Original finding: raw provider exception was returned in the response.
- Remediation implemented: response now uses the controlled message `AI provider is unavailable`; detailed exception remains server-side.
- Verification evidence: targeted failing-provider check passed.
- Impact: internal provider/network details may be disclosed.
- Current disposition: MITIGATED + TARGETED TESTED; deployed log access/privacy remains NOT VERIFIED.
- Verification after fix: force provider failure and assert the response omits exception internals.

### SEC-004 — Development database credentials are embedded in Compose

- Severity: MEDIUM
- Location: `docker-compose.yml:5-8,19`.
- Original finding: MySQL credentials were literal values in Compose.
- Remediation implemented: Compose now requires `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_ROOT_PASSWORD` and `MYSQL_DATABASE` configuration.
- Verification evidence: `docker compose config` passed with temporary environment values and rejects missing required values.
- Impact: unsafe reuse outside local development.
- Current disposition: MITIGATED for configuration exposure; actual secret storage and Docker runtime security remain NOT VERIFIED.
- Verification after fix: inspect effective Compose configuration without hard-coded deployment credentials.

### SEC-005 — AI prompt trust boundary is only partially defined

- Severity: MEDIUM
- Location: `backend/app/services/ai_service.py:35-39,47-56`.
- Original finding: retrieved context was not structurally delimited.
- Remediation implemented: retrieved context is wrapped in `BEGIN UNTRUSTED REFERENCE CONTEXT` / `END UNTRUSTED REFERENCE CONTEXT` and explicitly described as reference data.
- Verification evidence: targeted prompt-construction check passed.
- Impact: a malicious document chunk or conversation message could influence model instructions.
- Current disposition: PARTIALLY MITIGATED + TARGETED TESTED; no live/adversarial model evaluation was executed.
- Verification after fix: offline/mock tests with adversarial chunk content and history.

## Not verified

- Penetration testing.
- Browser/E2E security behavior.
- Live MySQL security and constraint behavior.
- Live Ollama/provider security behavior.
- Complete dependency vulnerability coverage.
- Production secret management, TLS and deployment hardening.

## Human disposition

Findings require human decisions: fix now, accept risk, or backlog. No source changes were made and this review does not approve G3, G4 or G5.
