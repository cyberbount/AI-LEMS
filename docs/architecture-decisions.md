# Architecture Decision Records

These decisions describe the current architecture and target direction derived from the locked G1 baseline. They do not approve G2 and do not authorize implementation changes.

## ADR-001: Modular monolith

- Decision: Keep a React/Vite frontend and FastAPI backend in one project with explicit routers, services and persistence boundaries.
- Context: The current system is a laboratory management application of limited deployment scope.
- Alternatives: Microservices; a single frontend-only application.
- Reason: The current code already has a coherent modular-monolith boundary and does not require independent service scaling.
- Consequence: Simpler deployment and tracing; broader modules remain coupled to one backend.
- Status: CURRENT / VERIFIED

## ADR-002: FastAPI backend

- Decision: Use FastAPI as the HTTP/application boundary.
- Context: Current routers, dependency injection, validation and OpenAPI are implemented in FastAPI.
- Alternatives: Flask, Django or a different backend framework.
- Reason: Matches the existing implementation and supports typed request validation.
- Consequence: Business routes and dependencies remain Python/FastAPI-specific.
- Status: CURRENT / VERIFIED

## ADR-003: SQLAlchemy persistence

- Decision: Use SQLAlchemy models and sessions for relational access.
- Context: Current entities and routers use SQLAlchemy.
- Alternatives: Raw SQL or another ORM.
- Reason: Existing model relationships and SQLite/MySQL support.
- Consequence: Schema changes must remain consistent with ORM models and DDL.
- Status: CURRENT / VERIFIED

## ADR-004: SQLite and MySQL environments

- Decision: Use SQLite for local development and MySQL in Docker.
- Context: `.env`, `docker-compose.yml`, `backend/app/db.py` and `backend/init.sql` define these environments.
- Alternatives: One database engine only; PostgreSQL.
- Reason: Preserves the current local workflow and Docker deployment setup.
- Consequence: SQLite/MySQL parity must be checked manually; SQL behavior can differ.
- Status: CURRENT / PARTIAL; parity issue recorded in `docs/database-design.md`

## ADR-005: JWT authentication and backend authorization

- Decision: Use JWT bearer authentication and enforce authorization in backend dependencies.
- Context: `auth.py`, `deps.py` and protected routers implement this boundary.
- Alternatives: Session cookies; frontend-only role checks.
- Reason: The G1 baseline requires backend-enforced authorization.
- Consequence: Frontend role state is presentation only. `admin` and any technical `manager` role map to Lab Manager; `user` maps to Lab User; `technician` maps to Maintenance Technician.
- Status: CURRENT / RESOLVED FOR G2; source code unchanged

## ADR-006: Local Ollama provider

- Decision: Run the AI provider locally through Ollama.
- Context: The project requires local execution without a hosted AI provider.
- Alternatives: OpenAI, Gemini, Claude or another hosted provider.
- Reason: Matches the project privacy and deployment boundary.
- Consequence: Availability and response quality depend on the laptop/Ollama runtime; provider failure must be reported.
- Status: CURRENT / VERIFIED

## ADR-007: Keyword retrieval for current implementation

- Decision: The current retrieval implementation uses keyword matching over `DocumentChunk`.
- Context: `AIService._context()` loads chunks and selects lexical matches.
- Alternatives: Embeddings/vector search; external search service.
- Reason: It is the implemented PoC and no mandatory vector database is in the locked baseline.
- Consequence: Retrieval is lexical and has weaker semantic relevance. The system must not describe it as semantic/vector RAG.
- Status: CURRENT / VERIFIED

## ADR-008: Read-only AI boundary

- Decision: AI output is advisory and cannot approve/reject requests, mutate equipment state or confirm failure autonomously.
- Context: G1 business rules require human-controlled operational decisions.
- Alternatives: AI tool-calling into business mutation endpoints.
- Reason: Safety and human-in-the-loop requirement.
- Consequence: Summary and Inspection Alert require a human decision after the AI response.
- Status: CURRENT / PARTIAL; dedicated negative/workflow tests are not available

## ADR-009: No mandatory vector database

- Decision: Do not introduce a vector database as a G2 requirement.
- Context: The current baseline requires managed-document retrieval but does not require a particular retrieval technology.
- Alternatives: Make a vector store mandatory now.
- Reason: Avoid introducing an unsupported technology requirement before evaluation evidence exists.
- Consequence: Future semantic retrieval remains an optional future architecture decision.
- Status: TARGET CONSTRAINT

## ADR-010: Document and chunk persistence

- Decision: Persist document metadata and chunks as the current retrieval source.
- Context: `documents` and `document_chunks` exist in the models and schema.
- Alternatives: Filesystem-only documents; external document service.
- Reason: Relational traceability and source-name return behavior.
- Consequence: Document management operations are still a GAP; persistence must not be mistaken for upload/full CRUD.
- Status: CURRENT / PARTIAL

## ADR-011: Migration strategy

- Decision: The current project uses `create_all` and static Docker initialization; Alembic is not currently present.
- Context: No migration history or Alembic configuration exists.
- Alternatives: Introduce Alembic now; maintain only static SQL.
- Reason: Records the actual state without claiming a migration capability.
- Consequence: Schema evolution is manual and is a deployment risk. Migration/versioning remains a future implementation concern and is not a G2 blocker.
- Status: CURRENT / DOCUMENTED FUTURE CONCERN

## ADR-012: AI authentication boundary

- Decision: The target `/api/ai/chat` boundary requires a valid JWT for an active technical role.
- Context: `backend/app/routers/ai.py` currently injects `Db` but not `current_user` or `require_roles`.
- Alternatives: Leave public; restrict to selected roles only.
- Reason: G2 resolved that AI access is authenticated while preserving the four business actors and technical role mapping.
- Consequence: Current deployment remains public until a G3 source-code change adds the JWT dependency.
- Status: TARGET RESOLVED / CURRENT IMPLEMENTATION GAP

## G2 status

**READY FOR HUMAN APPROVAL.** These ADRs document the resolved G2 target and current implementation gaps. They do not approve Human Gate G2 automatically.
