---
name: rag-prompt
description: Construct a grounded Vietnamese prompt for the local Ollama assistant using only supplied laboratory context.
---

# RAG Prompt Skill

## Objective

Make the local assistant answer from supplied laboratory context and state its limits when context is missing.

## Inputs

- user question
- selected AI mode
- bounded conversation history
- context and source names from `context-builder`
- local model configuration

## Process

1. Set the assistant role as a laboratory operations helper.
2. State that context is authoritative for specific operational facts.
3. Include the supplied context only when it is non-empty.
4. Require Vietnamese answers that are concise and safety-aware.
5. Prohibit approval, status mutation and confirmation of equipment failure.
6. Require a limitation statement when context does not support the answer.

## Rules

- Never fabricate a device, status, maintenance record or document source.
- Never claim that the model performed a database mutation.
- Never present an unsupported alert as a diagnosis.
- Keep the prompt compatible with Ollama; do not introduce a cloud provider.

## Output and verification

Return messages suitable for the existing `AIProvider.chat` contract. Verify with in-context, out-of-context and safety questions. The current runtime keeps this prompt in `AIService._system_prompt`; this skill does not claim a separate prompt-builder module exists.
