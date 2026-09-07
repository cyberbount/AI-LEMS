---
name: implementation
description: Use when starting the implementation phase after API Gate G4 is approved, or when asked to implement/modify local-lab-ai code strictly against approved requirements, architecture, database and API artifacts, with conflict STOP rules, dependency discipline and a change report process.
---

# Implementation Skill

## Objective
Write or change backend (FastAPI/SQLAlchemy) and frontend (React/Vite) code that conforms to the approved artifacts, and stop instead of guessing when the specification is insufficient.

## Inputs
Read only approved artifacts:
- `docs/requirements.md`, `docs/architecture.md`, `docs/database-design.md`, `docs/api-design.md`
- current code: `backend/app/`, `frontend/src/`

## Process
1. Read the approved specification; list the tasks to implement.
2. Implement inside the existing structure — backend: routers in `app/routers/`, Pydantic schemas in `app/schemas.py`, models in `app/models.py`, services in `app/services/`; frontend: `src/App.jsx`, `src/lib/api.js`, `src/components/ui.jsx`. Match the compact existing code style.
3. Respect the API contract exactly: paths, methods, status codes, schemas, role checks via `deps.require_roles`.
4. Respect database design: changes go through SQLAlchemy models; keep SQLite and MySQL parity; never hand-write dialect-specific SQL unless the design says so.
5. After coding, run what is available: start the app (`uvicorn app.main:app --app-dir backend`), run tests if present (`pytest`), check the FastAPI `/docs` contract against `docs/api-design.md`.
6. Self-review the diff: correctness, contract compliance, no dead code, no debug leftovers.
7. Write the change report: every modified/added file with a one-line reason, mapped to the API/DBT IDs it implements.

## Rules
- Never modify approved artifacts (requirements/architecture/database/api docs). If a conflict or gap is found: STOP, report the conflict, propose a change request, wait for the Human Gate.
- Do not add a dependency without explicit approval; no over-engineering, no speculative features.
- Never hardcode secrets (JWT key, passwords); read them from `config.py` settings/.env.
- If the specification is not enough to implement a task, stop and ask — a good agent knows when to stop.
- Do not implement unapproved chatbot/AI features; AI behavior changes need their own approved artifact.
- Change request workflow: When a specification gap or conflict is found, document it in a change request format (problem, proposed solution, impact assessment, required approval) and submit to the Human Gate for decision before proceeding.
- **Why these rules prevent hallucination**: By prohibiting modification of approved artifacts, we maintain specification integrity. By requiring explicit approval for dependencies, we prevent unnecessary complexity. By avoiding hardcoded secrets, we ensure proper configuration management. By stopping when specifications are unclear, we prevent incorrect assumptions. By restricting AI features to approved requirements, we prevent scope creep.

## Outputs
- source code changes under `backend/` and `frontend/`
- `docs/implementation-notes.md` (changed files, implemented IDs, conflicts found, STOP reasons)

## Verification
PASS if: app boots; implemented endpoints match the API contract; models match the DB design; no approved artifact was edited; conflicts are reported not guessed; change report complete.
FAIL if: code deviates from any approved artifact without a change request, a conflict was silently resolved, or the app does not run.

## Human Gate (G5)
A human reviewer reads implementation-notes.md, checks the diff against the API contract, and decides each reported conflict.
- PASS → testing may start. FAIL → fix items and re-verify.
