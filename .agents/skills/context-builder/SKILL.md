---
name: context-builder
description: Build bounded, traceable context for the local laboratory AI from approved database and document data.
---

# Context Builder Skill

## Objective

Prepare context for Ollama without inventing facts, exposing unrelated records or bypassing backend authorization.

## Inputs

- authenticated request and allowed role
- question and selected mode
- matching `DocumentChunk` records
- explicitly allowed device, maintenance or statistics data

## Process

1. Identify the requested mode: chat, rag, summary or inspection alert.
2. Retrieve only data available through the backend service for that mode.
3. Bound history and context size according to configuration.
4. Preserve source document names for retrieved chunks.
5. Return an empty context when there is no evidence.
6. Mark whether the result is grounded.

## Rules

- Do not query data directly from the frontend.
- Do not add facts, statuses, users or documents that are not in the database context.
- Do not treat keyword matching as semantic relevance.
- Do not allow context building to mutate business state.

## Output and verification

Return `context`, `sources` and `grounded` to the AI service. Verify that every source is from a retrieved document or an explicitly named database summary. This skill describes the required behavior; the current runtime implements it inside `AIService._context`, not as a separate module.

## Role-scoped context rules (added 2026-09-27, BR-015)

Context building is role-aware end to end:

- **Persona**: the system prompt carries a role scope section (admin/manager → operational data; technician → repair and incident SOPs; user → usage manuals and borrow rules only). Role comes from the authenticated user.
- **Mode gating**: `summary` is limited to admin/manager, `inspection_alert` to admin/manager/technician; disallowed modes are rejected with 403 at the router and fail closed inside `AIService`.
- **Inventory context**: when the user asks to enumerate devices, the context is built from `database:devices` scoped to the role (admin/manager → all; technician → technical statuses; user → available only), capped at 30 rows.
- **Output policy**: responses may carry a `safety_note` for safety-related topics; sensitive columns (password hashes, emails of other users) are never serialized into context.

Runtime: `AIService._context`, `_inventory_context`, `_system_prompt(user_role)`. Verified by `tests/test_ai_roles.py`.
