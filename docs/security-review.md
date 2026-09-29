# Security Review

## Scope

Static review of the active backend/frontend implementation, configuration, dependency declarations and existing verification evidence. No exploit attempts, production assessment, live MySQL test or live Ollama security test was performed.

## Checklist

| Area | Result | Evidence and limits |
|---|---|---|
| SQL Injection | PASS for inspected active code | SQLAlchemy ORM queries are used; no raw SQL construction was found in active routers/services. This is static inspection, not penetration testing. |
| XSS | PASS for inspected active code | No `dangerouslySetInnerHTML` or direct HTML injection was found in `frontend/src`. Browser testing was not executed. |
| CSRF | MITIGATED BY DESIGN (see CSRF mitigation section) | The API uses `Authorization: Bearer <JWT>` headers only; no session/identity cookie is ever set, so no browser-ambient credential exists for a cross-site request to replay. Browser-origin testing was not executed. |
| Authentication | PARTIAL | JWT decode/expiry and bcrypt password verification exist; targeted configuration check confirmed no placeholder fallback. Persistent deployment secret handling remains NOT VERIFIED. |
| Authorization | PARTIAL | `current_user` and `require_roles` protect active endpoints; role assignment matrix has regression evidence, but not every endpoint matrix is tested. |
| Secrets | PARTIAL → verified by scan | JWT and Compose credentials now come from ephemeral/environment configuration; production secret handling remains NOT VERIFIED. **detect-secrets scan 2026-09-27: 13 findings, 100% false positive (docs/test credentials), no real secrets in repo — `docs/secret-scan-2026-09-27.md`.** **Plaintext password storage (`raw_password`) removed 2026-09-25 — see SEC-006.** **Google SSO fail-closed 2026-09-28:** thiếu GOOGLE_CLIENT_ID → 503 thay vì bỏ qua kiểm tra audience; aud được kiểm tra trên mọi token (hermetic tests). |
| Input validation | PARTIAL | Pydantic schemas and enum-like status validation exist; complete boundary/error matrix was not tested. |
| File upload | NOT VERIFIED / NOT IMPLEMENTED | No document upload endpoint was found. There is no upload attack surface in the current API, but no future-upload security control can be claimed. |
| Dependency vulnerability | NOT VERIFIED | `backend/requirements.txt` and `frontend/package.json` were inspected. No vulnerability scanner was available/executed. |
| Information leakage | PARTIAL | AI endpoint now returns controlled error text; `/health` and `/api/capabilities` still expose provider/model metadata. |
| CORS/configuration | PARTIAL | CORS origins are configurable and credentials are enabled; no production-origin review was executed. |
| AI/RAG prompt injection | PARTIALLY MITIGATED (see Prompt Injection mitigation section) | Retrieved context has an explicit untrusted-reference delimiter; client input is validated (Pydantic length/type bounds), client-supplied `system` messages are stripped, and the AI is read-only. No live/adversarial model evaluation was executed. |
| Document poisoning | PASS for current surface | Document ingestion is now role-managed: `documents.allowed_roles` controls which requester roles can retrieve a document in the RAG pipeline (BR-015, report §2.11); upload is restricted to admin/manager with extension + 1 MB size + UTF-8 validation. |
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

### SEC-006 — Plaintext password storage and exposure (`raw_password`)

- Severity: HIGH
- Location (original): `backend/app/models.py` (User model), `backend/app/schemas.py` (`UserOut`), `backend/app/routers/users.py`, `backend/init.sql`, `fix_db.py`.
- Original finding: a `users.raw_password` column stored the plaintext password at account creation, password update and admin reset; `UserOut` returned it to any admin/manager listing users, and the frontend offered a "reveal password" eye toggle for other users' passwords.
- Remediation implemented (2026-09-25): column removed from the ORM model, `init.sql` and all routers; `UserOut` no longer exposes it; the frontend password-reveal feature was replaced with a static mask plus a bcrypt one-way-hash notice; migration script `remove_raw_password.py` drops the column from existing SQLite databases (`ALTER TABLE users DROP COLUMN raw_password`).
- Verification evidence: full suite **33/33 passed** after removal; `compileall` over `backend/app` passed; frontend `npm run build` passed; migration run against `lab.db` confirmed the column no longer exists.
- Impact: any DB read, API response or browser session could disclose reusable user passwords.
- Current disposition: **FIXED + REGRESSION TESTED.**
- Verification after fix: `PRAGMA table_info(users)` shows no `raw_password`; re-running `remove_raw_password.py` is a no-op.

## Mitigation: CSRF

**Status: mitigated by design (bearer-token authentication model).**

- The frontend authenticates every state-changing call with an `Authorization: Bearer <JWT>` header. The token lives in `sessionStorage` and is attached explicitly by JavaScript — it is **never stored in a cookie**.
- CSRF attacks exploit *ambient* credentials (cookies/basic-auth) that the browser attaches automatically to cross-site requests. This application has no ambient credential: a forged cross-site form or `fetch` from another origin arrives **without** the JWT header and is rejected with `401` by `current_user`.
- The session cookie surface is therefore empty: no `SameSite` policy is needed because no session cookie exists, and `document.cookie` contains no identity data.
- CORS is additionally restricted (`CORS_ORIGINS`) so untrusted origins cannot read authenticated responses.
- Residual limitations: XSS would still expose the in-page token (XSS is separately reviewed above); browser-origin/CSRF tooling tests were not executed; if cookie-based auth is ever introduced, `SameSite=Strict/Lax` + CSRF tokens must be added.

## Mitigation: Prompt Injection (AI input hardening)

**Status: partially mitigated with layered controls (see SEC-005 for the original finding).**

Defense-in-depth applied to everything that reaches the LLM (Ollama):

1. **Pre-flight screening filter (SEC-05, implemented 2026-09-27)** — `AIService.check_adversarial_input()` screens every user message against regex patterns derived from the repository's own NVIDIA Garak scan results (`reports/garak/`: dan baseline, promptinject baseline, encoding_rot13, leakreplay) *before* the provider is called. Flagged inputs are refused immediately with `grounded=false` and no model call. Verified by `tests/test_ai_security.py` SEC-05 (38/38 suite PASS).
2. **Input validation before the model** — `ChatRequest`/`ChatMessage` are Pydantic-validated: message and every history item are bounded to 12,000 characters, `mode` is restricted to the four known literals (`chat`, `rag`, `summary`, `inspection_alert`); anything outside fails with `422` before touching the AI service.
2. **History sanitation** — client-supplied history is bounded to `MAX_HISTORY_MESSAGES` (12) and any `system`-role message from the client is **stripped**; only the server builds system instructions, so an attacker cannot overwrite the operating prompt through history.
3. **Untrusted-context delimiting** — retrieved RAG context is wrapped in `BEGIN UNTRUSTED REFERENCE CONTEXT ... END UNTRUSTED REFERENCE CONTEXT` and explicitly declared as reference data, not instructions (`backend/app/services/ai_service.py`).
4. **Bounded retrieval surface** — retrieval only queries the managed `document_chunks` table seeded by `scripts/seed_sop_documents.py`; there is no upload endpoint, so third parties cannot poison the knowledge base through the API (document poisoning: PASS for current surface).
5. **Read-only AI boundary (damage containment)** — even if injection succeeds, the model cannot mutate state: no tool/function calling is exposed, the system prompt forbids approvals/status changes, and BR-011 requires all state changes to be human actions through RBAC-protected endpoints.
6. **No data exfiltration channel** — the prompt context is built from devices/maintenance/chunks only; credentials and password hashes are never sent to the model.
7. **Role-scoped retrieval (BR-015, added 2026-09-27)** — RAG chunks are filtered by `documents.allowed_roles` against the requester's JWT role before scoring, AI modes are role-gated (`summary` → admin/manager, `inspection_alert` → admin/manager/technician), and every AI query is written to `audit_logs` (`AI_QUERY`) for traceability. Verified by `tests/test_ai_roles.py`.
- Residual limitation: offline adversarial pattern coverage now exists (Garak scan artifacts in `reports/garak/` + SEC-05 pre-flight filter); however, evaluation against the live `qwen2.5:3b` model with adaptive (non-pattern) attacks was not executed.

## Framework mapping (MITRE ATLAS · NIST AI RMF · OWASP LLM Top 10)

Áp dụng phương pháp phân loại của thư viện tham khảo `Anthropic-Cybersecurity-Skills` (agentskills.io):
mỗi finding chỉ được map vào framework ID **thật và đã đối chiếu**; không map thì ghi "N/A" thay vì đoán.
Cơ sở yêu cầu: Báo cáo §2.11 ("Yêu cầu an toàn thông tin và an toàn AI"), đề tài 23 (phần bảo mật dữ liệu),
rubric môn học tiêu chí Review + Security.

| Finding | MITRE ATLAS | NIST AI RMF | OWASP LLM Top 10 | Ghi chú |
|---|---|---|---|---|
| SEC-001 Placeholder JWT secret | N/A (không phải mối đe dọa AI) | N/A | N/A | Bảo mật ứng dụng web truyền thống — đã khắc phục |
| SEC-002 Role assignment quá rộng | N/A | N/A | N/A | RBAC ứng dụng — đã khắc phục + regression test |
| SEC-003 Lộ chi tiết lỗi AI provider | N/A | MEASURE-2.7 (an toàn & khả năng phục hồi hệ thống AI) | LLM02 Sensitive Information Disclosure | Đã khắc phục (thông báo lỗi kiểm soát) |
| SEC-004 Credential mặc định trong Compose | N/A | N/A | N/A | Đã khắc phục |
| SEC-005 Prompt injection qua RAG | **AML.T0051** (LLM Prompt Injection), **AML.T0051.001** (Indirect) | MEASURE-2.7 | **LLM01** Prompt Injection | Pre-flight filter (SEC-05) + untrusted-context delimiter |
| SEC-006 Lưu/trả mật khẩu plaintext | N/A | N/A | LLM02 Sensitive Information Disclosure | Đã khắc phục 2026-09-25, regression tested |
| BR-015 Role-scoped retrieval | **AML.T0051.001** (Indirect — bề mặt tài liệu) | MEASURE-2.7 | LLM01 / LLM06 Sensitive Information Disclosure | Biện pháp phòng ngừa trước khi vào pipeline RAG |
| AI read-only (BR-011) | AML.T0051 (giảm thiểu tác động) | MANAGE-4.1 (giám sát sau triển khai) | LLM06 (không tự thực hiện hành động) | AI không đột biến trạng thái; human-in-the-loop |
| Đề tài cấm: AI gửi dữ liệu ra dịch vụ ngoài | N/A | N/A | LLM03 Supply Chain (giảm thiểu bằng local Ollama) | Model chạy hoàn toàn local |

ID đã đối chiếu với MITRE ATLAS v2026.07 (AML.T0051 LLM Prompt Injection; AML.T0054 LLM Jailbreak — dùng cho
bộ pre-flight pattern) và NIST AI RMF 1.0. Không tuyên bố đầy đủ ATLAS/CSF cho các finding ngoài phạm vi AI.

## Not verified

- Penetration testing.
- Browser/E2E security behavior.
- Live MySQL security and constraint behavior.
- Live Ollama/provider security behavior.
- Complete dependency vulnerability coverage.
- Production secret management, TLS and deployment hardening.

## Human disposition

Findings require human decisions: fix now, accept risk, or backlog. No source changes were made and this review does not approve G3, G4 or G5.
