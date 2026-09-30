-- Canonical relational schema and seed dataset for AI-LEMS (LyxLab)
-- Aligned with Core Business Logic, Audit Logs, and RAG SOP Documents
CREATE DATABASE IF NOT EXISTS lab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lab;

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS roles (
    name VARCHAR(30) PRIMARY KEY,
    description TEXT
);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(80) UNIQUE NOT NULL,
    email VARCHAR(160) UNIQUE NOT NULL,
    full_name VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role) REFERENCES roles(name)
);

-- 3. Device Groups Table
CREATE TABLE IF NOT EXISTS device_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);

-- 4. Locations Table
CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(120) UNIQUE NOT NULL,
    building VARCHAR(120) NOT NULL DEFAULT ''
);

-- 5. Devices Table
CREATE TABLE IF NOT EXISTS devices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    asset_code VARCHAR(60) UNIQUE NOT NULL,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    `condition` VARCHAR(60) DEFAULT 'Mới nguyên hộp',
    serial_number VARCHAR(120) NOT NULL DEFAULT '',
    group_id INT NULL,
    location_id INT NULL,
    FOREIGN KEY (group_id) REFERENCES device_groups(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

-- 6. Borrow Requests Table
CREATE TABLE IF NOT EXISTS borrow_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    requested_from DATETIME NULL,
    requested_to DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- 7. Usage History Table
CREATE TABLE IF NOT EXISTS usage_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    device_id INT NOT NULL,
    borrow_request_id INT NULL,
    action VARCHAR(30) NOT NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (borrow_request_id) REFERENCES borrow_requests(id)
);

-- 8. Maintenance Schedules Table
CREATE TABLE IF NOT EXISTS maintenance_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    interval_days INT NOT NULL DEFAULT 180,
    next_due_at DATETIME NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

-- 9. Maintenance Records Table
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    device_id INT NOT NULL,
    technician_id INT NULL,
    kind VARCHAR(40) NOT NULL DEFAULT 'inspection',
    notes TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    scheduled_at DATETIME NULL,
    completed_at DATETIME NULL,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

-- 10. Documents Table (For RAG)
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    allowed_roles VARCHAR(120) NOT NULL DEFAULT 'admin,manager,technician,user',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. Document Chunks Table (For RAG vector / lexical search)
CREATE TABLE IF NOT EXISTS document_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NULL,
    document_name VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    chunk_index INT NOT NULL DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

-- 12. Audit Logs Table (Full System Tracking)
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    username VARCHAR(60) NOT NULL DEFAULT '',
    user_role VARCHAR(30) NOT NULL DEFAULT '',
    action VARCHAR(40) NOT NULL,
    target_type VARCHAR(40) NOT NULL,
    target_id INT NULL,
    target_name VARCHAR(160) NOT NULL DEFAULT '',
    details TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ====================================================================
-- SEED DATA
-- ====================================================================

-- 1. ROLES
INSERT IGNORE INTO roles (name, description) VALUES 
('admin', 'Quản trị viên toàn quyền hệ thống'),
('manager', 'Ban quản lý phòng thí nghiệm và phê duyệt tài sản'),
('technician', 'Kỹ thuật viên phụ trách bảo trì và hiệu chuẩn'),
('user', 'Người sử dụng, nghiên cứu viên và sinh viên thực hành');

-- 2. USERS
INSERT IGNORE INTO users (id, username, email, full_name, password_hash, role, is_active) VALUES
(1, 'admin', 'admin@lab.local', 'Quản lý Hệ thống Lab', '$2b$12$KZffDZVkM34HA8FzMCd1hOgI8quQVge/Ep1YSV7PdabnOaPsKVWFi', 'admin', TRUE),
(2, 'thang.nv', 'thang.nv@lab.local', 'TS. Nguyễn Văn Thắng', '$2b$12$KZffDZVkM34HA8FzMCd1hOgI8quQVge/Ep1YSV7PdabnOaPsKVWFi', 'manager', TRUE),
(3, 'technician', 'tech@lab.local', 'Trần Đình Trọng (KT Trưởng)', '$2b$12$X4pk6bjG1mKv0i8spyC3tekN42ocTZS2sqHOA4NXYo/0S/Fm1KO.u', 'technician', TRUE),
(4, 'viet.lh', 'viet.lh@lab.local', 'Lê Hoàng Việt (KT Viên)', '$2b$12$X4pk6bjG1mKv0i8spyC3tekN42ocTZS2sqHOA4NXYo/0S/Fm1KO.u', 'technician', TRUE),
(5, 'user', 'user@lab.local', 'Sinh viên Bount (K23A)', '$2b$12$27.TiHCMLWQ0QLrgaJ3GeOpreV.p.H6jFfVbOUVWQGRl/0YYHPJyO', 'user', TRUE),
(6, 'an.tb', 'an.tb@lab.local', 'Trần Bình An (K23A)', '$2b$12$27.TiHCMLWQ0QLrgaJ3GeOpreV.p.H6jFfVbOUVWQGRl/0YYHPJyO', 'user', TRUE),
(7, 'ha.vt', 'ha.vt@lab.local', 'Vũ Thu Hà (NCV Lab Vi mạch)', '$2b$12$27.TiHCMLWQ0QLrgaJ3GeOpreV.p.H6jFfVbOUVWQGRl/0YYHPJyO', 'user', TRUE),
(8, 'minh.dq', 'minh.dq@lab.local', 'Đặng Quang Minh (K23A)', '$2b$12$27.TiHCMLWQ0QLrgaJ3GeOpreV.p.H6jFfVbOUVWQGRl/0YYHPJyO', 'user', TRUE),
(9, 'minhanh', 'minhanh@local.lab', 'Lê Minh Anh', '$2b$12$w.MobVQywmt0zjL1MsNwzOieNh3kOteD8foC.Bsxj.NhB0sNWViVy', 'user', TRUE),
(10, 'manager', 'manager@lab.local', 'Quản Lý Phòng Lab', '$2b$12$urNrtWx4LvrkGLUvc/NKOuYDoShg.BlxBKdvwwA/QlsnoGQcaYRV6', 'manager', TRUE);

-- 3. DEVICE GROUPS
INSERT IGNORE INTO device_groups (id, name, description) VALUES
(1, 'Đo lường & Phân tích tín hiệu', 'Máy hiện sóng, đồng hồ vạn năng, máy phân tích phổ, máy phát xung'),
(2, 'Hệ thống Nhúng & Vi điều khiển', 'Kit STM32, ESP32, Raspberry Pi, Arduino, FPGA và mạch nạp'),
(3, 'Thiết bị Điện tử & Nguồn công suất', 'Bộ nguồn lập trình DC, trạm hàn nhiệt, tải điện tử, đồng hồ đo LCR'),
(4, 'Mạng & IoT Không dây', 'Module LoRa, Zigbee Gateway, SDR HackRF, anten và cảm biến môi trường'),
(5, 'Robot & Tự động hóa', 'Cánh tay robot mini, xe tự hành AGV, động cơ bước và driver điều khiển'),
(6, 'An toàn & Bảo hộ phòng thí nghiệm', 'Máy kiểm định rò điện, thiết bị chống tĩnh điện ESD, bình chữa cháy');

-- 4. LOCATIONS
INSERT IGNORE INTO locations (id, name, building) VALUES
(1, 'Lab 301 - Tủ thiết bị A (Đo lường)', 'Tòa nhà A3 - Tầng 3'),
(2, 'Lab 301 - Bàn thực hành số 1-4', 'Tòa nhà A3 - Tầng 3'),
(3, 'Lab 302 - Tủ linh kiện Nhúng & IoT', 'Tòa nhà A3 - Tầng 3'),
(4, 'Lab 405 - Phòng nghiên cứu Robot & AI', 'Tòa nhà B1 - Tầng 4'),
(5, 'Kho Lưu trữ Tổng (Storage)', 'Tòa nhà A3 - Tầng 1'),
(6, 'Bàn Kỹ thuật & Hiệu chuẩn thiết bị', 'Tòa nhà A3 - Tầng 3');

-- 5. DEVICES (25 thiết bị thực tế đa dạng chủng loại)
INSERT IGNORE INTO devices (id, asset_code, name, category, status, serial_number, group_id, location_id) VALUES
(1, 'EQ-001', 'Máy hiện sóng số Tektronix TBS1102B (100MHz, 2CH)', 'Đo lường & Phân tích tín hiệu', 'available', 'SN-TBS1102-9011', 1, 1),
(2, 'EQ-002', 'Máy hiện sóng số Tektronix TBS1102B (100MHz, 2CH)', 'Đo lường & Phân tích tín hiệu', 'available', 'SN-TBS1102-9012', 1, 1),
(3, 'EQ-003', 'Máy hiện sóng số 4 kênh Rigol DS1054Z (50MHz)', 'Đo lường & Phân tích tín hiệu', 'returning', 'SN-DS1054-4421', 1, 2),
(4, 'EQ-004', 'Đồng hồ vạn năng để bàn độ chính xác cao Keysight 34461A', 'Đo lường & Phân tích tín hiệu', 'available', 'SN-KEY3446-081', 1, 1),
(5, 'EQ-005', 'Đồng hồ vạn năng cầm tay Fluke 87V Industrial', 'Đo lường & Phân tích tín hiệu', 'available', 'SN-FLU87V-7712', 1, 1),
(6, 'EQ-006', 'Máy phát hàm / xung Siglent SDG1032X (30MHz)', 'Đo lường & Phân tích tín hiệu', 'available', 'SN-SIG1032-1209', 1, 1),
(7, 'EQ-007', 'Máy phân tích phổ cầm tay Rohde & Schwarz FPH (3GHz)', 'Đo lường & Phân tích tín hiệu', 'available', 'SN-RSFPH-0045', 1, 1),
(8, 'EQ-008', 'Máy phân tích logic 16 kênh USB Saleae Logic Pro 16', 'Đo lường & Phân tích tín hiệu', 'reserved', 'SN-SAL16P-3312', 1, 1),

(9, 'EQ-009', 'Nguồn DC lập trình 3 ngõ ra Keysight E3631A (80W)', 'Thiết bị Điện tử & Nguồn công suất', 'available', 'SN-E3631-5511', 3, 1),
(10, 'EQ-010', 'Nguồn DC lập trình 3 ngõ ra Rigol DP832 (195W)', 'Thiết bị Điện tử & Nguồn công suất', 'available', 'SN-DP832-6623', 3, 1),
(11, 'EQ-011', 'Trạm hàn khò nhiệt thông minh Quick 861DW ESD', 'Thiết bị Điện tử & Nguồn công suất', 'available', 'SN-QK861-1189', 3, 2),
(12, 'EQ-012', 'Trạm hàn thiếc cao cấp Hakko FX-888D ESD', 'Thiết bị Điện tử & Nguồn công suất', 'available', 'SN-HK888-9941', 3, 2),
(13, 'EQ-013', 'Tải điện tử lập trình DC Itech IT8512+ (150V/30A/300W)', 'Thiết bị Điện tử & Nguồn công suất', 'maintenance', 'SN-IT8512-2021', 3, 6),
(14, 'EQ-014', 'Cầu đo LCR độ chính xác cao Tonghui TH2822D', 'Thiết bị Điện tử & Nguồn công suất', 'available', 'SN-TH2822-4410', 3, 1),

(15, 'EQ-015', 'Kit phát triển ARM Cortex-M4 STM32F407G-DISC1', 'Hệ thống Nhúng & Vi điều khiển', 'available', 'SN-STM32F4-001', 2, 3),
(16, 'EQ-016', 'Kit phát triển ARM Cortex-M7 NUCLEO-H743ZI2', 'Hệ thống Nhúng & Vi điều khiển', 'borrowed', 'SN-STM32H7-002', 2, 3),
(17, 'EQ-017', 'Máy tính nhúng Raspberry Pi 5 8GB RAM (kèm case tản nhiệt)', 'Hệ thống Nhúng & Vi điều khiển', 'borrowed', 'SN-RPI5-8G-081', 2, 3),
(18, 'EQ-018', 'Kit máy tính AI nhúng NVIDIA Jetson Nano Developer Kit B01', 'Hệ thống Nhúng & Vi điều khiển', 'available', 'SN-JETSON-B01-44', 2, 3),
(19, 'EQ-019', 'Kit phát triển FPGA Digilent Basys 3 Artix-7', 'Hệ thống Nhúng & Vi điều khiển', 'reserved', 'SN-FPGA-BASYS-01', 2, 3),

(20, 'EQ-020', 'Module định tuyến vô tuyến LoRaWAN Gateway Dragino LG308', 'Mạng & IoT Không dây', 'available', 'SN-LORA-LG308-11', 4, 3),
(21, 'EQ-021', 'Bộ thu phát sóng vô tuyến định nghĩa bằng phần mềm HackRF One SDR', 'Mạng & IoT Không dây', 'available', 'SN-HACKRF-8821', 4, 3),
(22, 'EQ-022', 'Kit thực hành IoT ESP32-S3 AI Cam & Cảm biến môi trường', 'Mạng & IoT Không dây', 'borrowed', 'SN-ESP32S3-7711', 4, 3),

(23, 'EQ-023', 'Xe robot tự hành điều hướng SLAM TurtleBot3 Burger', 'Robot & Tự động hóa', 'available', 'SN-TB3-BURGER-01', 5, 4),
(24, 'EQ-024', 'Cánh tay robot 6 bậc tự do xArm 6 DoF Robotic Arm', 'Robot & Tự động hóa', 'maintenance', 'SN-XARM6-5519', 5, 4),

(25, 'EQ-025', 'Thiết bị đo kiểm an toàn điện cách ly và nối đất Chauvin Arnoux', 'An toàn & Phụ trợ Lab', 'available', 'SN-CA6117-0912', 6, 5);

-- 6. BORROW REQUESTS (12 yêu cầu mượn mẫu đầy đủ trạng thái)
INSERT IGNORE INTO borrow_requests (id, user_id, device_id, purpose, status, requested_from, requested_to, created_at) VALUES
(1, 5, 3, 'Đo kiểm xung PWM và dạng sóng nghịch lưu 3 pha (Đồ án K23A)', 'return_pending', '2026-09-20 08:00:00', '2026-09-23 17:00:00', '2026-09-19 14:30:00'),
(2, 6, 16, 'Thực hành nạp firmware RTOS điều khiển động cơ', 'borrowed', '2026-09-22 09:00:00', '2026-09-29 17:00:00', '2026-09-21 10:15:00'),
(3, 7, 17, 'Huấn luyện mô hình Computer Vision nhận diện vật thể nhẹ', 'borrowed', '2026-09-23 13:30:00', '2026-09-30 17:00:00', '2026-09-23 08:45:00'),
(4, 8, 22, 'Thu thập dữ liệu cảm biến nhiệt ẩm truyền về dashboard', 'borrowed', '2026-09-24 08:00:00', '2026-09-27 17:00:00', '2026-09-23 16:20:00'),
(5, 5, 8, 'Phân tích giao thức SPI và I2C giữa MCU và EEPROM', 'approved', '2026-09-25 08:00:00', '2026-09-28 17:00:00', '2026-09-24 15:00:00'),
(6, 6, 19, 'Mô phỏng mạch cộng trừ song song 8-bit trên phần cứng FPGA', 'approved', '2026-09-25 13:00:00', '2026-10-02 17:00:00', '2026-09-24 16:30:00'),
(7, 7, 7, 'Đo phổ bức xạ trạm thu phát sóng di động thực nghiệm', 'pending', '2026-09-26 08:00:00', '2026-09-28 17:00:00', '2026-09-24 20:00:00'),
(8, 8, 1, 'Đo kiểm độ nhiễu nguồn xung Buck-Boost', 'pending', '2026-09-26 09:00:00', '2026-09-29 17:00:00', '2026-09-25 00:15:00'),
(9, 5, 23, 'Chạy thuật toán định vị Gmapping trên TurtleBot3', 'pending', '2026-09-27 08:00:00', '2026-10-01 17:00:00', '2026-09-25 00:30:00'),
(10, 5, 4, 'Đo dòng tiêu thụ chế độ Deep-Sleep vi điều khiển', 'returned', '2026-09-15 08:00:00', '2026-09-18 17:00:00', '2026-09-14 09:00:00'),
(11, 6, 9, 'Cấp nguồn ổn áp thí nghiệm mạch khuếch đại thuật toán Op-Amp', 'returned', '2026-09-16 08:00:00', '2026-09-19 17:00:00', '2026-09-15 11:20:00'),
(12, 7, 11, 'Hàn gắn linh kiện dán SMD 0805 cho bo mạch đồ án', 'returned', '2026-09-18 13:30:00', '2026-09-21 17:00:00', '2026-09-18 10:00:00');

-- 7. USAGE HISTORY
INSERT IGNORE INTO usage_history (id, user_id, device_id, borrow_request_id, action, occurred_at) VALUES
(1, 5, 4, 10, 'approved', '2026-09-14 10:00:00'),
(2, 5, 4, 10, 'borrowed', '2026-09-15 08:15:00'),
(3, 5, 4, 10, 'returned', '2026-09-18 16:45:00'),
(4, 6, 9, 11, 'approved', '2026-09-15 14:00:00'),
(5, 6, 9, 11, 'borrowed', '2026-09-16 08:30:00'),
(6, 6, 9, 11, 'returned', '2026-09-19 16:30:00'),
(7, 5, 3, 1, 'approved', '2026-09-19 16:00:00'),
(8, 5, 3, 1, 'borrowed', '2026-09-20 08:20:00'),
(9, 6, 16, 2, 'approved', '2026-09-21 14:00:00'),
(10, 6, 16, 2, 'borrowed', '2026-09-22 09:10:00'),
(11, 7, 17, 3, 'approved', '2026-09-23 10:00:00'),
(12, 7, 17, 3, 'borrowed', '2026-09-23 13:45:00'),
(13, 8, 22, 4, 'approved', '2026-09-23 17:00:00'),
(14, 8, 22, 4, 'borrowed', '2026-09-24 08:15:00'),
(15, 5, 8, 5, 'approved', '2026-09-24 16:00:00'),
(16, 6, 19, 6, 'approved', '2026-09-24 17:30:00');

-- 8. MAINTENANCE SCHEDULES
INSERT IGNORE INTO maintenance_schedules (id, device_id, interval_days, next_due_at, active, notes) VALUES
(1, 1, 180, '2026-11-15 00:00:00', TRUE, 'Hiệu chuẩn đầu đo suy hao và dải tần máy hiện sóng Tektronix'),
(2, 4, 365, '2026-12-01 00:00:00', TRUE, 'Kiểm định sai số đo điện áp DC/AC với điện trở chuẩn viện VMI'),
(3, 9, 180, '2026-10-30 00:00:00', TRUE, 'Đo điện áp gợn sóng (Ripple) và kiểm tra quạt làm mát nguồn Keysight'),
(4, 25, 90, '2026-10-15 00:00:00', TRUE, 'Kiểm tra độ cách điện và hệ thống nối đất an toàn toàn bộ các bàn Lab');

-- 9. MAINTENANCE RECORDS
INSERT IGNORE INTO maintenance_records (id, device_id, technician_id, kind, notes, status, scheduled_at, completed_at) VALUES
(1, 1, 3, 'inspection', 'Đã vệ sinh đầu giắc BNC, quạt tản nhiệt chạy êm, sai số tần số < 0.02%, máy đạt tiêu chuẩn vận hành.', 'completed', '2026-09-10 08:00:00', '2026-09-10 11:30:00'),
(2, 2, 4, 'inspection', 'Hiệu chuẩn que đo 10X, kiểm tra tiếp điểm tiếp đất tốt, màn hình LCD sáng nét.', 'completed', '2026-09-11 08:30:00', '2026-09-11 10:45:00'),
(3, 10, 3, 'inspection', 'Đo thử tải giả 10A liên tục trong 30 phút, bảo vệ quá dòng OCP phản hồi chuẩn 5ms.', 'completed', '2026-09-12 13:30:00', '2026-09-12 16:00:00'),
(4, 13, 3, 'incident', '[SỰ CỐ KHẨN CẤP]: Màn hình nhấp nháy báo lỗi quá áp OVP, quạt phát tiếng kêu lạ, nghi hỏng sò công suất MOSFET kênh 2.', 'open', '2026-09-24 14:15:00', NULL),
(5, 24, 4, 'incident', '[SỰ CỐ KHẨN CẤP]: Cánh tay robot khớp J3 bị kẹt cơ khí và mất bước khi nâng vật nặng quá 500g, cần tháo hộp số bảo dưỡng.', 'open', '2026-09-24 16:40:00', NULL),
(6, 5, 4, 'inspection', 'Lên lịch kiểm tra thay pin 9V và dây đo Fluke 87V định kỳ tháng 10.', 'open', '2026-10-05 08:00:00', NULL);

-- 10. DOCUMENTS (SOP & Technical Manuals for RAG)
-- allowed_roles: RBAC tri thức (mục 2.11 báo cáo) — SOP vận hành nội bộ (SOP-05/06) giới hạn cán bộ & kỹ thuật
INSERT IGNORE INTO documents (id, name, description, allowed_roles, created_at) VALUES
(1, 'SOP-01: Quy trình an toàn phòng thí nghiệm và bảo hộ lao động', 'Quy chuẩn an toàn chung, an toàn điện, phòng chống cháy nổ và thao tác khẩn cấp', 'admin,manager,technician,user', '2026-09-01 08:00:00'),
(2, 'SOP-02: Hướng dẫn vận hành máy hiện sóng Tektronix TBS1102B', 'Các bước thiết lập kênh đo, nút Autoset, bù que đo và giới hạn điện áp đo an toàn', 'admin,manager,technician,user', '2026-09-01 08:00:00'),
(3, 'SOP-03: Quy chuẩn vận hành nguồn DC Keysight E3631A', 'Hướng dẫn đặt dòng giới hạn, chọn kênh ngõ ra độc lập và phòng chống ngắn mạch', 'admin,manager,technician,user', '2026-09-01 08:00:00'),
(4, 'SOP-04: Quy định mượn, trả và bàn giao thiết bị phòng Lab', 'Quy trình đăng ký trên hệ thống LyxLab, điều kiện bàn giao, gia hạn và trách nhiệm', 'admin,manager,technician,user', '2026-09-01 08:00:00'),
(5, 'SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD', 'Kiểm soát nhiệt độ mỏ hàn Hakko/Quick, đeo vòng chống tĩnh điện và thông gió khói chì', 'admin,manager,technician', '2026-09-01 08:00:00'),
(6, 'SOP-06: Hướng dẫn xử lý sự cố thiết bị và kích hoạt bảo trì khẩn cấp', 'Quy trình ngắt nguồn E-Stop, cách thức bấm nút Báo sự cố trên phần mềm và lập biên bản', 'admin,manager,technician', '2026-09-01 08:00:00');

-- 11. DOCUMENT CHUNKS (For Local AI RAG context)
INSERT IGNORE INTO document_chunks (id, document_id, document_name, content, chunk_index) VALUES
(1, 1, 'SOP-01: Quy trình an toàn phòng thí nghiệm và bảo hộ lao động', 'Nguyên tắc an toàn chung: Luôn mang kính bảo hộ và trang phục gọn gàng khi làm việc với thiết bị điện. Cấm mang đồ ăn, thức uống vào khu vực thí nghiệm. Luôn xác định vị trí nút dừng khẩn cấp (E-Stop) và bình chữa cháy CO2 trước khi bắt đầu ca thực hành.', 0),
(2, 1, 'SOP-01: Quy trình an toàn phòng thí nghiệm và bảo hộ lao động', 'Quy trình xử lý sự cố rò điện hoặc chập cháy: Lập tức ngắt nguồn bằng nút E-Stop, ngắt cầu dao aptomat chính và thông báo ngay cho Kỹ thuật viên hoặc Quản lý phòng lab. Không được dùng nước dập đám cháy thiết bị điện.', 1),
(3, 2, 'SOP-02: Hướng dẫn vận hành máy hiện sóng Tektronix TBS1102B', 'Quy trình vận hành máy hiện sóng Tektronix (mã EQ-001, EQ-002): Kết nối que đo vào cổng BNC CH1 hoặc CH2. Luôn kiểm tra công tắc gạt hệ số suy hao trên que đo (1X hoặc 10X). Bấm phím Autoset để máy tự động nhận diện dạng sóng cơ bản.', 0),
(4, 2, 'SOP-02: Hướng dẫn vận hành máy hiện sóng Tektronix TBS1102B', 'Giới hạn điện áp và bảo dưỡng que đo: Điện áp ngõ vào tối đa qua que đo 10X là 300V RMS CAT II. Tuyệt đối không đo trực tiếp điện áp lưới 220VAC mà không có biến áp cách ly hoặc que đo vi sai chuyên dụng. Khi kết thúc ca làm việc, vệ sinh đầu kẹp que đo và cuộn dây nhẹ nhàng.', 1),
(5, 3, 'SOP-03: Quy chuẩn vận hành nguồn DC Keysight E3631A', 'Cài đặt nguồn DC Keysight E3631A (mã EQ-009): Cung cấp 3 ngõ ra độc lập (6V/5A, +25V/1A, -25V/1A). Trước khi bấm nút bật ngõ ra Output On/Off, bắt buộc phải cài đặt giới hạn dòng bảo vệ (Current Limit) để chống ngắn mạch phá hỏng vi mạch nhạy cảm.', 0),
(6, 3, 'SOP-03: Quy chuẩn vận hành nguồn DC Keysight E3631A', 'Cảnh báo bảo trì nguồn điện: Nếu màn hình hiển thị nhấp nháy dòng CC (Constant Current) hoặc OVP, kiểm tra ngay mạch tải có bị chập hay không. Kỹ thuật viên định kỳ kiểm tra độ gợn sóng (ripple & noise) 6 tháng một lần.', 1),
(7, 4, 'SOP-04: Quy định mượn, trả và bàn giao thiết bị phòng Lab', 'Quy trình mượn thiết bị: Người dùng tìm kiếm thiết bị ở trạng thái Sẵn sàng (available) và gửi yêu cầu mượn trên hệ thống LyxLab. Quản lý phòng lab duyệt yêu cầu trước khi thiết bị được giao nhận thực tế tại tủ chứa.', 0),
(8, 4, 'SOP-04: Quy định mượn, trả và bàn giao thiết bị phòng Lab', 'Quy định trả và kiểm tra hoàn trả: Sau khi kết thúc thời gian mượn, người dùng phải kiểm tra ngoại quan, phụ kiện đầy đủ và bấm Hoàn trả thiết bị trên hệ thống. Nếu có hỏng hóc hoặc thiếu phụ kiện, phải lập biên bản bảo trì ngay.', 1),
(9, 5, 'SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD', 'Kiểm soát nhiệt độ mỏ hàn: Nhiệt độ hàn thông thường với thiếc có chì (Sn63/Pb37) là 320°C - 350°C; với thiếc không chì (Lead-free SAC305) là 350°C - 380°C. Luôn bật máy hút khói hàn để tránh hít phải khí độc từ nhựa thông flux.', 0),
(10, 5, 'SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD', 'Bảo vệ chống tĩnh điện ESD: Khi tiếp xúc với IC vi điều khiển, FPGA hoặc cảm biến nhạy cảm, người thực hành bắt buộc phải đeo vòng đeo tay chống tĩnh điện (ESD wrist strap) và kẹp mass vào bàn thí nghiệm.', 1),
(11, 6, 'SOP-06: Hướng dẫn xử lý sự cố thiết bị và kích hoạt bảo trì khẩn cấp', 'Kích hoạt báo cáo sự cố phần mềm: Khi thiết bị đang trong trạng thái mượn (borrowed) gặp trục trặc, bốc khói hoặc hỏng hóc, người dùng bấm nút Báo sự cố trên giao diện. Hệ thống sẽ tự động chuyển máy sang trạng thái Maintenance và gửi cảnh báo đến kỹ thuật viên.', 0);

-- 12. AUDIT LOGS (20 bản ghi kiểm toán mẫu chi tiết)
INSERT IGNORE INTO audit_logs (id, user_id, username, user_role, action, target_type, target_id, target_name, details, created_at) VALUES
(1, 1, 'admin', 'admin', 'CREATE', 'DEVICE', 1, 'Máy hiện sóng Tektronix TBS1102B (EQ-001)', 'Nhập mới thiết bị vào kho Lab 301, serial SN-TBS1102-9011', '2026-09-01 09:00:00'),
(2, 1, 'admin', 'admin', 'CREATE', 'DEVICE', 3, 'Máy hiện sóng 4 kênh Rigol DS1054Z (EQ-003)', 'Nhập mới thiết bị vào kho Lab 301, serial SN-DS1054-4421', '2026-09-01 09:15:00'),
(3, 1, 'admin', 'admin', 'CREATE', 'DEVICE', 9, 'Nguồn DC lập trình Keysight E3631A (EQ-009)', 'Nhập mới thiết bị vào kho Lab 301, serial SN-E3631-5511', '2026-09-01 09:30:00'),
(4, 1, 'admin', 'admin', 'CREATE', 'USER', 5, 'Sinh viên Bount (K23A)', 'Tạo tài khoản người dùng nghiên cứu @user', '2026-09-02 08:30:00'),
(5, 1, 'admin', 'admin', 'CREATE', 'USER', 6, 'Trần Bình An (K23A)', 'Tạo tài khoản người dùng nghiên cứu @an.tb', '2026-09-02 08:35:00'),
(6, 3, 'technician', 'technician', 'UPDATE', 'MAINTENANCE', 1, 'Thiết bị #1 (EQ-001)', 'Hoàn tất bảo trì định kỳ 6 tháng: hiệu chuẩn dải tần đạt chuẩn', '2026-09-10 11:30:00'),
(7, 5, 'user', 'user', 'BORROW_REQUEST', 'REQUEST', 10, 'Thiết bị #4 (EQ-004)', 'Gửi yêu cầu mượn: Đo dòng tiêu thụ chế độ Deep-Sleep vi điều khiển, Hẹn trả: 18/09/2026 17:00', '2026-09-14 09:00:00'),
(8, 2, 'thang.nv', 'manager', 'APPROVE', 'REQUEST', 10, 'Thiết bị #4 (EQ-004)', 'Phê duyệt yêu cầu mượn #10 cho sinh viên @user', '2026-09-14 10:00:00'),
(9, 3, 'technician', 'technician', 'HANDOVER', 'REQUEST', 10, 'Thiết bị #4 (EQ-004)', 'Bàn giao thiết bị và que đo cho @user tại Tủ A', '2026-09-15 08:15:00'),
(10, 5, 'user', 'user', 'RETURN', 'REQUEST', 10, 'Thiết bị #4 (EQ-004)', 'Xác nhận hoàn trả thiết bị về phòng thí nghiệm an toàn', '2026-09-18 16:45:00'),
(11, 5, 'user', 'user', 'BORROW_REQUEST', 'REQUEST', 1, 'Thiết bị #3 (EQ-003)', 'Gửi yêu cầu mượn: Đo kiểm xung PWM và dạng sóng nghịch lưu 3 pha, Hẹn trả: 23/09/2026 17:00', '2026-09-19 14:30:00'),
(12, 1, 'admin', 'admin', 'APPROVE', 'REQUEST', 1, 'Thiết bị #3 (EQ-003)', 'Phê duyệt yêu cầu mượn #1 cho sinh viên @user', '2026-09-19 16:00:00'),
(13, 3, 'technician', 'technician', 'HANDOVER', 'REQUEST', 1, 'Thiết bị #3 (EQ-003)', 'Bàn giao máy hiện sóng 4 kênh cho @user tại Bàn 2', '2026-09-20 08:20:00'),
(14, 6, 'an.tb', 'user', 'BORROW_REQUEST', 'REQUEST', 2, 'Thiết bị #16 (EQ-016)', 'Gửi yêu cầu mượn: Thực hành nạp firmware RTOS điều khiển động cơ, Hẹn trả: 29/09/2026 17:00', '2026-09-21 10:15:00'),
(15, 2, 'thang.nv', 'manager', 'APPROVE', 'REQUEST', 2, 'Thiết bị #16 (EQ-016)', 'Phê duyệt yêu cầu mượn #2 cho @an.tb', '2026-09-21 14:00:00'),
(16, 4, 'viet.lh', 'technician', 'HANDOVER', 'REQUEST', 2, 'Thiết bị #16 (EQ-016)', 'Bàn giao kit STM32H7 kèm cáp USB ST-Link cho @an.tb', '2026-09-22 09:10:00'),
(17, 7, 'ha.vt', 'user', 'BORROW_REQUEST', 'REQUEST', 3, 'Thiết bị #17 (EQ-017)', 'Gửi yêu cầu mượn: Huấn luyện mô hình Computer Vision, Hẹn trả: 30/09/2026 17:00', '2026-09-23 08:45:00'),
(18, 1, 'admin', 'admin', 'APPROVE', 'REQUEST', 3, 'Thiết bị #17 (EQ-017)', 'Phê duyệt yêu cầu mượn #3 cho @ha.vt', '2026-09-23 10:00:00'),
(19, 3, 'technician', 'technician', 'HANDOVER', 'REQUEST', 3, 'Thiết bị #17 (EQ-017)', 'Bàn giao Raspberry Pi 5 kèm nguồn 27W Type-C cho @ha.vt', '2026-09-23 13:45:00'),
(20, 5, 'user', 'user', 'INCIDENT_REPORT', 'DEVICE', 13, 'Tải điện tử lập trình DC Itech (EQ-013)', 'Báo cáo sự cố khi đang sử dụng: Màn hình nhấp nháy báo lỗi OVP, quạt kêu lạ nghi hỏng sò công suất', '2026-09-24 14:15:00'),
(21, 6, 'an.tb', 'user', 'INCIDENT_REPORT', 'DEVICE', 24, 'Cánh tay robot 6 DoF xArm (EQ-024)', 'Báo cáo sự cố khi đang sử dụng: Khớp J3 bị kẹt cơ khí và mất bước khi nâng vật nặng', '2026-09-24 16:40:00'),
(22, 1, 'admin', 'admin', 'UPDATE', 'USER', 5, 'Sinh viên Bount (K23A)', 'Tên đăng nhập: user -> bount, Họ tên: Sinh viên Bount (K23A)', '2026-09-24 23:55:00'),
(23, 7, 'ha.vt', 'user', 'BORROW_REQUEST', 'REQUEST', 7, 'Thiết bị #7 (EQ-007)', 'Gửi yêu cầu mượn: Đo phổ bức xạ trạm thu phát sóng di động, Hẹn trả: 28/09/2026 17:00', '2026-09-24 20:00:00'),
(24, 8, 'minh.dq', 'user', 'BORROW_REQUEST', 'REQUEST', 8, 'Thiết bị #1 (EQ-001)', 'Gửi yêu cầu mượn: Đo kiểm độ nhiễu nguồn xung Buck-Boost, Hẹn trả: 29/09/2026 17:00', '2026-09-25 00:15:00');
