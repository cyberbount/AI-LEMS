# -*- coding: utf-8 -*-
"""Module sinh PHẦN XV đến PHẦN XXII: Implementation Skill, Lập trình Core, Testing Skill, Kiểm thử Core, Code Review, Security Review."""

def get_core_review_markdown():
    return r"""## PHẦN XV. IMPLEMENTATION SKILL
### Bước 12. Tạo Implementation Skill
Tạo file `.agents/skills/implementation/SKILL.md`:
```yaml
---
name: implementation
description: Implement robust, clean, and tested backend APIs and frontend components following approved designs.
---
# Implementation Skill
## Objective
Implement production-ready, clean, maintainable, and secure source code for FastAPI and React Vite.
## Inputs
- docs/requirements.md
- docs/architecture.md
- docs/database-design.md
- database/schema.sql
## Process
1. Implement SQLAlchemy ORM models matching database/schema.sql.
2. Implement Pydantic request/response schemas with strict field validations.
3. Build FastAPI routers with explicit RBAC dependencies (`require_roles`).
4. Implement frontend React views, state hooks, and error-handling flows.
5. Apply Clean Code and SOLID principles across all modules.
## Rules
- Fail-closed: unauthorized requests must return HTTP 401 or 403.
- Never write business logic directly in database drivers; use services and routers.
- Strictly adhere to BR-011: AI runtime has no database write access.
## Outputs
- backend/app/*
- frontend/src/*
## Verification
- Code passes linter, type-check, and automated test execution.
```

---

## PHẦN XVI. BẮT ĐẦU LẬP TRÌNH (CORE FR-001..FR-011)
### Bước 13. Lập trình phần Core của Hệ thống

### PROMPT 04 - implementation skill (Core FR-01..FR-11)
```text
Hãy sử dụng implementation skill.
Triển khai toàn bộ phần Core của hệ thống AI-LEMS:
1. Authentication & RBAC (FR-001, FR-002): Đăng nhập JWT, băm mật khẩu Bcrypt, phân quyền 4 vai trò.
2. Thiết bị phòng lab (FR-003): CRUD thiết bị, quản lý mã tài sản, phân loại, trạng thái.
3. Mượn - Trả thiết bị (FR-004, FR-005, FR-006): Tạo phiếu, Manager duyệt phiếu, bàn giao.
4. Bảo trì & Sự cố (FR-007, FR-008): Lập lịch kiểm định, ghi nhật ký sửa chữa.
5. Tài liệu SOP & Thống kê (FR-009, FR-010, FR-011): Quản lý tài liệu, Dashboard thống kê, Audit logs.
Chưa gọi mô hình AI ở bước này. Đảm bảo Core chạy ổn định 100%.
```

#### Kiến trúc Mã nguồn Backend Core (`backend/app/`):
- `models.py`: Định nghĩa 12 mô hình ORM: `User`, `Role`, `Device`, `DeviceGroup`, `Location`, `BorrowRequest`, `UsageHistory`, `MaintenanceSchedule`, `MaintenanceRecord`, `Document`, `DocumentChunk`, `AuditLog`.
- `schemas.py`: Định nghĩa Pydantic models xác thực dữ liệu đầu vào (Input validation).
- `routers/auth.py`: Xác thực tài khoản, băm mật khẩu Bcrypt, sinh token JWT.
- `routers/devices.py`: Quản lý danh mục thiết bị phòng lab.
- `routers/requests.py`: Quản lý chu trình mượn - trả và phê duyệt của Manager.
- `routers/maintenance.py`: Quản lý phiếu sửa chữa và lịch kiểm định định kỳ.
- `routers/stats.py`: Cung cấp số liệu thống kê tổng quan và theo khoảng ngày.
- `routers/documents.py`: Quản lý tài liệu SOP và phân quyền tài liệu theo vai trò (`allowed_roles`).

---

## PHẦN XVII. TESTING SKILL
### Bước 14. Tạo Testing Skill
Tạo file `.agents/skills/testing/SKILL.md`:
```yaml
---
name: testing
description: Design, implement, and execute automated unit, integration, and security test suites using pytest.
---
# Testing Skill
## Objective
Validate that the software functions strictly according to specifications and business rules without regressions.
## Inputs
- docs/requirements.md
- docs/tables/use-case-specifications.md
- backend/app/*
## Process
1. Formulate test scenarios covering happy paths, edge cases, and unauthorized attempts.
2. Build hermetic fixtures using an in-memory SQLite database.
3. Write unit tests for services and integration tests for FastAPI routers.
4. Execute tests via pytest and assert HTTP status codes and database mutations.
5. Record evidence and coverage in docs/test-report.md.
## Rules
- Mock third-party dependencies (e.g., local Ollama service) in unit tests.
- Verify negative cases: unauthorized access must fail with 401/403.
## Outputs
- tests/test_*.py
- docs/test-report.md
## Verification
- 100% test pass rate with zero flaky tests.
```

---

## PHẦN XVIII. KIỂM THỬ CORE
### Bước 15. Kiểm thử phần đã triển khai

### PROMPT 05 - testing + table-design skill (Core)
```text
Hãy sử dụng testing skill và table-design skill.
Xây dựng và thực thi bộ kiểm thử tự động cho toàn bộ Core FR-001..FR-011 tại tests/.
Xuất kết quả chi tiết ra docs/test-report.md.
```

#### Kết quả Thực thi Kiểm thử Tự động:
Lệnh thực thi trong môi trường ảo:
```bash
PYTHONPATH=backend pytest tests/test_api.py tests/test_operations.py -v
```

**Bảng tổng hợp kết quả kiểm thử Core (38 Test Cases):**
| Nhóm kiểm thử | Số lượng Test Cases | Số lượng PASS | Số lượng FAIL | Tỷ lệ Đạt |
|---|:---:|:---:|:---:|:---:|
| **Xác thực & Quản lý Tài khoản (Auth & Users)** | 8 | 8 | 0 | **100%** |
| **Quản lý Danh mục Thiết bị (Devices CRUD)** | 6 | 6 | 0 | **100%** |
| **Quy trình Mượn - Trả Thiết bị (Borrow Requests)** | 8 | 8 | 0 | **100%** |
| **Bảo trì & Báo cáo Sự cố (Maintenance Records)** | 6 | 6 | 0 | **100%** |
| **Tài liệu SOP & Phân quyền Tri thức (Documents)** | 4 | 4 | 0 | **100%** |
| **Dashboard Thống kê & Audit Logs (Stats & Logs)** | 6 | 6 | 0 | **100%** |
| **TỔNG CỘNG** | **38** | **38** | **0** | **100% (9.32 giây)** |

---

## PHẦN XIX. CODE REVIEW SKILL
### Bước 16. Tạo Code Review Skill
Tạo file `.agents/skills/code-review/SKILL.md`:
```yaml
---
name: code-review
description: Perform static code analysis, identify code smells, architectural gaps, and maintainability issues.
---
# Code Review Skill
## Objective
Evaluate implementation quality against maintainability, correctness, security, and performance standards.
## Inputs
- backend/app/*
- frontend/src/*
## Process
1. Inspect code organization, naming conventions, and modularity.
2. Verify comprehensive error handling, logging, and database transaction rollbacks.
3. Check for boundary conditions, buffer overflows, and character length bounds.
4. Record findings and verified fixes in docs/code-review.md.
## Outputs
- docs/code-review.md
```

---

## PHẦN XX. REVIEW CODE
### Bước 17. Thực hiện Review Code

### PROMPT 06 - code-review skill (Review implementation hiện tại)
```text
Hãy sử dụng code-review skill rà soát toàn bộ backend/app/ và frontend/src/.
Ghi nhận các phát hiện (Code Smells / Gaps) vào docs/code-review.md.
```

#### Các phát hiện quan trọng và Biện pháp khắc phục đã triển khai:
1. **DEF-G4-001 (Lỗi Đồng bộ Trạng thái Thiết bị sau Bảo trì):**
   - *Phát hiện:* Sau khi Kỹ thuật viên hoàn tất phiếu sửa chữa trên Frontend, danh sách thiết bị trên màn hình không tự tải lại trạng thái mới mà vẫn hiển thị `maintenance`.
   - *Khắc phục:* Bổ sung lời gọi hàm `fetchDevices()` ngay sau khi API PATCH trả về mã 200 tại `frontend/src/App.jsx`.
2. **CR-002 (Thiếu Transaction Rollback khi Lưu Phiếu Mượn):**
   - *Phát hiện:* Nếu quá trình ghi `usage_history` gặp lỗi sau khi đã cập nhật `borrow_requests`, dữ liệu có nguy cơ bị phân mảnh.
   - *Khắc phục:* Bọc toàn bộ các thao tác ghi dữ liệu mượn trả trong một Session Transaction duy nhất với `db.commit()` và `db.rollback()` trong khối `try...except`.
3. **CR-003 (Giới hạn Kích thước Dữ liệu Đầu vào Pydantic):**
   - *Phát hiện:* Tin nhắn gửi tới Trợ lý AI chưa có giới hạn độ dài chặt chẽ, tiềm ẩn nguy cơ DoS bộ nhớ.
   - *Khắc phục:* Ràng buộc Pydantic `Field(max_length=12000)` cho mọi trường tin nhắn.

---

## PHẦN XXI. SECURITY SKILL
### Bước 18. Tạo Security Skill
Tạo file `.agents/skills/security-review/SKILL.md`:
```yaml
---
name: security-review
description: Audit system security against OWASP Top 10, CWE, secret leaks, and AI prompt injection vulnerabilities.
---
# Security Review Skill
## Objective
Identify security weaknesses across authentication, authorization, data handling, and AI interaction pipelines.
## Inputs
- Full codebase, configuration files, and deployment scripts.
## Process
1. Audit authentication: password hashing, JWT secrets, session lifespans.
2. Audit authorization: RBAC enforcement, privilege escalation vectors.
3. Audit data protection: plaintext credentials, SQL injection, XSS, CSRF.
4. Audit AI prompt security: trust boundaries, delimiter encapsulation, instruction override.
5. Run secret detection tools (detect-secrets).
## Outputs
- docs/security-review.md
```

---

## PHẦN XXII. SECURITY REVIEW
### Bước 19. Thực hiện Security Review

### PROMPT 07 - security-review skill (Security Review)
```text
Hãy sử dụng security-review skill rà soát toàn diện hệ thống và lập docs/security-review.md.
Kiểm tra: JWT Secret, phân quyền vai trò, rò rỉ ngoại lệ, mật khẩu cơ sở dữ liệu, rò rỉ mật khẩu thô.
```

#### Bảng Tổng hợp 6 Lỗ hổng Trọng yếu Phát hiện & Đã khắc phục (SEC-001 đến SEC-006):
| Mã số | Mức độ | Vị trí phát hiện | Mô tả lỗ hổng & Rủi ro | Giải pháp khắc phục đã triển khai | Kết quả xác thực |
|:---:|:---:|---|---|---|:---:|
| **SEC-001** | **HIGH** | `backend/app/config.py`<br>`docker-compose.yml` | Khóa ký JWT ban đầu dùng chuỗi mặc định `change-me-in-production`. | Yêu cầu bắt buộc nạp biến môi trường `JWT_SECRET_KEY`; fallback local chỉ sinh khóa ngẫu nhiên tạm thời. | **100% PASS** |
| **SEC-002** | **HIGH** | `backend/app/routers/users.py` | Leo thang đặc quyền: Vai trò `manager` ban đầu có thể gán quyền `admin`. | Ràng buộc: Duy nhất `admin` mới được phân quyền `admin`/`manager`; `manager` chỉ tạo `technician`/`user`. | **100% PASS** |
| **SEC-003** | **MEDIUM** | `backend/app/routers/ai.py` | Lộ stacktrace chi tiết khi AI provider mất kết nối mạng. | Chuẩn hóa thông báo lỗi an toàn: *"AI provider is unavailable"*, giữ chẩn đoán chi tiết server-side. | **100% PASS** |
| **SEC-004** | **MEDIUM** | `docker-compose.yml` | Mật khẩu database lưu cứng dạng plaintext trong file cấu hình. | Chuyển toàn bộ mật khẩu sang tệp bí mật `.env`, cấu hình Docker Compose yêu cầu biến môi trường. | **100% PASS** |
| **SEC-005** | **MEDIUM** | `backend/app/services/ai_service.py` | Ranh giới dữ liệu tham chiếu RAG chưa có thẻ phân định cấu trúc. | Đóng gói toàn bộ ngữ cảnh trong cặp thẻ `BEGIN/END UNTRUSTED REFERENCE CONTEXT` và bổ sung bộ lọc Pre-flight. | **100% PASS** |
| **SEC-006** | **HIGH** | `backend/app/models.py`<br>`backend/init.sql` | Cột `users.raw_password` lưu mật khẩu thô của người dùng. | **Xóa bỏ hoàn toàn cột này khỏi ORM và Database**, chuyển đổi 100% mật khẩu sang **Bcrypt (12 rounds)**. | **100% PASS** |

#### Đánh giá Bảo mật Ứng dụng Web Truyền thống:
- **Phòng chống CSRF (Cross-Site Request Forgery):** Hệ thống sử dụng mô hình xác thực không trạng thái (Stateless Authentication) dựa trên `Authorization: Bearer <JWT>` lưu trong `sessionStorage`. Hệ thống **hoàn toàn không sử dụng Cookie**, do đó miễn nhiễm 100% trước các cuộc tấn công CSRF.
- **Phòng chống SQL Injection:** 100% câu lệnh truy vấn dữ liệu được thực thi thông qua SQLAlchemy ORM với cơ chế Binding Parameter tự động, không có bất kỳ câu lệnh SQL nối chuỗi thô nào.
- **Phòng chống XSS (Cross-Site Scripting):** Giao diện React Vite tự động escape ký tự HTML nguy hiểm trong JSX, không sử dụng `dangerouslySetInnerHTML`.
- **Bảo mật Đăng nhập Google SSO:** Thiết lập cơ chế Fail-Closed tại `backend/app/routers/auth.py`. Nếu thiếu cấu hình `GOOGLE_CLIENT_ID`, hệ thống trả về mã lỗi 503 thay vì bỏ qua bước xác thực audience token.
"""
