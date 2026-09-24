-- AI-LEMS (LyxLab) — Database Schema
-- Hệ thống Quản lý Thiết bị Phòng thí nghiệm có tích hợp AI
--
-- Tài liệu này phản ánh CHÍNH XÁC cấu trúc ORM tại `backend/app/models.py`.
-- Bản DDL cặp đôi chính thức:
--   - SQLite (dev local) : `database/schema.sql`
--   - MySQL 8  (Docker)  : `backend/init.sql`
-- Cả ba nguồn được kiểm tra tính nhất quán bởi `tests/test_database_schema.py`.

-- ============================================================
-- 1. ROLES — vai trò hệ thống (RBAC)
-- ============================================================
CREATE TABLE roles (
    name        VARCHAR(30)  PRIMARY KEY,
    description TEXT         NOT NULL DEFAULT ''
);

-- ============================================================
-- 2. USERS — tài khoản người dùng
-- Mật khẩu CHỈ lưu dạng bcrypt hash một chiều (password_hash).
-- Hệ thống KHÔNG lưu/hiển thị lại mật khẩu plaintext.
-- ============================================================
CREATE TABLE users (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,  -- MySQL: INT AUTO_INCREMENT PRIMARY KEY
    username      VARCHAR(80)  NOT NULL UNIQUE,
    email         VARCHAR(160) NOT NULL UNIQUE,
    full_name     VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role          VARCHAR(30)  NOT NULL DEFAULT 'user',
    is_active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at    DATETIME     NOT NULL,                   -- giờ Hà Nội (UTC+7), naive
    FOREIGN KEY (role) REFERENCES roles(name)
);
CREATE INDEX ix_users_role ON users(role);

-- ============================================================
-- 3. DEVICE_GROUPS — nhóm thiết bị
-- ============================================================
CREATE TABLE device_groups (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT         NOT NULL DEFAULT ''
);

-- ============================================================
-- 4. LOCATIONS — vị trí phòng/bàn/lab
-- ============================================================
CREATE TABLE locations (
    id       INTEGER      PRIMARY KEY AUTOINCREMENT,
    name     VARCHAR(120) NOT NULL UNIQUE,
    building VARCHAR(120) NOT NULL DEFAULT ''
);

-- ============================================================
-- 5. DEVICES — thiết bị phòng lab
-- status: available | reserved | borrowed | maintenance |
--         returning | pending_inspection | in_progress |
--         replace_partial | replace_full
-- (giá trị hợp lệ được kiểm soát ở tầng API — schemas.DeviceStatus)
-- ============================================================
CREATE TABLE devices (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    asset_code    VARCHAR(60)  NOT NULL UNIQUE,     -- mã tài sản, duy nhất
    name          VARCHAR(160) NOT NULL,
    category      VARCHAR(80)  NOT NULL,
    status        VARCHAR(30)  NOT NULL DEFAULT 'available',
    condition     VARCHAR(60)  NOT NULL DEFAULT 'Mới nguyên hộp',  -- tình trạng vật lý
    serial_number VARCHAR(120) NOT NULL DEFAULT '',
    group_id      INTEGER      REFERENCES device_groups(id),
    location_id   INTEGER      REFERENCES locations(id)
);
CREATE INDEX ix_devices_status ON devices(status);

-- ============================================================
-- 6. BORROW_REQUESTS — yêu cầu mượn thiết bị
-- status: pending → approved → borrowed → (return_pending) → returned
--         hoặc pending/approved → rejected
-- ============================================================
CREATE TABLE borrow_requests (
    id             INTEGER      PRIMARY KEY AUTOINCREMENT,
    user_id        INTEGER      NOT NULL REFERENCES users(id),
    device_id      INTEGER      NOT NULL REFERENCES devices(id),
    purpose        TEXT         NOT NULL,
    status         VARCHAR(30)  NOT NULL DEFAULT 'pending',
    requested_from DATETIME,                        -- thời điểm mượn mong muốn
    requested_to   DATETIME,                        -- thời điểm trả mong muốn
    created_at     DATETIME     NOT NULL
);
CREATE INDEX ix_borrow_requests_status ON borrow_requests(status);

-- ============================================================
-- 7. USAGE_HISTORY — lịch sử sử dụng thiết bị (mượn/trả/sự cố...)
-- ============================================================
CREATE TABLE usage_history (
    id                INTEGER  PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER  NOT NULL REFERENCES users(id),
    device_id         INTEGER  NOT NULL REFERENCES devices(id),
    borrow_request_id INTEGER  REFERENCES borrow_requests(id),
    action            VARCHAR(30) NOT NULL,
    occurred_at       DATETIME    NOT NULL
);

-- ============================================================
-- 8. MAINTENANCE_SCHEDULES — lịch bảo trì định kỳ theo thiết bị
-- ============================================================
CREATE TABLE maintenance_schedules (
    id            INTEGER  PRIMARY KEY AUTOINCREMENT,
    device_id     INTEGER  NOT NULL REFERENCES devices(id),
    interval_days INTEGER  NOT NULL DEFAULT 180,
    next_due_at   DATETIME NOT NULL,
    active        BOOLEAN  NOT NULL DEFAULT TRUE,
    notes         TEXT     NOT NULL DEFAULT ''
);

-- ============================================================
-- 9. MAINTENANCE_RECORDS — phiếu bảo trì / sửa chữa / sự cố
-- kind:   inspection | incident
-- status: open | in_progress | completed | replace_partial | replace_full
-- ============================================================
CREATE TABLE maintenance_records (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    device_id     INTEGER      NOT NULL REFERENCES devices(id),
    technician_id INTEGER      REFERENCES users(id),   -- kỹ thuật viên tiếp nhận (nullable)
    kind          VARCHAR(40)  NOT NULL DEFAULT 'inspection',
    notes         TEXT         NOT NULL DEFAULT '',
    status        VARCHAR(30)  NOT NULL DEFAULT 'open',
    scheduled_at  DATETIME,
    completed_at  DATETIME
);
CREATE INDEX ix_maintenance_records_status ON maintenance_records(status);

-- ============================================================
-- 10. DOCUMENTS — tài liệu hướng dẫn/SOP (nguồn cho RAG)
-- ============================================================
CREATE TABLE documents (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(200) NOT NULL UNIQUE,
    description TEXT         NOT NULL DEFAULT '',
    created_at  DATETIME     NOT NULL
);

-- ============================================================
-- 11. DOCUMENT_CHUNKS — đoạn văn bản được trích để truy hồi (RAG)
-- Không dùng embedding/vector: truy hồi bằng so khớp từ khóa.
-- ============================================================
CREATE TABLE document_chunks (
    id            INTEGER      PRIMARY KEY AUTOINCREMENT,
    document_id   INTEGER      REFERENCES documents(id),
    document_name VARCHAR(200) NOT NULL,   -- denormalized để truy vết nguồn
    content       TEXT         NOT NULL,
    chunk_index   INTEGER      NOT NULL DEFAULT 0
);
CREATE INDEX ix_document_chunks_document_name ON document_chunks(document_name);

-- ============================================================
-- 12. AUDIT_LOGS — nhật ký kiểm toán mọi thao tác quan trọng
-- ============================================================
CREATE TABLE audit_logs (
    id          INTEGER      PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER      REFERENCES users(id),
    username    VARCHAR(60)  NOT NULL DEFAULT '',
    user_role   VARCHAR(30)  NOT NULL DEFAULT '',
    action      VARCHAR(40)  NOT NULL,   -- LOGIN | CREATE | UPDATE | DELETE | APPROVE | ...
    target_type VARCHAR(40)  NOT NULL,   -- USER | DEVICE | REQUEST | MAINTENANCE | ...
    target_id   INTEGER,
    target_name VARCHAR(160) NOT NULL DEFAULT '',
    details     TEXT         NOT NULL DEFAULT '',
    created_at  DATETIME     NOT NULL
);
CREATE INDEX ix_audit_logs_action ON audit_logs(action);
CREATE INDEX ix_audit_logs_target_type ON audit_logs(target_type);
CREATE INDEX ix_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================
-- Seed tối thiểu (tương ứng seed_defaults() trong backend/app/db.py)
-- Mật khẩu seed lưu dạng bcrypt hash — KHÔNG plaintext.
-- ============================================================
INSERT INTO roles (name, description) VALUES
    ('admin',      'Quản trị hệ thống'),
    ('manager',    'Quản lý phòng lab'),
    ('technician', 'Kỹ thuật viên bảo trì'),
    ('user',       'Người sử dụng thiết bị');
