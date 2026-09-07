---
name: manual-retrieval
description: Retrieve the most relevant document chunks (equipment manuals, SOPs, safety documents) from the document store for a given analyzed question, using keyword or embedding-based matching with a bounded top-k.
---

# Manual Retrieval Skill

## Objective
Given keywords and intent from the question-analysis stage, retrieve the top-k most relevant document chunks from the document store. This is the second stage of the RAG pipeline: `question -> analyze -> retrieve -> context -> prompt -> answer`.

## Inputs
- Intent classification and keyword set from `question-analysis`.
- Document store: `document_chunks` table (fields: `document_name`, `content`, `chunk_index`).
- Optional: embedding index if the deployment has one.

## Process
### 1. Select the retrieval source
- Intent `manual` -> search equipment manual chunks.
- Intent `safety` -> search SOP / safety chunks first, manuals second.
- Intent `status` -> skip document retrieval; the caller should query the operational database instead.
- Intent `general` -> return an empty result set.

### 2. Match chunks
Keyword mode (current implementation):
- Score each chunk by counting keyword occurrences in `content` (case-insensitive).
- Break ties by shorter, denser chunks (more keyword hits per 100 words).

Embedding mode (future):
- Compute the question embedding once.
- Use cosine similarity against chunk embeddings.
- Return the top-k by similarity score.

### 3. Apply top-k bound
- Return at most `k = 5` chunks (configurable via `RAG_TOP_K`).
- Enforce a minimum score threshold; discard chunks with zero keyword hits or similarity below 0.2.

### 4. Preserve provenance
- Keep `document_name` and `chunk_index` for every returned chunk; these become citations in the final answer.

## Rules
- Never return more than `RAG_TOP_K` chunks.
- Never return chunks with zero relevance score.
- Do not modify, summarize, or rewrite chunk content; pass text through verbatim.
- Do not fabricate document names.
- If no chunk matches, return an empty list; the prompt-builder stage must handle the empty case instead of inventing content.

## Outputs
A list of retrieved chunks:
```json
[
  {"document_name": "Oscilloscope Manual", "chunk_index": 0, "content": "Kết nối probe đúng cực...", "score": 0.83}
]
```

## Verification
Before completing, verify:
- every returned chunk has a real `document_name` and `chunk_index`;
- top-k bound is respected;
- safety intent queries never return an empty result when SOP chunks exist;
- empty result is a valid, handled outcome.
