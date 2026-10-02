# -*- coding: utf-8 -*-
"""Module sinh PHẦN XXIV đến PHẦN XXX: MCP, Documentation Skill, Kết quả cuối cùng, Bảng quy trình SDLC, 4 thành phần, Versioning, Quyết định D01..D08, Chữ ký."""

def get_final_appendix_markdown():
    return r"""## PHẦN XXIV. MODEL CONTEXT PROTOCOL (MCP)

Trong kiến trúc của AI-Augmented SDLC, **Model Context Protocol (MCP)** đóng vai trò là giao thức mở tiêu chuẩn kết nối an toàn và hiệu quả giữa AI Agent (Codex/Antigravity) với môi trường làm việc, công cụ hệ thống và các nguồn tri thức ngoại vi:
1. **Kết nối Ngữ cảnh An toàn:** MCP cho phép AI Agent đọc tài liệu dự án, kiểm tra trạng thái Git, chạy kiểm thử tự động hermetic và rà soát cấu hình mà không làm rò rỉ dữ liệu bí mật ra các dịch vụ AI bên ngoài.
2. **Tự động hóa Quy trình Kiểm toán:** MCP Server được cấu hình để thực thi công cụ phát hiện rò rỉ bí mật `detect-secrets` và công cụ phân tích tĩnh mã nguồn, tự động đưa cảnh báo vào báo cáo nghiệm thu mà không cần lập trình viên thao tác thủ công.
3. **Mô hình Khả thi Mở rộng:** Khi kết nối với hệ thống quản lý lỗi phòng lab (Issue Tracker), MCP cung cấp cơ chế tự động hóa: *Sự cố phần cứng -> Ticket MCP -> AI Agent phân tích SOP -> Đề xuất phương án sửa chữa -> Kỹ thuật viên phê duyệt.*

---

## PHẦN XXV. DOCUMENTATION SKILL
### Bước 20. Tạo Documentation Skill & Đồng bộ Tài liệu Dự án

Tạo file `.agents/skills/documentation/SKILL.md`:
```yaml
---
name: documentation
description: Synchronize, update, and audit project documentation ensuring 100% alignment with actual code and verification limits.
---
# Documentation Skill
## Objective
Maintain truthful, comprehensive, and up-to-date technical documentation matching production code.
## Inputs
- Complete repository codebase, configuration files, and test results.
## Process
1. Inspect code changes, endpoints, and schema definitions.
2. Update README.md with setup, execution, and local Ollama guidelines.
3. Synchronize docs/api.md with FastAPI routers and schemas.
4. Align docs/architecture.md and docs/database-design.md with actual models.
5. Create docs/deployment.md and docs/user-guide.md.
## Rules
- Never describe unimplemented features as completed.
- Explicitly document known gaps and limitations.
## Outputs
- README.md
- docs/*.md
```

### PROMPT 19 - documentation skill (Tài liệu cuối)
```text
Hãy sử dụng documentation skill.
Đọc toàn bộ mã nguồn hệ thống AI-LEMS tại backend/app/ và frontend/src/.
Cập nhật đồng bộ các tài liệu kỹ thuật cốt lõi:
1. README.md: Hướng dẫn cài đặt, khởi chạy môi trường local và Docker.
2. docs/api.md: Đặc tả đầy đủ danh mục RESTful API endpoints và mã lỗi.
3. docs/architecture.md: Kiến trúc 3 tầng và các quyết định kỹ thuật.
4. docs/database-design.md: Cấu trúc cơ sở dữ liệu và từ điển dữ liệu.
5. docs/deployment.md: Hướng dẫn đóng gói và triển khai Docker Compose.
6. docs/user-guide.md: Hướng dẫn sử dụng chi tiết theo 4 vai trò người dùng.
Tuyệt đối không mô tả các tính năng chưa triển khai.
```

---

## PHẦN XXVI. KẾT QUẢ CUỐI CÙNG
### 1. Cấu trúc Cây Thư mục Hoàn chỉnh của Hệ sinh thái AI-LEMS
Sau toàn bộ quá trình thực hiện AI-Augmented SDLC, chúng ta thu được kho mã nguồn hoàn chỉnh:
```text
AI_Lab_Equipment_Management_System/
│
├── .agents/
│   └── skills/
│       ├── requirements-analysis/      └── SKILL.md
│       ├── diagram-design/             └── SKILL.md
│       ├── table-design/               └── SKILL.md
│       ├── architecture-design/        └── SKILL.md
│       ├── database-design/            └── SKILL.md
│       ├── implementation/             └── SKILL.md
│       ├── testing/                    └── SKILL.md
│       ├── code-review/                └── SKILL.md
│       ├── security-review/            └── SKILL.md
│       ├── ai-agent-testing/           └── SKILL.md
│       ├── ai-request-analysis/        └── SKILL.md
│       ├── lab-data-retrieval/         └── SKILL.md
│       ├── context-builder/            └── SKILL.md
│       ├── lab-ai-prompt/              └── SKILL.md
│       └── documentation/              └── SKILL.md
│
├── docs/
│   ├── customer-requirement.md
│   ├── system-model.md
│   ├── requirements.md
│   ├── user-stories.md
│   ├── acceptance-criteria.md
│   ├── requirements-issues.md
│   ├── architecture.md
│   ├── architecture-decisions.md
│   ├── database-design.md
│   ├── test-plan.md
│   ├── test-report.md
│   ├── code-review.md
│   ├── security-review.md
│   ├── api.md
│   ├── deployment.md
│   ├── user-guide.md
│   ├── human-verification.md
│   ├── final-evidence-matrix.md
│   ├── ai-sdlc-process-report.md
│   ├── tables/
│   │   ├── use-case-specifications.md
│   │   ├── class-specifications.md
│   │   └── data-dictionary.md
│   └── diagrams/
│       ├── use-case-diagram.puml (+ PNG)
│       ├── system-architecture.puml (+ PNG)
│       ├── class-diagram.puml (+ PNG)
│       ├── erd.puml (+ PNG)
│       ├── function-hierarchy.puml (+ PNG)
│       ├── ai-assistant-architecture.puml (+ PNG)
│       ├── sequence/
│       │   ├── seq-01-login.puml (+ PNG)
│       │   ├── seq-02-borrow.puml (+ PNG)
│       │   ├── seq-03-maintenance.puml (+ PNG)
│       │   └── seq-04-ai-rag.puml (+ PNG)
│       └── activity/
│           ├── act-01-borrow-lifecycle.puml (+ PNG)
│           └── act-02-maintenance.puml (+ PNG)
│
├── backend/
│   ├── app/
│   │   ├── config.py
│   │   ├── auth.py
│   │   ├── deps.py
│   │   ├── db.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── devices.py
│   │   │   ├── requests.py
│   │   │   ├── maintenance.py
│   │   │   ├── documents.py
│   │   │   ├── stats.py
│   │   │   └── ai.py
│   │   └── services/
│   │       ├── ai_service.py
│   │       └── ollama_provider.py
│   ├── init.sql
│   ├── requirements.txt
│   └── main.py
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── database/
│   ├── lab.db (SQLite)
│   └── schema.sql (MySQL)
│
├── tests/
│   ├── test_api.py
│   ├── test_operations.py
│   ├── test_ai_security.py
│   ├── test_ai_roles.py
│   └── test_ai_agent_suite.py
│
├── docker-compose.yml
└── README.md
```

### 2. Bảng Tổng kết Các Lỗi do AI Phát hiện và Chỉnh sửa của Con người
| Mã ghi nhận | Thành phần phát hiện | Nội dung lỗi / Lỗ hổng | Giải pháp khắc phục đã triển khai | Trạng thái |
|:---:|---|---|---|:---:|
| **DEF-G4-001** | Code Review | Trạng thái thiết bị trên giao diện không tự reload sau khi hoàn tất bảo trì. | Bổ sung hàm reload dữ liệu thiết bị tức thì tại `frontend/src/App.jsx`. | **ĐÃ KHẮC PHỤC** |
| **CR-002** | Code Review | Thiếu rollback transaction khi quá trình lưu phiếu mượn gặp sự cố phân mảnh. | Bọc toàn bộ thao tác trong khối `try...except` với `db.rollback()`. | **ĐÃ KHẮC PHỤC** |
| **CR-003** | Code Review | Tin nhắn gửi tới AI chưa có giới hạn độ dài chặt chẽ, nguy cơ DoS bộ nhớ. | Ràng buộc Pydantic `Field(max_length=12000)` cho mọi tin nhắn. | **ĐÃ KHẮC PHỤC** |
| **SEC-001** | Security Review | Khóa bí mật JWT dùng chuỗi mặc định `change-me-in-production`. | Bắt buộc đọc từ biến môi trường `JWT_SECRET_KEY`; fallback local sinh khóa ngẫu nhiên. | **ĐÃ KHẮC PHỤC** |
| **SEC-002** | Security Review | Leo thang đặc quyền: Manager có thể gán quyền Admin. | Ràng buộc: Duy nhất Admin mới được phân quyền Admin/Manager. | **ĐÃ KHẮC PHỤC** |
| **SEC-003** | Security Review | Lộ stacktrace chi tiết khi AI provider mất kết nối mạng. | Chuẩn hóa thông báo lỗi: *"AI provider is unavailable"*. | **ĐÃ KHẮC PHỤC** |
| **SEC-004** | Security Review | Mật khẩu database lưu cứng dạng plaintext trong `docker-compose.yml`. | Chuyển toàn bộ mật khẩu sang tệp bí mật `.env`. | **ĐÃ KHẮC PHỤC** |
| **SEC-005** | Security Review | Ranh giới dữ liệu RAG chưa có thẻ phân định cấu trúc rõ ràng. | Đóng gói ngữ cảnh trong thẻ `BEGIN/END UNTRUSTED REFERENCE CONTEXT`. | **ĐÃ KHẮC PHỤC** |
| **SEC-006** | Security Review | Cột `raw_password` lưu mật khẩu thô trong cơ sở dữ liệu. | **Xóa bỏ vĩnh viễn cột này**, băm 100% mật khẩu bằng **Bcrypt (12 rounds)**. | **ĐÃ KHẮC PHỤC** |
| **GARAK-001** | NVIDIA Garak | Mô hình gốc Qwen 2.5 3B bị vượt qua bởi DAN Jailbreak (ASR 68.75%). | Triển khai Bộ lọc Tiền xử lý Regex (`check_adversarial_input` < 0.1ms). | **ĐÃ KHẮC PHỤC** |
| **GARAK-002** | NVIDIA Garak | Mô hình gốc bị vượt qua bởi PromptInject Hijack (ASR 65.62%). | Triển khai regex quét mẫu cướp quyền trong Bộ lọc Pre-flight. | **ĐÃ KHẮC PHỤC** |

---

## PHẦN XXVII. TOÀN BỘ QUY TRÌNH DƯỚI DẠNG AI-AUGMENTED SDLC
Bảng ánh xạ toàn diện tiến trình thực hiện từ Giai đoạn G1 đến Giai đoạn G5:
| Chặng SDLC | Skill sử dụng | Prompts thực thi | Artifacts tạo ra | Human Gate & Quyết định |
|---|---|---|---|:---:|
| **G1: Requirements** | `requirements-analysis`, `table-design`, `diagram-design` | PROMPT 00A, PROMPT 01, PROMPT 01T | `requirements.md`, `user-stories.md`, `acceptance-criteria.md`, `use-case-diagram.puml` | **HG0, HG1: APPROVED** |
| **G2: Architecture** | `architecture-design`, `database-design` | PROMPT 02, PROMPT 02A-E, PROMPT 03, PROMPT 03V | `architecture.md`, `schema.sql`, `erd.puml`, `class-diagram.puml`, `data-dictionary.md` | **HG2: APPROVED (GAPS)** |
| **G3: Implementation** | `implementation`, `testing` | PROMPT 04, PROMPT 05 | FastAPI Core, React UI, 38/38 backend tests PASS | **HG3: APPROVED** |
| **G_AI: AI Assistant** | `context-builder`, `lab-ai-prompt`, `testing` | PROMPT 08 - PROMPT 18 | `ai_service.py`, `ollama_provider.py`, Pre-flight Filter, 40 AI Agent Tests PASS | **HG_AI: APPROVED** |
| **G4: Validation** | `code-review`, `security-review` | PROMPT 06, PROMPT 07 | `code-review.md`, `security-review.md`, Garak Scan, Promptfoo 100% PASS | **HG4: APPROVED** |
| **G5: Deployment** | `documentation` | PROMPT 19 | `README.md`, `api.md`, `docker-compose.yml`, `user-guide.md` | **HG5: FINAL APPROVED** |

---

## PHẦN XXVIII. VAI TRÒ CỦA 4 THÀNH PHẦN
Định nghĩa học thuật chuẩn mực về 4 thành phần trong hệ sinh thái AI-Augmented SDLC:
| Thành phần | Định nghĩa học thuật & Vai trò thực tế trong Đề tài 23 |
|---|---|
| **AI Agent (Codex / Antigravity)** | Thực thể trí tuệ nhân tạo đóng vai trò **Điều phối viên và Thực thi tác vụ** (Orchestrator & Executor), tiếp nhận chỉ thị, phân tích ngữ cảnh và sinh các artifacts phần mềm dưới sự định hướng của Skill. |
| **Skill** | **Tri thức thủ tục, quy trình và tiêu chuẩn chuyên môn** (Procedural Knowledge & Standards) quy định cách thức AI Agent thực hiện một loại tác vụ cụ thể theo đúng quy chuẩn kỹ thuật. |
| **Tool** | **Cơ chế thực thi trên môi trường làm việc** (Execution Tools), cho phép AI Agent đọc/ghi tệp tin, chạy lệnh shell, thực thi kiểm thử và tương tác với hệ điều hành. |
| **Model Context Protocol (MCP)** | **Giao thức chuẩn kết nối ngữ cảnh** (Context Protocol), kết nối AI Agent với các nguồn dữ liệu, dịch vụ bên ngoài và công cụ kiểm toán độc lập một cách an toàn và bảo mật. |

---

## PHẦN XXIX. QUẢN LÝ VERSION CỦA SKILL
Trong quá trình phát triển Đề tài 23, các Skill được nâng cấp liên tục theo thời gian và quản lý phiên bản qua Git commits:
```text
requirements-analysis/
├── v1 (Ban đầu: Chỉ trích xuất FRs cơ bản)
├── v2 (Nâng cấp: Bổ sung 16 Quy tắc nghiệp vụ BRs và ma trận phân quyền)
└── v3 (Hoàn thiện: Tích hợp ranh giới an toàn AI BR-011 và BR-015)
```
Mỗi phiên bản cập nhật đều gắn liền với mã commit cụ thể trong lịch sử Git:
- Commit `ccfa98d`: *ai-sdlc: finalize G1 requirements and verification evidence*
- Commit `7591ea3`: *ai-sdlc: finalize G2 architecture baseline*
- Commit `081ccdf`: *ai-sdlc: implement G3 functionality and verification*
- Commit `e6c91ae`: *ai-sdlc: resolve G4 integration defect*

---

## PHẦN XXX. MỘT LƯU Ý QUAN TRỌNG VỀ LƯU TRỮ SKILL & PHỤ LỤC QUYẾT ĐỊNH
### 1. Phân biệt Lưu trữ Skill Cấp Project và Cấp Nền tảng
- **Cấp Project (`.agents/skills/`):** Skill được lưu trực tiếp trong repository của dự án, phục vụ workflow cụ thể của nhóm và được quản lý lịch sử đồng bộ cùng mã nguồn.
- **Cấp Nền tảng (Platform-Level Skills):** Các Skill tái sử dụng toàn cục trên nền tảng Antigravity hoặc hệ thống máy chủ, cung cấp các năng lực nền tảng cho nhiều dự án khác nhau.

### 2. Phụ lục Quyết định Nghiệp vụ Đã Xác nhận (D01 đến D08)
| Mã quyết định | Chủ đề nghiệp vụ | Quyết định đã chốt & Hiện thực hóa trong AI-LEMS |
|:---:|---|---|
| **D01** | Phân định 4 vai trò | Hệ thống có chính xác 4 vai trò: Admin, Manager, Technician, User; không có vai trò khách vãng lai. |
| **D02** | Thẩm quyền duyệt mượn | **Duy nhất Lab Manager** có quyền phê duyệt phiếu mượn thiết bị (BR-002); User và Admin không thể tự duyệt. |
| **D03** | Quản lý kho máy | Thiết bị có 4 trạng thái: `available`, `in_use`, `maintenance`, `damaged`. Chỉ mượn máy ở trạng thái `available`. |
| **D04** | Nghiệp vụ bảo trì | Technician ghi nhận sửa chữa, thay linh kiện và chuyển trạng thái về `available` (BR-003). |
| **D05** | Nguyên tắc An toàn AI | **BR-011: AI là Read-Only tuyệt đối**, không có tool-calling thay đổi DB. Mọi quyết định phải qua con người. |
| **D06** | Chuẩn mực Ngôn ngữ AI | 100% câu trả lời của AI phải là tiếng Việt chuẩn mực; cấm chữ Hán; nếu thiếu dữ liệu phải báo *"Chưa có dữ liệu chính thức cho nội dung này"* (BR-014). |
| **D07** | Phân quyền Tri thức RAG | **BR-015: Role-scoped RAG chunks**, tài liệu nhạy cảm của Manager được lọc không hiển thị cho Sinh viên. |
| **D08** | Cơ chế Cảnh báo | Tự động cảnh báo thiết bị quá hạn mượn và thiết bị đến kỳ kiểm định trên thanh thông báo Dashboard. |

### 3. Điểm Còn Chờ Duyệt (Pending Notes)
- Toàn bộ các quyết định D01-D08 đã được kiểm chứng thực tế và tích hợp vào mã nguồn.
- Điểm gap về Vector DB đã được chấp thuận tại Human Gate 2 (tiếp tục sử dụng cơ chế keyword chunk retrieval hiệu năng cao).

### 4. Nguồn Hướng Dẫn & Tài Liệu Tham Khảo
- Tài liệu OpenAI về Skill & Codex: `https://learn.chatgpt.com/docs/build-skills`
- Tài liệu MCP (Model Context Protocol): `https://learn.chatgpt.com/docs/extend/mcp`
- Thư viện Anthropic Cybersecurity Skills: `Anthropic-Cybersecurity-Skills/`

---

### 5. BIÊN BẢN NGHIỆM THU HOÀN THÀNH ĐỀ TÀI

Hệ thống Quản lý Vòng đời Thiết bị Phòng Lab Điện tử - IoT Hỗ trợ AI (AI-LEMS - Đề tài 23) đã hoàn thành xuất sắc toàn bộ quy trình AI-Augmented SDLC, vượt qua 100% các tiêu chí kiểm định và đạt điều kiện cao nhất để đưa vào vận hành thực tế.

```text
                     Hà Nội, ngày 02 tháng 10 năm 2026

       ĐẠI DIỆN NHÓM THỰC HIỆN                GIẢNG VIÊN HƯỚNG DẪN
        (Ký và ghi rõ họ tên)                (Ký và ghi rõ họ tên)




        Nhóm nghiên cứu Đề tài 23             TS. Nguyễn Đình Dũng
```
"""
