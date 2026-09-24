import re

with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

# 1. Update statusMeta
status_meta_replacement = """  completed: { label: "Hoàn thành", tone: "green" },
  replace_full: { label: "Phải thay thế mới", tone: "red" },
  replace_partial: { label: "Thay thế một phần", tone: "amber" },
};"""
content = re.sub(r'  completed: { label: "Hoàn thành", tone: "green" },\n};', status_meta_replacement, content)

# 2. Update WorkspaceSection export buttons
export_condition_old = 'section === "Báo cáo" && ('
export_condition_new = '(section === "Báo cáo" || (role === "technician" && section === "Lịch sử")) && ('
content = content.replace(export_condition_old, export_condition_new)

# 3. Add MaintenanceModal
maintenance_modal = """
function MaintenanceModal({ open, mode, item, devices, onClose, onSubmit, onDelete }) {
  const [form, setForm] = useState({ device_id: "", notes: "", status: "open", kind: "inspection" });
  
  useEffect(() => {
    if (open) {
      if (mode === "create") {
        setForm({ device_id: devices[0]?.id || "", notes: "", status: "open", kind: "inspection" });
      } else if (item) {
        setForm({ device_id: item.device_id, notes: item.notes || "", status: item.status, kind: item.kind });
      }
    }
  }, [open, mode, item, devices]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-foreground">
          {mode === "create" ? "Thêm mới / Lên lịch bảo trì" : "Cập nhật công việc bảo trì"}
        </h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Thiết bị</label>
            <select
              value={form.device_id}
              onChange={(e) => setForm({ ...form, device_id: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              disabled={mode === "update"}
            >
              {devices.map(d => <option key={d.id} value={d.id}>#{d.id} - {d.name}</option>)}
            </select>
          </div>
          {mode === "update" && (
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
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Ghi chú</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Nhập ghi chú chi tiết..."
            />
          </div>
          <div className="mt-6 flex justify-between gap-3">
            {mode === "update" ? (
              <Button size="sm" variant="danger" onClick={() => onDelete(item.id)}>Xóa</Button>
            ) : <div />}
            <div className="flex gap-3">
              <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
              <Button size="sm" onClick={() => onSubmit(form)}>Lưu</Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

if "function MaintenanceModal" not in content:
    content = content.replace('function TechnicianDashboard', maintenance_modal + '\nfunction TechnicianDashboard')

# 4. Update TechnicianDashboard logic
tech_dash_old = """  const [toast, setToast] = useState(null);

  async function complete(item) {
    try {
      await api.completeMaintenance(item.id);
      const devices = await api.devices();
      setToast({ message: "Đã hoàn thành công việc bảo trì", type: "success" });
      setData((current) => ({
        ...current,
        devices,
        maintenance: current.maintenance.map((row) => row.id === item.id ? { ...row, status: "completed" } : row),
      }));
    } catch {
      setToast({ message: "Không thể cập nhật qua API", type: "error" });
    }
  }

  if (section !== "Tổng quan") return <><PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />{offline && <OfflineNotice />}<WorkspaceSection section={section} role="technician" data={data} onComplete={complete} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} /></>;

  const openItems = data.maintenance.filter((item) => item.status !== "completed");
  const completedItems = data.maintenance.filter((item) => item.status === "completed");
  const deviceCount = new Set(openItems.map((item) => item.device_id)).size;"""

tech_dash_new = """  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState({ open: false, mode: 'create', item: null });

  async function handleSubmit(form) {
    try {
      if (modal.mode === "create") {
        await api.createMaintenance(form.device_id, form.notes, form.kind);
        setToast({ message: "Đã lên lịch bảo trì", type: "success" });
      } else {
        await api.updateMaintenance(modal.item.id, { status: form.status, notes: form.notes });
        setToast({ message: "Đã cập nhật bảo trì", type: "success" });
      }
      const [devices, maintenance] = await Promise.all([api.devices(), api.maintenance()]);
      setData(current => ({ ...current, devices, maintenance }));
      setModal({ open: false, mode: 'create', item: null });
    } catch {
      setToast({ message: "Không thể cập nhật qua API", type: "error" });
    }
  }

  async function handleDelete(id) {
    try {
      await api.deleteMaintenance(id);
      setToast({ message: "Đã xóa bản ghi", type: "success" });
      const maintenance = await api.maintenance();
      setData(current => ({ ...current, maintenance }));
      setModal({ open: false, mode: 'create', item: null });
    } catch {
      setToast({ message: "Không thể xóa qua API", type: "error" });
    }
  }

  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />
      {offline && <OfflineNotice />}
      <WorkspaceSection section={section} role="technician" data={data} onComplete={(item) => setModal({ open: true, mode: 'update', item })} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} />
      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
    </>
  );

  const openItems = data.maintenance.filter((item) => !["completed", "replace_full"].includes(item.status));
  const completedItems = data.maintenance.filter((item) => item.status === "completed");
  const replaceFullItems = data.maintenance.filter((item) => item.status === "replace_full");
  const replacePartialItems = data.maintenance.filter((item) => item.status === "replace_partial");
  const deviceCount = new Set(openItems.map((item) => item.device_id)).size;"""

content = content.replace(tech_dash_old, tech_dash_new)

# 5. Update TechnicianDashboard UI (Cards and List)
kpi_cards_old = """      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Đang bảo trì" value={openItems.length} icon={Wrench} tone="red" />
        <KPICard label="Đã hoàn thành" value={completedItems.length} icon={CheckCircle2} tone="green" />
        <KPICard label="Thiết bị liên quan" value={deviceCount} icon={Cpu} tone="blue" />
        <KPICard label="Tổng bản ghi" value={data.maintenance.length} icon={ClipboardCheck} tone="amber" />
      </div>"""

kpi_cards_new = """      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KPICard label="Đang bảo trì" value={openItems.length} icon={Wrench} tone="blue" />
        <KPICard label="Thay thế 1 phần" value={replacePartialItems.length} icon={Wrench} tone="amber" />
        <KPICard label="Phải thay thế mới" value={replaceFullItems.length} icon={AlertTriangle} tone="red" />
        <KPICard label="Đã hoàn thành" value={completedItems.length} icon={CheckCircle2} tone="green" />
      </div>"""
content = content.replace(kpi_cards_old, kpi_cards_new)

to_do_list_old = """      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <SectionTitle title="Danh sách công việc cần làm" />
        {openItems.length ? (
          openItems.map((item) => (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800 min-w-0" key={item.id}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0"><Settings2 size={17} /></div>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Thiết bị #{item.device_id} • {item.kind}</span>
              <StatusBadge status={item.status} />
              <Button size="sm" variant="success" onClick={() => complete(item)} className="shrink-0">Hoàn thành</Button>
            </div>
          ))
        ) : ("""

to_do_list_new = """      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle title="Danh sách công việc cần làm" />
          <Button size="sm" onClick={() => setModal({ open: true, mode: 'create', item: null })}>+ Lên lịch / Thêm</Button>
        </div>
        {openItems.length ? (
          openItems.map((item) => (
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-4 last:border-0 dark:border-slate-800 min-w-0" key={item.id}>
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 shrink-0"><Settings2 size={17} /></div>
              <span className="flex-1 text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">Thiết bị #{item.device_id} • {item.kind}</span>
              <StatusBadge status={item.status} />
              <Button size="sm" variant="outline" onClick={() => setModal({ open: true, mode: 'update', item })} className="shrink-0">Cập nhật</Button>
            </div>
          ))
        ) : ("""
content = content.replace(to_do_list_old, to_do_list_new)

# Add <MaintenanceModal /> at the end of TechnicianDashboard return
toast_old = """      <Toast message={toast?.message} type={toast?.type} />
    </>"""
toast_new = """      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
      <Toast message={toast?.message} type={toast?.type} />
    </>"""
content = content.replace(toast_old, toast_new)

# 6. Update WorkspaceSection's button text from "Hoàn thành" to "Cập nhật"
ws_button_old = """          {role === "technician" && item.status !== "completed" && <Button size="sm" variant="success" onClick={() => onComplete(item)} className="shrink-0">Hoàn thành</Button>}"""
ws_button_new = """          {role === "technician" && item.status !== "completed" && <Button size="sm" variant="outline" onClick={() => onComplete(item)} className="shrink-0">Cập nhật</Button>}"""
content = content.replace(ws_button_old, ws_button_new)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)
