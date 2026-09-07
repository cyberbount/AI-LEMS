# Architecture

## Actual architecture

The project is a modular monolith. The React/Vite frontend calls FastAPI JSON endpoints. FastAPI applies JWT authentication and role checks, then uses SQLAlchemy models and services. The AI service calls the local Ollama HTTP API.

```text
React dashboard
  -> FastAPI router
  -> current_user / require_roles
  -> SQLAlchemy session and model
  -> SQLite (local) or MySQL (Docker)

AI chat panel
  -> /api/ai/chat
  -> AIService
  -> DocumentChunk keyword matching and database context
  -> OllamaProvider
  -> Ollama qwen2.5:3b
```

## Components

- ARC-01: React frontend for login, role dashboards, equipment display, borrow interaction, maintenance completion and AI chat.
- ARC-02: FastAPI application and router boundary.
- ARC-03: Authentication and RBAC dependencies using JWT and `require_roles`.
- ARC-04: Equipment, group and location routers and SQLAlchemy models.
- ARC-05: Borrow request and usage-history lifecycle.
- ARC-06: Maintenance records and schedules.
- ARC-07: Statistics query service.
- ARC-08: AIService with bounded history, database context and safety prompt.
- ARC-09: OllamaProvider abstraction and local HTTP client.
- ARC-10: Document and DocumentChunk persistence used by retrieval; no document CRUD router exists yet.

## Security boundaries

The backend is the authorization boundary. Frontend role state is only used for presentation and routing. The AI boundary is read-only: AI output is returned to the caller and does not call business mutation endpoints.

## Traceability

- FR-001 → ARC-03
- FR-002 → ARC-03
- FR-003 → ARC-04
- FR-004 → ARC-04
- FR-005 → ARC-05
- FR-006 → ARC-05
- FR-007 → ARC-05
- FR-008 → ARC-06
- FR-009 → ARC-07
- FR-010 → ARC-08
- FR-011 → ARC-08
- FR-012 → ARC-08
- FR-013 → ARC-08
- FR-014 → ARC-10

**Human Gate G2:** PENDING review of the actual-versus-incomplete component list.
