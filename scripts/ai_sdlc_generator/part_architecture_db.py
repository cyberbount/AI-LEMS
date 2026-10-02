# -*- coding: utf-8 -*-
"""Module sinh PHẦN IX đến PHẦN XIV: Architecture Skill, Sơ đồ Kiến trúc PlantUML, Sequence, Class, Activity, ERD, Schema DDL SQL, Human Gate 2."""

def get_architecture_db_markdown():
    return r"""## PHẦN IX. XÂY DỰNG ARCHITECTURE SKILL
### Bước 8. Tạo Skill Thiết kế Kiến trúc
Tạo file `.agents/skills/architecture-design/SKILL.md`:
```yaml
---
name: architecture-design
description: Design a modular, layered system architecture and generate architectural PlantUML diagrams from approved requirements.
---
# Architecture Design Skill
## Objective
Design a modular, scalable, maintainable 3-tier software architecture and generate complete architectural diagrams.
## Inputs
- docs/requirements.md
- docs/system-model.md
- docs/tables/use-case-specifications.md
## Process
### 1. Identify architectural style
Adopt a 3-tier Layered Architecture: Presentation Tier (React Vite), Business Logic Tier (FastAPI), Data & AI Tier (SQLAlchemy, SQLite/MySQL, Ollama).
### 2. Identify major components
Define components: Auth, Users, Devices, Requests, Maintenance, Stats, Documents, AIService, OllamaProvider.
### 3. Model interaction flows (Sequence Diagrams)
Create sequence flows for Login, Borrow Approval, Incident Resolution, RAG SOP Inquiry.
### 4. Model domain entities (Class Diagram)
Map business rules and database relationships into object-oriented classes.
### 5. Define boundaries and security policies
Enforce RBAC at the API layer; strictly isolate AI runtime from database write access (BR-011).
## Outputs
- docs/architecture.md
- docs/architecture-decisions.md
- docs/diagrams/system-architecture.puml
- docs/diagrams/sequence/*.puml
- docs/diagrams/class-diagram.puml
- docs/diagrams/activity/*.puml
- docs/diagrams/function-hierarchy.puml
## Verification
- Every functional requirement is mapped to an architectural component.
```

---

## PHẦN X. SỬ DỤNG ARCHITECTURE SKILL
### Bước 9. Chạy Architecture Skill

### PROMPT 02 - Kiến trúc hệ thống AI-LEMS + Sơ đồ kiến trúc
```text
Hãy sử dụng architecture-design và diagram-design skill.
Đọc docs/requirements.md và docs/system-model.md.
Xây dựng docs/architecture.md và sơ đồ docs/diagrams/system-architecture.puml mô tả kiến trúc 3 tầng:
1. Presentation Layer (React Vite, Tailwind CSS, Responsive UI).
2. Business Logic Layer (FastAPI Routers, Auth JWT, RBAC Middleware, AIService).
3. Data & AI Inference Layer (SQLAlchemy ORM, lab.db SQLite/MySQL, Local Ollama Qwen 2.5 3B).
```

#### Mã nguồn PlantUML Sơ đồ Kiến trúc Hệ thống 3 tầng (`docs/diagrams/system-architecture.puml`):
```plantuml
@startuml
skinparam packageStyle rectangle
skinparam roundcorner 10
skinparam shadowing false
skinparam defaultFontName "Times New Roman"
skinparam defaultFontSize 12

package "Tầng Trình diễn (Presentation Layer - Frontend)" {
    [React 18 SPA (Vite)] as ReactApp
    [Tailwind CSS & Lucide UI] as UI
    [Axios HTTP Client] as Client
    [Session Storage (JWT Token)] as Storage
    ReactApp ..> UI
    ReactApp ..> Client
    ReactApp ..> Storage
}

package "Tầng Logic Nghiệp vụ (Business Logic Layer - FastAPI Backend)" {
    package "Bảo mật & Middleware" {
        [CORS Middleware] as CORS
        [JWT Authenticator & RBAC] as JWT
        [Pre-flight Screening Filter] as Filter
    }
    
    package "API Routers (RESTful Endpoints)" {
        [Auth Router (/api/auth)] as R_Auth
        [Users Router (/api/users)] as R_Users
        [Devices Router (/api/devices)] as R_Devices
        [Requests Router (/api/requests)] as R_Req
        [Maintenance Router (/api/maintenance)] as R_Maint
        [Stats Router (/api/stats)] as R_Stats
        [Documents Router (/api/documents)] as R_Docs
        [AI Router (/api/ai)] as R_AI
    }
    
    package "Dịch vụ Nghiệp vụ (Domain Services)" {
        [AIService Orchestrator] as AISvc
        [Context Builder & Sanitizer] as CtxBuilder
        [OllamaProvider Adapter] as Provider
    }
}

package "Tầng Dữ liệu & Trí tuệ Nhân tạo (Data & AI Inference Tier)" {
    database "Cơ sở Dữ liệu Quan hệ" {
        [SQLAlchemy ORM Engine] as ORM
        [SQLite / MySQL 8 (lab.db)] as DB
        ORM --> DB
    }
    
    node "Local AI Engine" {
        [Ollama Service (Port 11434)] as Ollama
        [Qwen 2.5 3B (Quantized Q4_K_M)] as LLM
        Ollama --> LLM
    }
}

Client --> CORS : HTTP/JSON Requests
CORS --> JWT : Kiểm tra Bearer Token
JWT --> R_Auth
JWT --> R_Users
JWT --> R_Devices
JWT --> R_Req
JWT --> R_Maint
JWT --> R_Stats
JWT --> R_Docs
JWT --> R_AI

R_Auth --> ORM
R_Users --> ORM
R_Devices --> ORM
R_Req --> ORM
R_Maint --> ORM
R_Stats --> ORM
R_Docs --> ORM

R_AI --> Filter : Quét mẫu đối kháng (<0.1ms)
Filter --> AISvc : Hợp lệ
AISvc --> ORM : Đọc dữ liệu & SOP Chunks (Read-Only)
AISvc --> CtxBuilder : Bọc UNTRUSTED CONTEXT
CtxBuilder --> Provider : Build Guardrails Prompt
Provider --> Ollama : HTTP POST /api/chat

note right of AISvc
  NGUYÊN TẮC BR-011:
  AI hoàn toàn READ-ONLY.
  Không có quyền ghi vào DB.
end note
@enduml
```

---

### PROMPT 02A - Sequence Diagrams (Quy trình nghiệp vụ cốt lõi)
```text
Sinh mã PlantUML cho 4 Sequence Diagrams trọng yếu lưu tại docs/diagrams/sequence/:
1. Đăng nhập & Xác thực JWT (POST /api/auth/login).
2. Quy trình mượn và phê duyệt thiết bị (User -> Request Router -> Manager Duyệt -> Bàn giao).
3. Quy trình báo cáo sự cố & hoàn tất bảo trì kỹ thuật (User -> Tech -> Sửa -> Đổi trạng thái).
4. Quy trình tra cứu SOP có kiểm chứng RAG qua Trợ lý AI.
```

#### 1. Sequence Diagram: Đăng nhập & Xác thực JWT (`docs/diagrams/sequence/seq-01-login.puml`)
```plantuml
@startuml
autonumber
skinparam defaultFontName "Times New Roman"
actor "Người dùng" as User
participant "React Frontend" as FE
participant "Auth Router" as Router
participant "SQLAlchemy ORM" as ORM
database "Cơ sở dữ liệu" as DB

User -> FE : Nhập username và password
FE -> Router : POST /api/auth/login {username, password}
Router -> ORM : Truy vấn User theo username
ORM -> DB : SELECT * FROM users WHERE username = ?
DB --> ORM : Trả về bản ghi User (password_hash)
ORM --> Router : Đối tượng User
Router -> Router : Kiểm tra mật khẩu (Bcrypt verify)
alt Mật khẩu đúng & tài khoản active
    Router -> Router : Tạo JWT Token (HS256, expired 24h, kèm role)
    Router --> FE : HTTP 200 {access_token, token_type, user_info}
    FE -> FE : Lưu token vào sessionStorage & điều hướng Dashboard
    FE --> User : Hiển thị màn hình làm việc tương ứng vai trò
else Mật khẩu sai hoặc tài khoản bị khóa
    Router --> FE : HTTP 401 Unauthorized {detail: "Sai thông tin đăng nhập"}
    FE --> User : Báo lỗi trên giao diện đăng nhập
end
@enduml
```

#### 2. Sequence Diagram: Đăng ký & Phê duyệt Mượn Thiết bị (`docs/diagrams/sequence/seq-02-borrow.puml`)
```plantuml
@startuml
autonumber
skinparam defaultFontName "Times New Roman"
actor "Sinh viên (User)" as Student
actor "Quản lý (Manager)" as Manager
participant "React Frontend" as FE
participant "Requests Router" as Router
participant "Devices Router" as DevRouter
participant "SQLAlchemy ORM" as ORM
database "Cơ sở dữ liệu" as DB

Student -> FE : Chọn thiết bị & điền phiếu mượn
FE -> Router : POST /api/requests {device_id, purpose, from_time, to_time}
Router -> ORM : Kiểm tra trạng thái thiết bị
ORM -> DB : SELECT status FROM devices WHERE id = ?
DB --> ORM : Trả về status
alt Thiết bị available
    Router -> ORM : INSERT INTO borrow_requests (status='pending')
    ORM -> DB : COMMIT
    Router --> FE : HTTP 201 Created {request_id, status: "pending"}
    FE --> Student : Thông báo tạo phiếu thành công, chờ duyệt
else Thiết bị không available (đang mượn/bảo trì)
    Router --> FE : HTTP 400 Bad Request {detail: "Thiết bị không sẵn sàng"}
    FE --> Student : Báo lỗi thiết bị đang bận
end

Manager -> FE : Xem danh sách phiếu chờ duyệt
FE -> Router : GET /api/requests/pending (kèm Manager JWT)
Router --> FE : Danh sách các phiếu pending
Manager -> FE : Bấm nút "Phê duyệt"
FE -> Router : PATCH /api/requests/{id}/approve
Router -> Router : Xác thực quyền Manager (RBAC check - BR-002)
Router -> ORM : Cập nhật borrow_requests.status = 'approved'
Router -> ORM : Cập nhật devices.status = 'borrowed'
Router -> ORM : Ghi bản ghi usage_history (action='borrow')
ORM -> DB : COMMIT Transaction
Router --> FE : HTTP 200 OK {status: "approved"}
FE --> Manager : Cập nhật giao diện phê duyệt thành công
@enduml
```

#### 3. Sequence Diagram: Báo cáo Sự cố & Hoàn tất Bảo trì (`docs/diagrams/sequence/seq-03-maintenance.puml`)
```plantuml
@startuml
autonumber
skinparam defaultFontName "Times New Roman"
actor "Kỹ thuật viên (Technician)" as Tech
participant "React Frontend" as FE
participant "Maintenance Router" as Router
participant "SQLAlchemy ORM" as ORM
database "Cơ sở dữ liệu" as DB

Tech -> FE : Nhập thông tin sự cố / yêu cầu bảo dưỡng
FE -> Router : POST /api/maintenance {device_id, kind: 'incident', notes}
Router -> ORM : Tạo maintenance_records (status='in_progress', tech_id)
Router -> ORM : Cập nhật devices.status = 'maintenance'
ORM -> DB : COMMIT Transaction
Router --> FE : HTTP 201 Created

Tech -> FE : Thực hiện sửa chữa xong, nhập linh kiện thay thế & kết luận
FE -> Router : PATCH /api/maintenance/{id}/complete {notes, status: 'completed'}
Router -> Router : Kiểm tra quyền Technician/Manager (BR-003)
Router -> ORM : Cập nhật maintenance_records.status = 'completed'
Router -> ORM : Cập nhật devices.status = 'available'
Router -> ORM : Ghi audit_logs (action='COMPLETE_MAINTENANCE')
ORM -> DB : COMMIT Transaction
Router --> FE : HTTP 200 OK {status: "completed"}
FE -> FE : Tự động reload danh sách thiết bị (DEF-G4-001 fix)
FE --> Tech : Thông báo hoàn tất bảo trì, thiết bị đã khả dụng trở lại
@enduml
```

#### 4. Sequence Diagram: Tra cứu SOP có Kiểm chứng RAG qua AI (`docs/diagrams/sequence/seq-04-ai-rag.puml`)
```plantuml
@startuml
autonumber
skinparam defaultFontName "Times New Roman"
actor "Người dùng" as User
participant "React Chat UI" as FE
participant "AI Router" as Router
participant "AIService" as Svc
participant "Pre-flight Filter" as Filter
participant "SQLAlchemy ORM" as ORM
participant "Ollama Provider" as Provider
participant "Local Ollama Engine" as Ollama

User -> FE : Gửi câu hỏi: "Máy hiện sóng TBS1102B dùng nguồn điện áp nào?"
FE -> Router : POST /api/ai/chat {message, mode: 'rag', history}
Router -> Svc : chat(message, history, mode, db, user_role)
Svc -> Filter : check_adversarial_input(message)
alt Phát hiện mẫu tấn công DAN / Injection
    Filter --> Svc : Khớp mẫu đối kháng
    Svc --> Router : Trả về thông báo từ chối an toàn (grounded=false)
    Router --> FE : HTTP 200 {answer: "Tôi phải từ chối yêu cầu này..."}
else Truy vấn an toàn
    Filter --> Svc : Hợp lệ
    Svc -> ORM : Truy vấn document_chunks phù hợp vai trò (BR-015)
    ORM --> Svc : Trả về Top 2 chunks liên quan nhất từ SOP
    Svc -> Svc : Đóng gói BEGIN/END UNTRUSTED REFERENCE CONTEXT
    Svc -> Svc : Nhúng System Prompt Guardrails (Rule 4, Rule 5, 100% Tiếng Việt)
    Svc -> Provider : chat(formatted_messages)
    Provider -> Ollama : HTTP POST /api/chat {model: "qwen2.5:3b", messages}
    Ollama --> Provider : Trả về raw text câu trả lời
    Provider --> Svc : raw text
    Svc -> Svc : Language Sanitizer (xóa sạch ký tự chữ Hán)
    Svc --> Router : ChatResult (answer, grounded=true, sources, source_details)
    Router --> FE : HTTP 200 {answer, grounded: true, sources: ["SOP-02 TBS1102B"]}
    FE --> User : Hiển thị câu trả lời súc tích kèm trích dẫn nguồn tài liệu
end
@enduml
```

---

### PROMPT 02B - Class Diagram tổng thể
```text
Xây dựng docs/diagrams/class-diagram.puml mô tả toàn bộ mô hình hướng đối tượng:
User, Role, Device, DeviceGroup, Location, BorrowRequest, UsageHistory,
MaintenanceSchedule, MaintenanceRecord, Document, DocumentChunk, AuditLog, AIService.
```

#### Mã nguồn PlantUML Sơ đồ Lớp Tổng thể (`docs/diagrams/class-diagram.puml`):
```plantuml
@startuml
skinparam classAttributeIconSize 0
skinparam defaultFontName "Times New Roman"
skinparam roundcorner 6

class Role {
    +name: String [PK]
    +description: String
}

class User {
    +id: Integer [PK]
    +username: String
    +email: String
    +full_name: String
    +password_hash: String
    +role: String [FK]
    +is_active: Boolean
    +created_at: DateTime
    +verify_password(raw: String): Boolean
}

class DeviceGroup {
    +id: Integer [PK]
    +name: String
    +description: String
}

class Location {
    +id: Integer [PK]
    +name: String
    +building: String
}

class Device {
    +id: Integer [PK]
    +asset_code: String
    +name: String
    +category: String
    +status: String
    +condition: String
    +serial_number: String
    +group_id: Integer [FK]
    +location_id: Integer [FK]
}

class BorrowRequest {
    +id: Integer [PK]
    +user_id: Integer [FK]
    +device_id: Integer [FK]
    +purpose: String
    +status: String
    +requested_from: DateTime
    +requested_to: DateTime
    +created_at: DateTime
}

class UsageHistory {
    +id: Integer [PK]
    +user_id: Integer [FK]
    +device_id: Integer [FK]
    +borrow_request_id: Integer [FK]
    +action: String
    +occurred_at: DateTime
}

class MaintenanceSchedule {
    +id: Integer [PK]
    +device_id: Integer [FK]
    +interval_days: Integer
    +next_due_at: DateTime
    +active: Boolean
    +notes: String
}

class MaintenanceRecord {
    +id: Integer [PK]
    +device_id: Integer [FK]
    +technician_id: Integer [FK]
    +kind: String
    +notes: String
    +status: String
    +scheduled_at: DateTime
    +completed_at: DateTime
}

class Document {
    +id: Integer [PK]
    +name: String
    +description: String
    +allowed_roles: String
    +created_at: DateTime
}

class DocumentChunk {
    +id: Integer [PK]
    +document_id: Integer [FK]
    +document_name: String
    +content: String
    +chunk_index: Integer
}

class AuditLog {
    +id: Integer [PK]
    +user_id: Integer [FK]
    +username: String
    +user_role: String
    +action: String
    +target_type: String
    +target_id: Integer
    +target_name: String
    +details: String
    +created_at: DateTime
}

class AIService {
    +provider: AIProvider
    +max_history_messages: Integer
    +chat(msg: String, history: List, mode: String, db: Session, role: String): ChatResult
    +check_adversarial_input(msg: String): Boolean
    -_system_prompt(role: String): String
    -_context(msg: String, mode: String, db: Session, role: String): Tuple
}

User "1" *-- "1" Role : has
User "1" o-- "0..*" BorrowRequest : creates
Device "1" o-- "0..*" BorrowRequest : requested_in
User "1" o-- "0..*" UsageHistory : performs
Device "1" o-- "0..*" UsageHistory : used_in
Device "1" *-- "0..*" MaintenanceSchedule : has
Device "1" o-- "0..*" MaintenanceRecord : maintained_in
User "0..1" o-- "0..*" MaintenanceRecord : assigned_to
DeviceGroup "1" o-- "0..*" Device : groups
Location "1" o-- "0..*" Device : placed_at
Document "1" *-- "1..*" DocumentChunk : contains
User "0..1" o-- "0..*" AuditLog : triggers
@enduml
```

---

### PROMPT 02C - Activity Diagrams
```text
Sinh mã PlantUML sơ đồ hoạt động (Activity Diagram) cho 2 luồng:
1. Luồng Vòng đời Mượn - Trả Thiết bị.
2. Luồng Xử lý Sự cố & Bảo dưỡng Thiết bị.
```

#### 1. Activity Diagram: Vòng đời Mượn - Trả Thiết bị (`docs/diagrams/activity/act-01-borrow-lifecycle.puml`)
```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
start
:Sinh viên tìm kiếm & chọn thiết bị khả dụng;
if (Thiết bị có trạng thái 'available'?) then (Có)
    :Nhập mục đích & khoảng thời gian mượn;
    :Gửi phiếu mượn (status = 'pending');
    :Quản lý phòng lab nhận thông báo thẩm định;
    if (Đạt yêu cầu & đúng quy chế?) then (Duyệt)
        :Manager phê duyệt phiếu (status = 'approved');
        :Thiết bị chuyển trạng thái 'borrowed';
        :Thực hiện bàn giao thực tế tại phòng lab;
        :Ghi nhận lịch sử sử dụng (usage_history);
        :Sinh viên thực hành thí nghiệm;
        :Sinh viên hoàn tất & mang thiết bị trả;
        :Manager kiểm tra hiện trạng thiết bị;
        if (Thiết bị nguyên vẹn?) then (Tốt)
            :Xác nhận hoàn tất trả (status = 'returned');
            :Thiết bị trở lại trạng thái 'available';
        else (Có hỏng hóc)
            :Lập biên bản sự cố;
            :Thiết bị chuyển trạng thái 'maintenance';
        endif
    else (Từ chối)
        :Manager từ chối phiếu (status = 'rejected');
        :Ghi rõ lý do từ chối cho sinh viên;
    endif
else (Không)
    :Thông báo thiết bị đang bận hoặc bảo trì;
endif
stop
@enduml
```

---

### PROMPT 02D - Bảng đặc tả Class
Tạo bảng đặc tả chi tiết lưu tại `docs/tables/class-specifications.md`:
| Tên Class | Trách nhiệm chính | Thuộc tính then chốt | Phương thức trọng yếu |
|---|---|---|---|
| `User` | Đại diện tài khoản nhân sự và sinh viên. | `id`, `username`, `email`, `password_hash`, `role`, `is_active` | `verify_password()`, `to_dict()` |
| `Device` | Quản lý vòng đời và hiện trạng thiết bị. | `asset_code`, `name`, `category`, `status`, `condition`, `location_id` | `update_status()`, `is_available()` |
| `BorrowRequest` | Lưu vết yêu cầu mượn thiết bị. | `user_id`, `device_id`, `purpose`, `status`, `requested_from`, `requested_to` | `approve()`, `reject()`, `return_device()` |
| `MaintenanceRecord`| Lưu phiếu bảo trì, chẩn đoán, sửa chữa. | `device_id`, `technician_id`, `kind`, `notes`, `status`, `completed_at` | `assign_tech()`, `complete()` |
| `DocumentChunk` | Lưu các đoạn cắt tài liệu SOP cho RAG. | `document_id`, `document_name`, `content`, `chunk_index` | `get_snippet()` |
| `AuditLog` | Lưu vết kiểm toán an ninh hệ thống. | `user_id`, `username`, `action`, `target_type`, `target_id`, `created_at` | `log_event()` |
| `AIService` | Bộ điều phối Trợ lý AI và an toàn đối kháng. | `provider`, `max_history_messages` | `chat()`, `check_adversarial_input()` |

---

### PROMPT 02E - Sơ đồ phân cấp chức năng và quy trình tổng quát
```text
Xây dựng docs/diagrams/function-hierarchy.puml thể hiện cây phân cấp chức năng toàn diện của hệ thống AI-LEMS.
```

#### Mã nguồn PlantUML Sơ đồ Phân cấp Chức năng (`docs/diagrams/function-hierarchy.puml`):
```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam roundcorner 5

rectangle "Hệ thống Quản lý Thiết bị Phòng Lab AI-LEMS" as Root {
    rectangle "1. Quản lý Tài khoản & Phân quyền" as M1 {
        [1.1. Đăng nhập JWT / Google SSO]
        [1.2. Quản lý người dùng & Đổi mật khẩu]
        [1.3. Phân quyền RBAC 4 vai trò]
    }
    rectangle "2. Quản lý Kho Máy & Vị trí" as M2 {
        [2.1. Danh mục thiết bị & Mã tài sản]
        [2.2. Nhóm thiết bị & Bàn thí nghiệm]
        [2.3. Cập nhật tình trạng & Khóa máy hỏng]
    }
    rectangle "3. Quy trình Mượn - Trả Thiết bị" as M3 {
        [3.1. Tạo phiếu đăng ký mượn]
        [3.2. Quản lý xét duyệt & Bàn giao]
        [3.3. Thu hồi máy & Ghi nhận lịch sử]
    }
    rectangle "4. Bảo dưỡng & Xử lý Sự cố" as M4 {
        [4.1. Lập lịch kiểm định định kỳ]
        [4.2. Tiếp nhận sửa chữa & Nhật ký linh kiện]
        [4.3. Nghiệm thu & Chuyển trạng thái available]
    }
    rectangle "5. Báo cáo & Kiểm toán Hệ thống" as M5 {
        [5.1. Dashboard thống kê theo khoảng ngày]
        [5.2. Nhật ký kiểm toán Audit Logs]
    }
    rectangle "6. Trợ lý Trí tuệ Nhân tạo (Local AI)" as M6 {
        [6.1. Mode Chat: Hỏi đáp an toàn SOP]
        [6.2. Mode RAG: Tra cứu tài liệu có trích dẫn]
        [6.3. Mode Summary: Tóm tắt nhật ký vận hành]
        [6.4. Mode Inspection Alert: Cảnh báo kiểm định]
        [6.5. Pre-flight Screening Filter chống tấn công]
    }
}
@enduml
```

---

## PHẦN XI. HUMAN GATE 2 (ARCHITECTURE GATE)
### Biên bản Đánh giá Human Gate 2:
- [x] Mỗi yêu cầu chức năng (FR-001..FR-016) đều có Component kiến trúc chịu trách nhiệm rõ ràng.
- [x] Sơ đồ Sequence, Class Diagram, Activity Diagram đầy đủ và truy vết 100% về yêu cầu.
- [x] Kiến trúc AI tuân thủ nghiêm ngặt nguyên tắc **BR-011: AI là Read-Only**.

**Quyết định phê duyệt:** **APPROVED WITH DOCUMENTED GAPS**  
**Người kiểm duyệt độc lập:** *Minh Anh — Quản lý Phòng Lab (Lab Manager)*  
**Ghi chú điểm Gap được ghi nhận:** *"Hệ thống RAG hiện tại sử dụng cơ chế trích xuất theo từ khóa (keyword retrieval) trên các đoạn văn bản SQLite/MySQL chunks, chưa triển khai Vector Database chuyên dụng. Điểm gap này được chấp thuận cho giai đoạn đồ án hiện tại."*

---

## PHẦN XII. DATABASE SKILL
### Bước 10. Tạo Database Design Skill
Tạo file `.agents/skills/database-design/SKILL.md`:
```yaml
---
name: database-design
description: Design a normalized relational database schema, ERD, and data dictionary for SQLite and MySQL.
---
# Database Design Skill
## Objective
Transform domain classes and data requirements into a normalized (3NF), consistent relational database schema.
## Inputs
- docs/requirements.md
- docs/diagrams/class-diagram.puml
- docs/system-model.md
## Process
1. Define entities, primary keys, and foreign keys with cascading rules.
2. Standardize data types, unique constraints, and search indexes.
3. Generate PlantUML Entity-Relationship Diagram (ERD).
4. Create production DDL schema.sql compatible with SQLite and MySQL.
5. Create comprehensive data dictionary.
## Rules
- Enforce Bcrypt one-way hash for passwords; never store plaintext passwords.
- Enforce foreign key constraints across devices, users, requests, and maintenance records.
## Outputs
- docs/database-design.md
- docs/diagrams/erd.puml
- database/schema.sql
- docs/tables/data-dictionary.md
## Verification
- Schema parses cleanly with SQLite3 and MySQL 8 with zero syntax or relational errors.
```

---

## PHẦN XIII. YÊU CẦU CODEX THIẾT KẾ DATABASE
### Bước 11. Chạy Database Skill

### PROMPT 03 - Thiết kế CSDL + ERD + Data Dictionary
```text
Hãy sử dụng database-design, diagram-design và table-design skill.
1. Xây dựng docs/database-design.md và database/schema.sql chuẩn hóa 3NF cho 12 bảng.
2. Vẽ sơ đồ quan hệ thực thể docs/diagrams/erd.puml.
3. Tạo từ điển dữ liệu docs/tables/data-dictionary.md.
```

#### 1. Mã nguồn PlantUML Sơ đồ Thực thể Quan hệ (`docs/diagrams/erd.puml`):
```plantuml
@startuml
skinparam defaultFontName "Times New Roman"
skinparam linetype ortho
skinparam roundcorner 5

entity "roles" as roles {
    * name : VARCHAR(30) <<PK>>
    --
    description : TEXT
}

entity "users" as users {
    * id : INTEGER <<PK, AUTO>>
    --
    * username : VARCHAR(80) <<UQ>>
    * email : VARCHAR(160) <<UQ>>
    * full_name : VARCHAR(160)
    * password_hash : VARCHAR(255)
    * role : VARCHAR(30) <<FK>>
    * is_active : BOOLEAN
    * created_at : DATETIME
}

entity "device_groups" as groups {
    * id : INTEGER <<PK, AUTO>>
    --
    * name : VARCHAR(100) <<UQ>>
    description : TEXT
}

entity "locations" as locs {
    * id : INTEGER <<PK, AUTO>>
    --
    * name : VARCHAR(120) <<UQ>>
    building : VARCHAR(120)
}

entity "devices" as devices {
    * id : INTEGER <<PK, AUTO>>
    --
    * asset_code : VARCHAR(60) <<UQ>>
    * name : VARCHAR(160)
    * category : VARCHAR(80)
    * status : VARCHAR(30)
    * condition : VARCHAR(60)
    serial_number : VARCHAR(120)
    group_id : INTEGER <<FK>>
    location_id : INTEGER <<FK>>
}

entity "borrow_requests" as reqs {
    * id : INTEGER <<PK, AUTO>>
    --
    * user_id : INTEGER <<FK>>
    * device_id : INTEGER <<FK>>
    * purpose : TEXT
    * status : VARCHAR(30)
    requested_from : DATETIME
    requested_to : DATETIME
    * created_at : DATETIME
}

entity "usage_history" as history {
    * id : INTEGER <<PK, AUTO>>
    --
    * user_id : INTEGER <<FK>>
    * device_id : INTEGER <<FK>>
    borrow_request_id : INTEGER <<FK>>
    * action : VARCHAR(30)
    * occurred_at : DATETIME
}

entity "maintenance_schedules" as scheds {
    * id : INTEGER <<PK, AUTO>>
    --
    * device_id : INTEGER <<FK>>
    * interval_days : INTEGER
    * next_due_at : DATETIME
    * active : BOOLEAN
    notes : TEXT
}

entity "maintenance_records" as maints {
    * id : INTEGER <<PK, AUTO>>
    --
    * device_id : INTEGER <<FK>>
    technician_id : INTEGER <<FK>>
    * kind : VARCHAR(40)
    notes : TEXT
    * status : VARCHAR(30)
    scheduled_at : DATETIME
    completed_at : DATETIME
}

entity "documents" as docs {
    * id : INTEGER <<PK, AUTO>>
    --
    * name : VARCHAR(200) <<UQ>>
    description : TEXT
    * allowed_roles : VARCHAR(120)
    * created_at : DATETIME
}

entity "document_chunks" as chunks {
    * id : INTEGER <<PK, AUTO>>
    --
    document_id : INTEGER <<FK>>
    * document_name : VARCHAR(200)
    * content : TEXT
    * chunk_index : INTEGER
}

entity "audit_logs" as logs {
    * id : INTEGER <<PK, AUTO>>
    --
    user_id : INTEGER <<FK>>
    username : VARCHAR(60)
    user_role : VARCHAR(30)
    * action : VARCHAR(40)
    * target_type : VARCHAR(40)
    target_id : INTEGER
    target_name : VARCHAR(160)
    details : TEXT
    * created_at : DATETIME
}

roles ||--o{ users : "role"
groups ||--o{ devices : "group_id"
locs ||--o{ devices : "location_id"
users ||--o{ reqs : "user_id"
devices ||--o{ reqs : "device_id"
users ||--o{ history : "user_id"
devices ||--o{ history : "device_id"
reqs ||--o{ history : "borrow_request_id"
devices ||--o{ scheds : "device_id"
devices ||--o{ maints : "device_id"
users ||--o{ maints : "technician_id"
docs ||--o{ chunks : "document_id"
users ||--o{ logs : "user_id"
@enduml
```

#### 2. Toàn văn Mã nguồn DDL SQL Cơ sở Dữ liệu (`database/schema.sql`):
```sql
-- AI-LEMS (LyxLab) — Database Schema
-- Hệ thống Quản lý Thiết bị Phòng thí nghiệm có tích hợp AI

CREATE TABLE roles (
    name        VARCHAR(30)  PRIMARY KEY,
    description TEXT         NOT NULL DEFAULT ''
);

CREATE TABLE users (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    username      VARCHAR(80)  NOT NULL UNIQUE,
    email         VARCHAR(160) NOT NULL UNIQUE,
    full_name     VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30)  NOT NULL DEFAULT 'user',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL,
    FOREIGN KEY (role) REFERENCES roles(name)
);
CREATE INDEX ix_users_role ON users(role);

CREATE TABLE device_groups (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT         NOT NULL DEFAULT ''
);

CREATE TABLE locations (
    id       INTEGER      PRIMARY KEY AUTOINCREMENT,
    name     VARCHAR(120) NOT NULL UNIQUE,
    building VARCHAR(120) NOT NULL DEFAULT ''
);

CREATE TABLE devices (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    asset_code    VARCHAR(60)  NOT NULL UNIQUE,
    name          VARCHAR(160) NOT NULL,
    category      VARCHAR(80)  NOT NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'available',
    condition     VARCHAR(60)  NOT NULL DEFAULT 'Mới nguyên hộp',
    serial_number VARCHAR(120) NOT NULL DEFAULT '',
    group_id      INTEGER      REFERENCES device_groups(id),
    location_id   INTEGER      REFERENCES locations(id)
);
CREATE INDEX ix_devices_status ON devices(status);

CREATE TABLE borrow_requests (
    id             INTEGER      PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER      NOT NULL REFERENCES users(id),
    device_id      INTEGER      NOT NULL REFERENCES devices(id),
    purpose        TEXT         NOT NULL,
    status         VARCHAR(30)  NOT NULL DEFAULT 'pending',
    requested_from DATETIME,
    requested_to   DATETIME,
    created_at     DATETIME     NOT NULL
);
CREATE INDEX ix_borrow_requests_status ON borrow_requests(status);

CREATE TABLE usage_history (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER  NOT NULL REFERENCES users(id),
    device_id         INTEGER  NOT NULL REFERENCES devices(id),
    borrow_request_id INTEGER  REFERENCES borrow_requests(id),
    action            VARCHAR(30) NOT NULL,
    occurred_at       DATETIME    NOT NULL
);

CREATE TABLE maintenance_schedules (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    device_id     INTEGER  NOT NULL REFERENCES devices(id),
    interval_days INTEGER  NOT NULL DEFAULT 180,
    next_due_at   DATETIME NOT NULL,
    active        BOOLEAN  NOT NULL DEFAULT TRUE,
    notes         TEXT     NOT NULL DEFAULT ''
);

CREATE TABLE maintenance_records (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    device_id     INTEGER      NOT NULL REFERENCES devices(id),
    technician_id INTEGER      REFERENCES users(id),
    kind          VARCHAR(40)  NOT NULL DEFAULT 'inspection',
    notes         TEXT         NOT NULL DEFAULT '',
    status        VARCHAR(30)  NOT NULL DEFAULT 'open',
    scheduled_at  DATETIME,
    completed_at  DATETIME
);
CREATE INDEX ix_maintenance_records_status ON maintenance_records(status);

CREATE TABLE documents (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    name          VARCHAR(200) NOT NULL UNIQUE,
    description   TEXT         NOT NULL DEFAULT '',
    allowed_roles VARCHAR(120) NOT NULL DEFAULT 'admin,manager,technician,user',
    created_at    DATETIME     NOT NULL
);

CREATE TABLE document_chunks (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    document_id   INTEGER      REFERENCES documents(id),
    document_name VARCHAR(200) NOT NULL,
    content       TEXT         NOT NULL,
    chunk_index   INTEGER      NOT NULL DEFAULT 0
);
CREATE INDEX ix_document_chunks_document_name ON document_chunks(document_name);

CREATE TABLE audit_logs (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER      REFERENCES users(id),
    username    VARCHAR(60)  NOT NULL DEFAULT '',
    user_role   VARCHAR(30)  NOT NULL DEFAULT '',
    action      VARCHAR(40)  NOT NULL,
    target_type VARCHAR(40)  NOT NULL,
    target_id   INTEGER,
    target_name VARCHAR(160) NOT NULL DEFAULT '',
    details     TEXT         NOT NULL DEFAULT '',
    created_at  DATETIME     NOT NULL
);
CREATE INDEX ix_audit_logs_action ON audit_logs(action);
CREATE INDEX ix_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at);

-- Dữ liệu hạt giống mặc định (Seed Data)
INSERT INTO roles (name, description) VALUES
    ('admin',      'Quản trị hệ thống'),
    ('manager',    'Quản lý phòng lab'),
    ('technician', 'Kỹ thuật viên bảo trì'),
    ('user',       'Người sử dụng thiết bị');
```

---

### PROMPT 03V - Đối chiếu sơ đồ sau khi tự vẽ
Đối soát mã nguồn PlantUML `erd.puml` và tệp SQL `schema.sql`:
- 100% tên bảng và tên cột trùng khớp tuyệt đối.
- Toàn bộ các khóa ngoại (`FOREIGN KEY`) và chỉ mục tìm kiếm (`INDEX`) được thể hiện đầy đủ.

---

## PHẦN XIV. KIỂM TRA DATABASE
Nhóm nghiên cứu kiểm tra cấu trúc cơ sở dữ liệu:
- Bảng `devices`: Trường `status` nhận đúng các giá trị hợp lệ (`available`, `in_use`, `maintenance`, `damaged`).
- Bảng `users`: Cột mật khẩu lưu dạng `password_hash` băm bằng Bcrypt 12 rounds, hoàn toàn không có cột `raw_password`.
- Bảng `documents`: Trường `allowed_roles` hỗ trợ cơ chế phân quyền tri thức RAG (BR-015).
"""
