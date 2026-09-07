# AI-LEMS (AI Laboratory Equipment Management System)

Hệ thống quản lý thiết bị phòng thí nghiệm Điện tử, IoT và Hệ thống nhúng có tích hợp AI local.

## Phạm vi hiện tại

Hệ thống hiện có các phần sau:

- Đăng nhập bằng JWT và phân quyền ở backend.
- Quản lý thiết bị, nhóm thiết bị và vị trí ở mức API.
- Tạo yêu cầu mượn, phê duyệt, nhận và trả thiết bị.
- Ghi nhận lịch sử sử dụng thông qua các chuyển trạng thái mượn/trả.
- Tạo và hoàn thành bản ghi bảo trì; có lịch bảo trì ở mức API.
- Thống kê số người dùng, thiết bị, yêu cầu, bảo trì và lịch sử sử dụng.
- Chat local qua Ollama với model mặc định `qwen2.5:3b`.
- Tra cứu tài liệu theo keyword trong `document_chunks`, cùng hai chế độ summary và inspection alert.

Các phần chưa có giao diện hoặc chưa được triển khai đầy đủ được ghi rõ trong `docs/implementation-notes.md`; không xem chúng là tính năng đã hoàn thành.

## Kiến trúc thực tế

```text
React/Vite
  -> FastAPI routers
  -> JWT/RBAC dependencies
  -> SQLAlchemy models
  -> SQLite khi phát triển hoặc MySQL trong Docker

AI panel
  -> POST /api/ai/chat
  -> AIService
  -> keyword retrieval từ DocumentChunk
  -> Ollama local HTTP API
```

Hệ thống không gọi Gemini, OpenAI API hay dịch vụ AI bên thứ ba. Ollama là dịch vụ local được cấu hình qua `OLLAMA_BASE_URL`.

## Chạy backend local

Từ thư mục `local-lab-ai`:

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
uvicorn app.main:app --app-dir backend --reload --port 8000
```

Backend cung cấp tài liệu OpenAPI tại `http://localhost:8000/docs` và kiểm tra trạng thái tại `http://localhost:8000/health`.

## Chạy frontend local

```powershell
cd frontend
npm install
npm run dev
```

Mở `http://localhost:5173/login`.

Tài khoản seed cho môi trường local:

- `admin` / `admin123`
- `user` / `user123`
- `technician` / `tech123`

Frontend có dữ liệu mẫu để xem giao diện khi API offline. Dữ liệu mẫu không được coi là dữ liệu đã ghi vào database; các thao tác nghiệp vụ mới bị từ chối khi API không khả dụng.

## Cấu hình AI local

Các biến chính trong `.env`:

```env
DATABASE_URL=sqlite:///./lab.db
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
OLLAMA_NUM_PREDICT=512
MAX_HISTORY_MESSAGES=12
REQUEST_TIMEOUT_SECONDS=360
```

Đảm bảo Ollama đang chạy và model đã tồn tại:

```powershell
ollama pull qwen2.5:3b
ollama list
```

## Docker

`docker-compose.yml` chạy MySQL, FastAPI, React/nginx và Ollama. Backend trong Docker dùng MySQL; chạy local mặc định dùng SQLite theo `.env`.

```powershell
docker compose up --build
```

## Tài liệu AI-Augmented SDLC

- Yêu cầu: `docs/requirements.md`
- Kiến trúc: `docs/architecture.md`
- Thiết kế database: `docs/database-design.md`
- Thiết kế API: `docs/api-design.md`
- Ghi chú triển khai: `docs/implementation-notes.md`
- Kế hoạch kiểm thử: `docs/test-plan.md`
- Review code: `docs/code-review.md`
- Review bảo mật: `docs/security-review.md`
- Kiểm tra truy xuất: `traceability-report.md`

Các tài liệu này phân biệt rõ trạng thái `Implemented`, `Partial` và `Not implemented` để không phóng đại mức độ hoàn thiện của hệ thống.
