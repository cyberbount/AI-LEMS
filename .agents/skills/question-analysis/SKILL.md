---
name: question-analysis
description: Analyze a user's natural-language question about lab equipment and classify its intent so the RAG pipeline can decide which data source to retrieve from (equipment manual, safety SOP, or operational status).
---

# Question Analysis Skill

## Objective
Analyze an incoming user question and classify its intent into one of the supported RAG retrieval targets. This is the first stage of the RAG pipeline: `question -> analyze -> retrieve -> context -> prompt -> answer`.

## Inputs
- The raw user `question` (Vietnamese or English).
- The list of available document sources (e.g. `Lab SOP`, `Oscilloscope Manual`, equipment manuals).

## Process
### 1. Normalize the question
- Lowercase and trim whitespace.
- Strip punctuation and stop words that carry no retrieval meaning.
- Keep technical terms, equipment names, model numbers, and safety keywords.

### 2. Classify intent
Assign exactly one intent label:

| Intent | Trigger examples | Retrieval target |
|--------|------------------|------------------|
| `manual` | "cách dùng", "hướng dẫn sử dụng", "vận hành", "cài đặt", "đo lường" | Equipment manual chunks |
| `safety` | "an toàn", "SOP", "quy định", "nguy hiểm", "bảo hộ", "ngắt nguồn" | Safety / SOP chunks |
| `status` | "tình trạng", "còn mượn không", "đang bảo trì", "hỏng", "sẵn sàng" | Operational database (Device / Maintenance) |
| `general` | greeting, chit-chat, out-of-scope | No retrieval; answer from system prompt only |

### 3. Extract retrieval keywords
- Extract equipment names, model numbers, and category terms.
- Extract safety keywords when intent is `safety`.
- Keep a small set (3-8) of the most discriminative terms for the retrieval stage.

### 4. Detect out-of-scope questions
- If the question asks about topics unrelated to lab equipment, safety, or operations, mark it `general` and do not force retrieval.

## Rules
- Do not answer the question in this stage; only classify and extract keywords.
- Do not invent intent labels beyond the four defined above.
- When ambiguous, prefer `manual` over `status`; safety keywords always win over other intents.
- Do not access the database or the LLM in this stage.

## Outputs
Return a structured result:
```json
{
  "intent": "manual",
  "keywords": ["oscilloscope", "probe", "thang đo"],
  "equipment": ["Oscilloscope TBS1102B"],
  "out_of_scope": false
}
```

## Verification
Before completing, verify:
- exactly one intent label is assigned;
- keywords are discriminative (not generic stop words);
- safety-related questions are never classified as `general`;
- out-of-scope detection is explicit.
