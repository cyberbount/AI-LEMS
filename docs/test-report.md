# Test Report

## Scope

This report records tests that are actually present and executed in this repository. It does not claim coverage for features that have no automated test or are not implemented.

## Environment

### Hardware Configuration

- **CPU**: Intel Core i7-10850H
- **RAM**: 32 GB
- **Storage**: 1.4 TB SSD
- **GPU**: NVIDIA Quadro T2000 4 GB

### Software Configuration

- **OS**: Ubuntu 24.04.4 LTS on WSL2
- **Backend**: FastAPI, SQLAlchemy, Python virtual environment
- **Database**: SQLite
- **Test runner**: pytest
- **GPU usage**: The current automated backend test suite does not require GPU acceleration.
- **AI provider**: Ollama provider tests are not executed against a live Ollama instance in the current test run.

## Current test suite

| Area | Test file | Status |
|---|---|---|
| Authentication and `/me` | `tests/test_api.py` | Executed |
| RBAC device creation | `tests/test_api.py` | Executed |
| Borrow, approve, borrow and return lifecycle | `tests/test_api.py` | Executed |
| Reject unavailable device | `tests/test_api.py` | Executed |
| Maintenance completion and statistics | `tests/test_operations.py`, `tests/test_g3.py` | Executed |
| Keyword retrieval, bounded history and AI authentication | `tests/test_ai.py` | Executed |
| Password change and account authorization | `tests/test_g3.py` | Executed |
| Ollama provider failure through the live provider | Not yet automated | Pending |

## Execution record

Run from the repository root:

```text
PYTHONPATH=backend .venv/bin/python -m pytest -q tests/
```

The pass/fail count below must be updated from the command output after each run. No historical QA team, external test-management system or unverified pass rate is claimed here.

- Last execution: 2026-09-08, local development environment
- Command: `PYTHONPATH=backend .venv/bin/python -m pytest -q tests/`
- Tests run: 16
- Passed: 16
- Failed: 0
- Errors: 0
- Result: PASS

## Limitations

The suite does not prove complete requirements coverage. The traceability report continues to show gaps for untested workflows, live Ollama behavior, and document-management CRUD/upload.
