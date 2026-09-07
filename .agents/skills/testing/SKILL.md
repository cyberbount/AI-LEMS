---
name: testing
description: Use during G3 Implementation & Verification and G4 Integration & System Validation, or when asked to build/run the test suite for local-lab-ai from approved requirements and implementation, including unit, API integration, RBAC, borrow-lifecycle and AI tests with a mocked provider, plus requirement coverage analysis.
---

# Testing Skill

## Objective
Prove the implementation satisfies the approved requirements through automated tests, prioritizing business rules and failure paths, not only the happy path.

## Inputs
Read only approved artifacts and the real code:
- `docs/requirements.md`, `docs/acceptance-criteria.md`, `docs/api-design.md`
- implementation under `backend/app/`, existing tests (currently none — the suite will be created)

## Process
1. Derive test scenarios from acceptance criteria and the borrow lifecycle; assign test IDs (`TC-001`, ...).
2. Build the test pyramid:
   - Unit: `auth.py` (hash/verify, token create/decode/expiry), `ai_service._context` (keyword matching, modes), borrow state-machine transitions.
   - API integration: FastAPI `TestClient` with a temporary SQLite database — register/login, RBAC (401 without token, 403 wrong role per endpoint matrix), device create/status, borrow flow `pending → approved → borrowed → returned`, invalid transitions (409), borrowing an unavailable device (409), maintenance records/schedules, stats.
   - AI: every test uses a fake/stub `AIProvider` — deterministic answers, no Ollama, no network. Verify mode handling, empty-context refusal path, bounded history.
3. Include validation and error cases (Pydantic limits, duplicate username/email 409, wrong credentials 401).
4. Run the suite: `pytest` (add `pytest` + `httpx` test client to dev requirements). Record results verbatim — failures are findings, not noise.
5. Build the coverage matrix: FR → TC list; every important FR must have ≥1 test or a written reason why it cannot be automated (e.g. Ollama answer quality).

## Rules
- Never edit a test just to make it pass; fix the code or report a defect.
- No real Ollama/network calls inside the automated suite.
- Tests isolate data: temporary database per run, no writes to `lab.db`.
- Do not test unimplemented features; do not weaken acceptance criteria.
- Test dependencies require approval: any test that depends on external services (Ollama, AI providers) must be mocked and approved by the human gate before execution.
- **Why these rules prevent hallucination**: By refusing to modify tests to pass, we ensure tests reflect actual behavior, not desired behavior. By mocking external services, we prevent test flakiness and ensure deterministic results. By isolating test data, we prevent test interference and ensure reproducibility. By restricting tests to implemented features, we prevent false positives. By requiring approval for dependencies, we maintain test reliability.

## Outputs
Create or update:
- `tests/` (pytest suite)
- `docs/test-plan.md` (scenarios, TC→FR/AC matrix, environment)
- `docs/test-report.md` (execution results, failures, defect list)

## Verification
PASS if: full suite runs and passes (or every failure has a defect entry); coverage matrix complete; no test was modified to force a pass; AI tests are offline-deterministic.
FAIL if: any acceptance criterion has no test and no documented reason, or a failing test was hidden.

## Human Gate (G3/G4)
A human reviewer reads test-report.md, confirms the suite actually ran (output evidence) and accepts deferred/untestable items.
- G3 covers implementation and verification evidence; G4 covers integration and system validation. PASS → the next project phase may start only after the corresponding human review. FAIL → fix defects first.

Project gate sequence: G1 Requirements, G2 Architecture, G3 Implementation & Verification, G4 Integration & System Validation, G5 Documentation & Deployment.
