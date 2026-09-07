# Architecture Decisions

- ADR-001: Use FastAPI plus React because these are the current project frameworks and already expose the required frontend/backend boundary.
- ADR-002: Use local Ollama rather than a cloud AI API because the project constraint is local execution without a third-party AI service or external API key.
- ADR-003: Keep `AIProvider` as a protocol so the service contract is isolated from the local provider implementation.
- ADR-004: Keep keyword retrieval over `DocumentChunk` for the current PoC. Embeddings and a vector database are not introduced without a stated requirement and evaluation evidence.
- ADR-005: Use SQLite for the local `.env` and MySQL for Docker deployment because both configurations already exist in the project.
- ADR-006: Keep AI operations read-only. Approval, status changes and confirmation of equipment failure remain human-controlled business operations.
