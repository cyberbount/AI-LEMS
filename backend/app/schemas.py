from typing import Literal

from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict


class ChatMessage(BaseModel):
    role: Literal["system", "user", "assistant"]
    content: str = Field(min_length=1, max_length=12000)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=12000)
    history: list[ChatMessage] = Field(default_factory=list)
    mode: Literal["chat", "rag", "summary", "inspection_alert"] = "chat"


class ChatResponse(BaseModel):
    answer: str
    model: str
    provider: str
    mode: str = "chat"
    grounded: bool | None = None
    sources: list[str] = Field(default_factory=list)


DeviceStatus = Literal["available", "reserved", "borrowed", "maintenance"]
RequestStatus = Literal["pending", "approved", "borrowed", "returned", "rejected"]


class HealthResponse(BaseModel):
    status: str
    ollama: bool
    model: str
    provider: str
    capabilities: list[str] = Field(default_factory=list)


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str
    full_name: str
    password: str = Field(min_length=8)
    role: str = "user"


class UserOut(ORMModel):
    id: int; username: str; email: str; full_name: str; role: str; is_active: bool


class Token(BaseModel):
    access_token: str; token_type: str = "bearer"


class DeviceCreate(BaseModel):
    asset_code: str; name: str; category: str; serial_number: str = ""; group_id: int | None = None; location_id: int | None = None


class DeviceOut(ORMModel):
    id: int; asset_code: str; name: str; category: str; status: DeviceStatus; serial_number: str; group_id: int | None; location_id: int | None


class RequestCreate(BaseModel):
    device_id: int; purpose: str = Field(min_length=3); requested_from: datetime | None = None; requested_to: datetime | None = None


class RequestOut(ORMModel):
    id: int; user_id: int; device_id: int; purpose: str; status: RequestStatus; requested_from: datetime | None; requested_to: datetime | None; created_at: datetime


class MaintenanceCreate(BaseModel):
    device_id: int; kind: str = "inspection"; notes: str = ""; scheduled_at: datetime | None = None


class MaintenanceOut(ORMModel):
    id: int; device_id: int; technician_id: int | None; kind: str; notes: str; status: str; scheduled_at: datetime | None; completed_at: datetime | None


class MaintenanceScheduleCreate(BaseModel):
    device_id: int; interval_days: int = Field(default=180, ge=1); next_due_at: datetime; active: bool = True; notes: str = ""


class MaintenanceScheduleOut(ORMModel):
    id: int; device_id: int; interval_days: int; next_due_at: datetime; active: bool; notes: str


class GroupCreate(BaseModel):
    name: str; description: str = ""


class LocationCreate(BaseModel):
    name: str; building: str = ""
