# Code Review

## Scope and evidence

Static review of `backend/app`, `frontend/src`, existing tests, locked requirements/architecture artifacts and current integration evidence. No source code was modified and no destructive testing was performed.

## Findings

### HIGH

#### CR-001 — Default JWT secret is usable when configuration is omitted

- Location: `backend/app/config.py:8`; also `docker-compose.yml`.
- Original finding: `jwt_secret_key` used a known placeholder when configuration was omitted.
- Remediation implemented: local configuration now generates an ephemeral secret when unset; Docker requires `JWT_SECRET_KEY` from the environment.
- Current verification: targeted configuration check confirmed a non-placeholder ephemeral value; full pytest suite passed.
- Impact: deployments that do not override the setting use a publicly guessable signing key, weakening token integrity.
- References: NFR-001, security architecture.
- Recommendation: require a deployment-provided secret outside development and fail closed when the placeholder remains.
- Current disposition: MITIGATED; persistent/deployment secret management remains NOT VERIFIED.

#### CR-002 — Account-management endpoint permits creation of privileged roles by an already authorized manager/admin

- Location: `backend/app/routers/users.py:15-29`.
- Original finding: manager could assign privileged roles.
- Remediation implemented: admin may assign all approved roles; manager may assign only `user` and `technician`.
- Evidence: `tests/test_g3.py::G3ApiTests::test_account_role_assignment_matrix` and full suite.
- Impact: a compromised or over-broad manager account can grant administrative or manager privileges.
- References: FR-016, AC-020, RBAC architecture and privilege-escalation requirement.
- Recommendation: define and enforce the approved privilege-assignment boundary, including whether a Lab Manager may create/assign `admin` or `manager` roles.
- Current disposition: MITIGATED + REGRESSION TESTED; complete endpoint/role matrix beyond this policy test remains limited.

### MEDIUM

#### CR-003 — AI provider exception details are returned to clients

- Location: `backend/app/routers/ai.py:15-18`.
- Original finding: the response detail included `str(exc)`.
- Remediation implemented: API returns `AI provider is unavailable`; raw exception is logged server-side.
- Evidence: targeted failing-provider check and full pytest suite.
- Impact: provider URLs, connection details or internal exception text may be disclosed to authenticated users.
- References: NFR security/error-boundary expectations.
- Recommendation: return a generic client error and log a correlation-safe server-side diagnostic.
- Current disposition: MITIGATED + TARGETED TESTED; logging/privacy in deployed environments remains NOT VERIFIED.

#### CR-004 — Fallback data can look like real equipment data when API calls fail

- Location: `frontend/src/lib/api.js:3-12`; `frontend/src/App.jsx:506-513`.
- Evidence: `fallbackData.devices` contains named equipment and is used as the initial state; failed requests leave fallback values in the view.
- Impact: users may mistake sample data for persisted lab data during an outage.
- References: frontend/backend integration and correctness expectations.
- Recommendation: render an explicit unavailable state instead of domain-looking fallback records, or label fallback data unmistakably.
- Status: FINDING; not fixed in this review.

### LOW

#### CR-005 — Duplicate backend package tree increases maintenance ambiguity

- Location: `backend/app/backend_app/` duplicates the active `backend/app/` package tree.
- Evidence: the active startup imports `app.main` from `backend/app`, while a second parallel package contains alternate routers/services.
- Impact: future edits may target the inactive tree and create inconsistent behavior.
- References: architecture modular-monolith boundary.
- Recommendation: document or remove the inactive tree in a separately approved cleanup task.
- Status: FINDING; no deletion performed.

## Review dimensions

| Dimension | Result |
|---|---|
| Correctness | PARTIAL: covered workflows pass existing tests; findings CR-002 and CR-004 remain. |
| Requirements compliance | PARTIAL: main G3/G4 behavior is present, but FR-016 privilege boundary needs clarification. |
| Architecture compliance | PARTIAL: active path matches modular FastAPI/React design; duplicate package tree is a maintainability concern. |
| Maintainability/code quality | PARTIAL: duplicate tree and compact one-line router statements reduce clarity. |
| Security | CR-001 through CR-003 mitigated in code; see `docs/security-review.md` for residual limits. |
| Performance | NOT VERIFIED: no load or performance test was executed. |
| Testing | PASS for the executed 19-test suite; full requirements/UI/live-provider coverage is not established. |

## Verified areas

- SQLAlchemy is used for application queries; no raw SQL construction was found in the active backend routers/services.
- React rendering uses normal JSX; no `dangerouslySetInnerHTML` was found.
- Existing automated suite: 20 passed, 20 warnings.
- G4 defect DEF-G4-001 was addressed, but no browser/E2E test exists.

## Review disposition

Human review is required for all findings. This document does not authorize fixes or approve a project gate.
