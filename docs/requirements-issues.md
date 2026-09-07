# Requirements Issues and Human Decisions

| ID | Type | Issue | Treatment | Status |
|---|---|---|---|---|
| RI-001 | Source availability | `Hướng dẫn quản lý dự án.txt` was not found. | Do not silently substitute another file. | HUMAN DECISION REQUIRED |
| RI-002 | Role ambiguity | Technical `admin` exists while the business actor is Lab Manager. | Keep `admin` technical; do not make it a business actor. | HUMAN DECISION REQUIRED |
| RI-003 | Scope gap | Password change is in the authoritative report but not implemented. | Keep FR-015 in scope with `Not implemented`. | OPEN |
| RI-004 | Scope gap | Lab Manager account/role management is in the report but not implemented. | Keep FR-016 in scope with `Not implemented`. | OPEN |
| RI-005 | Requirement ambiguity | FR-009 includes time range/frequency, but exact metrics are undefined. | Keep a single FR-009; do not create FR-017. | HUMAN DECISION REQUIRED |
| RI-006 | Operation boundary | Document Management is in scope, but exact operations are unspecified. | Keep business requirement; do not claim upload/full CRUD. | HUMAN DECISION REQUIRED |
| RI-007 | Implementation gap | Document tables/chunks exist without management endpoints. | Mark Partial/Not implemented. | OPEN |
| RI-008 | AI implementation | Retrieval is keyword-based and pipeline steps are internal to `AIService`. | Do not claim semantic RAG or separate runtime modules. | DOCUMENTED |
| RI-009 | AI safety | Summary/Alert must not mutate state or replace human decisions. | Keep as BR-011/BR-014; tests remain pending. | OPEN |
| RI-010 | Source conflict | `docs/customer-requirement.md` has different IDs and unconfirmed items. | Retain as non-authoritative input only. | DOCUMENTED |
| RI-011 | Unsupported targets | Numeric performance targets lack authoritative support. | Exclude from baseline. | DOCUMENTED |
| RI-012 | Traceability gap | Several FRs lack executed tests. | Record `TEST NOT AVAILABLE`; do not claim coverage. | OPEN |
| RI-013 | Evidence classification | Code, test existence, execution and pass status must be distinct. | Use explicit evidence vocabulary in requirements/traceability. | DOCUMENTED |
| RI-014 | Sign-off evidence | Customer artifact has blank signatures. | Do not treat it as approved evidence. | HUMAN DECISION REQUIRED |

No unresolved issue is silently converted into a feature or rule.

## Human Gate G1

Status: **PENDING**. Confirmation is required for role mapping, FR-009 metrics, document operation boundary, source-file availability and final baseline acceptance.
