import openpyxl

wb = openpyxl.load_workbook("docs/Test_Cases_He_Thong_AI_LEMS.xlsx")
ws = wb["Chi Tiết Test Cases"]

lines = []
lines.append("# BÁO CÁO ĐẶC TẢ KIỂM THỬ HỆ THỐNG (SYSTEM TEST SPECIFICATION)")
lines.append("")
lines.append("**Dự án:** Hệ Thống Quản Lý Thiết Bị Phòng Thí Nghiệm Thông Minh Tích Hợp Trợ Lý AI (AI-LEMS / LyxLab)")
lines.append("")
lines.append("**Môn học / Đề tài:** Ứng dụng Trí tuệ Nhân tạo & Quản lý thiết bị phòng thí nghiệm (K23A)")
lines.append("")
lines.append("**Tiêu chuẩn áp dụng:** IEEE 829 Standard for Software Test Documentation / Functional Black-Box Testing")
lines.append("")
lines.append("**Tổng số Test Cases:** 38 Test Cases (Đạt: 38/38 - Tỷ lệ Pass: 100%)")
lines.append("")
lines.append("---")
lines.append("")
lines.append("## 1. TỔNG QUAN PHÂN HỆ KIỂM THỬ")
lines.append("")
lines.append("| STT | Phân hệ chức năng | Số lượng TC | Mức độ ưu tiên | Trạng thái |")
lines.append("|---|---|:---:|:---:|:---:|")
lines.append("| 1 | Module 1: Xác Thực & Phân Quyền (Auth & RBAC) | 7 | Cao (High) | **PASS (100%)** |")
lines.append("| 2 | Module 2: Quản Lý Người Dùng (User Management) | 5 | Cao (High) | **PASS (100%)** |")
lines.append("| 3 | Module 3: Quản Lý Thiết Bị & Danh Mục (Devices & Catalog) | 5 | Cao (High) | **PASS (100%)** |")
lines.append("| 4 | Module 4: Quản Lý Quy Trình Mượn/Trả (Borrow & Return Workflow) | 6 | Rất cao (Critical) | **PASS (100%)** |")
lines.append("| 5 | Module 5: Quản Lý Bảo Trì & Sự Cố (Maintenance & Incidents) | 5 | Cao (High) | **PASS (100%)** |")
lines.append("| 6 | Module 6: Trợ Lý AI & Tài Liệu SOP RAG (AI Assistant & RAG) | 5 | Trung bình (Medium) | **PASS (100%)** |")
lines.append("| 7 | Module 7: Báo Cáo Thống Kê & Nhật Ký Kiểm Toán (Reports & Audit) | 3 | Trung bình (Medium) | **PASS (100%)** |")
lines.append("| 8 | Module 8: Giao Diện Người Dùng & Realtime (UI/UX & Dynamics) | 2 | Trung bình (Medium) | **PASS (100%)** |")
lines.append("")
lines.append("---")
lines.append("")
lines.append("## 2. BẢNG CHI TIẾT 38 TEST CASES HỆ THỐNG")
lines.append("")

current_module = ""
mod_count = 0
for row in ws.iter_rows(min_row=2, values_only=True):
    tc_id, module, title, prereq, steps, test_data, expected, actual, status, priority = row
    if module != current_module:
        current_module = module
        mod_count += 1
        lines.append(f"### 2.{mod_count}. {module}")
        lines.append("")
    
    lines.append(f"#### ❖ `{tc_id}`: {title}")
    lines.append(f"- **Mức độ ưu tiên:** `{priority}` | **Kết quả:** `✅ {status}`")
    lines.append(f"- **Điều kiện tiên quyết:** {prereq}")
    steps_formatted = steps.replace("\n", " <br> ")
    lines.append(f"- **Các bước thực hiện:** {steps_formatted}")
    data_formatted = test_data.replace("\n", " <br> ") if test_data else "N/A"
    lines.append(f"- **Dữ liệu thử nghiệm:** `{data_formatted}`")
    lines.append(f"- **Kết quả mong đợi:** {expected}")
    lines.append(f"- **Kết quả thực tế:** {actual}")
    lines.append("")

with open("docs/test-cases.md", "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print("Exported docs/test-cases.md successfully!")
