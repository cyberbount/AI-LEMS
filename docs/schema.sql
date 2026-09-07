-- Database Schema for Laboratory Equipment Management System with AI Integration
-- MySQL 8.4 compatible

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS document_chunks;
DROP TABLE IF EXISTS documents;
DROP TABLE IF EXISTS maintenance_records;
DROP TABLE IF EXISTS borrow_requests;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS equipment_groups;
DROP TABLE IF EXISTS equipment_locations;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'technician') NOT NULL DEFAULT 'user',
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Create equipment_groups table
CREATE TABLE equipment_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create equipment_locations table
CREATE TABLE equipment_locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    building VARCHAR(50),
    room VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create equipment table
CREATE TABLE equipment (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    group_id INT,
    location_id INT,
    status ENUM('available', 'borrowed', 'maintenance') NOT NULL DEFAULT 'available',
    serial_number VARCHAR(100),
    model VARCHAR(100),
    manufacturer VARCHAR(100),
    purchase_date DATE,
    warranty_expiry DATE,
    cost DECIMAL(10, 2),
    specifications JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (group_id) REFERENCES equipment_groups(id) ON DELETE SET NULL,
    FOREIGN KEY (location_id) REFERENCES equipment_locations(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create borrow_requests table
CREATE TABLE borrow_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected', 'returned') NOT NULL DEFAULT 'pending',
    purpose TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    approved_by INT,
    approved_at TIMESTAMP,
    rejected_reason TEXT,
    returned_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create maintenance_records table
CREATE TABLE maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    equipment_id INT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    status ENUM('scheduled', 'in_progress', 'completed') NOT NULL DEFAULT 'scheduled',
    scheduled_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    performed_by INT,
    notes TEXT,
    cost DECIMAL(10, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create documents table
CREATE TABLE documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    file_path VARCHAR(255) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(100),
    equipment_id INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create document_chunks table
CREATE TABLE document_chunks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    chunk_text TEXT NOT NULL,
    chunk_index INT NOT NULL,
    embedding JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

CREATE INDEX idx_equipment_group ON equipment(group_id);
CREATE INDEX idx_equipment_location ON equipment(location_id);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_equipment_created_by ON equipment(created_by);

CREATE INDEX idx_borrow_user ON borrow_requests(user_id);
CREATE INDEX idx_borrow_equipment ON borrow_requests(equipment_id);
CREATE INDEX idx_borrow_status ON borrow_requests(status);
CREATE INDEX idx_borrow_dates ON borrow_requests(start_date, end_date);

CREATE INDEX idx_maintenance_equipment ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_status ON maintenance_records(status);
CREATE INDEX idx_maintenance_dates ON maintenance_records(scheduled_date, completed_at);

CREATE INDEX idx_documents_equipment ON documents(equipment_id);
CREATE INDEX idx_documents_created_by ON documents(created_by);

CREATE INDEX idx_document_chunks_document ON document_chunks(document_id);
CREATE INDEX idx_document_chunks_index ON document_chunks(chunk_index);

-- Create triggers for updating timestamps
DELIMITER $$
CREATE TRIGGER update_users_timestamp BEFORE UPDATE ON users
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP$$

CREATE TRIGGER update_equipment_timestamp BEFORE UPDATE ON equipment
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP$$

CREATE TRIGGER update_borrow_requests_timestamp BEFORE UPDATE ON borrow_requests
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP$$

CREATE TRIGGER update_maintenance_records_timestamp BEFORE UPDATE ON maintenance_records
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP$$

CREATE TRIGGER update_documents_timestamp BEFORE UPDATE ON documents
FOR EACH ROW SET NEW.updated_at = CURRENT_TIMESTAMP$$
$$
DELIMITER ;

-- Create views for common queries
CREATE VIEW equipment_summary AS
SELECT 
    e.id,
    e.name,
    e.description,
    e.status,
    eg.name as group_name,
    el.name as location_name,
    e.serial_number,
    e.model,
    e.manufacturer,
    e.created_at,
    e.updated_at
FROM equipment e
LEFT JOIN equipment_groups eg ON e.group_id = eg.id
LEFT JOIN equipment_locations el ON e.location_id = el.id;

CREATE VIEW borrow_summary AS
SELECT 
    br.id,
    br.status,
    br.purpose,
    br.start_date,
    br.end_date,
    br.created_at,
    u.username as borrower_name,
    e.name as equipment_name,
    eg.name as equipment_group,
    el.name as equipment_location
FROM borrow_requests br
JOIN users u ON br.user_id = u.id
JOIN equipment e ON br.equipment_id = e.id
LEFT JOIN equipment_groups eg ON e.group_id = eg.id
LEFT JOIN equipment_locations el ON e.location_id = el.id;

CREATE VIEW maintenance_summary AS
SELECT 
    mr.id,
    mr.title,
    mr.description,
    mr.status,
    mr.scheduled_date,
    mr.completed_at,
    u.username as technician_name,
    e.name as equipment_name,
    eg.name as equipment_group,
    el.name as equipment_location
FROM maintenance_records mr
LEFT JOIN users u ON mr.performed_by = u.id
JOIN equipment e ON mr.equipment_id = e.id
LEFT JOIN equipment_groups eg ON e.group_id = eg.id
LEFT JOIN equipment_locations el ON e.location_id = el.id;

-- Create stored procedures for common operations
DELIMITER $$
CREATE PROCEDURE get_equipment_by_status(IN p_status VARCHAR(20))
BEGIN
    SELECT * FROM equipment_summary 
    WHERE status = p_status
    ORDER BY name;
END$$

CREATE PROCEDURE get_borrow_requests_by_status(IN p_status VARCHAR(20))
BEGIN
    SELECT * FROM borrow_summary 
    WHERE status = p_status
    ORDER BY created_at DESC;
END$$

CREATE PROCEDURE get_maintenance_records_by_status(IN p_status VARCHAR(20))
BEGIN
    SELECT * FROM maintenance_summary 
    WHERE status = p_status
    ORDER BY scheduled_date ASC;
END$$

CREATE PROCEDURE get_equipment_statistics()
BEGIN
    SELECT 
        COUNT(*) as total_equipment,
        SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) as available_equipment,
        SUM(CASE WHEN status = 'borrowed' THEN 1 ELSE 0 END) as borrowed_equipment,
        SUM(CASE WHEN status = 'maintenance' THEN 1 ELSE 0 END) as maintenance_equipment,
        COUNT(DISTINCT group_id) as total_groups,
        COUNT(DISTINCT location_id) as total_locations
    FROM equipment;
END$$

CREATE PROCEDURE get_user_statistics()
BEGIN
    SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
        SUM(CASE WHEN role = 'technician' THEN 1 ELSE 0 END) as technician_users,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users
    FROM users;
END$$

CREATE PROCEDURE get_borrow_statistics()
BEGIN
    SELECT 
        COUNT(*) as total_borrows,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_borrows,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_borrows,
        SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END) as rejected_borrows,
        SUM(CASE WHEN status = 'returned' THEN 1 ELSE 0 END) as returned_borrows,
        AVG(DATEDIFF(end_date, start_date)) as avg_borrow_days
    FROM borrow_requests;
END$$

CREATE PROCEDURE get_maintenance_statistics()
BEGIN
    SELECT 
        COUNT(*) as total_maintenance,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_maintenance,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_maintenance,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_maintenance,
        AVG(TIMESTAMPDIFF(HOUR, scheduled_date, completed_at)) as avg_completion_hours
    FROM maintenance_records
    WHERE status = 'completed';
END$$
$$
DELIMITER ;

-- Create sample data for testing
INSERT INTO users (username, email, hashed_password, role, full_name, department) VALUES
('admin', 'admin@lab.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZW6', 'admin', 'System Administrator', 'IT'),
('manager', 'manager@lab.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZW6', 'admin', 'Lab Manager', 'Laboratory'),
('user1', 'user1@lab.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZW6', 'user', 'John Doe', 'Electronics'),
('technician', 'technician@lab.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZeUfkZMBs9kYZW6', 'technician', 'Jane Smith', 'Maintenance');

INSERT INTO equipment_groups (name, description) VALUES
('Test Equipment', 'Oscilloscopes, signal generators, and other test equipment'),
('Measurement Tools', 'Multimeters, power supplies, measurement instruments'),
('Development Kits', 'Arduino, Raspberry Pi, development boards'),
('Components', 'Resistors, capacitors, integrated circuits'),
('Software', 'Test software, development tools');

INSERT INTO equipment_locations (name, description, building, room) VALUES
('Lab A', 'Main electronics laboratory', 'Engineering Building', 'A101'),
('Lab B', 'IoT and embedded systems lab', 'Engineering Building', 'B202'),
('Lab C', 'Research and development lab', 'Engineering Building', 'C303'),
('Storage', 'Equipment storage area', 'Engineering Building', 'S001');

INSERT INTO equipment (name, description, group_id, location_id, status, serial_number, model, manufacturer, purchase_date, warranty_expiry, cost, specifications, created_by) VALUES
('Oscilloscope', 'Digital oscilloscope for signal analysis', 1, 1, 'available', 'DSO001', 'DSO1204G', 'Rigol', '2023-01-15', '2026-01-15', 1200.00, '{"bandwidth": "200MHz", "channels": 4, "sampling_rate": "1GSa/s"}', 1),
('Multimeter', 'Digital multimeter for electrical measurements', 2, 1, 'available', 'DMM001', 'Fluke 117', 'Fluke', '2023-02-20', '2026-02-20', 300.00, '{"functions": "AC/DC voltage, current, resistance", "accuracy": "±0.5%"}', 1),
('Arduino Uno', 'Microcontroller development board', 3, 2, 'available', 'ARD001', 'Uno R3', 'Arduino', '2023-03-10', '2028-03-10', 25.00, '{"microcontroller": "ATmega328P", "voltage": "5V", "pins": 14}', 1),
('Raspberry Pi', 'Single-board computer', 3, 2, 'borrowed', 'RPI001', '4B', 'Raspberry Pi Foundation', '2023-04-05', '2028-04-05', 55.00, '{"cpu": "Quad-core ARM Cortex-A72", "ram": "8GB", "storage": "32GB"}', 2),
('Power Supply', 'Adjustable DC power supply', 2, 3, 'available', 'PSU001', 'E3631A', 'Keysight', '2023-05-12', '2026-05-12', 800.00, '{"voltage": "0-60V", "current": "0-3A", "power": "180W"}', 1),
('Signal Generator', 'Function/arbitrary waveform generator', 1, 1, 'maintenance', 'SGN001', 'AFG3022C', 'Tektronix', '2023-06-18', '2026-06-18', 2500.00, '{"bandwidth": "20MHz", "channels": 2, "sampling_rate": "250MSa/s"}', 1);

INSERT INTO borrow_requests (user_id, equipment_id, status, purpose, start_date, end_date, approved_by, approved_at, returned_at) VALUES
(2, 4, 'returned', 'IoT project development', '2023-07-01 09:00:00', '2023-07-07 17:00:00', 2, '2023-07-01 10:00:00', '2023-07-07 17:30:00'),
(3, 1, 'approved', 'Signal analysis project', '2023-07-10 14:00:00', '2023-07-15 17:00:00', 2, '2023-07-10 15:00:00', NULL);

INSERT INTO maintenance_records (equipment_id, title, description, status, scheduled_date, started_at, completed_at, performed_by, notes, cost) VALUES
(6, 'Annual calibration', 'Perform annual calibration and verification', 'completed', '2023-08-01 09:00:00', '2023-08-01 10:00:00', '2023-08-01 14:00:00', 4, 'Calibration completed successfully. All specifications within tolerance.', 150.00),
(5, 'Fan replacement', 'Replace cooling fan that was making noise', 'scheduled', '2023-09-15 09:00:00', NULL, NULL, NULL, NULL, NULL);

INSERT INTO documents (title, description, file_path, file_size, mime_type, equipment_id, created_by) VALUES
('Oscilloscope User Manual', 'Complete user manual for DSO1204G oscilloscope', '/docs/oscilloscope_manual.pdf', 2048000, 'application/pdf', 1, 1),
('Arduino Uno Reference', 'Official Arduino Uno reference guide', '/docs/arduino_reference.pdf', 1024000, 'application/pdf', 3, 1),
('Lab Safety Guidelines', 'General laboratory safety procedures', '/docs/safety_guidelines.pdf', 512000, 'application/pdf', NULL, 1),
('Equipment Maintenance Procedures', 'Standard maintenance procedures for lab equipment', '/docs/maintenance_procedures.pdf', 1536000, 'application/pdf', NULL, 1);

-- Enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Grant permissions (replace 'your_user' and 'your_password' with actual credentials)
-- GRANT ALL PRIVILEGES ON local_lab_ai.* TO 'lab_user'@'%' IDENTIFIED BY 'your_password';
-- FLUSH PRIVILEGES;