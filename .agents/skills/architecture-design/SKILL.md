---
name: architecture-design
description: Use when starting the architecture design phase after requirements Gate G1 is approved, or when asked to design/review the system architecture for local-lab-ai, documenting components, responsibilities, data flow, security boundaries, AI/RAG pipeline and traceable decisions from approved requirements.
---

# Architecture Design Skill

## Objective
Transform approved requirements (Gate G1) into a coherent architecture for the FastAPI + React lab-management system, with every major decision justified and traceable to requirements.

## Inputs
Read only approved artifacts:
- `docs/requirements.md`, `docs/user-stories.md`, `docs/acceptance-criteria.md`

## Process
1. PROPOSE FIRST: Create a proposed architecture document before reviewing the actual codebase, ensuring alignment with approved requirements without bias from existing code.
2. Document the actual layered style of this codebase:
   React SPA (3 role dashboards) → REST/JSON → FastAPI routers (`backend/app/routers/`) → dependencies (`deps.py`: JWT auth, `require_roles`) → services (`services/ai_service.py`: `AIService` + `AIProvider` protocol) → SQLAlchemy models (`models.py`) → SQLite (dev) / MySQL 8 (docker-compose) → Ollama HTTP API (external local service).
2. Assign component IDs (`ARC-01`, `ARC-02`, ...) with one responsibility each: auth, users, devices, borrow requests, maintenance, catalog, stats, documents, AI service, AI provider, RAG retrieval.
3. Define interactions and data flow between components; mark synchronous HTTP, ORM access, and the Ollama HTTP call.
4. Define the RAG pipeline as a component chain: question → analyze (`question-analysis` skill) → retrieve (`manual-retrieval` skill, keyword top-k over `document_chunks`) → context → prompt → answer. Embeddings/vector store are optional, not required.
5. Define security boundaries: (a) API boundary — JWT token + RBAC on every business endpoint; (b) AI boundary — AI is a read-only advisor; it must never mutate business state.
6. Record external dependencies: Ollama (`qwen2.5:3b`), MySQL image, no cloud AI, no API key.
7. Write decision records (`ADR-001`, ...) for non-obvious choices, each with rationale and trade-off, e.g. local Ollama (privacy, no key), provider protocol (swap engine without touching contract), keyword retrieval instead of vector DB (PoC scale), dual DB dialect (dev SQLite / deploy MySQL).
8. Build the traceability table: every FR → at least one ARC component.

## Rules
- Use only approved requirements; do not modify them.
- Do not introduce architecture patterns or technologies absent from the project (no Kafka, Kubernetes, event sourcing, microservices, vector DB) unless a requirement forces it and the decision says why.
- Every major decision needs a rationale; "popular" is not a rationale.
- Do not implement source code.
- Review the proposed architecture against the actual codebase and document any deviations as findings for the Human Gate.
- **Why these rules prevent hallucination**: By requiring traceability from requirements to components, we ensure no unnecessary features are added. By prohibiting absent technologies, we prevent over-engineering. By demanding rationale for decisions, we prevent arbitrary choices. By separating proposal from review, we avoid bias from existing code.

## Outputs
Create or update:
- `docs/architecture.md` (components, data flow, boundaries, FR→ARC traceability table)
- `docs/architecture-decisions.md` (ADR list)

## Verification
PASS if: every FR maps to ≥1 component; data flow is complete from UI to DB and to Ollama; both security boundaries are defined; every ADR has a rationale; no invented technology.
FAIL if: any FR has no supporting component, a boundary is missing, or a decision lacks rationale.

## Human Gate (G2)
A human reviewer must confirm the FR→component table covers all FRs and accepts each ADR trade-off.
- PASS → database-design may start. FAIL → name the gaps and stay in this phase.
