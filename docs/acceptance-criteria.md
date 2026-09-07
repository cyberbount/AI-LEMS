# Acceptance Criteria

| ID | FR/BR | Given | When | Then | Evidence/status |
|---|---|---|---|---|---|
| AC-001 | FR-001 | Valid credentials for an active actor exist | The actor signs in | Token is returned and `/api/auth/me` identifies the actor | `tests/test_api.py`; executed/passed |
| AC-002 | FR-002 | Actor lacks required technical permission | Actor calls a protected endpoint | API returns HTTP 403 | `tests/test_api.py`; executed/passed; business mapping not verified |
| AC-003 | FR-005 | Device is available | Lab User creates request | Pending request is created | `tests/test_api.py`; executed/passed |
| AC-004 | FR-005, BR-004, BR-006 | Device is not available | Lab User creates request | Request is rejected and not created | `tests/test_api.py`; executed/passed |
| AC-005 | FR-003 | Permitted Lab Manager is authenticated | Manager creates equipment record | Record is persisted and returned | `tests/test_api.py`; executed/passed |
| AC-006 | FR-004 | Catalog/group/location data exists | Authorized actor requests catalog | Available catalog data is returned | TEST NOT AVAILABLE |
| AC-007 | FR-006 | Request is pending | Authorized approval actor approves it | Request becomes approved and device reserved | `tests/test_api.py`; executed/passed |
| AC-008 | FR-006 | Request is pending | Authorized approval actor rejects it | Request becomes rejected without borrowed state | TEST NOT AVAILABLE |
| AC-009 | FR-007 | Request is approved | Device is recorded as received/borrowed | Lifecycle and usage state are recorded | Code exists; handover TEST NOT AVAILABLE |
| AC-010 | FR-007, BR-003 | Request is borrowed | Owner returns device | Request becomes returned and device available | `tests/test_api.py`; executed/passed |
| AC-011 | FR-008 | Authorized maintenance actor is authenticated | Actor creates record | Record identifies device and actor | `tests/test_operations.py`; executed/passed |
| AC-012 | FR-008 | Maintenance record is open | Authorized actor completes it | Record becomes completed with completion time | `tests/test_operations.py`; executed/passed |
| AC-013 | FR-009 | Usage data and approved metric definition exist | Lab Manager requests statistics | Database-derived counts are returned for supported time/frequency dimensions | Aggregate passed; time-range/frequency NOT IMPLEMENTED |
| AC-014 | FR-010 | Authenticated laboratory actor sends valid question | AI service processes request | Answer and metadata are returned | Fake-provider test passed; live Ollama TEST NOT AVAILABLE |
| AC-015 | FR-011, BR-012 | Matching document chunks exist | Actor asks retrieval question | Matching source names are returned | `tests/test_ai.py`; executed/passed |
| AC-016 | FR-012 | Official equipment/usage/maintenance evidence exists | Actor requests Summary | Summary is limited to that evidence | TEST NOT AVAILABLE |
| AC-017 | FR-013, BR-014 | Inspection evidence exists | Actor requests Inspection Alert | Advisory suggestion with evidence is returned without state mutation | TEST NOT AVAILABLE |
| AC-018 | FR-014 | Managed instructional-document data exists | Retrieval service uses it | Data can provide source context and identity | Tables/retrieval exist; management API NOT IMPLEMENTED |
| AC-019 | FR-015, BR-003 | Authenticated actor has valid current password | Actor submits new password | Only that account changes and new login works | Endpoint NOT FOUND; TEST NOT AVAILABLE |
| AC-020 | FR-016, BR-002 | Lab Manager is authenticated | Manager creates account and assigns role | Account/role persist and access is enforced | Endpoint NOT FOUND; TEST NOT AVAILABLE |

## Evidence rules

Code existence does not imply a passing test. Missing tests are `TEST NOT AVAILABLE`; absent behavior is `NOT IMPLEMENTED`; unexecuted behavior is `NOT VERIFIED`.
