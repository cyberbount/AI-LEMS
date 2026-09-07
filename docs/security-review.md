# Security Review

Review scope: the current FastAPI backend, React frontend, local database configuration and Ollama integration.

- SEC-001: Password storage uses `passlib` hashing and login compares hashes. Status: Observed positive control. TC-001 → SEC-001.
- SEC-002: Backend routes use `current_user` or `require_roles`; frontend localStorage role is not treated as authorization. Status: Partial evidence; TC-002 → SEC-002.
- SEC-003: Pydantic request validation and explicit device/request status literals reduce invalid input values. Status: Implemented for current status fields. TC-003 → SEC-003.
- SEC-004: SQLAlchemy query APIs are used for database access; no string-built SQL was found in the reviewed routers. Status: Observed positive control. TC-004 → SEC-004.
- SEC-005: AI receives bounded history and a safety prompt, but keyword retrieval does not provide semantic relevance guarantees. Status: Limitation. TC-010 → SEC-005.
- SEC-006: The local `.env` contains a development JWT secret and Docker compose contains development credentials. Status: Development-only risk; secrets must be replaced before deployment. TC-001 → SEC-006.
- SEC-007: The frontend has an offline fallback. It must not represent fallback state as persisted business data. Status: Corrected in the current frontend change. TC-009 → SEC-007.

## Not verified by automated evidence

CSRF behavior, dependency vulnerability scanning, browser XSS testing, secret rotation and backup recovery have no automated evidence in the repository yet. They remain review items rather than completed controls.

**Human Gate G7:** PENDING human review before deployment outside the local/demo environment.
