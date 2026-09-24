# Hướng dẫn sử dụng — AI-LEMS (LyxLab)

Hệ thống Quản lý Thiết bị Phòng thí nghiệm có tích hợp AI.
Tài liệu này mô tả đúng các tính năng **đang hoạt động** của hệ thống
(React frontend + FastAPI backend + Ollama AI local), theo 4 vai trò:
**Admin (Quản lý phòng lab), Manager (Quản lý), Technician (Kỹ thuật viên), User (Người sử dụng)**.

## Mục lục

1. [Đăng nhập & tài khoản](#đăng-nhập--tài-khoản)
2. [Vai trò và quyền hạn](#vai-trò-và-quyền-hạn)
3. [Luồng mượn — trả thiết bị](#luồng-mượn--trả-thiết-bị)
4. [Luồng sự cố và sửa chữa](#luồng-sự-cố-và-sửa-chữa)
5. [Trang theo từng vai trò](#trang-theo-từng-vai-trò)
6. [Bảo trì định kỳ](#bảo-trì-định-kỳ)
7. [Trợ lý AI](#trợ-lý-ai)
8. [Thống kê & báo cáo](#thống-kê--báo-cáo)
9. [Xử lý sự cố kỹ thuật](#xử-lý-sự-cố-kỹ-thuật)

---

## Đăng nhập & tài khoản

- Truy cập giao diện web (mặc định `http://localhost:5173` khi chạy dev) và đăng nhập bằng
  **tên đăng nhập hoặc email** + mật khẩu. Hỗ trợ đăng nhập Google Workspace (tài khoản
  phải được quản lý cấp sẵn trong hệ thống).
- Tài khoản mẫu sau khi seed:
  - `admin` / `admin123` — Quản lý phòng lab
  - `technician` / `tech123` — Kỹ thuật viên
  - `user` / `user123` — Người sử dụng
  - (`manager` được hỗ trợ trong API/schema; chỉ có trong dữ liệu mẫu MySQL `init.sql`)
- **Đổi mật khẩu:** mở biểu tượng hồ sơ → *Đổi mật khẩu*. Mật khẩu mới tối thiểu 8 ký tự.
  Mật khẩu được mã hóa một chiều (bcrypt) — **không ai (kể cả quản trị viên) xem lại
  được mật khẩu cũ**; nếu quên, quản trị viên đặt mật khẩu mới giúp bạn.
- Tự đăng ký tài khoản công khai luôn được gán vai trò `user`; tài khoản vai trò khác
  do Admin/Manager tạo trong mục *Người dùng*.

## Vai trò và quyền hạn

| Chức năng | Admin | Manager | Technician | User |
|---|:---:|:---:|:---:|:---:|
| Xem danh sách thiết bị | ✅ | ✅ | ✅ | ✅ |
| Thêm / sửa / thanh lý thiết bị | ✅ | ✅ | ❌ | ❌ |
| Đổi trạng thái kỹ thuật của thiết bị | ✅ | ✅ | ✅ (giới hạn các trạng thái kỹ thuật) | ❌ |
| Tạo yêu cầu mượn | ✅ | ✅ | ✅ | ✅ |
| Duyệt / từ chối yêu cầu | ✅ | ✅ | ❌ | ❌ |
| Nhận máy / báo hoàn trả | ✅ | ✅ | ✅ | ✅ (yêu cầu của mình) |
| Xác nhận hoàn trả, thu hồi | ✅ | ✅ | ✅ | ❌ |
| Tạo / cập nhật / hoàn tất phiếu bảo trì | ✅ | ✅ | ✅ | ❌ |
| Tiếp nhận sự cố (bắt đầu sửa) | ❌ | ❌ | ✅ | ❌ |
| Quản lý tài khoản (tạo / khóa / xóa) | ✅ | ✅ (chỉ tạo `user`, `technician`) | ❌ | ❌ |
| Xem nhật ký kiểm toán | ✅ (tất cả) | ✅ (tất cả) | của mình | của mình |
| Trợ lý AI | ✅ | ✅ | ✅ | ✅ |

## Luồng mượn — trả thiết bị

1. **User tạo yêu cầu mượn**: chọn thiết bị đang *Khả dụng* → bấm **Mượn** → nhập mục đích,
   thời gian mượn/trả mong muốn (hệ thống chặn mượn thời điểm trong quá khứ).
   Trạng thái yêu cầu: `pending` (Chờ duyệt).
2. **Manager/Admin duyệt**: trong mục *Yêu cầu mượn* → **Duyệt** (thiết bị chuyển sang
   *Đã đặt trước*) hoặc **Từ chối**.
3. **User nhận máy**: bấm **Nhận máy** (bàn giao). Trạng thái: yêu cầu `borrowed`,
   thiết bị `borrowed` (Đang mượn).
4. **Trả máy — quy trình 2 bước**:
   - User bấm **Báo hoàn trả** → yêu cầu chuyển `return_pending`, thiết bị `returning`
     (chờ kiểm tra).
   - Manager/Admin/Technician kiểm tra tình trạng → **Xác nhận hoàn trả** với đánh giá
     tình trạng thiết bị → `returned`, thiết bị trở lại *Khả dụng*.
   - Nếu tình trạng có dấu hiệu hỏng hóc, hệ thống **tự chuyển thiết bị sang bảo trì
     và tạo phiếu kiểm tra**.
5. **Quá hạn**: yêu cầu mượn quá giờ trả hiển thị huy hiệu đỏ **QUÁ HẠN** kèm thời gian
   trễ chính xác; Admin thấy cảnh báo tổng trên trang Tổng quan và có nút **Thu hồi** /
   **Nhận trả** trực tiếp.
6. Mọi bước chuyển trạng thái được ghi vào **lịch sử sử dụng** và **nhật ký kiểm toán**.

## Luồng sự cố và sửa chữa

Khi thiết bị gặp sự cố trong lúc mượn (hoặc phát hiện hư hỏng khi tiếp nhận trả):

1. **Báo sự cố**: User (nút **Báo sự cố** trên lượt mượn của mình) hoặc Manager/Admin
   nhập mô tả hư hỏng. Hệ thống:
   - chuyển thiết bị sang `pending_inspection` (Chờ kiểm tra),
   - tự tạo phiếu sửa chữa loại `incident` đang mở.
2. **Tiếp nhận**: **Technician** bấm **Tiếp nhận kiểm tra** — thiết bị chuyển
   `in_progress` (Đang sửa chữa), phiếu ghi nhận kỹ thuật viên phụ trách.
3. **Sửa chữa & cập nhật**: Technician cập nhật trạng thái phiếu
   (Đang sửa / Thay thế một phần / Thay thế toàn bộ), tình trạng thiết bị và ghi chú.
4. **Hoàn tất**: Technician bấm **Hoàn tất** — phiếu chuyển `completed`, thiết bị
   trở lại *Khả dụng*, sẵn sàng cho lượt mượn tiếp theo.
5. Trong lúc thiết bị hỏng/bảo trì, mọi yêu cầu mượn mới đối với thiết bị đó bị từ chối (409).

> Lưu ý: Trợ lý AI chỉ **gợi ý/ tham khảo**, không tự duyệt hay thay đổi bất kỳ trạng thái nào.

## Trang theo từng vai trò

### Admin (và Manager) — "Quản lý phòng lab"
- **Tổng quan**: KPI (thiết bị, đang mượn, quá hạn, chờ duyệt...), băng cảnh báo đỏ
  các lượt mượn quá hạn (Thu hồi / Nhận trả), băng sự cố (Tiếp nhận kiểm tra),
  bảng điều khiển nhanh thiết bị real-time (làm mới mỗi ~3 giây), biểu đồ sử dụng.
- **Người dùng**: tạo/sửa/khóa/xóa tài khoản, đặt lại mật khẩu, gán vai trò.
- **Thiết bị**: tìm kiếm, lọc trạng thái, thêm/sửa/thanh lý thiết bị.
- **Bảo trì**: danh sách phiếu, tạo phiếu mới, hoàn tất.
- **Yêu cầu mượn**: duyệt / từ chối / bàn giao / xác nhận trả / thu hồi.
- **Nhật ký hệ thống**: tra cứu theo loại đối tượng, hành động, khoảng thời gian;
  xuất TXT; tự làm mới 10 giây.
- **Báo cáo**: thống kê + xuất file TXT / in PDF.
- **Trợ lý AI**: chế độ tóm tắt tình trạng từ dữ liệu hiện có.

### User — "Người sử dụng"
- **Tổng quan**: KPI cá nhân, cảnh báo quá hạn của chính mình (Báo hoàn trả ngay /
  Báo sự cố), thiết bị đang mượn.
- **Thiết bị**: danh mục + tìm kiếm + lọc nhóm; chỉ thấy nút **Mượn** trên thiết bị khả dụng.
- **Lượt mượn của tôi**: nhận máy / báo hoàn trả / báo sự cố; trạng thái chờ duyệt.
- **Trợ lý AI**: hỏi đáp SOP/hướng dẫn sử dụng.
- Giao diện che các trạng thái sửa chữa nội bộ thành một nhãn "Đang bảo trì".

### Technician — "Kỹ thuật viên"
- **Tổng quan**: danh sách công việc cần làm, băng sự cố chờ tiếp nhận.
- **Thiết bị**: bảng điều khiển nhanh; chỉ được đặt các trạng thái kỹ thuật
  (chờ kiểm tra, đang sửa, thay thế một phần/toàn bộ, bảo trì).
- **Bảo trì**: tạo / cập nhật / xóa / hoàn tất phiếu, tiếp nhận sự cố,
  lên lịch bảo trì ("+ Lên lịch / Thêm tác vụ").
- **Lịch sử**: phiếu đã xử lý, xuất báo cáo.
- **Cảnh báo AI**: danh sách thiết bị cần kiểm tra do AI gợi ý (chế độ `inspection_alert`).

## Bảo trì định kỳ

- Mục *Bảo trì* cho tạo **lịch định kỳ** theo thiết bị: chu kỳ ngày
  (`interval_days`, mặc định 180) và hạn kiểm tra tiếp theo (`next_due_at`).
- Phiếu bảo trì thường (`kind="inspection"`) dùng cho kiểm tra/bảo dưỡng;
  `kind="incident"` tự sinh khi có sự cố.

## Trợ lý AI

- Nút nổi trên mọi trang (kéo được), hoặc mục **Trợ lý AI** / **Cảnh báo AI** trong sidebar.
- Chế độ: **hỏi đáp** (chat/RAG theo SOP), **tóm tắt** (Admin: tình trạng thiết bị —
  bảo trì từ dữ liệu thật), **cảnh báo** (Technician: thiết bị cần kiểm tra).
- Câu trả lời tiếng Việt, kèm **nguồn trích dẫn** (tên tài liệu SOP) và nhãn
  *RAG Grounded* khi có ngữ cảnh; không có ngữ cảnh phù hợp thì AI tự nhận "không đủ dữ liệu".
- Có các phím hỏi nhanh: an toàn điện, máy soi Tektronix, nguồn DC Keysight, quy trình mượn-trả.
- Có thể **dừng phản hồi** đang chờ; lịch sử hội thoại được giới hạn 12 thông điệp gần nhất.
- AI chạy hoàn toàn local (Ollama `qwen2.5:3b`) — dữ liệu không rời khỏi máy.
- AI chỉ tham khảo: không tự duyệt mượn, không đổi trạng thái thiết bị.

## Thống kê & báo cáo

- `/api/stats` và trang **Báo cáo**: số liệu tổng hợp + **tần suất sử dụng theo
  khoảng thời gian tùy chọn** (chọn cả `start` và `end`), phân rã theo loại hành động.
- Xuất báo cáo dạng TXT và in/PDF (bố cục in được tối ưu riêng).

## Xử lý sự cố kỹ thuật

| Hiện tượng | Nguyên nhân & cách xử lý |
|---|---|
| Không đăng nhập được (401) | Sai tên đăng nhập/email hoặc mật khẩu; kiểm tra tài khoản đã được cấp |
| "Tài khoản bị khóa" (403) | Liên hệ Admin mở khóa (is_active) |
| Nút Mượn bị lỗi 409 | Thiết bị không còn khả dụng hoặc đang trong luồng sự cố — chọn thiết bị khác |
| Trợ lý AI báo "nhà cung cấp AI không khả dụng" (502) | Ollama chưa chạy: `ollama serve`, kiểm tra `ollama list` có `qwen2.5:3b` |
| Câu trả lời AI chậm | Lần đầu chạy model phải load vào RAM/GPU; chờ hoặc dùng model nhỏ hơn |
| Token hết hạn sau 60 phút | Đăng nhập lại |
| Lỗi CORS khi dev | Kiểm tra `CORS_ORIGINS` trong `.env` chứa cổng frontend (5173/3000) |
| Xem chi tiết API | Mở `http://localhost:8000/docs` (Swagger UI) |

---

*Tài liệu khớp với mã nguồn tại `backend/app/routers/` và `frontend/src/App.jsx`;
chi tiết kỹ thuật từng endpoint xem `docs/api.md`, cấu trúc dữ liệu xem `docs/schema.sql`.*
