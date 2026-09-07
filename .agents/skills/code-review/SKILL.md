---
name: code-review
description: Review the existing local-lab-ai implementation without changing source code, using requirements, architecture, tests and security evidence.
---

# Code Review Skill

## Objective

Find correctness, scope, security, maintainability and test-evidence problems in the current system. Review facts from the repository; do not assume a feature exists because a document mentions it.

## Inputs

- `docs/requirements.md`
- `docs/architecture.md`
- `docs/api-design.md`
- `docs/implementation-notes.md`
- `docs/test-plan.md`
- source code under `backend/` and `frontend/`

## Process

1. Check correctness against functional requirements and acceptance criteria.
2. Check API authorization and validation at the backend boundary.
3. Check data-flow and architecture compliance.
4. Check maintainability, error handling, offline behavior and misleading UI states.
5. Check duplication, dead controls and unimplemented claims.
6. Check performance-sensitive paths without inventing performance results.
7. Check test evidence; mark untested behavior as unverified.
8. Classify findings as CRITICAL, HIGH, MEDIUM or LOW with file references.

## Rules

- Do not change source code during review.
- Do not report a missing feature as a defect if it is explicitly outside scope.
- Do not treat frontend role state as authorization evidence.
- Do not call fallback data persisted data.

## Output and verification

Create or update `docs/code-review.md`. Every finding must include evidence, impact and status. A review passes only when all high findings are either fixed or accepted by a human.

Review dimensions: Correctness, Requirements Compliance, Architecture Compliance, Maintainability/Code Quality, Security, Performance and Testing.

## Project gates

Use the project gate sequence only: G1 Requirements, G2 Architecture, G3 Implementation & Verification, G4 Integration & System Validation, G5 Documentation & Deployment. Code review does not create a new gate.
