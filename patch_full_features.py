import re

with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

# ---------------------------------------------------------
# 1. Add downloadAuditLogsTXT helper right after printReportPDF
# ---------------------------------------------------------
audit_export_helper = """
function downloadAuditLogsTXT(logs = [], title = "NHẬT KÝ KIỂM TOÁN HỆ THỐNG", filename = "Nhat_ky_kiem_toan") {
  const now = new Date();
  const dateStr = now.toLocaleDateString("vi-VN");
  const timeStr = now.toLocaleTimeString("vi-VN");

  let content = `=====================================================\\n`;
  content += `           ${title.toUpperCase()}\\n`;
  content += `=====================================================\\n`;
  content += `Thời gian xuất : ${timeStr} - ${dateStr}\\n`;
  content += `Tổng số bản ghi: ${logs.length}\\n\\n`;

  if (!logs.length) {
    content += `Chưa có bản ghi nhật ký nào.\\n`;
  } else {
    logs.forEach((log, i) => {
      const d = new Date(log.created_at).toLocaleString("vi-VN");
      content += `[${i + 1}] ${d} | @${log.username} (${log.user_role}) | ${log.action} | ${log.target_type}\\n`;
      content += `    Đối tượng: ${log.target_name || "—"}\\n`;
      if (log.details) content += `    Chi tiết : ${log.details}\\n`;
      content += `-----------------------------------------------------\\n`;
    });
  }
  content += `\\n=====================================================\\n`;
  content += `      XUẤT TỰ ĐỘNG TỪ HỆ THỐNG KIỂM TOÁN LYXLAB\\n`;
  content += `=====================================================\\n`;

  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${now.toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
"""

if "function downloadAuditLogsTXT" not in content:
    content = content.replace("function printReportPDF() {\n  window.print();\n}", "function printReportPDF() {\n  window.print();\n}\n" + audit_export_helper)

# ---------------------------------------------------------
# 2. Add AuditLogViewer, BorrowModal, IncidentModal, DeviceEditModal
# ---------------------------------------------------------
new_modals = """
/* ------------------------------------------------------------------ */
/* Audit Log & Advanced Action Modals                                  */
/* ------------------------------------------------------------------ */
function AuditLogViewer({ targetType = null, title = "Nhật ký hoạt động & Kiểm toán (Audit Trail)" }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("all");

  const fetchLogs = () => {
    setLoading(true);
    api.auditLogs({ target_type: targetType || undefined })
      .then(res => { setLogs(res); setLoading(false); })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchLogs();
  }, [targetType]);

  const filtered = filterAction === "all" ? logs : logs.filter(l => l.action === filterAction);

  const actionLabels = {
    CREATE: "Tạo mới",
    UPDATE: "Cập nhật",
    DELETE: "Xóa / Thanh lý",
    STATUS_CHANGE: "Đổi trạng thái",
    BORROW_REQUEST: "Yêu cầu mượn",
    APPROVE: "Duyệt mượn",
    REJECT: "Từ chối",
    HANDOVER: "Bàn giao",
    RETURN: "Hoàn trả",
    INCIDENT_REPORT: "Báo sự cố",
    RESET_PASSWORD: "Đặt lại MK",
  };

  return (
    <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <SectionTitle title={title} />
          <p className="-mt-2 text-xs text-muted-foreground">Truy vết thời gian, người thực hiện và dữ liệu biến động trên hệ thống.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterAction} onChange={(e) => setFilterAction(e.target.value)} className="h-9 text-xs w-36">
            <option value="all">Tất cả hành động</option>
            {Object.entries(actionLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
          <Button size="sm" variant="outline" onClick={() => downloadAuditLogsTXT(filtered, title, "Nhat_ky_kiem_toan")}>
            <FileDown size={14} /> Xuất Log .TXT
          </Button>
          <Button size="sm" variant="outline" onClick={printReportPDF}>
            <Printer size={14} /> In PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground py-4">Đang tải dữ liệu nhật ký...</p>
      ) : filtered.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-elevated uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Thời gian</th>
                <th className="px-4 py-2.5">Người thực hiện</th>
                <th className="px-4 py-2.5">Hành động</th>
                <th className="px-4 py-2.5">Đối tượng</th>
                <th className="px-4 py-2.5">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.slice(0, 50).map((log) => (
                <tr key={log.id} className="hover:bg-surface-elevated/40">
                  <td className="px-4 py-2.5 font-mono text-muted-foreground whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-2.5 font-semibold text-foreground whitespace-nowrap">
                    @{log.username} <span className="text-[10px] text-muted-foreground font-normal">({log.user_role})</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      {actionLabels[log.action] || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-medium text-foreground truncate max-w-[200px]" title={log.target_name}>
                    {log.target_name || `#${log.target_id || "—"}`}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground max-w-[320px] truncate" title={log.details}>
                    {log.details || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty text="Chưa có bản ghi nhật ký hoạt động nào." />
      )}
    </Card>
  );
}

function BorrowModal({ open, device, onClose, onSubmit }) {
  const [form, setForm] = useState({ purpose: "Thực hành phòng thí nghiệm", requested_to: "" });

  useEffect(() => {
    if (open) {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      setForm({ purpose: "Thực hành phòng thí nghiệm", requested_to: d.toISOString().slice(0, 10) });
    }
  }, [open]);

  if (!open || !device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl">
        <h3 className="mb-2 text-lg font-bold text-foreground">Đăng ký mượn thiết bị</h3>
        <p className="text-xs text-muted-foreground mb-4">
          Thiết bị: <span className="font-semibold text-foreground">{device.name}</span> ({device.asset_code})
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Mục đích sử dụng</label>
            <textarea
              value={form.purpose}
              onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              rows={3}
              placeholder="Nêu rõ bài thực hành, đề tài hoặc mục đích mượn..."
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Ngày hẹn trả thiết bị</label>
            <input
              type="date"
              value={form.requested_to}
              onChange={(e) => setForm({ ...form, requested_to: e.target.value })}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-xs text-blue-700 dark:text-blue-300">
            Cam kết: Sử dụng thiết bị đúng quy trình kỹ thuật, ngắt nguồn khi không dùng và hoàn trả đúng ngày hẹn.
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
            <Button size="sm" onClick={() => onSubmit(form)}>Gửi yêu cầu mượn</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IncidentModal({ open, item, onClose, onSubmit }) {
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (open) setDescription("");
  }, [open]);

  if (!open || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-surface p-6 shadow-2xl border-2 border-red-500/30">
        <div className="flex items-center gap-2 mb-2 text-red-600 dark:text-red-400">
          <AlertTriangle size={20} />
          <h3 className="text-lg font-bold text-foreground">Báo cáo sự cố thiết bị</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Thiết bị #{item.device_id}: Hệ thống sẽ gửi cảnh báo khẩn cấp đến Kỹ thuật viên và chuyển máy sang trạng thái bảo trì.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Mô tả chi tiết sự cố / lỗi hỏng</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-red-500 focus:outline-none"
              rows={4}
              placeholder="Ví dụ: Thiết bị không lên nguồn, chập que đo, cháy cầu chì, màn hình hiển thị lỗi..."
            />
          </div>

          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
            <Button size="sm" variant="danger" onClick={() => onSubmit(description)} disabled={!description.trim()}>
              Gửi báo cáo sự cố
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeviceEditModal({ open, device, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", category: "", condition: "", serial_number: "" });

  useEffect(() => {
    if (open && device) {
      setForm({
        name: device.name || "",
        category: device.category || RESEARCH_CATEGORIES[0].value,
        condition: device.condition || "Mới nguyên hộp",
        serial_number: device.serial_number || "",
      });
    }
  }, [open, device]);

  if (!open || !device) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-surface p-6 shadow-2xl">
        <h3 className="mb-4 text-lg font-bold text-foreground">Chỉnh sửa thông tin thiết bị</h3>
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Mã tài sản (Cố định)</label>
            <input value={device.asset_code} disabled className="w-full rounded-lg border border-border bg-surface-elevated/50 p-2 text-sm text-muted-foreground font-mono" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Tên thiết bị</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Nhóm phân loại</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none">
              {RESEARCH_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Tình trạng vật lý</label>
            <select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none">
              {DEVICE_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Số Sê-ri (Serial Number)</label>
            <input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none" placeholder="SN-xxxxx" />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Button size="sm" variant="outline" onClick={onClose}>Hủy</Button>
            <Button size="sm" onClick={() => onSave(device.id, form)}>Lưu thay đổi</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
"""

if "function AuditLogViewer" not in content:
    content = content.replace("function DeviceModal(", new_modals + "\nfunction DeviceModal(")

# ---------------------------------------------------------
# 3. Update RequestList to show overdue badge and requested_to date
# ---------------------------------------------------------
req_list_old = """            <div className="min-w-0 flex-1 text-sm truncate">
              <div className="flex items-center gap-2">
                <span className="font-bold text-foreground">Thiết bị #{item.device_id}</span>
                <StatusBadge status={item.status} />
              </div>
              <span className="mt-1 block truncate text-xs font-medium text-muted-foreground">
                {item.purpose || `Yêu cầu #${item.id}`}
              </span>
            </div>"""

req_list_new = """            <div className="min-w-0 flex-1 text-sm truncate">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-foreground">Thiết bị #{item.device_id}</span>
                <StatusBadge status={item.status} />
                {item.status === "borrowed" && item.requested_to && new Date(item.requested_to) < new Date() && (
                  <span className="rounded bg-red-100 dark:bg-red-950/80 px-1.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 animate-pulse">
                    QUÁ HẠN
                  </span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                <span>{item.purpose || `Yêu cầu #${item.id}`}</span>
                {item.requested_to && (
                  <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400">
                    • Hạn trả: {new Date(item.requested_to).toLocaleDateString("vi-VN")}
                  </span>
                )}
              </div>
            </div>"""

content = content.replace(req_list_old, req_list_new)
content = content.replace("items.slice(0, 10).map((item) => (", "items.map((item) => (")

# ---------------------------------------------------------
# 4. Update WorkspaceSection export conditions
# ---------------------------------------------------------
old_ws_export = '(section === "Báo cáo" || (role === "technician" && section === "Lịch sử")) && ('
new_ws_export = '(section === "Báo cáo" || (role === "technician" && section === "Lịch sử") || (role === "user" && section === "Lượt mượn của tôi")) && ('
content = content.replace(old_ws_export, new_ws_export)

# Add AuditLogViewer to WorkspaceSection when section is "Báo cáo" or "Lịch sử"
ws_tail_old = """      {(section === "Báo cáo" || (role === "technician" && section === "Lịch sử")) && (
        <>
          <UsageChart usage={data.stats.usage_by_action} />"""

ws_tail_new = """      {section === "Báo cáo" && (
        <>
          <UsageChart usage={data.stats.usage_by_action} />
          <div className="mt-6">
            <AuditLogViewer />
          </div>"""
content = content.replace(ws_tail_old, ws_tail_new)

# Add AuditLogViewer for technician in Lịch sử tab
ws_tech_hist_old = """          <div className="flex flex-col">
            <KPICard label="Yêu cầu" value={data.stats.requests} icon={Package} tone="blue" />
          </div>
        </div>
      </>
    )}"""

# ---------------------------------------------------------
# 5. Update MaintenanceModal to include condition evaluation
# ---------------------------------------------------------
maint_cond_old = """          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Ghi chú</label>
            <textarea"""

maint_cond_new = """          {mode === "update" && (
            <div>
              <label className="mb-1 block text-sm font-semibold text-foreground">Đánh giá tình trạng thiết bị</label>
              <select
                value={form.device_condition || ""}
                onChange={(e) => setForm({ ...form, device_condition: e.target.value })}
                className="w-full rounded-lg border border-input bg-surface-elevated p-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="">-- Giữ nguyên tình trạng cũ --</option>
                {DEVICE_CONDITIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="mb-1 block text-sm font-semibold text-foreground">Ghi chú</label>
            <textarea"""

content = content.replace(maint_cond_old, maint_cond_new)

# Also update handleSubmit in TechnicianDashboard to send device_condition
tech_submit_old = "await api.updateMaintenance(modal.item.id, { status: form.status, notes: form.notes });"
tech_submit_new = "await api.updateMaintenance(modal.item.id, { status: form.status, notes: form.notes, device_condition: form.device_condition || undefined });"
content = content.replace(tech_submit_old, tech_submit_new)

# ---------------------------------------------------------
# 6. Update UserDashboard: BorrowModal + IncidentModal + Button
# ---------------------------------------------------------
user_state_old = """  const [toast, setToast] = useState(null);"""
user_state_new = """  const [toast, setToast] = useState(null);
  const [borrowModal, setBorrowModal] = useState({ open: false, device: null });
  const [incidentModal, setIncidentModal] = useState({ open: false, item: null });"""

# In UserDashboard:
content = content.replace("function UserDashboard({ section = \"Tổng quan\", onNavigate }) {\n  const { data, offline, setData } = useDashboardData();\n  const { user } = useAuth();\n  const [toast, setToast] = useState(null);",
                          "function UserDashboard({ section = \"Tổng quan\", onNavigate }) {\n  const { data, offline, setData } = useDashboardData();\n  const { user } = useAuth();\n" + user_state_new)

user_borrow_func_old = """  async function borrow(device) {
    const purpose = window.prompt("Mục đích mượn thiết bị:", "Thực hành phòng thí nghiệm");
    if (!purpose) return;
    try {
      const item = await api.borrow(device.id, purpose);
      setData((current) => ({ ...current, requests: [...current.requests, item] }));
      setToast({ message: "Đã gửi yêu cầu mượn thành công. Vui lòng chờ Quản lý duyệt.", type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi yêu cầu mượn khi API chưa khả dụng", type: "error" });
    }
  }"""

user_borrow_func_new = """  function borrow(device) {
    setBorrowModal({ open: true, device });
  }

  async function handleConfirmBorrow(form) {
    try {
      const item = await api.borrow(borrowModal.device.id, form.purpose, form.requested_to);
      setData((current) => ({ ...current, requests: [...current.requests, item] }));
      setToast({ message: "Đã gửi yêu cầu mượn thành công. Vui lòng chờ Quản lý duyệt.", type: "success" });
      setBorrowModal({ open: false, device: null });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi yêu cầu mượn khi API chưa khả dụng", type: "error" });
    }
  }

  async function handleReportIncident(description) {
    try {
      const updated = await api.reportIncident(incidentModal.item.id, description);
      const [devices, requests] = await Promise.all([api.devices(), api.requests()]);
      setData((current) => ({ ...current, devices, requests }));
      setToast({ message: "Đã gửi báo cáo sự cố khẩn cấp thành công. Kỹ thuật viên sẽ kiểm tra máy.", type: "success" });
      setIncidentModal({ open: false, item: null });
    } catch (error) {
      setToast({ message: error.message || "Không thể gửi báo cáo sự cố.", type: "error" });
    }
  }"""

content = content.replace(user_borrow_func_old, user_borrow_func_new)

# Add "Báo sự cố" button in User active loans
user_btn_old = """                    {item.status === "borrowed" && (
                      <Button size="sm" variant="outline" onClick={() => returnBorrow(item)} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60" title="Bấm để xác nhận hoàn trả thiết bị về phòng thí nghiệm">
                        <RotateCcw size={14} /> Hoàn trả thiết bị
                      </Button>
                    )}"""

user_btn_new = """                    {item.status === "borrowed" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => returnBorrow(item)} className="border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60" title="Bấm để xác nhận hoàn trả thiết bị về phòng thí nghiệm">
                          <RotateCcw size={14} /> Hoàn trả thiết bị
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => setIncidentModal({ open: true, item })} title="Báo cáo sự cố khi thiết bị gặp trục trặc, lỗi, chập cháy">
                          <AlertTriangle size={14} /> Báo sự cố
                        </Button>
                      </>
                    )}"""

content = content.replace(user_btn_old, user_btn_new)

# Add BorrowModal and IncidentModal to UserDashboard return
user_modals_injection = """      <BorrowModal open={borrowModal.open} device={borrowModal.device} onClose={() => setBorrowModal({ open: false, device: null })} onSubmit={handleConfirmBorrow} />
      <IncidentModal open={incidentModal.open} item={incidentModal.item} onClose={() => setIncidentModal({ open: false, item: null })} onSubmit={handleReportIncident} />
      <Toast message={toast?.message} type={toast?.type} />"""

content = content.replace("      <Toast message={toast?.message} type={toast?.type} />\n    </>\n  );\n}\n\n/* ------------------------------------------------------------------ */\n/* Technician dashboard",
                          user_modals_injection + "\n    </>\n  );\n}\n\n/* ------------------------------------------------------------------ */\n/* Technician dashboard")

# Also add modals when section !== "Tổng quan" in UserDashboard
user_sec_old = """      <WorkspaceSection 
        section={section} 
        role="user" 
        data={{ ...data, onReturn: returnBorrow, onHandover: handover }} 
        onBorrow={borrow} 
        onDownloadReportTXT={downloadReportTXT} 
        onPrintReportPDF={printReportPDF} 
        onNavigate={onNavigate}
      />
    </>"""

user_sec_new = """      <WorkspaceSection 
        section={section} 
        role="user" 
        data={{ ...data, onReturn: returnBorrow, onHandover: handover }} 
        onBorrow={borrow} 
        onDownloadReportTXT={downloadReportTXT} 
        onPrintReportPDF={printReportPDF} 
        onNavigate={onNavigate}
      />
      <BorrowModal open={borrowModal.open} device={borrowModal.device} onClose={() => setBorrowModal({ open: false, device: null })} onSubmit={handleConfirmBorrow} />
      <IncidentModal open={incidentModal.open} item={incidentModal.item} onClose={() => setIncidentModal({ open: false, item: null })} onSubmit={handleReportIncident} />
    </>"""
content = content.replace(user_sec_old, user_sec_new)

# ---------------------------------------------------------
# 7. Update Admin: Device edit & decommission
# ---------------------------------------------------------
# Add Edit and Delete buttons in AdminSection device table
admin_dev_tr_old = """                  <tr className="hover:bg-surface-elevated/50 transition" key={item.id}>
                    <td className="px-5 py-3.5 font-semibold text-foreground truncate max-w-[240px]">{item.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{item.asset_code}</td>
                    <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[160px]">{item.category}</td>
                    <td className="px-5 py-3.5">
                      <ConditionBadge condition={item.condition} />
                    </td>
                    <td className="px-5 py-3">
                      <Select value={item.status} onChange={(event) => onDeviceStatus(item, event.target.value)} className="h-9 min-w-36 text-xs">
                        {["available", "reserved", "borrowed", "maintenance"].map((status) => (
                          <option value={status} key={status}>{statusMeta[status].label}</option>
                        ))}
                      </Select>
                    </td>
                  </tr>"""

admin_dev_tr_new = """                  <tr className="hover:bg-surface-elevated/50 transition" key={item.id}>
                    <td className="px-5 py-3.5 font-semibold text-foreground truncate max-w-[240px]">{item.name}</td>
                    <td className="px-5 py-3.5 text-muted-foreground font-mono text-xs">{item.asset_code}</td>
                    <td className="px-5 py-3.5 text-muted-foreground truncate max-w-[160px]">{item.category}</td>
                    <td className="px-5 py-3.5">
                      <ConditionBadge condition={item.condition} />
                    </td>
                    <td className="px-5 py-3">
                      <Select value={item.status} onChange={(event) => onDeviceStatus(item, event.target.value)} className="h-9 min-w-36 text-xs">
                        {["available", "reserved", "borrowed", "maintenance"].map((status) => (
                          <option value={status} key={status}>{statusMeta[status].label}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenEditDevice && onOpenEditDevice(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-slate-600 hover:border-blue-500 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 transition"
                          title="Sửa thông tin thiết bị"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeleteDevice && onDeleteDevice(item)}
                          className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-surface text-slate-600 hover:border-red-500 hover:text-red-600 dark:text-slate-300 dark:hover:text-red-400 transition"
                          title="Thanh lý / Xóa thiết bị"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>"""

content = content.replace(admin_dev_tr_old, admin_dev_tr_new)
content = content.replace("""                  <th className="px-5 py-3">Tình trạng</th>
                  <th className="px-5 py-3">Trạng thái</th>
                </tr>""", """                  <th className="px-5 py-3">Tình trạng</th>
                  <th className="px-5 py-3">Trạng thái</th>
                  <th className="px-5 py-3 text-right">Thao tác</th>
                </tr>""")

# Pass onOpenEditDevice and onDeleteDevice in AdminSection props
content = content.replace("  onOpenDeviceForm,\n  onDeviceStatus,\n  onOpenUserForm,",
                          "  onOpenDeviceForm,\n  onDeviceStatus,\n  onOpenEditDevice,\n  onDeleteDevice,\n  onOpenUserForm,")

content = content.replace("      onOpenDeviceForm={() => setDeviceModal(true)} \n      onDeviceStatus={updateDeviceStatus}\n      onOpenUserForm={() => setUserModal(true)}",
                          "      onOpenDeviceForm={() => setDeviceModal(true)} \n      onDeviceStatus={updateDeviceStatus}\n      onOpenEditDevice={(dev) => { setSelectedDevice(dev); setEditDeviceModal(true); }}\n      onDeleteDevice={handleDeleteDevice}\n      onOpenUserForm={() => setUserModal(true)}")

# Add state and handlers to AdminDashboard
admin_state_old = """  const [deviceModal, setDeviceModal] = useState(false);"""
admin_state_new = """  const [deviceModal, setDeviceModal] = useState(false);
  const [editDeviceModal, setEditDeviceModal] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState(null);"""
content = content.replace(admin_state_old, admin_state_new)

admin_handlers = """  async function handleUpdateDevice(id, payload) {
    try {
      const updated = await api.updateDevice(id, payload);
      setData((current) => ({ ...current, devices: current.devices.map((d) => d.id === id ? updated : d) }));
      setToast({ message: `Đã cập nhật thiết bị ${updated.name}`, type: "success" });
      setEditDeviceModal(false);
    } catch (error) {
      setToast({ message: error.message || "Không thể cập nhật thiết bị.", type: "error" });
    }
  }

  async function handleDeleteDevice(item) {
    if (!window.confirm(`Bạn có chắc chắn muốn thanh lý / xóa thiết bị "${item.name}" (${item.asset_code}) không?`)) return;
    try {
      await api.deleteDevice(item.id);
      setData((current) => ({ ...current, devices: current.devices.filter((d) => d.id !== item.id) }));
      setToast({ message: `Đã thanh lý/xóa thiết bị ${item.name}`, type: "success" });
    } catch (error) {
      setToast({ message: error.message || "Không thể xóa thiết bị.", type: "error" });
    }
  }
"""

content = content.replace("  async function createDevice() {", admin_handlers + "\n  async function createDevice() {")

# Inject DeviceEditModal to AdminDashboard
content = content.replace("<DeviceModal open={deviceModal} form={deviceForm} setForm={setDeviceForm} onClose={() => setDeviceModal(false)} onSubmit={createDevice} />",
                          "<DeviceModal open={deviceModal} form={deviceForm} setForm={setDeviceForm} onClose={() => setDeviceModal(false)} onSubmit={createDevice} />\n      <DeviceEditModal open={editDeviceModal} device={selectedDevice} onClose={() => setEditDeviceModal(false)} onSave={handleUpdateDevice} />")

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)

print("Patch applied successfully!")
