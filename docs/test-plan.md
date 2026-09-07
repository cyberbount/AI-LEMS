# Test Plan

The following cases are derived from the current requirements. `Not run` means there is no automated evidence in the repository yet; it is not a claim that the behavior is correct.

- TC-001: Valid and invalid login; verify token and `/api/auth/me`. Status: Not run.
- TC-002: User calls a manager-only endpoint; verify HTTP 403. Status: Not run.
- TC-003: Create a request for an available device; verify pending state. Status: Not run.
- TC-004: Create a request for a non-available device; verify rejection. Status: Not run.
- TC-005: Approve and reject pending requests; verify lifecycle and device state. Status: Not run.
- TC-006: Borrow and return a request; verify usage history and available device state. Status: Not run.
- TC-007: Complete a maintenance record with an authorized role. Status: Not run.
- TC-008: Read statistics and usage action counts. Status: Not run.
- TC-009: Call AI chat with Ollama unavailable and verify a controlled error. Status: Not run.
- TC-010: Call AI retrieval with matching and non-matching document chunks. Status: Not run.

## Traceability

- FR-001 → TC-001
- FR-002 → TC-002
- FR-005 → TC-003
- FR-005 → TC-004
- FR-006 → TC-005
- FR-007 → TC-006
- FR-008 → TC-007
- FR-009 → TC-008
- FR-010 → TC-009
- FR-011 → TC-010

## Test evidence status

The repository currently has no `tests/` suite and no recorded execution report. The next testing task must create automated tests from these cases and must not change assertions only to make a failure pass.
