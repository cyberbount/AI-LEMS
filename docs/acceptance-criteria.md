# Acceptance Criteria

- AC-001: Given valid seeded credentials, when the user signs in, then the API returns a JWT and `/api/auth/me` returns the authenticated user.
- AC-002: Given a user without manager role, when the user calls a manager-only endpoint, then the API returns HTTP 403.
- AC-003: Given an available device, when an authenticated user creates a borrow request, then the API creates a pending request.
- AC-004: Given a non-available device, when a user creates a borrow request, then the API rejects the request with a conflict response.
- AC-005: Given a pending request, when a manager approves it, then the request becomes approved and the device becomes reserved.
- AC-006: Given a borrowed request, when the owner returns it, then the request becomes returned and the device becomes available.
- AC-007: Given an open maintenance record, when an authorized technician completes it successfully, then the record becomes completed.
- AC-008: Given recorded usage history, when an authenticated user requests statistics, then the response contains counts derived from the database.
- AC-009: Given Ollama is available, when a user sends an AI chat request, then the response contains the answer, provider, model and mode.
- AC-010: Given matching document chunks, when a user asks a retrieval question, then the response includes matching source names.
- AC-011: Given no matching official context, when a user asks for a specific operational fact, then the AI prompt contains no fabricated database fact and the response can state the limitation.
- AC-012: Given the API is unavailable, when the user views the frontend, then the UI labels the data as fallback data and does not report a new business action as persisted.
