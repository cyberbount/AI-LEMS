---
name: security-review
description: Use when starting the security review phase after testing Gate G6 is approved, or when asked to review the implemented local-lab-ai system for security issues, including authentication, authorization, secrets, input validation, RAG/prompt-injection and data leakage, producing evidence-based findings without fixing code.
---

# Security Review Skill

## Objective
Find and document real security weaknesses in this codebase with evidence, severity and recommended fixes; do not modify code.

## Inputs
Read the real implementation:
- `backend/app/` (config, auth, deps, routers, services), `backend/init.sql`, `docker-compose.yml`, `.env` handling in `config.py`
- `docs/api-design.md` (role matrix) for expected vs actual authorization

## Process
Review each applicable area; mark not-applicable areas explicitly with a reason:
1. Authentication: JWT algorithm/expiry (`auth.py`), password hashing (bcrypt via passlib), default `jwt_secret_key = "change-me-in-production"`, token storage guidance.
2. Authorization: compare actual `require_roles(...)` per endpoint against the role matrix in `docs/api-design.md`; check object-level access (e.g. a user touching another user's borrow request); check the demo frontend role login (`localStorage`) vs backend RBAC.
3. Input validation: unvalidated `status` query params on PATCH endpoints, Pydantic field limits, path parameter types.
4. Injection: SQL injection (verify ORM-only, no raw string SQL), XSS exposure (React escaping, any `dangerouslySetInnerHTML`), command injection in scripts.
5. AI/RAG security (project-specific):
   - Prompt injection through `document_chunks` content or user chat history reaching the system prompt — check the system prompt refusal rules and whether retrieval content is clearly delimited.
   - Document poisoning: who can insert chunks (currently seed-only; no upload endpoint — if one is added, it needs authorization + sanitization).
   - Retrieval authorization: all documents are global; decide whether that is acceptable for this lab.
   - Data leakage: AI answers must never expose `password_hash` or other sensitive columns; summary mode should expose aggregates only.
   - Secrets: Ollama URL/model config, no external API key (verify), docker-compose default passwords (`root`/`lab`), placeholder hashes in `init.sql`.
6. Transport/config: CORS `allow_credentials` with configurable origins, debug exposure, error messages leaking internals (502 detail), logging of sensitive data.
7. Dependencies: known-vulnerability check for requirements (e.g. `pip-audit`) if the environment allows.

For every finding record ID (`SEC-001`, ...), severity (CRITICAL/HIGH/MEDIUM/LOW), affected component with `file:line` evidence, recommendation, and how to verify the fix.

## Rules
- Read-only: do not fix, do not commit changes.
- Every finding needs evidence in the real code; no generic checklist padding.
- Do not invent threats for technologies the project does not use.
- Report uncertain items as "needs human review" instead of guessing.
- **Why these rules prevent hallucination**: By requiring evidence from real code, we ensure findings are based on actual implementation, not theoretical concerns. By prohibiting generic checklists, we prevent false positives from irrelevant threats. By restricting threats to actual technologies, we avoid wasting effort on non-existent vulnerabilities. By admitting uncertainty instead of guessing, we prevent incorrect security assessments that could lead to unnecessary fixes or missed real issues.

## Outputs
Create or update:
- `docs/security-review.md` (scope, checklist results with N/A reasons, findings table SEC→severity→evidence→recommendation→verification, residual risk)

## Verification
PASS if: every endpoint and every AI path was reviewed; each checklist area has an explicit result (finding or N/A with reason); all findings have severity + evidence.
FAIL if: a reviewed area is missing, a finding lacks evidence, or the review stayed on generic advice.

## Human Gate (G7)
A human reviewer decides the disposition of each finding: fix now, accept risk, or backlog. AI does not decide which risks are acceptable.
- PASS → documentation may start. FAIL → agreed fixes enter implementation as change requests.
