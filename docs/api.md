# API Documentation — AI-LEMS (LyxLab)

Tài liệu này mô tả **đúng các endpoint đang chạy thực tế** của backend FastAPI
(mã nguồn: `backend/app/routers/`, ứng dụng: `backend/app/main.py`).
Mọi endpoint cũng có thể xem dạng OpenAPI tương tác tại `http://localhost:8000/docs`.

## Thông tin chung

- **Base URL:** `http://localhost:8000`
- **Kiểu xác thực:** JWT Bearer (HS256, hết hạn 60 phút) qua header
  `Authorization: Bearer <token>`
- **Vai trò (RBAC):** `admin` (Quản lý phòng lab), `manager` (Quản lý, được hỗ trợ trong API),
  `technician` (Kỹ thuật viên), `user` (Người sử dụng)
- **Định dạng:** JSON, trừ `POST /api/auth/login` dùng form-urlencoded (OAuth2 password flow)
- **Múi giờ:** mọi datetime trả về ở dạng ISO 8601 múi giờ `+07:00` (Hà Nội)

## Danh mục endpoint

| # | Endpoint | Method | Quyền |
|---|----------|--------|-------|
| 1 | `/api/auth/register` | POST | Công khai |
| 2 | `/api/auth/login` | POST | Công khai (form) |
| 3 | `/api/auth/google` | POST | Công khai (Google ID token) |
| 4 | `/api/auth/me` | GET | Đã đăng nhập |
| 5 | `/api/auth/password` | PATCH | Đã đăng nhập |
| 6 | `/api/users` | GET | admin, manager |
| 7 | `/api/users` | POST | admin, manager |
| 8 | `/api/users/{id}` | PATCH | admin, manager |
| 9 | `/api/users/{id}` | DELETE | admin, manager |
| 10 | `/api/users/{id}/reset-password` | POST | admin, manager |
| 11 | `/api/devices` | GET | Đã đăng nhập |
| 12 | `/api/devices` | POST | admin, manager |
| 13 | `/api/devices/{id}/status` | PATCH | admin, manager, technician |
| 14 | `/api/devices/{id}` | PATCH | admin, manager |
| 15 | `/api/devices/{id}` | DELETE | admin, manager |
| 16 | `/api/requests` | GET / POST | Đã đăng nhập |
| 17 | `/api/requests/{id}/status` | PATCH | admin, manager |
| 18 | `/api/requests/{id}/approve` | PATCH | admin, manager |
| 19 | `/api/requests/{id}/borrow` | PATCH | chủ yêu cầu, admin, manager |
| 20 | `/api/requests/{id}/request-return` | PATCH | chủ yêu cầu, admin, manager |
| 21 | `/api/requests/{id}/confirm-return` | PATCH | admin, manager, technician |
| 22 | `/api/requests/{id}/return` | PATCH | chủ yêu cầu, admin, manager, technician |
| 23 | `/api/requests/{id}/incident` | POST | chủ yêu cầu, admin, manager, technician |
| 24 | `/api/maintenance` | GET / POST | GET: đã đăng nhập; POST: admin/manager/technician |
| 25 | `/api/maintenance/{id}/complete` | PATCH | admin, manager, technician |
| 26 | `/api/maintenance/{id}/accept` | PATCH | technician |
| 27 | `/api/maintenance/{id}` | PATCH / DELETE | admin, manager, technician |
| 28 | `/api/maintenance/schedules` | GET / POST | GET: đã đăng nhập; POST: admin/manager/technician |
| 29 | `/api/stats` | GET | Đã đăng nhập |
| 30 | `/api/groups` | GET / POST | GET: đã đăng nhập; POST: admin, manager |
| 31 | `/api/locations` | GET / POST | GET: đã đăng nhập; POST: admin, manager |
| 32 | `/api/ai/chat` | POST | Đã đăng nhập |
| 33 | `/api/audit-logs` | GET | admin/manager: tất cả; role khác: của chính mình |
| 34 | `/health`, `/api/capabilities` | GET | Công khai |

---

## 1. Xác thực — `/api/auth`

### POST /api/auth/register — đăng ký tài khoản
Đăng ký công khai; **luôn được gán role `user`** (không thể tự nâng quyền).

```json
// Request
{ "username": "sinhvien01", "email": "sv01@uit.edu.vn", "full_name": "Nguyen Van A", "password": "matkhau8kitu" }
// Response 201
{ "id": 5, "username": "sinhvien01", "email": "sv01@uit.edu.vn", "full_name": "Nguyen Van A", "role": "user", "is_active": true }
```

`400` nếu thiếu trường, `403` nếu cố gửi `role` khác `user`, `409` nếu username/email đã tồn tại.

### POST /api/auth/login — đăng nhập
**OAuth2 form-urlencoded** (đúng chuẩn Swagger UI): `username=...&password=...`
Trường `username` chấp nhận **tên đăng nhập hoặc email**.

```
// Response 200
{ "access_token": "eyJhbGciOi...", "token_type": "bearer" }
```

`401` sai thông tin đăng nhập, `403` tài khoản bị khóa (`is_active = false`).

### POST /api/auth/google — đăng nhập Google Workspace
```json
// Request
{ "id_token": "<Google ID token>" }
```
Token được xác thực với `https://oauth2.googleapis.com/tokeninfo`; email phải đã
`email_verified`, **phải tồn tại sẵn trong hệ thống** và đang hoạt động — nếu chưa,
tài khoản cần do quản lý cấp trước. `200` trả về Token; `401` token không hợp lệ;
`403` email chưa được phân quyền / bị vô hiệu hóa.

### GET /api/auth/me — thông tin tài khoản hiện tại
```json
{ "id": 1, "username": "admin", "email": "admin@lab.local", "full_name": "Administrator", "role": "admin", "is_active": true }
```

### PATCH /api/auth/password — đổi mật khẩu của chính mình
```json
// Request  →  Response 204 (không có body)
{ "current_password": "...", "new_password": "matkhaumoi8kitu" }
```
`400` mật khẩu hiện tại sai hoặc trùng mật khẩu mới; `422` mật khẩu mới < 8 ký tự.

---

## 2. Quản lý tài khoản — `/api/users` (admin, manager)

### GET /api/users
Danh sách tất cả tài khoản (mới nhất trước).

### POST /api/users — tạo tài khoản
```json
// Request
{ "username": "tech02", "email": "tech02@lab.local", "full_name": "Ky Thuat Vien 02", "password": "matkhau8kitu", "role": "technician" }
// Response 201 — UserOut
```
Phân quyền theo người tạo: **admin** được gán `admin | manager | user | technician`;
**manager** chỉ được gán `user | technician`. `400` role không hợp lệ,
`409` username/email trùng.

### PATCH /api/users/{id} — cập nhật một phần
Các trường tùy chọn: `username`, `full_name`, `email`, `role`, `is_active`, `password`.
Chỉ ghi những trường thực sự thay đổi vào audit log. `400` mật khẩu mới < 8 ký tự
hoặc username trùng.

### DELETE /api/users/{id}
`204`. `400` không thể tự xóa tài khoản đang đăng nhập.

### POST /api/users/{id}/reset-password
```json
// Request  →  Response 204
{ "new_password": "matkhaumoi8kitu" }
```
Mật khẩu được bcrypt-hash trước khi lưu; hệ thống **không lưu plaintext**.

---

## 3. Thiết bị — `/api/devices`

### GET /api/devices?status=available
Lọc tùy chọn theo `status`. Mỗi thiết bị gồm: `id, asset_code, name, category,
status, condition, serial_number, group_id, location_id`.

`DeviceStatus` hợp lệ: `available`, `reserved`, `borrowed`, `maintenance`,
`returning`, `pending_inspection`, `in_progress`, `replace_partial`, `replace_full`.

### POST /api/devices (admin, manager)
```json
// Request
{ "asset_code": "EQ-026", "name": "Oscilloscope Rigol DS1054Z", "category": "Máy đo",
  "serial_number": "DS1ZA234567", "group_id": 4, "location_id": 2,
  "condition": "Mới nguyên hộp" }
// Response 201 — DeviceOut
```
`400` nếu `asset_code` hoặc `serial_number` đã tồn tại.

### PATCH /api/devices/{id}/status?status=maintenance&condition=Hỏng%20một%20phần
Đổi trạng thái thiết bị. **Technician bị giới hạn** chỉ được đặt các trạng thái
kỹ thuật: `inspection`, `in_progress`, `replace_partial`, `replace_full`,
`maintenance`. `403` nếu vượt quyền, `404` không tìm thấy.

### PATCH /api/devices/{id} (admin, manager)
Cập nhật `name, category, condition, serial_number, location_id, group_id, status`
(kiểm tra trùng serial khi đổi).

### DELETE /api/devices/{id} (admin, manager)
Thanh lý/xóa thiết bị. `409` nếu thiết bị đang `borrowed`.

---

## 4. Mượn — Trả thiết bị — `/api/requests`

### Máy trạng thái (request status)
```
pending ──approve──▶ approved ──borrow──▶ borrowed ──request-return──▶ return_pending ──confirm-return──▶ returned
   │                    │                                                    │
   └──reject──▶ rejected └──reject──▶ rejected        (return trực tiếp: borrowed ──return──▶ returned)
```
Đồng thời, trạng thái **thiết bị** được đồng bộ tự động:
`pending→available` · `approved→reserved` · `borrow→borrowed` ·
`request-return→returning` · `return/confirm-return→available` (hoặc `maintenance`
nếu phát hiện hỏng hóc).

### GET /api/requests
Role `user` chỉ thấy yêu cầu của chính mình; admin/manager/technician thấy tất cả.

### POST /api/requests — tạo yêu cầu mượn
```json
// Request
{ "device_id": 3, "purpose": "Bài thực hành vi điều khiển tuần 6",
  "requested_from": "2026-09-25T08:00:00+07:00",
  "requested_to":   "2026-09-25T11:00:00+07:00" }
// Response 201 — RequestOut
```
`409` nếu thiết bị không ở trạng thái `available`; `422` nếu thời điểm bắt đầu quá
quá khứ (> 15 phút), kết thúc trước bắt đầu, hoặc kết thúc trong quá khứ.

### PATCH /api/requests/{id}/approve · /reject (admin, manager)
`approve`: `pending → approved`. Từ chối dùng `PATCH /status?status=rejected`.

### PATCH /api/requests/{id}/borrow (chủ yêu cầu, admin, manager)
`approved → borrowed`, thiết bị `reserved → borrowed`.

### PATCH /api/requests/{id}/request-return (chủ yêu cầu, admin, manager)
Bước 1 của trả 2 bước: `borrowed → return_pending`, thiết bị `→ returning`.

### PATCH /api/requests/{id}/confirm-return (admin, manager, technician)
Bước 2 — tiếp nhận và xác nhận trả:
```json
// Request
{ "condition": "Đã qua sử dụng - Hoạt động tốt", "notes": "Kiểm tra đầu dò OK" }
```
- Tình trạng tốt → `returned`, thiết bị `→ available`.
- Tình trạng có từ khóa hỏng hóc ("hỏng", "lỗi", "sự cố", "damaged", "faulty"…) →
  thiết bị `→ maintenance` và **tự tạo phiếu bảo trì `kind="inspection"`**.
- **Chặn nếu thiết bị đang trong luồng sự cố** (`pending_inspection`/`in_progress`/
  `replace_*` còn phiếu `kind="incident"` mở): `409`.

### PATCH /api/requests/{id}/return (chủ yêu cầu, admin, manager, technician)
Trả trực tiếp một bước từ `borrowed → returned` (cùng logic chặn sự cố như trên).

### POST /api/requests/{id}/incident — báo sự cố
```json
// Request  →  Response 200 — RequestOut
{ "description": "Rơi máy, màn hình không lên" }
```
Chỉ khi yêu cầu đang `borrowed`. Thiết bị `→ pending_inspection`, condition ghi
"Hỏng hóc / Lỗi phần cứng", tự tạo phiếu bảo trì `kind="incident"` mở.

---

## 5. Bảo trì — `/api/maintenance`

### GET /api/maintenance
Danh sách phiếu bảo trì/sửa chữa. `MaintenanceOut` gồm: `id, device_id,
technician_id, kind, notes, status, scheduled_at, completed_at`.

### POST /api/maintenance (admin, manager, technician)
```json
// Request
{ "device_id": 3, "kind": "inspection", "notes": "Kiểm tra định kỳ 6 tháng",
  "scheduled_at": "2026-10-01T09:00:00+07:00", "status": "open" }
// Response 201 — MaintenanceOut
```
Đồng bộ trạng thái thiết bị: `completed` → `available`; trạng thái khác → `maintenance`.

### PATCH /api/maintenance/{id}/complete
Hoàn tất phiếu: `status=completed`, `completed_at` = giờ Hà Nội hiện tại,
thiết bị `→ available`.

### PATCH /api/maintenance/{id}/accept (technician)
Kỹ thuật viên **tiếp nhận sự cố**: phiếu phải đang `open` + `kind="incident"`;
thiết bị `→ in_progress`; ghi nhận `technician_id`.

### PATCH /api/maintenance/{id} (admin, manager, technician)
Cập nhật `status, notes, device_condition` với đồng bộ trạng thái thiết bị đầy đủ:
`completed → available`; `replace_partial / replace_full →` trạng thái tương ứng
(tự đóng yêu cầu mượn đang mở); `in_progress → in_progress`; `open → maintenance`
nếu thiết bị đang available.

### DELETE /api/maintenance/{id} — xóa phiếu (admin, manager, technician).

### GET/POST /api/maintenance/schedules
Lịch bảo trì định kỳ: `{ "device_id": 3, "interval_days": 180,
"next_due_at": "2027-03-01T09:00:00+07:00", "active": true, "notes": "" }`.

---

## 6. Thống kê — `/api/stats`

### GET /api/stats?start=2026-09-01&end=2026-09-30
Khoảng thời gian tùy chọn (phải truyền **cả hai hoặc không truyền cả hai**, ngược lại `422`).

```json
// Response 200
{
  "users": 8, "devices": 26, "requests": 15, "maintenance_open": 2,
  "usage": 24, "usage_frequency": 6,
  "selected_from": "2026-09-01T00:00:00+07:00", "selected_to": "2026-09-30T23:59:59+07:00",
  "usage_by_action": { "BORROW": 10, "RETURN": 8, "INCIDENT": 1 }
}
```

---

## 7. Danh mục — `/api/groups`, `/api/locations`

- `GET /api/groups`, `GET /api/locations` — mọi người dùng đã đăng nhập.
- `POST` — admin, manager:
  `{ "name": "Máy đo", "description": "..." }` · `{ "name": "Lab 301", "building": "A3" }`

---

## 8. Trợ lý AI — `/api/ai/chat`

**Bắt buộc JWT** (endpoint không cho người ẩn danh). Model local Ollama
(`qwen2.5:3b`), RAG truy hồi từ khóa trên `document_chunks` (SOP/hướng dẫn).

```json
// Request
{
  "message": "Làm thế nào để đo an toàn trên máy soi hỏng cách điện?",
  "history": [ { "role": "user", "content": "..." }, { "role": "assistant", "content": "..." } ],
  "mode": "chat"
}
// Response 200
{
  "answer": "Trước tiên ngắt nguồn... (tiếng Việt)",
  "model": "qwen2.5:3b",
  "provider": "ollama",
  "mode": "chat",
  "grounded": true,
  "sources": ["SOP-01 An toàn điện", "SOP-02 Máy soi Tektronix"]
}
```

- `mode`: `chat` (hỏi đáp) | `rag` (truy hồi tài liệu) | `summary` (tóm tắt tình
  trạng thiết bị/bảo trì từ DB) | `inspection_alert` (cảnh báo thiết bị cần kiểm tra).
- Lịch sử hội thoại bị chặn giới hạn (`MAX_HISTORY_MESSAGES`, mặc định 12) và
  luôn loại bỏ `system` message do client gửi.
- AI **chỉ mang tính tham khảo (read-only)**: không tự duyệt yêu cầu, không tự đổi
  trạng thái thiết bị — mọi thay đổi phải do con người thao tác.
- `502` nếu nhà cung cấp AI không khả dụng (không lộ chi tiết lỗi nội bộ).

---

## 9. Nhật ký kiểm toán — `/api/audit-logs`

### GET /api/audit-logs?target_type=DEVICE&action=UPDATE&limit=200
`limit` 1–1000 (mặc định 200). admin/manager thấy toàn bộ; role khác chỉ thấy
bản ghi do chính mình tạo. Mỗi bản ghi: `id, user_id, username, user_role, action,
target_type, target_id, target_name, details, created_at`.

---

## 10. Endpoint hệ thống (công khai)

- `GET /health` → `{ "status": "ok" | "degraded", "ollama": true, "model": "qwen2.5:3b", "provider": "ollama", "capabilities": [...] }`
- `GET /api/capabilities` → thông tin provider/model/ năng lực AI.
- `GET /` → thông tin dịch vụ.

## Mã lỗi dùng chung

| Mã | Ý nghĩa |
|----|---------|
| 401 | Chưa đăng nhập / token hết hạn hoặc không hợp lệ |
| 403 | Vượt quyền RBAC, tài khoản bị khóa, hoặc gán role vượt thẩm quyền |
| 404 | Không tìm thấy tài nguyên |
| 409 | Trạng thái xung đột (thiết bị không available, serial trùng, luồng sự cố đang mở…) |
| 422 | Dữ liệu không hợp lệ (Pydantic / khoảng thời gian thống kê) |
| 502 | Nhà cung cấp AI (Ollama) không phản hồi |
