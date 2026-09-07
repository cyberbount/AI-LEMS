# AI-Augmented SDLC Process Log

## Purpose

This log records project work that can be evidenced in the repository. It is not a claim that every conversation or every proposed change was executed.

## System boundary confirmed by human review

- Domain: laboratory equipment management for Electronics, IoT and Embedded Systems.
- Backend: FastAPI, SQLAlchemy and JWT/RBAC.
- Frontend: React/Vite.
- Database: SQLite for local development and MySQL in Docker.
- AI: Ollama running locally on the laptop.
- Retrieval: keyword matching over `document_chunks`; not semantic vector search.
- No OpenAI, Gemini or other hosted AI service is used by the runtime.

## Artifacts produced

| Phase | Evidence |
|---|---|
| Requirements | `docs/requirements.md`, `docs/user-stories.md`, `docs/acceptance-criteria.md` |
| Architecture | `docs/architecture.md`, `docs/architecture-decisions.md` |
| Database | `docs/database-design.md`, `database/schema.sql`, `backend/init.sql` |
| API | `docs/api-design.md`, `docs/api.md`, FastAPI OpenAPI at `/docs` |
| Implementation | `docs/implementation-notes.md`, `backend/`, `frontend/` |
| Testing | `tests/`, `docs/test-plan.md`, `docs/test-report.md` |
| Review | `docs/code-review.md`, `docs/security-review.md` |
| Chatbot | `docs/chatbot-*.md`, `docs/question-analysis.md` |

## Human modifications and decisions

- Replaced product/laptop assumptions with the laboratory equipment domain.
- Kept Ollama local and documented the actual `qwen2.5:3b` configuration.
- Corrected descriptions that overstated semantic RAG, document CRUD or separate chatbot modules.
- Added executable tests and recorded their real result.
- Kept incomplete features and unverified security controls explicitly marked.

## Remaining human verification

See `docs/human-gates.md`. No gate is marked approved by this log. The owner must inspect the artifacts, runtime and test output before approving each gate.
