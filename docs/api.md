# API Documentation

## Overview

This document provides comprehensive API documentation for the Laboratory Equipment Management System with AI Integration (AI-LEMS). The API is built using FastAPI and follows RESTful principles.

## Base URL

```
http://localhost:8000
```

## Authentication

All API endpoints (except authentication endpoints) require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## API Endpoints

### Authentication

#### POST /auth/login
Authenticate user and return JWT token

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "access_token": "string",
  "token_type": "bearer"
}
```

**Status Codes:**
- 200: Success
- 401: Invalid credentials

---

### Equipment Management

#### GET /equipment
Get all equipment with pagination

**Query Parameters:**
- `page`: Page number (default: 1)
- `size`: Items per page (default: 10)
- `search`: Search term (optional)
- `group`: Equipment group filter (optional)
- `location`: Equipment location filter (optional)

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "name": "Oscilloscope",
      "description": "Digital oscilloscope for signal analysis",
      "group": "Test Equipment",
      "location": "Lab A",
      "status": "available",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z"
    }
  ],
  "total": 25,
  "page": 1,
  "size": 10
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

#### POST /equipment
Create new equipment

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "group": "string",
  "location": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "group": "string",
  "location": "string",
  "status": "available",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Status Codes:**
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden

---

#### PUT /equipment/{id}
Update equipment

**Path Parameters:**
- `id`: Equipment ID

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "group": "string",
  "location": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "group": "string",
  "location": "string",
  "status": "available",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

#### DELETE /equipment/{id}
Delete equipment

**Path Parameters:**
- `id`: Equipment ID

**Response:**
```json
{
  "message": "Equipment deleted successfully"
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

### Borrow Management

#### GET /borrow-requests
Get all borrow requests with filtering

**Query Parameters:**
- `status`: Filter by status (pending, approved, rejected, returned)
- `user_id`: Filter by user ID
- `equipment_id`: Filter by equipment ID

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "user_id": 1,
      "equipment_id": 1,
      "status": "pending",
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "equipment": {
        "id": 1,
        "name": "Oscilloscope",
        "group": "Test Equipment",
        "location": "Lab A"
      }
    }
  ],
  "total": 5,
  "page": 1,
  "size": 10
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

#### POST /borrow-requests
Create new borrow request

**Request Body:**
```json
{
  "equipment_id": 1,
  "purpose": "string",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-02T00:00:00Z"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "equipment_id": 1,
  "status": "pending",
  "purpose": "string",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-02T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 201: Created
- 400: Bad request
- 401: Unauthorized

---

#### PUT /borrow-requests/{id}/approve
Approve borrow request

**Path Parameters:**
- `id`: Borrow request ID

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "equipment_id": 1,
  "status": "approved",
  "purpose": "string",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-02T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

#### PUT /borrow-requests/{id}/reject
Reject borrow request

**Path Parameters:**
- `id`: Borrow request ID

**Request Body:**
```json
{
  "reason": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "equipment_id": 1,
  "status": "rejected",
  "purpose": "string",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-02T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

#### PUT /borrow-requests/{id}/return
Return borrowed equipment

**Path Parameters:**
- `id`: Borrow request ID

**Response:**
```json
{
  "id": 1,
  "user_id": 1,
  "equipment_id": 1,
  "status": "returned",
  "purpose": "string",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-02T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

### Maintenance Management

#### GET /maintenance-records
Get all maintenance records

**Query Parameters:**
- `status`: Filter by status (scheduled, in_progress, completed)
- `equipment_id`: Filter by equipment ID

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "equipment_id": 1,
      "title": "Annual calibration",
      "description": "Perform annual calibration of oscilloscope",
      "status": "scheduled",
      "scheduled_date": "2023-01-15T00:00:00Z",
      "completed_date": null,
      "created_at": "2023-01-01T00:00:00Z",
      "updated_at": "2023-01-01T00:00:00Z",
      "equipment": {
        "id": 1,
        "name": "Oscilloscope",
        "group": "Test Equipment",
        "location": "Lab A"
      }
    }
  ],
  "total": 3,
  "page": 1,
  "size": 10
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

#### POST /maintenance-records
Create new maintenance record

**Request Body:**
```json
{
  "equipment_id": 1,
  "title": "string",
  "description": "string",
  "scheduled_date": "2023-01-15T00:00:00Z"
}
```

**Response:**
```json
{
  "id": 1,
  "equipment_id": 1,
  "title": "Annual calibration",
  "description": "Perform annual calibration of oscilloscope",
  "status": "scheduled",
  "scheduled_date": "2023-01-15T00:00:00Z",
  "completed_date": null,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 201: Created
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden

---

#### PUT /maintenance-records/{id}/start
Start maintenance work

**Path Parameters:**
- `id`: Maintenance record ID

**Response:**
```json
{
  "id": 1,
  "equipment_id": 1,
  "title": "Annual calibration",
  "description": "Perform annual calibration of oscilloscope",
  "status": "in_progress",
  "scheduled_date": "2023-01-15T00:00:00Z",
  "completed_date": null,
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

#### PUT /maintenance-records/{id}/complete
Complete maintenance work

**Path Parameters:**
- `id`: Maintenance record ID

**Request Body:**
```json
{
  "notes": "string"
}
```

**Response:**
```json
{
  "id": 1,
  "equipment_id": 1,
  "title": "Annual calibration",
  "description": "Perform annual calibration of oscilloscope",
  "status": "completed",
  "scheduled_date": "2023-01-15T00:00:00Z",
  "completed_date": "2023-01-16T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z",
  "equipment": {
    "id": 1,
    "name": "Oscilloscope",
    "group": "Test Equipment",
    "location": "Lab A"
  }
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 403: Forbidden
- 404: Not found

---

### AI Assistant

#### POST /ai/ask
Ask question to AI assistant

**Request Body:**
```json
{
  "question": "How do I use the oscilloscope?",
  "context": "optional context information"
}
```

**Response:**
```json
{
  "answer": "To use the oscilloscope, follow these steps: 1) Turn on the power, 2) Connect the probe to the circuit, 3) Adjust the time and voltage scales, 4) Observe the waveform on the display.",
  "sources": [
    {
      "document_name": "Oscilloscope User Manual",
      "relevance_score": 0.95
    }
  ],
  "processing_time": 2.5
}
```

**Status Codes:**
- 200: Success
- 400: Bad request
- 401: Unauthorized
- 500: AI service error

---

#### GET /ai/stats
Get AI service statistics

**Response:**
```json
{
  "total_requests": 150,
  "successful_requests": 145,
  "failed_requests": 5,
  "average_response_time": 2.3,
  "available_devices": 25,
  "open_maintenance_records": 3
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

### Statistics and Reports

#### GET /stats/equipment
Get equipment statistics

**Response:**
```json
{
  "total_equipment": 50,
  "available_equipment": 35,
  "borrowed_equipment": 10,
  "maintenance_equipment": 5,
  "by_group": {
    "Test Equipment": 20,
    "Measurement Tools": 15,
    "Development Kits": 10,
    "Components": 5
  },
  "by_location": {
    "Lab A": 25,
    "Lab B": 15,
    "Lab C": 10
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

#### GET /stats/borrow
Get borrow statistics

**Response:**
```json
{
  "total_borrows": 100,
  "active_borrows": 10,
  "completed_borrows": 90,
  "average_borrow_duration": 3.5,
  "by_month": {
    "2023-01": 25,
    "2023-02": 30,
    "2023-03": 45
  }
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

#### GET /stats/maintenance
Get maintenance statistics

**Response:**
```json
{
  "total_maintenance": 30,
  "scheduled_maintenance": 5,
  "in_progress_maintenance": 3,
  "completed_maintenance": 22,
  "overdue_maintenance": 2,
  "average_completion_time": 5.2
}
```

**Status Codes:**
- 200: Success
- 401: Unauthorized

---

## Error Responses

All endpoints return appropriate HTTP status codes and error messages in JSON format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

Common error codes:
- 400: Bad Request - Invalid input data
- 401: Unauthorized - Authentication required
- 403: Forbidden - Insufficient permissions
- 404: Not Found - Resource not found
- 422: Unprocessable Entity - Validation error
- 500: Internal Server Error - Server-side error

## Rate Limiting

API endpoints are rate limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- General endpoints: 100 requests per minute
- AI endpoints: 20 requests per minute

## Data Models

### Equipment
```json
{
  "id": 1,
  "name": "string",
  "description": "string",
  "group": "string",
  "location": "string",
  "status": "available|borrowed|maintenance",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Borrow Request
```json
{
  "id": 1,
  "user_id": 1,
  "equipment_id": 1,
  "status": "pending|approved|rejected|returned",
  "purpose": "string",
  "start_date": "2023-01-01T00:00:00Z",
  "end_date": "2023-01-02T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### Maintenance Record
```json
{
  "id": 1,
  "equipment_id": 1,
  "title": "string",
  "description": "string",
  "status": "scheduled|in_progress|completed",
  "scheduled_date": "2023-01-15T00:00:00Z",
  "completed_date": "2023-01-16T00:00:00Z",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```

### User
```json
{
  "id": 1,
  "username": "string",
  "email": "string",
  "role": "admin|user|technician",
  "created_at": "2023-01-01T00:00:00Z",
  "updated_at": "2023-01-01T00:00:00Z"
}
```