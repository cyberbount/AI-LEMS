---
name: requirements-analysis
description: Use when starting the requirements analysis phase for local-lab-ai project, or when asked to analyze and structure lab equipment management requirements with traceability IDs, separating FR/NFR/BR/constraints/assumptions/ambiguities/user stories/acceptance criteria from de_tai 23.
---

# Requirements Analysis Skill

## Objective
Transform the problem statement (de_tai 23: lab equipment management with AI) into a structured, testable requirements specification that all later SDLC phases trace back to.

## Inputs
Read when available:
- problem statement: `docs/customer-requirement.md` (preferred; create it from `../de_tai_23 (1).txt` in the assignment folder if missing)
- existing analysis: report chapter 2 (survey & requirements)
- project constraints (stack, deployment, AI provider)

## Process
1. Identify stakeholders (lab, faculty, students) and actors:
   - Lab User (student/lecturer), Lab Manager (role `admin`), Maintenance Technician (role `technician`), AI Assistant (system capability, not a human actor).
2. Identify functional requirements. Use IDs `FR-001`, `FR-002`, ... Cover at minimum: login + role-based access; device/group/location management; borrow request lifecycle (create → approve → borrow → return) with request status tracked separately from device status; usage history; maintenance schedules and records; usage statistics; document management; AI chat with RAG from manuals; AI status summary; AI maintenance alert.
3. Identify non-functional requirements (`NFR-001`, ...): performance, security, reliability, usability, maintainability, scalability — each one measurable where possible.
4. Record business rules explicitly stated (`BR-001`, ...). Do not invent business rules.
5. Record constraints (FastAPI, React, SQLite/MySQL, local Ollama LLM) separately from requirements.
6. Record assumptions (`AS-001`, ...) and ambiguities (`AMB-001`, ...): ambiguous, incomplete, contradictory or untestable items. Known candidates: approval SLA, reservation expiry, concurrent-borrow conflicts, document upload flow, deletion rules.
7. Create user stories (`US-001`, ...): "As a <role>, I want <capability>, so that <benefit>."
8. Create acceptance criteria (`AC-...`) in Given/When/Then form for every important user story. Each criterion must be executable as a test.

## Rules
- Do not write source code, database design or architecture.
- Do not invent undocumented business rules or features (no procurement, no payment, no AI auto-approval — these are out of scope).
- Never promote an assumption into a confirmed requirement.
- Mark every ambiguous requirement instead of silently resolving it.
- AI functions are decision-support only: AI never approves, changes device status, or confirms breakage.
- Prevent stale findings: Review and update requirements-issues.md regularly to resolve ambiguities and assumptions. Any finding older than 2 weeks must be flagged as stale and either resolved or escalated.
- **Why these rules prevent hallucination**: By restricting this skill to requirements analysis only, we prevent premature design decisions. By prohibiting invented features, we maintain scope integrity. By treating assumptions as temporary, we prevent premature commitment to unverified requirements. By marking ambiguities, we ensure they're addressed rather than ignored. By preventing AI from making business decisions, we maintain human oversight. By managing stale findings, we ensure requirements evolve and don't become outdated.

## Outputs
Create or update:
- `docs/requirements.md` (FR/NFR/BR/constraints, all with IDs)
- `docs/user-stories.md` (US → FR traceability table)
- `docs/acceptance-criteria.md` (AC per US, Given/When/Then)
- `docs/requirements-issues.md` (assumptions, ambiguities, open questions)

## Verification
PASS if: every FR/NFR has an ID; every US traces to ≥1 FR; every AC is testable; assumptions and ambiguities are explicitly documented; no out-of-scope feature appears.
FAIL if: any ID is missing, any AC is untestable, any invented requirement appears, or inputs were ignored.

## Human Gate (G1)
A human reviewer must confirm: (1) the FR list matches the de_tai 23 scope exactly, (2) all ambiguities are acceptable to defer, (3) requirements-issues.md has no unanswered blocking question.
- PASS → status APPROVED in `docs/requirements.md`, architecture-design may start.
- FAIL → do not start the next phase; state which items must be fixed.
