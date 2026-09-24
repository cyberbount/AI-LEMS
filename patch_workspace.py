with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

# 1. Add onSchedule to WorkspaceSection props
ws_func_old = "function WorkspaceSection({ section, role, data, onBorrow, onComplete, onDownloadReportTXT, onPrintReportPDF, onNavigate }) {"
ws_func_new = "function WorkspaceSection({ section, role, data, onBorrow, onComplete, onSchedule, onDownloadReportTXT, onPrintReportPDF, onNavigate }) {"
content = content.replace(ws_func_old, ws_func_new)

# 2. Add the button in WorkspaceSection header
ws_header_old = """            <Button size="sm" variant="outline" onClick={onPrintReportPDF}>
              <Printer size={14} /> In / Xuất PDF
            </Button>
          </div>
        )}
      </div>"""
ws_header_new = """            <Button size="sm" variant="outline" onClick={onPrintReportPDF}>
              <Printer size={14} /> In / Xuất PDF
            </Button>
          </div>
        )}
        {section === "Bảo trì" && role === "technician" && onSchedule && (
          <Button size="sm" onClick={onSchedule}>+ Lên lịch / Thêm tác vụ</Button>
        )}
      </div>"""
content = content.replace(ws_header_old, ws_header_new)

# 3. Update TechnicianDashboard to pass onSchedule to WorkspaceSection
tech_dash_ws_old = "<WorkspaceSection section={section} role=\"technician\" data={data} onComplete={(item) => setModal({ open: true, mode: 'update', item })} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} />"
tech_dash_ws_new = "<WorkspaceSection section={section} role=\"technician\" data={data} onComplete={(item) => setModal({ open: true, mode: 'update', item })} onSchedule={() => setModal({ open: true, mode: 'create', item: null })} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} />"
content = content.replace(tech_dash_ws_old, tech_dash_ws_new)

# 4. Remove the button from TechnicianDashboard's "Tổng quan" card
td_header_old = """      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle title="Danh sách công việc cần làm" />
          <Button size="sm" onClick={() => setModal({ open: true, mode: 'create', item: null })}>+ Lên lịch / Thêm</Button>
        </div>"""
td_header_new = """      <Card className="mt-6 p-5 sm:p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <SectionTitle title="Danh sách công việc cần làm (Chỉ xem / Cập nhật nhanh)" />
        </div>"""
content = content.replace(td_header_old, td_header_new)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)
