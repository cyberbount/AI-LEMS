-- Canonical relational schema for AI-LEMS.
-- Runtime initialization is also available in backend/init.sql for MySQL.
CREATE TABLE roles (
    name VARCHAR(30) PRIMARY KEY,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    email VARCHAR(160) NOT NULL UNIQUE,
    full_name VARCHAR(160) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL DEFAULT 'user',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role) REFERENCES roles(name)
);

CREATE TABLE device_groups (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT ''
);

CREATE TABLE locations (
    id INTEGER PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    building VARCHAR(120) NOT NULL DEFAULT ''
);

CREATE TABLE devices (
    id INTEGER PRIMARY KEY,
    asset_code VARCHAR(60) NOT NULL UNIQUE,
    name VARCHAR(160) NOT NULL,
    category VARCHAR(80) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'available',
    serial_number VARCHAR(120) NOT NULL DEFAULT '',
    group_id INTEGER,
    location_id INTEGER,
    FOREIGN KEY (group_id) REFERENCES device_groups(id),
    FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE borrow_requests (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    requested_from TIMESTAMP,
    requested_to TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE usage_history (
    id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    device_id INTEGER NOT NULL,
    borrow_request_id INTEGER,
    action VARCHAR(30) NOT NULL,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (borrow_request_id) REFERENCES borrow_requests(id)
);

CREATE TABLE maintenance_schedules (
    id INTEGER PRIMARY KEY,
    device_id INTEGER NOT NULL,
    interval_days INTEGER NOT NULL DEFAULT 180,
    next_due_at TIMESTAMP NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT NOT NULL DEFAULT '',
    FOREIGN KEY (device_id) REFERENCES devices(id)
);

CREATE TABLE maintenance_records (
    id INTEGER PRIMARY KEY,
    device_id INTEGER NOT NULL,
    technician_id INTEGER,
    kind VARCHAR(40) NOT NULL DEFAULT 'inspection',
    notes TEXT NOT NULL DEFAULT '',
    status VARCHAR(30) NOT NULL DEFAULT 'open',
    scheduled_at TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (device_id) REFERENCES devices(id),
    FOREIGN KEY (technician_id) REFERENCES users(id)
);

CREATE TABLE documents (
    id INTEGER PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    description TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE document_chunks (
    id INTEGER PRIMARY KEY,
    document_id INTEGER,
    document_name VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    chunk_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (document_id) REFERENCES documents(id)
);

CREATE INDEX ix_users_role ON users(role);
CREATE INDEX ix_devices_status ON devices(status);
CREATE INDEX ix_borrow_requests_status ON borrow_requests(status);
CREATE INDEX ix_maintenance_records_status ON maintenance_records(status);
CREATE INDEX ix_document_chunks_name ON document_chunks(document_name);
