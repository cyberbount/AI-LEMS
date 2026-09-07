# Code Review

## Findings

- CR-001 HIGH: The dashboard previously displayed fixed counts and usage percentages that were not returned by the backend. Corrected by deriving visible counts from API data and showing an empty state when usage history is absent.
- CR-002 HIGH: The user dashboard previously appended a synthetic pending request after an API failure. Corrected so an offline failure is reported and no persisted action is claimed.
- CR-003 MEDIUM: The technician dashboard previously removed a maintenance item even when completion failed. Corrected so the item changes only after a successful API response.
- CR-004 MEDIUM: The project had two AI HTTP paths, while the frontend used the database-aware one. The duplicate direct `/api/chat` path was removed and `/api/ai/chat` is now the documented contract.
- CR-005 MEDIUM: Device and request status query values were accepted as arbitrary strings. Corrected with explicit allowed values at the schema/router boundary.
- CR-006 MEDIUM: The current single-file frontend is difficult to extend and several navigation labels are presentation-only. This is a maintainability gap, not a reason to invent new workflow screens.
- CR-007 LOW: `frontend/src/App.jsx` still contains a demo fallback and role shortcuts. They are acceptable for the local PoC only and must not be treated as production authentication.

## Review conclusion

The corrected code is closer to the stated local PoC scope, but the project still needs automated tests and human review of the incomplete workflows listed in `docs/implementation-notes.md`.
