import re

with open('frontend/src/App.jsx', 'r') as f:
    content = f.read()

# Pattern to find MaintenanceModal lines
# We only want to keep the one inside TechnicianDashboard.
# We'll just remove ALL MaintenanceModal lines and then carefully insert them ONLY in TechnicianDashboard.

# Wait, MaintenanceModal is injected exactly in 3 places, plus the declaration of the function itself.
# Let's remove ALL of these exact strings:
bad_line = "      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />\n"

# Remove all
content = content.replace(bad_line, "")

# Now add it back only inside TechnicianDashboard.
# TechnicianDashboard has a section return:
td_return_old = """  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />
      {offline && <OfflineNotice />}
      <WorkspaceSection section={section} role="technician" data={data} onComplete={(item) => setModal({ open: true, mode: 'update', item })} onSchedule={() => setModal({ open: true, mode: 'create', item: null })} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} />
    </>
  );"""
td_return_new = """  if (section !== "Tổng quan") return (
    <>
      <PageHeader eyebrow="Khu vực kỹ thuật" title={section} description="Theo dõi và xử lý các công việc bảo trì." />
      {offline && <OfflineNotice />}
      <WorkspaceSection section={section} role="technician" data={data} onComplete={(item) => setModal({ open: true, mode: 'update', item })} onSchedule={() => setModal({ open: true, mode: 'create', item: null })} onDownloadReportTXT={downloadReportTXT} onPrintReportPDF={printReportPDF} onNavigate={onNavigate} />
      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
    </>
  );"""

content = content.replace(td_return_old, td_return_new)

# And also add it back at the end of TechnicianDashboard's "Tổng quan" return
td_end_old = """      <div className="mt-6">
        <AIChatPanel title="AI Inspection Alert" mode="inspection_alert" starter="Bạn có thể hỏi về đề xuất kiểm tra. Tôi sẽ nêu rõ giới hạn nếu dữ liệu chưa đủ." />
      </div>

      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}"""

td_end_new = """      <div className="mt-6">
        <AIChatPanel title="AI Inspection Alert" mode="inspection_alert" starter="Bạn có thể hỏi về đề xuất kiểm tra. Tôi sẽ nêu rõ giới hạn nếu dữ liệu chưa đủ." />
      </div>

      <MaintenanceModal open={modal.open} mode={modal.mode} item={modal.item} devices={data.devices} onClose={() => setModal({ open: false, mode: 'create', item: null })} onSubmit={handleSubmit} onDelete={handleDelete} />
      <Toast message={toast?.message} type={toast?.type} />
    </>
  );
}"""

content = content.replace(td_end_old, td_end_new)

with open('frontend/src/App.jsx', 'w') as f:
    f.write(content)
