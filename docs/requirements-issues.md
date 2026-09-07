# Requirements Issues

| ID | Type | Issue | Current treatment |
|---|---|---|---|
| AMB-001 | Ambiguity | The assignment describes full document management, but the current code only has document tables and retrieval. | Keep FR-014 marked incomplete until the document upload/list/delete workflow is specified. |
| AMB-002 | Ambiguity | The exact receive/hand-over actor and UI workflow are not specified separately from status transitions. | The current API exposes status transition endpoints; a separate hand-over screen is not claimed. |
| AMB-003 | Ambiguity | The assignment mentions history and usage frequency but does not define date-range filters. | Current statistics are aggregate counts only. |
| AMB-004 | Ambiguity | The AI alert threshold is not defined. | Current inspection alert reports open maintenance records; it does not invent a predictive threshold. |
| AS-001 | Assumption | `admin` is the manager role used by the seeded local database; `technician` and `user` are the other seeded roles. | Verify at Human Gate G1. |
| AS-002 | Assumption | SQLite is for local development and MySQL is the Docker database. | This follows the current `.env` and `docker-compose.yml`. |

No unresolved issue is to be silently converted into a new feature or business rule.
