# Customer Requirements Input Artifact

## Authority status

This file is retained as a non-authoritative source/input artifact. It is not the current SDLC baseline and must not be merged automatically into `docs/requirements.md`.

The authoritative business source is `BaoCao_UDTTNT.docx`. The candidate SDLC baseline is `docs/requirements.md`. The current domain is laboratory equipment management, not an electronic-store example.

IDs in this file are source-local and must not be treated as identical to IDs in the SDLC baseline without mapping.

## Reconciliation notes

- Business actors: Lab User, Lab Manager, Maintenance Technician and AI Assistant.
- `admin` is a technical RBAC role with unresolved mapping to Lab Manager.
- Password change and Lab Manager account/role management are in scope from the authoritative report.
- Usage statistics by time range and frequency are in scope; exact metric definitions remain unresolved.
- Document Management is in scope; this file does not prove upload or full CRUD implementation.
- Frameworks, databases, Ollama, model names and retrieval strategy are implementation context, not business requirements.
- Numeric performance targets in this file are not baseline requirements without authoritative confirmation.

## Unconfirmed input items

Password reset, export/import reporting, specific search behavior, numeric performance targets, backup/recovery and any feature not directly supported by `BaoCao_UDTTNT.docx` remain unconfirmed.

## Sign-off status

The original sign-off fields are blank. This file is not evidence of stakeholder approval. Human Gate G1 remains **PENDING**.
