# Requirements

## Scope

The system manages laboratory equipment for Electronics, IoT and Embedded Systems. It supports equipment operations and local AI assistance. Ollama is local; no cloud AI provider is required.

## Functional requirements

- FR-001: The system authenticates a user with a username and password.
- FR-002: The backend enforces role-based access for admin, user and technician accounts.
- FR-003: An authorized manager can create and view laboratory equipment records.
- FR-004: The system stores equipment groups and locations and can return their catalog data.
- FR-005: A lab user can create a borrow request only for an available device.
- FR-006: An authorized manager can approve or reject a pending borrow request.
- FR-007: The system supports the borrow, return and usage-history status transitions.
- FR-008: An authorized staff member can create and complete maintenance records and maintenance schedules.
- FR-009: An authenticated user can view counts and usage-history statistics available in the database.
- FR-010: A user can ask the local AI assistant a question and receive a response from Ollama.
- FR-011: The AI assistant can use matching managed document chunks as context and return their source names.
- FR-012: The AI assistant can summarize the device and open-maintenance counts available to the service.
- FR-013: The AI assistant can list open maintenance records for inspection-alert support.
- FR-014: The system stores managed documents and document chunks as the data source for retrieval; document CRUD API is not implemented yet.

## Non-functional requirements

- NFR-001: Passwords are stored as hashes, not plaintext.
- NFR-002: Business authorization is enforced by the backend; frontend role selection is not a security boundary.
- NFR-003: Database relations use primary keys, foreign keys and unique constraints where defined by the current schema.
- NFR-004: The system runs with SQLite for local development and MySQL in the Docker configuration.
- NFR-005: AI requests use bounded chat history and a configured request timeout.
- NFR-006: The AI must not approve requests, change device status or confirm equipment failure.
- NFR-007: When official context is unavailable, the AI must state the limitation instead of presenting an invented operational fact.
- NFR-008: The system must expose loading, error and offline states clearly in the frontend.

## Business rules

- BR-001: A device must be available before a new borrow request can be created.
- BR-002: A pending request must be approved or rejected before the next lifecycle step.
- BR-003: A returned device becomes available through the backend return operation.
- BR-004: AI output is advisory and does not replace a manager or technician decision.
- BR-005: Safety-related answers must direct the user to the applicable SOP and equipment manual.

## Constraints

- Backend: FastAPI, Python and SQLAlchemy.
- Frontend: React, Vite and the existing local UI components.
- AI runtime: Ollama local with the configured model, currently `qwen2.5:3b`.
- Retrieval: current implementation is keyword matching over `document_chunks`; embeddings and a vector database are not part of the current implementation.

## Current implementation status

FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-010, FR-011, FR-012 and FR-013 are implemented at API/service level with the limitations recorded in `docs/implementation-notes.md`. FR-014 has database tables but no document management router.

**Human Gate G1:** PENDING human confirmation of the scope and of the items marked as incomplete.
