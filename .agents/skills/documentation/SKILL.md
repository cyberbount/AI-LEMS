---
name: documentation
description: Use during G5 Documentation & Deployment, or when asked to update project documentation for local-lab-ai so it exactly matches the implemented system, including setup, architecture overview, API usage, configuration, deployment, troubleshooting and design decisions.
---

# Documentation Skill

## Objective
Make every user-facing document describe what is actually implemented — no stale claims, no undocumented features.

## Inputs
Read approved artifacts and the real system:
- `docs/requirements.md`, `docs/architecture.md`, `docs/database-design.md`, `docs/api-design.md`, `docs/security-review.md` (accepted dispositions only)
- real code/config: `backend/app/`, `docker-compose.yml`, `backend/requirements.txt`, `frontend/package.json`, scripts

## Process
1. Inventory current docs and list stale statements. Known today: `README.md` claims "không có database, Docker, authentication, RAG" while the code now has SQLAlchemy models, JWT/RBAC, docker-compose and a keyword-RAG pipeline — these must be corrected.
2. Update `README.md`: overview, real architecture diagram (React → FastAPI → services → SQLAlchemy → SQLite/MySQL, plus AI service → Ollama), quick start (backend .env, uvicorn, frontend vite, or docker-compose), demo roles.
3. Write `docs/api.md` from the approved API contract: endpoint table with method, auth, roles, request/response examples, error codes.
4. Write `docs/deployment.md`: local dev vs docker-compose (MySQL, Ollama, model pull `qwen2.5:3b`), environment variables from `config.py`, WSL/Windows Ollama notes.
5. Write `docs/user-guide.md`: three role dashboards, borrow/approve/return workflow, maintenance, AI chat modes and their limits.
6. Write `docs/design-decisions.md` summary from approved ADRs (local LLM, provider protocol, keyword retrieval, dual DB dialect).
7. Cross-check every documented command/variable/endpoint against the code; verify setup steps from a clean-environment perspective.

## Rules
- Never document unimplemented features as working; mark planned features explicitly as "not implemented yet".
- Never contradict an approved artifact; if docs and code disagree, report it as a finding instead of writing fiction.
- Keep documents concise and operational; no marketing text.
- Reuse artifact content; do not restate it inconsistently.
- **Why these rules prevent hallucination**: By requiring documentation to match implemented features, we prevent false claims about functionality. By prohibiting contradictions with approved artifacts, we maintain specification consistency. By keeping documents concise and operational, we avoid vague descriptions that could be misinterpreted. By reusing artifact content, we ensure information is not lost or misrepresented during documentation.

## Outputs
Create or update:
- `README.md`, `docs/api.md`, `docs/deployment.md`, `docs/user-guide.md`, `docs/design-decisions.md`

## Verification
PASS if: every documented endpoint exists with matching contract; every env variable appears in `config.py`; setup commands were checked against scripts/compose files; stale claims are fixed or flagged; no unimplemented feature is described as working.
FAIL if: any documented claim cannot be traced to code or an approved artifact.

## Project gate alignment
Documentation belongs to G5 Documentation & Deployment. A human reviewer follows the quick-start and confirms the docs are accurate and complete. This Skill does not create a new gate.
