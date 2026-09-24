import re

# 1. Update backend/app/schemas.py
with open('backend/app/schemas.py', 'r') as f:
    schemas = f.read()
schemas = schemas.replace('class MaintenanceCreate(BaseModel):\n    device_id: int; kind: str = "inspection"; notes: str = ""; scheduled_at: datetime | None = None',
                          'class MaintenanceCreate(BaseModel):\n    device_id: int; kind: str = "inspection"; notes: str = ""; scheduled_at: datetime | None = None; status: str = "open"')
with open('backend/app/schemas.py', 'w') as f:
    f.write(schemas)

# 2. Update backend/app/routers/maintenance.py
with open('backend/app/routers/maintenance.py', 'r') as f:
    router = f.read()

router_old = """@router.post("", response_model=MaintenanceOut, status_code=201)
def create(data: MaintenanceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, data.device_id)
    if not device: raise HTTPException(404, "Device not found")
    if device.status == "available":
        device.status = "maintenance"
    item = MaintenanceRecord(**data.model_dump(), technician_id=user.id); db.add(item); db.commit(); db.refresh(item); return item"""

router_new = """@router.post("", response_model=MaintenanceOut, status_code=201)
def create(data: MaintenanceCreate, db: Db, user: Annotated[User, Depends(require_roles("admin", "manager", "technician"))]):
    device = db.get(Device, data.device_id)
    if not device: raise HTTPException(404, "Device not found")
    
    item = MaintenanceRecord(**data.model_dump(), technician_id=user.id)
    from datetime import datetime
    
    if data.status in ["completed", "replace_full", "replace_partial"]:
        if data.status == "completed":
            item.completed_at = datetime.utcnow()
        if device.status == "maintenance" and data.status == "completed":
            device.status = "available"
        elif device.status == "available" and data.status != "completed":
            device.status = "maintenance"
    else:
        if device.status == "available":
            device.status = "maintenance"
            
    db.add(item)
    db.commit()
    db.refresh(item)
    return item"""

router = router.replace(router_old, router_new)
with open('backend/app/routers/maintenance.py', 'w') as f:
    f.write(router)

# 3. Update frontend/src/lib/api.js
with open('frontend/src/lib/api.js', 'r') as f:
    api = f.read()
api = api.replace('createMaintenance: (device_id, notes, kind = "inspection") => request("/api/maintenance", { method: "POST", body: JSON.stringify({ device_id, notes, kind }) }),',
                  'createMaintenance: (device_id, notes, status = "open", kind = "inspection") => request("/api/maintenance", { method: "POST", body: JSON.stringify({ device_id, notes, status, kind }) }),')
with open('frontend/src/lib/api.js', 'w') as f:
    f.write(api)

# 4. Update frontend/src/App.jsx MaintenanceModal
with open('frontend/src/App.jsx', 'r') as f:
    app = f.read()

# Change handleSubmit
handle_old = """      if (modal.mode === "create") {
        await api.createMaintenance(form.device_id, form.notes, form.kind);
        setToast({ message: "Đã lên lịch bảo trì", type: "success" });"""
handle_new = """      if (modal.mode === "create") {
        await api.createMaintenance(form.device_id, form.notes, form.status, form.kind);
        setToast({ message: "Đã lưu tác vụ bảo trì", type: "success" });"""
app = app.replace(handle_old, handle_new)

# Show status dropdown in create mode too
modal_status_old = """          {mode === "update" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">Trạng thái</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="open">Đang mở</option>
                <option value="completed">Hoàn thành</option>
                <option value="replace_full">Phải thay thế mới</option>
                <option value="replace_partial">Thay thế một phần</option>
              </select>
            </div>
          )}"""
modal_status_new = """          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Trạng thái / Tác vụ</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="open">Lên lịch bảo trì (Đang mở)</option>
              <option value="replace_full">Phải thay thế mới</option>
              <option value="replace_partial">Thay thế một phần</option>
              <option value="completed">Đã hoàn thành</option>
            </select>
          </div>"""
app = app.replace(modal_status_old, modal_status_new)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(app)
