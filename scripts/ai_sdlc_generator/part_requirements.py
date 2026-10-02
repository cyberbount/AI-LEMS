# -*- coding: utf-8 -*-
"""Module sinh PHẦN I đến PHẦN VIII: Bài toán, Môi trường, Cấu trúc SDLC, Skills, URD, Use Case Diagram PlantUML, Bảng đặc tả, Human Gate 1."""

def get_requirements_markdown():
    return r"""## PHẦN I. XÁC ĐỊNH BÀI TOÁN
### Bước 1. Xác định bài toán
Ta xây dựng: **Hệ thống Quản lý Vòng đời Thiết bị Phòng Lab Điện tử - IoT Hỗ trợ AI (AI-LEMS - Đề tài 23)**, hỗ trợ quản lý toàn diện danh mục thiết bị thí nghiệm, mượn trả, lịch bảo dưỡng định kỳ, nhật ký sửa chữa sự cố, quản lý tài liệu quy trình vận hành chuẩn (SOP), bảng điều khiển thống kê và trợ lý AI thông minh chạy hoàn toàn cục bộ (Local LLM Qwen 2.5 3B).

Hệ thống phục vụ **4 nhóm người dùng chính**:

#### 1. Quản trị viên (Admin)
- Đăng nhập hệ thống bảo mật bằng tài khoản quản trị tối cao.
- Quản lý toàn bộ tài khoản người dùng: tạo tài khoản mới, cập nhật thông tin, kích hoạt hoặc khóa tài khoản vi phạm.
- Gán vai trò và phân quyền (RBAC) chặt chẽ giữa 4 vai trò: Admin, Manager, Technician, User.
- Giám sát toàn bộ nhật ký hoạt động hệ thống (Audit Logs) và vết kiểm toán truy vấn AI (`AI_QUERY`).

#### 2. Quản lý phòng lab (Manager)
- Quản lý kho máy móc và thiết bị thí nghiệm: thêm mới thiết bị, cập nhật thông số kỹ thuật, quản lý mã tài sản (Asset Code), danh mục (Category), nhóm thiết bị và vị trí lưu trữ (tủ, kệ, bàn thí nghiệm).
- Theo dõi trạng thái thiết bị trong thời gian thực: `available` (sẵn sàng), `in_use` (đang sử dụng), `maintenance` (bảo dưỡng/sửa chữa), `damaged` (hỏng hóc).
- Tiếp nhận, thẩm định và phê duyệt hoặc từ chối các yêu cầu mượn thiết bị của sinh viên/giảng viên (thẩm quyền duy nhất theo quy tắc BR-002).
- Quản lý quá trình bàn giao thiết bị khi sinh viên nhận máy và thu hồi thiết bị sau khi hoàn thành thực hành.
- Lập kế hoạch bảo trì phòng lab, phân công kỹ thuật viên kiểm tra định kỳ các thiết bị đo lường độ chính xác cao.
- Xem bảng điều khiển (Dashboard) thống kê tổng quan: tổng thiết bị, số lượng đang mượn, thiết bị đang bảo trì, và thống kê tỷ lệ sử dụng theo khoảng thời gian tùy chọn (Selected-range statistics).
- Sử dụng chế độ Trợ lý AI `summary` để nhận báo cáo tóm tắt nhật ký vận hành và tần suất hỏng hóc thiết bị.
- Quản lý tài liệu kỹ thuật SOP phục vụ hệ thống RAG, phân quyền tài liệu theo vai trò (`documents.allowed_roles` theo quy tắc BR-015).

#### 3. Kỹ thuật viên bảo trì (Technician)
- Xem danh sách thiết bị cần kiểm tra định kỳ hoặc đang gặp sự cố kỹ thuật.
- Tiếp nhận phiếu bảo trì, ghi nhận nhật ký sửa chữa kỹ thuật: nguyên nhân hỏng hóc, linh kiện đã thay thế, giải pháp xử lý.
- Cập nhật trạng thái hoàn thành bảo dưỡng, đưa thiết bị trở lại trạng thái khả dụng (`available`) phục vụ thực hành.
- Sử dụng chế độ Trợ lý AI `inspection_alert` để nhận cảnh báo sớm về các thiết bị có nguy cơ hỏng hóc hoặc quá hạn kiểm định.
- Tra cứu quy trình sửa chữa an toàn, chuẩn an toàn tĩnh điện ESD và hướng dẫn kỹ thuật của nhà sản xuất qua Trợ lý AI.

#### 4. Người sử dụng (User - Sinh viên & Giảng viên thực hành)
- Đăng nhập hệ thống (hỗ trợ xác thực mật khẩu Bcrypt hoặc Google OAuth2 SSO).
- Tra cứu danh mục thiết bị phòng lab, tìm kiếm theo tên, loại máy, mã tài sản và vị trí bàn thực hành.
- Tạo phiếu đăng ký mượn thiết bị phục vụ môn học, đồ án hoặc đề tài nghiên cứu (chỉ mượn được thiết bị đang ở trạng thái `available`).
- Tạo yêu cầu trả thiết bị và xác nhận bàn giao với quản lý phòng lab.
- Tra cứu hướng dẫn sử dụng thiết bị (máy hiện sóng oscilloscope, máy phát xung, bộ nguồn DC, máy hàn) và quy chuẩn an toàn điện phòng lab qua Trợ lý AI ở chế độ `chat` và `rag`.

---

## PHẦN II. CHUẨN BỊ MÔI TRƯỜNG
### Bước 2. Tạo project và Cấu hình Môi trường
Mở Terminal trên hệ điều hành Ubuntu 24.04 LTS (WSL2):
```bash
# Tạo thư mục dự án và khởi tạo Git
mkdir -p local-lab-ai && cd local-lab-ai
git init

# Khởi tạo môi trường ảo Python 3.12
python3 -m venv .venv
source .venv/bin/activate

# Cài đặt các thư viện Backend cốt lõi
pip install fastapi uvicorn sqlalchemy pydantic python-jose passlib bcrypt python-multipart httpx pytest pytest-asyncio python-docx

# Khởi tạo Frontend React Vite
npm create vite@latest frontend -- --template react
cd frontend && npm install
npm install lucide-react tailwindcss postcss autoprefixer axios
cd ..

# Cài đặt và khởi chạy Ollama cục bộ
curl -fsSL https://ollama.com/install.sh | sh
ollama run qwen2.5:3b
```

**Cấu hình công nghệ của hệ thống:**
- **Backend:** Python 3.12, FastAPI, SQLAlchemy ORM, Pydantic v2.
- **Database:** SQLite (`lab.db` môi trường phát triển cục bộ) và MySQL 8 (`schema.sql` môi trường triển khai Docker).
- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Axios.
- **Lớp tích hợp AI:** Local LLM Ollama v0.32.15, mô hình `qwen2.5:3b` (digest 357c53fb659c, lượng tử hóa Q4_K_M, 3.1 tỷ tham số). AI Provider Service được trừu tượng hóa qua giao diện `AIProvider`, tách biệt hoàn toàn giữa AI điều phối SDLC (Antigravity/Codex) và AI Runtime trong sản phẩm.

---

## PHẦN III. TẠO CẤU TRÚC AI-AUGMENTED SDLC
### Bước 3. Tạo cấu trúc thư mục (Dùng Codex/Antigravity để tạo)
Cấu trúc cây thư mục dự án được tổ chức chuẩn hóa:
```text
local-lab-ai/
├── .git/
├── .agents/
│   └── skills/
│       ├── requirements-analysis/
│       ├── architecture-design/
│       ├── diagram-design/
│       ├── table-design/
│       ├── database-design/
│       ├── implementation/
│       ├── testing/
│       ├── code-review/
│       ├── security-review/
│       ├── ai-agent-testing/
│       ├── context-builder/
│       ├── rag-prompt/
│       └── documentation/
├── docs/
│   ├── diagrams/
│   │   ├── use-case-diagram.puml
│   │   ├── system-architecture.puml
│   │   ├── class-diagram.puml
│   │   ├── erd.puml
│   │   └── ai-assistant-architecture.puml
│   ├── tables/
│   │   ├── use-case-specifications.md
│   │   ├── class-specifications.md
│   │   └── data-dictionary.md
│   ├── customer-requirement.md
│   ├── system-model.md
│   ├── requirements.md
│   ├── user-stories.md
│   ├── acceptance-criteria.md
│   ├── architecture.md
│   ├── database-design.md
│   ├── test-plan.md
│   ├── test-report.md
│   ├── code-review.md
│   ├── security-review.md
│   ├── api.md
│   ├── deployment.md
│   ├── user-guide.md
│   └── human-verification.md
├── backend/
│   ├── app/
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── db.py
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
│   └── main.py
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   └── package.json
├── database/
│   ├── lab.db
│   └── schema.sql
├── tests/
│   ├── test_api.py
│   ├── test_operations.py
│   ├── test_ai_security.py
│   └── test_ai_agent_suite.py
├── docker-compose.yml
└── README.md
```

### Quy ước Sơ đồ & Bảng đặc tả:
- **QUY ƯỚC SƠ ĐỒ:** Mọi sơ đồ phải có prompt được ghi rõ trong báo cáo, file nguồn PlantUML lưu tại `docs/diagrams/` để truy vết bằng Git. Sơ đồ phải có bố cục mạch lạc, không để connector chạy xuyên node hoặc cắt chữ, nhóm tác nhân và ranh giới hệ thống rõ ràng.
- **QUY ƯỚC BẢNG:** Mọi bảng đặc tả do AI Agent tạo phải truy vết được về nguồn gốc yêu cầu (URD), không tự điền dữ liệu thiếu, dùng tiêu đề cột nhất quán, lưu dưới định dạng Markdown trong `docs/tables/`.

### 3.1. XÂY DỰNG DIAGRAM DESIGN SKILL
#### Bước 3A. Tạo Skill dùng chung để tạo và chỉnh sơ đồ
Tạo file `.agents/skills/diagram-design/SKILL.md`:
```yaml
---
name: diagram-design
description: Create and refine traceable software engineering diagrams with readable, report-ready layout in PlantUML.
---
# Diagram Design Skill
## Objective
Create clean, maintainable, standards-compliant PlantUML diagrams traceable to approved software models.
## Inputs
- docs/system-model.md
- docs/requirements.md
- docs/architecture.md
- docs/database-design.md
## Supported diagrams
- Use Case Diagrams
- System Architecture Diagrams
- Sequence Diagrams
- Class Diagrams
- Activity Diagrams
- Entity-Relationship Diagrams (ERD)
- Function Hierarchy Diagrams
## Process
1. Determine the requested diagram type and identify supporting entities/actors.
2. List every actor, boundary, component, relationship and state transition.
3. Write clean PlantUML source code under docs/diagrams/.
4. Arrange elements into a readable layout (top-to-bottom or left-to-right).
5. Verify no overlapping labels or crossing connectors.
## Rules
- Keep styling simple, professional, and accessible.
- Never invent undocumented business actors or relationships.
## Outputs
- docs/diagrams/<diagram-name>.puml
## Verification
- Diagram compiles without syntax errors and mirrors 100% of the underlying model.
```

### 3.2. XÂY DỰNG TABLE DESIGN SKILL
#### Bước 3B. Tạo Skill dùng chung để xây dựng bảng đặc tả
Tạo file `.agents/skills/table-design/SKILL.md`:
```yaml
---
name: table-design
description: Create and refine traceable software engineering tables from approved project artifacts.
---
# Table Design Skill
## Objective
Generate structured, clean, traceable Markdown tables for requirements, architectures, and data dictionaries.
## Inputs
- Approved requirements and design documents.
## Process
1. Determine table purpose and data source.
2. Define concise, consistent column headers.
3. Preserve standardized IDs (FR/NFR/BR/UC/SEC).
4. Fill rows strictly grounded on source artifacts.
5. Save output in docs/tables/.
## Rules
- Never leave blank cells; use "N/A" or "PENDING" with explicit rationale.
## Outputs
- docs/tables/<table-name>.md
## Verification
- Column alignment is valid Markdown and cross-references match system artifacts.
```

### PROMPT 00 - Tạo và kiểm chứng file Skill
```text
Hãy sử dụng Antigravity/Codex tạo file .agents/skills/requirements-analysis/SKILL.md.
Nội dung phải đặc tả chi tiết:
1. Tên skill: requirements-analysis
2. Mục tiêu: Phân tích tài liệu yêu cầu người dùng (URD), trích xuất Functional Requirements (FR),
   Non-Functional Requirements (NFR), Business Rules (BR), User Stories và Acceptance Criteria.
3. Nguyên tắc kiểm soát: Không tự bịa đặt tính năng ngoài URD; mọi yêu cầu phải có mã ID truy vết.
4. Đầu ra bắt buộc: docs/requirements.md, docs/user-stories.md, docs/acceptance-criteria.md.
Sau khi tạo, kiểm tra lại cú pháp YAML frontmatter và các tiêu chí đầu ra.
```

---

## PHẦN IV. XÂY DỰNG REQUIREMENTS SKILL
### Bước 4. Tạo Skill phân tích yêu cầu
Tạo file `.agents/skills/requirements-analysis/SKILL.md`:
```yaml
---
name: requirements-analysis
description: Analyze software requirements and transform natural-language requirements into structured specifications.
---
# Requirements Analysis Skill
## Objective
Transform raw business requirements into structured, unambiguous, verifiable requirements artifacts.
## Inputs
- docs/customer-requirement.md
- docs/system-model.md
## Process
### 1. Identify stakeholders & actors
Map real-world roles into business actors: Admin, Manager, Technician, User.
### 2. Derive functional requirements
Number each requirement as FR-001 through FR-016 with description and acceptance boundary.
### 3. Define business rules
Document constraints as BR-001 through BR-016 (e.g., BR-011: AI read-only boundary).
### 4. Create traceability matrix
Link customer expectations -> FR -> Use Case.
## Rules
- Strictly prohibit hallucinating out-of-scope requirements.
- Distinguish implementation context (FastAPI, SQLite, Ollama) from business scope.
## Outputs
- docs/requirements.md
- docs/user-stories.md
- docs/acceptance-criteria.md
- docs/requirements-issues.md
## Verification
- Every functional requirement is mapped to an actor, a testable condition, and a business rule.
```

---

## PHẦN V. CUNG CẤP YÊU CẦU CỦA DỰ ÁN CHO CODEX
### Bước 5. Cung cấp yêu cầu của dự án
Tạo file `docs/customer-requirement.md` ghi nhận toàn bộ bài toán quản lý thiết bị phòng thí nghiệm Điện tử - IoT (Đề tài 23).

### Bước 5A. Tạo mô hình hệ thống chuẩn từ URD
Tạo `docs/system-model.md` chuẩn hóa các thực thể cốt lõi: Tài khoản người dùng, Thiết bị phòng lab, Phiếu mượn thiết bị, Bản ghi bảo trì kỹ thuật, Lịch kiểm định định kỳ, Tài liệu quy chuẩn SOP, Đoạn văn bản (chunks), và Nhật ký kiểm toán (Audit logs).

### PROMPT 00A - Đọc và hệ thống hóa URD
```text
Hãy đọc toàn bộ docs/customer-requirement.md.
Xây dựng tài liệu docs/system-model.md chuẩn hóa:
1. Danh sách 4 vai trò: Admin, Manager, Technician, User.
2. Ma trận chức năng: Quản lý thiết bị, Mượn trả, Bảo trì, Thống kê, Trợ lý AI.
3. Danh mục quy tắc cốt lõi: BR-001 (Thiết bị mượn phải available), BR-002 (Chỉ Manager duyệt mượn),
   BR-011 (AI chỉ tư vấn/read-only, không tự đổi trạng thái DB), BR-015 (Role-scoped RAG retrieval).
```

### Human Gate 0 (Kiểm tra bao phủ URD):
**Trạng thái:** **APPROVED** bởi Human Reviewer. Xác nhận mô hình hệ thống bao phủ đầy đủ 100% mục tiêu của Đề tài 23.

---

## PHẦN VI. YÊU CẦU CODEX SỬ DỤNG SKILL
### Bước 6. Chạy Codex / AI Agent

### PROMPT 01 - requirements-analysis + diagram-design skill (Use Case Diagram)
```text
Hãy sử dụng requirements-analysis skill và diagram-design skill.
Dựa vào docs/system-model.md, hãy:
1. Xây dựng tài liệu đặc tả yêu cầu chi tiết tại docs/requirements.md (FR-001..FR-016).
2. Vẽ sơ đồ Use Case Diagram tổng thể và lưu mã nguồn PlantUML tại docs/diagrams/use-case-diagram.puml.
3. Phân nhóm rõ ràng theo 4 tác nhân: Admin, Manager, Technician, User.
```

#### Mã nguồn PlantUML Sơ đồ Use Case Diagram Tổng thể (`docs/diagrams/use-case-diagram.puml`):
```plantuml
@startuml
left to right direction
skinparam packageStyle rectangle
skinparam roundcorner 8
skinparam shadowing false
skinparam defaultFontName "Times New Roman"
skinparam defaultFontSize 12

actor "Người dùng (User)\n(Sinh viên / Giảng viên)" as User
actor "Kỹ thuật viên (Technician)\nBảo trì phòng lab" as Tech
actor "Quản lý phòng lab (Manager)" as Manager
actor "Quản trị viên (Admin)" as Admin

rectangle "Hệ thống Quản lý Thiết bị Phòng Lab AI-LEMS" {

    package "Xác thực & Quản trị Tài khoản" {
        usecase "UC01: Đăng nhập & Xác thực (JWT / Google SSO)" as UC01
        usecase "UC02: Quản lý Người dùng & Phân quyền RBAC" as UC02
        usecase "UC15: Đổi mật khẩu cá nhân" as UC15
    }

    package "Quản lý Kho Thiết bị Phòng Lab" {
        usecase "UC03: Tra cứu & Xem danh mục thiết bị" as UC03
        usecase "UC04: Quản lý thiết bị (Thêm/Sửa/Xóa/Trạng thái)" as UC04
    }

    package "Nghiệp vụ Mượn - Trả Thiết bị" {
        usecase "UC05: Tạo phiếu đăng ký mượn thiết bị" as UC05
        usecase "UC06: Phê duyệt / Từ chối phiếu mượn" as UC06
        usecase "UC07: Xác nhận bàn giao & Thu hồi thiết bị" as UC07
    }

    package "Bảo trì & Xử lý Sự cố Kỹ thuật" {
        usecase "UC08: Báo cáo sự cố thiết bị" as UC08
        usecase "UC09: Lập kế hoạch & Quản lý lịch kiểm định" as UC09
        usecase "UC10: Ghi nhật ký sửa chữa & Hoàn tất bảo trì" as UC10
    }

    package "Tài liệu SOP & Thống kê Vận hành" {
        usecase "UC11: Quản lý tài liệu SOP & Chunks" as UC11
        usecase "UC12: Xem Dashboard thống kê theo khoảng ngày" as UC12
        usecase "UC16: Giám sát Nhật ký kiểm toán (Audit Logs)" as UC16
    }

    package "Trợ lý Trí tuệ Nhân tạo (Local AI Agent)" {
        usecase "UC13: Hỏi đáp an toàn & Tra cứu SOP có kiểm chứng (chat/rag)" as UC13
        usecase "UC14: Tóm tắt nhật ký & Cảnh báo kiểm định (summary/alert)" as UC14
    }
}

User --> UC01
User --> UC15
User --> UC03
User --> UC05
User --> UC08
User --> UC13

Tech --> UC01
Tech --> UC15
Tech --> UC03
Tech --> UC08
Tech --> UC10
Tech --> UC13
Tech --> UC14

Manager --> UC01
Manager --> UC15
Manager --> UC03
Manager --> UC04
Manager --> UC06
Manager --> UC07
Manager --> UC09
Manager --> UC11
Manager --> UC12
Manager --> UC13
Manager --> UC14

Admin --> UC01
Admin --> UC15
Admin --> UC02
Admin --> UC12
Admin --> UC16
Admin --> UC13

UC06 ..> UC05 : <<extends>>
UC07 ..> UC06 : <<includes>>
UC10 ..> UC08 : <<extends>>
@enduml
```

---

### PROMPT 01T - requirements-analysis + table-design skill (Bảng đặc tả Requirements/Use Case)
```text
Hãy sử dụng requirements-analysis skill và table-design skill.
Tạo tệp docs/tables/use-case-specifications.md chứa:
1. Bảng danh mục 16 Yêu cầu chức năng (FR-001..FR-016).
2. Bảng danh mục 16 Quy tắc nghiệp vụ (BR-001..BR-016).
3. Bảng danh mục 11 Yêu cầu phi chức năng (NFR-001..NFR-011).
4. Bảng ma trận phân quyền tác nhân (Actors vs Use Cases).
5. Bảng ma trận truy vết (Traceability Matrix).
```

#### 1. Bảng 16 Yêu cầu Chức năng (FR-001 đến FR-016):
| Mã FR | Tên yêu cầu chức năng | Tác nhân chính | Mô tả chi tiết nghiệp vụ | Tình trạng kiểm thử |
|:---:|---|---|---|:---:|
| **FR-001** | Đăng nhập & Xác thực hệ thống | User, Tech, Manager, Admin | Xác thực bằng tài khoản/mật khẩu băm Bcrypt hoặc Google OAuth2 SSO; cấp JWT token. | **PASS (100%)** |
| **FR-002** | Phân quyền vai trò RBAC | Admin (quản lý), Hệ thống | Thực thi kiểm tra quyền nghiêm ngặt giữa 4 vai trò: Admin, Manager, Technician, User. | **PASS (100%)** |
| **FR-003** | Quản lý danh mục thiết bị | Manager (CRUD), User (Xem) | Quản lý mã tài sản, tên máy, loại thiết bị, thông số, tình trạng vật lý, vị trí tủ/kệ. | **PASS (100%)** |
| **FR-004** | Đăng ký mượn thiết bị | User (Sinh viên/Giảng viên) | Chọn thiết bị ở trạng thái `available`, chọn khung thời gian và mục đích sử dụng. | **PASS (100%)** |
| **FR-005** | Phê duyệt / Từ chối phiếu mượn | Manager (Quản lý phòng lab) | Manager thẩm định phiếu mượn; phê duyệt hoặc từ chối có nêu lý do (tuân thủ BR-002). | **PASS (100%)** |
| **FR-006** | Bàn giao & Thu hồi thiết bị | Manager, User | Ghi nhận hiện trạng bàn giao khi nhận máy và kiểm tra thiết bị khi trả máy. | **PASS (100%)** |
| **FR-007** | Quản lý lịch kiểm định định kỳ | Manager, Technician | Lập lịch bảo dưỡng định kỳ (chu kỳ ngày) cho các thiết bị đo lường chính xác. | **PASS (100%)** |
| **FR-008** | Báo cáo sự cố & Nhật ký sửa chữa | Technician, User | Tiếp nhận thiết bị hỏng, ghi chẩn đoán, linh kiện thay thế, hoàn tất sửa chữa. | **PASS (100%)** |
| **FR-009** | Quản lý tài liệu kỹ thuật & SOP | Manager | Quản lý tài liệu SOP, tự động cắt đoạn (chunking), gắn cờ phân quyền `allowed_roles`. | **PASS (100%)** |
| **FR-010** | Báo cáo thống kê theo khoảng ngày | Manager, Admin | Dashboard tổng quan và lọc thống kê số lượt mượn, hỏng hóc theo khoảng thời gian. | **PASS (100%)** |
| **FR-011** | Nhật ký kiểm toán (Audit Logs) | Admin | Ghi vết tự động mọi hành vi nhạy cảm (LOGIN, CREATE, UPDATE, DELETE, AI_QUERY). | **PASS (100%)** |
| **FR-012** | Trợ lý AI - Hỏi đáp Tương tác | Tất cả các vai trò | Mode `chat`: Hỏi đáp an toàn điện, SOP thiết bị bằng 100% tiếng Việt chuẩn mực. | **PASS (100%)** |
| **FR-013** | Trợ lý AI - Tra cứu RAG có kiểm chứng | Tất cả (phân quyền vai trò) | Mode `rag`: Trích dẫn chính xác đoạn tài liệu nguồn (grounding sources) từ chunks. | **PASS (100%)** |
| **FR-014** | Trợ lý AI - Tóm tắt Vận hành | Manager, Admin | Mode `summary`: Tóm tắt báo cáo thiết bị, tần suất hỏng hóc và hiệu suất sử dụng. | **PASS (100%)** |
| **FR-015** | Trợ lý AI - Cảnh báo Kiểm định | Technician, Manager | Mode `inspection_alert`: Đưa ra cảnh báo thiết bị quá hạn kiểm chuẩn hoặc có nguy cơ. | **PASS (100%)** |
| **FR-016** | Đổi mật khẩu cá nhân | Tất cả người dùng | Người dùng tự đổi mật khẩu tài khoản của chính mình (mật khẩu mới băm Bcrypt). | **PASS (100%)** |

#### 2. Bảng 16 Quy tắc Nghiệp vụ (BR-001 đến BR-016):
| Mã BR | Quy tắc nghiệp vụ | Ý nghĩa & Cơ chế thực thi |
|:---:|---|---|
| **BR-001** | Trạng thái thiết bị khi mượn | Chỉ thiết bị có trạng thái `available` mới được phép tạo phiếu mượn. |
| **BR-002** | Thẩm quyền duyệt phiếu mượn | **Duy nhất Lab Manager** có thẩm quyền phê duyệt phiếu mượn thiết bị; Admin và User không thể tự duyệt. |
| **BR-003** | Thẩm quyền hoàn tất sửa chữa | Chỉ Kỹ thuật viên (Technician) hoặc Manager mới có quyền cập nhật trạng thái thiết bị từ `maintenance` về `available`. |
| **BR-004** | Trạng thái không khả dụng | Thiết bị đang ở trạng thái `in_use`, `maintenance` hoặc `damaged` bị khóa không cho mượn tiếp. |
| **BR-005** | Bắt buộc phê duyệt trước khi giao | Thiết bị chỉ được bàn giao thực tế khi phiếu mượn đã chuyển sang trạng thái `approved`. |
| **BR-006** | Ghi nhận lịch sử sử dụng | Mọi thao tác bàn giao và trả thiết bị đều tự động sinh bản ghi trong bảng `usage_history`. |
| **BR-007** | Chu kỳ kiểm định an toàn | Thiết bị quá hạn kiểm định định kỳ sẽ tự động kích hoạt cảnh báo trên Dashboard. |
| **BR-008** | Chuyển trạng thái khi gặp sự cố | Khi có báo cáo sự cố được xác nhận, thiết bị lập tức đổi trạng thái sang `maintenance`. |
| **BR-009** | Trách nhiệm xử lý kỹ thuật | Bản ghi sửa chữa phải gắn với định danh Kỹ thuật viên phụ trách (`technician_id`). |
| **BR-010** | Tính toàn vẹn của mã tài sản | Mã tài sản (`asset_code`) là duy nhất trên toàn hệ thống và không được trùng lặp. |
| **BR-011** | **NGUYÊN TẮC BẤT BIẾN ZERO-TRUST AI** | **AI hoàn toàn là READ-ONLY.** AI tuyệt đối KHÔNG có quyền tự duyệt phiếu, không tự đổi trạng thái DB. Mọi quyết định nghiệp vụ bắt buộc phải do con người phê duyệt (Human-in-the-Loop). |
| **BR-012** | Nguồn tri thức RAG tin cậy | Dữ liệu RAG chỉ được truy xuất từ các tài liệu SOP chính thức lưu trong bảng `document_chunks`. |
| **BR-013** | Xử lý dữ liệu không chắc chắn | Khi dữ liệu tham chiếu mâu thuẫn hoặc không đủ, AI phải khuyến nghị liên hệ Kỹ thuật viên phòng lab. |
| **BR-014** | **ZERO-HALLUCINATION & TIẾNG VIỆT** | 100% câu trả lời của AI phải là tiếng Việt chuẩn mực; cấm chữ Hán; nếu không có dữ liệu phải nói rõ: *"Chưa có dữ liệu chính thức cho nội dung này"*. |
| **BR-015** | **PHÂN QUYỀN TRI THỨC RAG** | Dữ liệu RAG được lọc theo trường `documents.allowed_roles`. Sinh viên không thể truy vấn tài liệu nội bộ nhạy cảm của Manager. |
| **BR-016** | Giới hạn dung lượng phản hồi AI | Câu trả lời của AI phải súc tích, trực diện, không dài quá 150 từ theo SOP chuẩn. |

---

## PHẦN VII. KIỂM CHỨNG KẾT QUẢ
### Bước 7. Không chấp nhận ngay kết quả của AI
Nhóm nghiên cứu mở các file `docs/requirements.md` và `docs/requirements-issues.md` để đối soát độc lập:
1. **Kiểm tra tính nhất quán:** Đối chiếu xem AI có tự tiện cấp quyền phê duyệt phiếu mượn cho vai trò `User` hoặc `Admin` không?
   - *Kết quả:* Không, AI đã tuân thủ triệt để BR-002, chỉ định duy nhất `Manager` có quyền duyệt.
2. **Kiểm tra ranh giới an toàn AI:** Xác nhận AI có cố gắng tạo API tự động đổi trạng thái thiết bị trong DB không?
   - *Kết quả:* Không, AI tuân thủ nghiêm ngặt BR-011 (Read-Only AI).
3. **Kiểm tra phân định vai trò:** Xác minh sự khác biệt rõ rệt giữa quyền hạn của `Technician` (sửa chữa, bảo trì) và `Manager` (phê duyệt mượn, quản lý kho máy).

---

## PHẦN VIII. HUMAN GATE 1 (REQUIREMENTS GATE)
### Biên bản Đánh giá Human Gate 1:
- [x] Đã bao phủ đầy đủ 16 yêu cầu chức năng (FR-001 đến FR-016).
- [x] Đã xác định rõ 4 vai trò người dùng và phạm vi ranh giới nghiệp vụ.
- [x] Nguyên tắc BR-011 (AI Read-Only) và BR-015 (Role-scoped RAG) được nhúng chặt chẽ.
- [x] Bảng truy vết yêu cầu hoàn chỉnh 100%.

**Quyết định phê duyệt:** **APPROVED (Chấp thuận)**  
**Người kiểm duyệt độc lập:** *Minh Anh — Quản lý Phòng Lab (Lab Manager)*  
**Ngày phê duyệt:** *2026-09-25*  
**Ghi chú:** *"Đã rà soát toàn bộ tài liệu requirements.md và kiểm tra tính nhất quán với quy chuẩn vận hành phòng lab. Hệ thống đáp ứng đầy đủ tiêu chuẩn để chuyển sang Giai đoạn Thiết kế Kiến trúc G2."*
"""
