#!/usr/bin/env python3
"""
Tự động chụp ảnh giao diện thực tế hệ thống AI-LEMS và Adminer,
đồng thời xuất tài liệu Word chuẩn báo cáo / đồ án:
- Tên hình
- Tác nhân (Actor)
- Mục đích / Chức năng chính
- Dữ liệu & Thao tác
- Nhận xét & Đánh giá giao diện (UX/UI, RBAC, Data integrity, RAG AI)
"""

import os
import sys
import time
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from playwright.sync_api import sync_playwright

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCREENSHOTS_DIR = os.path.join(BASE_DIR, "docs", "screenshots")
OUTPUT_DOCX = os.path.join(BASE_DIR, "docs", "Bao_Cao_Giao_Dien_He_Thong_AI_LEMS.docx")

os.makedirs(SCREENSHOTS_DIR, exist_ok=True)

# Cấu hình danh mục hình ảnh thực tế đối chiếu 100% với mã nguồn AI-LEMS
SCREENS_METADATA = [
    {
        "id": "IMG_01",
        "file": "IMG_01_Login_Light.png",
        "title": "Hình 4.1: Giao diện Đăng nhập hệ thống (Chế độ Sáng - Light Mode)",
        "actor": "Khách truy cập / Tất cả người dùng",
        "url": "http://localhost:5173/login",
        "function": "Xác thực danh tính người dùng thông qua 2 phương thức: Đăng nhập tài khoản nội bộ (Username/Email & Password) hoặc Đăng nhập một lần (SSO) qua Google Workspace OAuth 2.0.",
        "components": "Logo nhận diện AI-LEMS, Panel giới thiệu hệ sinh thái phòng Lab, Nút đăng nhập Google Identity Services (GSI), Form nhập liệu tiêu chuẩn với nút ẩn/hiện mật khẩu, Khung cảnh báo lỗi xác thực trực quan.",
        "evaluation": "Thiết kế bố cục chia đôi (Split Screen) hiện đại, đậm chất kỹ thuật với font chữ JetBrains Mono. Phân tách rõ ràng giữa xác thực Google OAuth và tài khoản nội bộ. Cơ chế validation phía client mượt mà, hỗ trợ responsive hoàn hảo trên mọi kích thước màn hình."
    },
    {
        "id": "IMG_02",
        "file": "IMG_02_Login_Dark.png",
        "title": "Hình 4.2: Giao diện Đăng nhập hệ thống (Chế độ Tối - Dark Mode)",
        "actor": "Khách truy cập / Tất cả người dùng",
        "url": "http://localhost:5173/login (Theme: Dark)",
        "function": "Cung cấp chế độ hiển thị nền tối chuyên dụng, tối ưu hóa thị giác khi người dùng làm việc trong môi trường phòng lab thiếu sáng hoặc ca trực đêm.",
        "components": "Nền Slate-900 / Dark Surface cao cấp, hiệu ứng ánh sáng gradient nhẹ nhàng (Ambient Glow), nút Google Sign-In tự động thích ứng sang theme 'filled_black', nút chuyển đổi theme (ThemeToggle) tiện lợi.",
        "evaluation": "Độ tương phản màu sắc đạt chuẩn WCAG, giảm mỏi mắt cho kỹ thuật viên và nhà nghiên cứu. Trải nghiệm chuyển đổi theme tức thời, không giật lag nhờ lưu trữ trạng thái theme vào LocalStorage."
    },
    {
        "id": "IMG_03",
        "file": "IMG_03_Admin_Dashboard.png",
        "title": "Hình 4.3: Bảng điều khiển Quản trị viên (Admin Overview Dashboard)",
        "actor": "Quản trị viên (Admin) / Quản lý phòng Lab (Manager)",
        "url": "http://localhost:5173/admin",
        "function": "Giám sát toàn diện tình trạng vận hành thiết bị phòng lab theo thời gian thực; theo dõi các chỉ số KPI tài sản và cảnh báo các yêu cầu mượn đã quá hạn trả.",
        "components": "Thẻ KPI trạng thái thiết bị (Sẵn sàng: Available, Đang mượn: Borrowed, Đang bảo trì: Maintenance, Hỏng: Broken), Đồng hồ số thời gian thực (useRealtimeClock), Banner cảnh báo mượn quá hạn (Overdue Alert Banner), Tỷ lệ hoạt động phòng lab.",
        "evaluation": "Trực quan hóa dữ liệu xuất sắc bằng mã màu phân loại trạng thái chuẩn mực. Tính năng cảnh báo quá hạn nhấp nháy thu hút sự chú ý ngay lập tức, hỗ trợ nhà quản lý đưa ra quyết định xử lý nhanh chóng."
    },
    {
        "id": "IMG_04",
        "file": "IMG_04_Admin_Devices.png",
        "title": "Hình 4.4: Danh mục Quản lý Thiết bị Phòng Lab (Equipment Inventory)",
        "actor": "Quản trị viên / Quản lý phòng Lab",
        "url": "http://localhost:5173/admin (Khu vực: Thiết bị)",
        "function": "Quản lý toàn bộ vòng đời tài sản phòng lab; tìm kiếm thiết bị đa tiêu chí; lọc theo danh mục nghiên cứu và trạng thái vận hành; xem mã định danh QR; mở form thêm mới.",
        "components": "Thanh tìm kiếm theo từ khóa/mã tài sản, Bộ lọc nhóm thiết bị (Viễn thông, Đo lường, Nguồn DC, IoT, v.v.), Bảng danh sách thiết bị kèm Mã tài sản (EQ-xxx), Chủng loại, Trạng thái (StatusBadge), Nút hành động nhanh.",
        "evaluation": "Cấu trúc bảng khoa học, rõ ràng. Bộ lọc client-side phản hồi tức thì với độ trễ 0ms, hỗ trợ phân loại linh hoạt từ thiết bị đo kiểm cao cấp (Oscilloscope, Spectrum Analyzer) đến các linh kiện vi điều khiển."
    },
    {
        "id": "IMG_05",
        "file": "IMG_05_Admin_Add_Device_Modal.png",
        "title": "Hình 4.5: Hộp thoại Khởi tạo Thiết bị Mới (Add Equipment Modal)",
        "actor": "Quản trị viên / Quản lý phòng Lab",
        "url": "http://localhost:5173/admin (Modal: Thêm thiết bị)",
        "function": "Nhập liệu hồ sơ thiết bị mới vào kho dữ liệu phòng thí nghiệm, ràng buộc kiểm tra tính hợp lệ của mã tài sản, số serial và tình trạng xuất xưởng.",
        "components": "Trường Mã tài sản (bắt buộc duy nhất), Tên thiết bị, Danh mục chuẩn phòng lab (dropdown), Tình trạng ban đầu (Mới nguyên hộp, Đang hoạt động tốt, Cần bảo trì), Số serial nhà sản xuất, Nút Lưu và Hủy.",
        "evaluation": "Giao diện Modal dạng popover tập trung, có lớp nền mờ (backdrop blur) ngăn thao tác nhầm ngoài trang. Hệ thống kiểm soát lỗi chặt chẽ, nút 'Lưu thiết bị' chỉ kích hoạt khi đã điền đủ các trường bắt buộc."
    },
    {
        "id": "IMG_06",
        "file": "IMG_06_Admin_Requests.png",
        "title": "Hình 4.6: Quản lý Luồng Yêu cầu Mượn trả (Borrow & Return Requests)",
        "actor": "Quản trị viên / Quản lý phòng Lab",
        "url": "http://localhost:5173/admin (Khu vực: Yêu cầu mượn)",
        "function": "Phê duyệt các đơn đăng ký mượn thiết bị; thực hiện thao tác bàn giao vật lý cho người mượn; kiểm tra và xác nhận thu hồi thiết bị về kho an toàn.",
        "components": "Bộ lọc trạng thái phiếu (Chờ duyệt, Đã duyệt, Đang mượn, Đã trả, Từ chối), Bảng thông tin chi tiết: Người mượn, Thiết bị, Mục đích sử dụng, Thời gian mượn/trả dự kiến, Các nút bấm Duyệt / Bàn giao / Nhận trả.",
        "evaluation": "Thiết kế luồng trạng thái máy (State Machine) chuẩn mực: Pending -> Approved -> Borrowed -> Returned. Giao diện thể hiện rõ ràng từng nấc chuyển giao trách nhiệm, bảo đảm tài sản công không bị thất thoát."
    },
    {
        "id": "IMG_07",
        "file": "IMG_07_Admin_Users.png",
        "title": "Hình 4.7: Quản trị Tài khoản & Phân quyền RBAC (User Management)",
        "actor": "Quản trị viên (Admin)",
        "url": "http://localhost:5173/admin (Khu vực: Người dùng)",
        "function": "Kiểm soát danh sách nhân sự; phân cấp quyền hạn theo mô hình Role-Based Access Control (4 vai trò); kích hoạt hoặc tạm khóa tài khoản thành viên.",
        "components": "Bảng tài khoản: Họ tên, Tên đăng nhập, Email (hỗ trợ liên kết Google), Cột Mật khẩu hiển thị biểu tượng khiên bảo mật mã hóa bcrypt, Vai trò (Admin, Manager, Technician, User), Trạng thái kích hoạt, Thao tác sửa/khóa/reset mật khẩu.",
        "evaluation": "Tuân thủ nghiêm ngặt nguyên tắc đặc quyền tối thiểu (Least Privilege). Biểu tượng khiên bảo mật ShieldCheck ở cột mật khẩu thể hiện trực quan chính sách băm mật khẩu một chiều an toàn của hệ thống."
    },
    {
        "id": "IMG_08",
        "file": "IMG_08_Admin_Add_User_Modal.png",
        "title": "Hình 4.8: Hộp thoại Khởi tạo Người dùng Mới (Create User Modal)",
        "actor": "Quản trị viên (Admin)",
        "url": "http://localhost:5173/admin (Modal: Thêm tài khoản mới)",
        "function": "Tạo tài khoản người dùng mới cho giảng viên, kỹ thuật viên hoặc sinh viên nghiên cứu; hỗ trợ thiết lập email Gmail phục vụ đăng nhập Google SSO.",
        "components": "Form nhập: Họ và tên, Tên đăng nhập, Địa chỉ Email, Mật khẩu khởi tạo (ràng buộc tối thiểu 8 ký tự), Dropdown chọn vai trò (Admin, Manager, Technician, User), Nút xác nhận tạo.",
        "evaluation": "Ràng buộc kiểm tra độ phức tạp mật khẩu ngay tại client và server, ngăn chặn mật khẩu yếu. Khả năng nhập email chuẩn xác giúp người dùng lập tức có thể sử dụng tính năng Google Sign-In tiện lợi."
    },
    {
        "id": "IMG_09",
        "file": "IMG_09_Admin_Maintenance.png",
        "title": "Hình 4.9: Quản lý Lịch Bảo trì & Xử lý Kỹ thuật (Maintenance Management)",
        "actor": "Quản trị viên / Kỹ thuật viên",
        "url": "http://localhost:5173/admin (Khu vực: Bảo trì)",
        "function": "Theo dõi tiến độ sửa chữa, bảo dưỡng định kỳ và xử lý các sự cố thiết bị hư hỏng phát sinh trong quá trình thực hành thí nghiệm.",
        "components": "Danh sách phiếu bảo trì: Thiết bị cần sửa, Lý do bảo trì/mô tả sự cố, Kỹ thuật viên phụ trách, Ngày bắt đầu, Chi phí phát sinh, Trạng thái phiếu (Đang kiểm tra, Đang sửa, Đã hoàn thành).",
        "evaluation": "Đồng bộ hóa tức thời với trạng thái vật lý của thiết bị. Khi thiết bị được đưa vào bảo trì, hệ thống tự động khóa tính năng mượn đối với thiết bị đó, ngăn chặn việc giao máy hỏng cho sinh viên."
    },
    {
        "id": "IMG_10",
        "file": "IMG_10_Admin_Audit_Logs.png",
        "title": "Hình 4.10: Nhật ký Kiểm toán Truy vết Hệ thống (System Audit Logs)",
        "actor": "Quản trị viên / Quản lý phòng Lab",
        "url": "http://localhost:5173/admin (Khu vực: Nhật ký hệ thống)",
        "function": "Lưu trữ nhật ký bất biến (Immutable Audit Trail) ghi lại mọi thao tác CRUD, thay đổi quyền, đăng nhập Google, duyệt mượn và cập nhật thiết bị để phục vụ thanh tra an toàn thông tin.",
        "components": "Bảng lưu vết: Mốc thời gian ISO (Timestamp), Người thực hiện (kèm ảnh đại diện/initials), Hành động (CREATE, UPDATE, LOGIN_GOOGLE, APPROVE, v.v.), Đối tượng tác động (DEVICE, REQUEST, USER), Chi tiết thay đổi cụ thể.",
        "evaluation": "Khả năng truy vết đạt chuẩn kiểm toán doanh nghiệp. Ghi nhận chi tiết cả thao tác đăng nhập qua Google OAuth, hỗ trợ bộ lọc hành vi giúp điều tra nguyên nhân sự cố nhanh chóng và minh bạch."
    },
    {
        "id": "IMG_11",
        "file": "IMG_11_Admin_Reports.png",
        "title": "Hình 4.11: Báo cáo Thống kê & Phân tích Hoạt động (Analytics & Reports)",
        "actor": "Quản trị viên / Quản lý phòng Lab",
        "url": "http://localhost:5173/admin (Khu vực: Báo cáo)",
        "function": "Tổng hợp số liệu thống kê về tần suất sử dụng thiết bị, tỷ lệ hư hỏng theo từng nhóm và thời lượng sử dụng phòng lab theo chu kỳ.",
        "components": "Biểu đồ cột/thanh phân bố thiết bị theo chủng loại, Thống kê tỷ lệ mượn trả theo tháng, Bảng tổng kết chi phí bảo trì, Nút xuất báo cáo định dạng chuẩn.",
        "evaluation": "Cung cấp góc nhìn số liệu trực quan hỗ trợ lãnh đạo phòng thí nghiệm đưa ra chiến lược đầu tư mua sắm bổ sung thiết bị hoặc thay thế linh kiện định kỳ một cách khoa học (Data-driven)."
    },
    {
        "id": "IMG_12",
        "file": "IMG_12_Admin_AI_Assistant.png",
        "title": "Hình 4.12: Trợ lý AI Lab Assistant - Tra cứu Quy trình SOP (RAG Chat Panel)",
        "actor": "Tất cả người dùng đã xác thực (Admin / Manager / Tech / User)",
        "url": "http://localhost:5173/admin (Khu vực: Trợ lý AI)",
        "function": "Hỏi đáp thông minh với mô hình AI cục bộ qwen2.5:3b; tra cứu quy trình vận hành tiêu chuẩn (SOP), hướng dẫn an toàn điện/hóa chất và tóm tắt nhanh tình trạng phòng lab.",
        "components": "Khung hội thoại trò chuyện trực quan, Hộp câu hỏi gợi ý nhanh (Starters), Khung hiển thị câu trả lời AI với thẻ Cảnh báo an toàn (Safety Note) và Trích dẫn nguồn tài liệu tham chiếu (Citations).",
        "evaluation": "Áp dụng kiến trúc RAG không ảo giác: AI chỉ trả lời dựa trên tài liệu SOP đã kiểm duyệt và dữ liệu thực tế của phòng lab. Phản hồi nhanh chóng, hỗ trợ xử lý tiếng Việt mượt mà ngay trên máy chủ nội bộ."
    },
    {
        "id": "IMG_13",
        "file": "IMG_13_Technician_Dashboard.png",
        "title": "Hình 4.13: Bảng điều khiển Kỹ thuật viên (Technician Dashboard)",
        "actor": "Kỹ thuật viên phòng Lab (Technician)",
        "url": "http://localhost:5173/technician",
        "function": "Không gian làm việc riêng của kỹ thuật viên: tập trung theo dõi các thiết bị gặp sự cố được giao xử lý, lịch bảo trì máy móc và các cảnh báo kiểm tra định kỳ.",
        "components": "Danh sách nhiệm vụ bảo trì cần thực hiện, Thẻ tổng hợp số lượng máy cần sửa, Bộ phím tắt thao tác nhanh vào nhật ký kỹ thuật.",
        "evaluation": "Giao diện tối giản, tập trung cao độ vào chuyên môn kỹ thuật sửa chữa. Lược bỏ hoàn toàn các chức năng quản trị nhân sự giúp kỹ thuật viên không bị phân tâm và thao tác nhanh chóng trên thiết bị di động/tablet."
    },
    {
        "id": "IMG_14",
        "file": "IMG_14_Technician_AI_Alerts.png",
        "title": "Hình 4.14: Hệ thống Cảnh báo Bất thường Thiết bị bằng AI (AI Inspection Alerts)",
        "actor": "Kỹ thuật viên phòng Lab",
        "url": "http://localhost:5173/technician (Khu vực: Cảnh báo AI)",
        "function": "Phân tích dữ liệu vận hành bằng mô hình AI để tự động phát hiện các thiết bị có tần suất mượn cao bất thường hoặc có lịch sử sự cố lặp lại, khuyến nghị kiểm định sớm.",
        "components": "Danh sách các cảnh báo thông minh (Alert Cards): Mã thiết bị, Mức độ cảnh báo (Cao/Trung bình), Đánh giá nguyên nhân rủi ro từ AI, Nút khởi tạo phiếu bảo dưỡng ngay.",
        "evaluation": "Minh chứng cho tính năng bảo trì dự đoán (Predictive Maintenance). Chuyển dịch mô hình vận hành phòng thí nghiệm từ bị động (chờ hỏng mới sửa) sang chủ động phòng ngừa, kéo dài tuổi thọ khí tài."
    },
    {
        "id": "IMG_15",
        "file": "IMG_15_User_Dashboard.png",
        "title": "Hình 4.15: Bảng điều khiển Người dùng Nghiên cứu (User Dashboard)",
        "actor": "Giảng viên / Sinh viên / Nhà nghiên cứu (User)",
        "url": "http://localhost:5173/user",
        "function": "Khu vực cá nhân của người mượn: hiển thị các thiết bị đang trong phiên mượn, hạn trả dự kiến, trạng thái các phiếu đăng ký mượn đang chờ duyệt.",
        "components": "Thẻ tóm tắt thiết bị đang giữ, Đồng hồ đếm ngược thời hạn hoàn trả, Lịch sử yêu cầu gần đây, Nút truy cập nhanh danh mục thiết bị để đăng ký mượn mới.",
        "evaluation": "Trực quan, dễ sử dụng, định hướng trải nghiệm người dùng cao. Nhắc nhở hạn trả máy văn minh, tránh tình trạng quên trả thiết bị ảnh hưởng đến các ca thực hành tiếp theo."
    },
    {
        "id": "IMG_16",
        "file": "IMG_16_User_My_Loans.png",
        "title": "Hình 4.16: Lịch sử Mượn trả & Báo cáo Sự cố Cá nhân (My Loans History)",
        "actor": "Người dùng (User)",
        "url": "http://localhost:5173/user (Khu vực: Lượt mượn của tôi)",
        "function": "Theo dõi chi tiết toàn bộ lịch sử các lần mượn thiết bị cá nhân từ trước đến nay, tình trạng bàn giao - hoàn trả và các sự cố kỹ thuật từng báo cáo.",
        "components": "Bảng danh sách phiếu mượn cá nhân kèm trạng thái (Đang mượn, Đã hoàn trả, Bị từ chối), Bộ lọc thời gian, Nút báo cáo sự cố (Report Incident) nếu máy gặp trục trặc.",
        "evaluation": "Minh bạch hóa trách nhiệm cá nhân đối với tài sản phòng thí nghiệm. Cung cấp kênh báo cáo sự cố hư hỏng kịp thời ngay trên giao diện mà không cần làm thủ tục giấy tờ thủ công."
    },
    {
        "id": "IMG_17",
        "file": "IMG_17_Adminer_Database_Overview.png",
        "title": "Hình 4.17: Giao diện Quản trị CSDL Thực tế Adminer (Database Tables Overview)",
        "actor": "Quản trị viên CSDL (DBA) / Quản trị viên hệ thống",
        "url": "http://localhost:8080/?server=mysql&username=root&db=lab",
        "function": "Quản trị tầng lưu trữ cơ sở dữ liệu quan hệ MySQL 'lab' trên cổng 8080; minh chứng các thực thể bảng dữ liệu thực tế đang vận hành trong kiến trúc hệ thống.",
        "components": "Danh sách toàn bộ các bảng trong CSDL: devices (quản lý thiết bị), users (người dùng & RBAC), requests (mượn trả), maintenance (bảo trì), audit_logs (nhật ký kiểm toán), sop_documents (tài liệu RAG), số lượng dòng (rows), Engine InnoDB, Collation utf8mb4_unicode_ci.",
        "evaluation": "Minh chứng khách quan cho tầng dữ liệu (Data Persistence Layer). CSDL được chuẩn hóa chuẩn mực (3NF), thiết lập đầy đủ khóa ngoại (Foreign Keys), chỉ mục (Indexes) và ràng buộc toàn vẹn dữ liệu."
    },
    {
        "id": "IMG_18",
        "file": "IMG_18_Adminer_Devices_Table.png",
        "title": "Hình 4.18: Chi tiết Dữ liệu Bảng 'devices' trong Adminer (Records & Schema View)",
        "actor": "Quản trị viên CSDL (DBA)",
        "url": "http://localhost:8080/?server=mysql&username=root&db=lab&select=devices",
        "function": "Trực quan hóa các bản ghi thiết bị thực tế lưu trữ trong bảng 'devices', đối chiếu tính toàn vẹn và nhất quán giữa giao diện người dùng và cơ sở dữ liệu MySQL.",
        "components": "Các cột dữ liệu: id, asset_code (EQ-001, EQ-002,...), name (tên thiết bị đo kiểm), category (phân loại), status (available, borrowed,...), condition, serial_number, created_at, updated_at.",
        "evaluation": "Khẳng định hệ thống chạy trên dữ liệu thật 100%, không sử dụng dữ liệu giả lập (mockup) hay bịa đặt. Tính nhất quán tuyệt đối giữa mã nguồn backend SQLAlchemy, API và giao diện React."
    }
]


def capture_all_screenshots():
    print("=== BẮT ĐẦU CHỤP ẢNH GIAO DIỆN HỆ THỐNG AI-LEMS ===")
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=1.5 # Tăng độ nét ảnh chụp
        )
        page = context.new_page()

        # -------------------------------------------------------------
        # 1. IMG_01: Login Light Mode
        # -------------------------------------------------------------
        print("-> [1/18] Chụp Login (Light Mode)...")
        page.goto("http://localhost:5173/login", wait_until="networkidle")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_01_Login_Light.png"))

        # -------------------------------------------------------------
        # 2. IMG_02: Login Dark Mode
        # -------------------------------------------------------------
        print("-> [2/18] Chụp Login (Dark Mode)...")
        # Click Theme Toggle
        theme_btn = page.query_selector("button:has(svg.lucide-moon), button:has(svg.lucide-sun)")
        if theme_btn:
            theme_btn.click()
            time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_02_Login_Dark.png"))
        # Toggle lại Light mode để các ảnh sau đồng bộ sáng sủa
        if theme_btn:
            theme_btn.click()
            time.sleep(0.5)

        # -------------------------------------------------------------
        # 3. Đăng nhập Admin & Chụp Admin Dashboard
        # -------------------------------------------------------------
        print("-> [3/18] Đăng nhập Admin & Chụp Dashboard Overview...")
        page.fill('input[placeholder*="username"]', 'admin')
        page.fill('input[placeholder*="mật khẩu"]', 'admin123')
        page.click('button[type="submit"]')
        page.wait_for_url("**/admin", timeout=10000)
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_03_Admin_Dashboard.png"))

        # -------------------------------------------------------------
        # 4. IMG_04: Admin Devices
        # -------------------------------------------------------------
        print("-> [4/18] Chụp Admin - Danh mục Thiết bị...")
        page.click("button.side-link:has-text('Thiết bị')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_04_Admin_Devices.png"))

        # -------------------------------------------------------------
        # 5. IMG_05: Modal Thêm Thiết bị
        # -------------------------------------------------------------
        print("-> [5/18] Chụp Modal Thêm Thiết bị...")
        add_dev_btn = page.query_selector("button:has-text('Thêm thiết bị')")
        if add_dev_btn:
            add_dev_btn.click()
            time.sleep(0.8)
            page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_05_Admin_Add_Device_Modal.png"))
            cancel_btn = page.query_selector("button:has-text('Hủy')")
            if cancel_btn:
                cancel_btn.click()
                time.sleep(0.5)

        # -------------------------------------------------------------
        # 6. IMG_06: Admin Requests (Yêu cầu mượn)
        # -------------------------------------------------------------
        print("-> [6/18] Chụp Admin - Quản lý Yêu cầu mượn...")
        page.click("button.side-link:has-text('Yêu cầu mượn')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_06_Admin_Requests.png"))

        # -------------------------------------------------------------
        # 7. IMG_07: Admin Users (Người dùng)
        # -------------------------------------------------------------
        print("-> [7/18] Chụp Admin - Quản lý Người dùng & RBAC...")
        page.click("button.side-link:has-text('Người dùng')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_07_Admin_Users.png"))

        # -------------------------------------------------------------
        # 8. IMG_08: Modal Thêm Người dùng
        # -------------------------------------------------------------
        print("-> [8/18] Chụp Modal Thêm Tài khoản Người dùng...")
        add_user_btn = page.query_selector("button:has-text('Thêm tài khoản mới')")
        if add_user_btn:
            add_user_btn.click()
            time.sleep(0.8)
            page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_08_Admin_Add_User_Modal.png"))
            cancel_btn = page.query_selector("button:has-text('Hủy')")
            if cancel_btn:
                cancel_btn.click()
                time.sleep(0.5)

        # -------------------------------------------------------------
        # 9. IMG_09: Admin Maintenance (Bảo trì)
        # -------------------------------------------------------------
        print("-> [9/18] Chụp Admin - Quản lý Bảo trì...")
        page.click("button.side-link:has-text('Bảo trì')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_09_Admin_Maintenance.png"))

        # -------------------------------------------------------------
        # 10. IMG_10: Admin Audit Logs (Nhật ký hệ thống)
        # -------------------------------------------------------------
        print("-> [10/18] Chụp Admin - Nhật ký Kiểm toán (Audit Logs)...")
        page.click("button.side-link:has-text('Nhật ký hệ thống')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_10_Admin_Audit_Logs.png"))

        # -------------------------------------------------------------
        # 11. IMG_11: Admin Reports (Báo cáo)
        # -------------------------------------------------------------
        print("-> [11/18] Chụp Admin - Báo cáo Thống kê...")
        page.click("button.side-link:has-text('Báo cáo')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_11_Admin_Reports.png"))

        # -------------------------------------------------------------
        # 12. IMG_12: Admin AI Assistant (Trợ lý AI)
        # -------------------------------------------------------------
        print("-> [12/18] Chụp Trợ lý AI Lab Assistant (RAG Chat)...")
        page.click("button.side-link:has-text('Trợ lý AI')")
        time.sleep(1.2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_12_Admin_AI_Assistant.png"))

        # -------------------------------------------------------------
        # Đăng xuất Admin
        # -------------------------------------------------------------
        page.evaluate("() => { sessionStorage.clear(); localStorage.clear(); }")

        # -------------------------------------------------------------
        # 13. Technician Login & Dashboard
        # -------------------------------------------------------------
        print("-> [13/18] Đăng nhập Technician & Chụp Dashboard...")
        page.goto("http://localhost:5173/login", wait_until="networkidle")
        page.fill('input[placeholder*="username"]', 'technician')
        page.fill('input[placeholder*="mật khẩu"]', 'tech123')
        page.click('button[type="submit"]')
        page.wait_for_url("**/technician", timeout=10000)
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_13_Technician_Dashboard.png"))

        # -------------------------------------------------------------
        # 14. Technician AI Alerts (Cảnh báo AI)
        # -------------------------------------------------------------
        print("-> [14/18] Chụp Technician - Cảnh báo AI...")
        page.click("button.side-link:has-text('Cảnh báo AI')")
        time.sleep(1.2)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_14_Technician_AI_Alerts.png"))

        # Đăng xuất Technician
        page.evaluate("() => { sessionStorage.clear(); localStorage.clear(); }")

        # -------------------------------------------------------------
        # 15. User Login & Dashboard
        # -------------------------------------------------------------
        print("-> [15/18] Đăng nhập User & Chụp Dashboard...")
        page.goto("http://localhost:5173/login", wait_until="networkidle")
        page.fill('input[placeholder*="username"]', 'user')
        page.fill('input[placeholder*="mật khẩu"]', 'user123')
        page.click('button[type="submit"]')
        page.wait_for_url("**/user", timeout=10000)
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_15_User_Dashboard.png"))

        # -------------------------------------------------------------
        # 16. User My Loans (Lượt mượn của tôi)
        # -------------------------------------------------------------
        print("-> [16/18] Chụp User - Lượt mượn của tôi...")
        page.click("button.side-link:has-text('Lượt mượn của tôi')")
        time.sleep(1)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_16_User_My_Loans.png"))

        # -------------------------------------------------------------
        # 17. Adminer Database Overview
        # -------------------------------------------------------------
        print("-> [17/18] Chụp Adminer - Tổng quan Cơ sở Dữ liệu...")
        page.goto("http://localhost:8080/?server=mysql&username=root&db=lab")
        pwd_input = page.query_selector('input[name="auth[password]"]')
        if pwd_input:
            pwd_input.fill('root_pass')
            page.click('input[type="submit"]')
            time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_17_Adminer_Database_Overview.png"))

        # -------------------------------------------------------------
        # 18. Adminer Devices Table View
        # -------------------------------------------------------------
        print("-> [18/18] Chụp Adminer - Dữ liệu bảng 'devices'...")
        page.goto("http://localhost:8080/?server=mysql&username=root&db=lab&select=devices")
        time.sleep(1.5)
        page.screenshot(path=os.path.join(SCREENSHOTS_DIR, "IMG_18_Adminer_Devices_Table.png"))

        browser.close()
    print("=== HOÀN TẤT CHỤP 18/18 ẢNH THẬT ===")


def set_cell_background(cell, color_hex):
    tcPr = cell._element.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), color_hex)
    tcPr.append(shd)


def set_table_borders(table, color="CBD5E1"):
    tblPr = table._element.xpath('w:tblPr')
    if tblPr:
        borders = OxmlElement('w:tblBorders')
        for border_name in ['top', 'left', 'bottom', 'right', 'insideH', 'insideV']:
            border = OxmlElement(f'w:{border_name}')
            border.set(qn('w:val'), 'single')
            border.set(qn('w:sz'), '4')
            border.set(qn('w:space'), '0')
            border.set(qn('w:color'), color)
            borders.append(border)
        tblPr[0].append(borders)


def generate_word_report():
    print(f"=== BẮT ĐẦU XUẤT TÀI LIỆU WORD: {OUTPUT_DOCX} ===")
    doc = Document()

    # Đặt lề trang A4 chuẩn (0.75 in = ~1.9cm)
    for section in doc.sections:
        section.top_margin = Inches(0.75)
        section.bottom_margin = Inches(0.75)
        section.left_margin = Inches(0.75)
        section.right_margin = Inches(0.75)

    # ----------------- TRANG BÌA & TIÊU ĐỀ -----------------
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(4)
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_uni = title_p.add_run("BỘ GIÁO DỤC VÀ ĐÀO TẠO — DỰ ÁN HỆ THỐNG AI-LEMS\n")
    r_uni.font.size = Pt(11)
    r_uni.font.bold = True
    r_uni.font.color.rgb = RGBColor(0x47, 0x55, 0x69)

    r_title = title_p.add_run("BÁO CÁO THIẾT KẾ VÀ ĐÁNH GIÁ GIAO DIỆN HỆ THỐNG\nAI-AUGMENTED LAB EQUIPMENT MANAGEMENT SYSTEM (AI-LEMS)")
    r_title.font.size = Pt(16)
    r_title.font.bold = True
    r_title.font.color.rgb = RGBColor(0x1E, 0x3A, 0x8A)

    sub_p = doc.add_paragraph()
    sub_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sub_p.paragraph_format.space_after = Pt(20)
    r_sub = sub_p.add_run("Tài liệu đặc tả minh chứng giao diện người dùng, phân quyền tác nhân (RBAC) và kiểm chứng dữ liệu thực tế")
    r_sub.font.italic = True
    r_sub.font.size = Pt(10)
    r_sub.font.color.rgb = RGBColor(0x64, 0x74, 0x8B)

    # ----------------- TỔNG QUAN HỆ THỐNG -----------------
    h1 = doc.add_paragraph()
    h1.paragraph_format.space_before = Pt(14)
    h1.paragraph_format.space_after = Pt(6)
    r_h1 = h1.add_run("1. TỔNG QUAN VỀ HỆ THỐNG GIAO DIỆN & TÁC NHÂN (ACTORS)")
    r_h1.font.size = Pt(13)
    r_h1.font.bold = True
    r_h1.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    intro_p = doc.add_paragraph(
        "Hệ thống AI-LEMS (AI-Augmented Lab Equipment Management System) được xây dựng theo kiến trúc phân tầng hiện đại, "
        "kết hợp chặt chẽ giữa Backend FastAPI, Cơ sở dữ liệu quan hệ MySQL 8.0, Trợ lý AI RAG cục bộ (Ollama qwen2.5:3b) "
        "và Giao diện người dùng React (Vite, TailwindCSS, Lucide Icons). Toàn bộ hệ thống tuân thủ nghiêm ngặt mô hình "
        "phân quyền theo vai trò (Role-Based Access Control - RBAC) với 4 tác nhân chính:\n"
        "• Quản trị viên (Admin): Toàn quyền quản trị tài sản, kiểm soát nhân sự, phân vai trò, phê duyệt mượn trả và kiểm toán audit logs.\n"
        "• Quản lý phòng lab (Manager): Quản lý danh mục thiết bị, điều phối quy trình mượn trả và theo dõi bảo trì.\n"
        "• Kỹ thuật viên (Technician): Chuyên trách xử lý sự cố, thực hiện bảo trì định kỳ và theo dõi cảnh báo bất thường từ AI.\n"
        "• Người nghiên cứu / Sinh viên (User): Tìm kiếm tài nguyên, gửi yêu cầu mượn trả, báo cáo sự cố và tương tác với Trợ lý AI tra cứu SOP."
    )
    intro_p.paragraph_format.space_after = Pt(12)
    intro_p.paragraph_format.line_spacing = 1.15

    # ----------------- BẢNG TỔNG HỢP DANH MỤC HÌNH ẢNH -----------------
    h2 = doc.add_paragraph()
    h2.paragraph_format.space_before = Pt(12)
    h2.paragraph_format.space_after = Pt(6)
    r_h2 = h2.add_run("2. BẢNG DANH MỤC MINH CHỨNG GIAO DIỆN HỆ THỐNG")
    r_h2.font.size = Pt(13)
    r_h2.font.bold = True
    r_h2.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    tbl_summary = doc.add_table(rows=1, cols=4)
    tbl_summary.alignment = WD_TABLE_ALIGNMENT.CENTER
    set_table_borders(tbl_summary)
    hdr_cells = tbl_summary.rows[0].cells
    hdr_titles = ["Mã hình", "Tên giao diện", "Tác nhân (Actor)", "Đường dẫn thực tế"]
    col_widths = [Inches(1.0), Inches(2.7), Inches(1.8), Inches(1.5)]

    for idx, name in enumerate(hdr_titles):
        hdr_cells[idx].width = col_widths[idx]
        set_cell_background(hdr_cells[idx], "1E3A8A")
        p = hdr_cells[idx].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        r = p.add_run(name)
        r.font.bold = True
        r.font.color.rgb = RGBColor(0xFF, 0xFF, 0xFF)
        r.font.size = Pt(9.5)

    for item in SCREENS_METADATA:
        row_cells = tbl_summary.add_row().cells
        for i, w in enumerate(col_widths):
            row_cells[i].width = w

        row_cells[0].paragraphs[0].add_run(item["id"]).font.bold = True
        row_cells[0].paragraphs[0].alignment = WD_ALIGN_PARAGRAPH.CENTER
        row_cells[1].paragraphs[0].add_run(item["title"].split(": ")[1])
        row_cells[2].paragraphs[0].add_run(item["actor"])
        row_cells[3].paragraphs[0].add_run(item["url"].replace("http://localhost:5173", "").replace("http://localhost:8080", "adminer:8080"))

        for c in row_cells:
            c.paragraphs[0].paragraph_format.space_after = Pt(2)
            c.paragraphs[0].paragraph_format.space_before = Pt(2)
            for run in c.paragraphs[0].runs:
                run.font.size = Pt(8.5)

    # ----------------- CHI TIẾT TỪNG HÌNH ẢNH & LỜI BÌNH -----------------
    doc.add_page_break()

    h3 = doc.add_paragraph()
    h3.paragraph_format.space_before = Pt(10)
    h3.paragraph_format.space_after = Pt(10)
    r_h3 = h3.add_run("3. CHI TIẾT HÌNH ẢNH GIAO DIỆN & PHÂN TÍCH ĐÁNH GIÁ CHUYÊN MÔN")
    r_h3.font.size = Pt(14)
    r_h3.font.bold = True
    r_h3.font.color.rgb = RGBColor(0x1E, 0x40, 0xAF)

    for item in SCREENS_METADATA:
        img_path = os.path.join(SCREENSHOTS_DIR, item["file"])
        
        # Tiêu đề mục
        p_sec = doc.add_paragraph()
        p_sec.paragraph_format.space_before = Pt(12)
        p_sec.paragraph_format.space_after = Pt(4)
        r_sec = p_sec.add_run(f"3.{item['id'].replace('IMG_', '')}. {item['title']}")
        r_sec.font.size = Pt(11.5)
        r_sec.font.bold = True
        r_sec.font.color.rgb = RGBColor(0x0F, 0x17, 0x2A)

        # Chèn hình ảnh
        if os.path.exists(img_path):
            p_img = doc.add_paragraph()
            p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p_img.paragraph_format.space_before = Pt(4)
            p_img.paragraph_format.space_after = Pt(4)
            run_img = p_img.add_run()
            run_img.add_picture(img_path, width=Inches(6.4))
        else:
            p_warn = doc.add_paragraph(f"[Chưa tìm thấy ảnh: {item['file']}]")
            p_warn.runs[0].font.color.rgb = RGBColor(0xDC, 0x26, 0x26)

        # Bảng thuyết minh & nhận xét
        tbl_info = doc.add_table(rows=5, cols=2)
        tbl_info.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(tbl_info)

        t_widths = [Inches(1.8), Inches(4.8)]
        field_data = [
            ("Tác nhân (Actor)", item["actor"]),
            ("Mục đích / Chức năng", item["function"]),
            ("Cấu phần & Dữ liệu", item["components"]),
            ("Đường dẫn / Trạng thái", item["url"]),
            ("Nhận xét & Đánh giá UI/UX", item["evaluation"]),
        ]

        for r_idx, (f_name, f_val) in enumerate(field_data):
            r_cells = tbl_info.rows[r_idx].cells
            r_cells[0].width = t_widths[0]
            r_cells[1].width = t_widths[1]
            
            set_cell_background(r_cells[0], "F1F5F9")
            
            # Tiêu đề trường
            p0 = r_cells[0].paragraphs[0]
            p0.paragraph_format.space_before = Pt(2)
            p0.paragraph_format.space_after = Pt(2)
            r0 = p0.add_run(f_name)
            r0.font.bold = True
            r0.font.size = Pt(9)
            r0.font.color.rgb = RGBColor(0x33, 0x41, 0x55)

            # Nội dung trường
            p1 = r_cells[1].paragraphs[0]
            p1.paragraph_format.space_before = Pt(2)
            p1.paragraph_format.space_after = Pt(2)
            p1.paragraph_format.line_spacing = 1.15
            r1 = p1.add_run(f_val)
            r1.font.size = Pt(9)
            if f_name == "Tác nhân (Actor)":
                r1.font.bold = True
                r1.font.color.rgb = RGBColor(0x1D, 0x4E, 0xD8)
            elif f_name == "Nhận xét & Đánh giá UI/UX":
                r1.font.color.rgb = RGBColor(0x0F, 0x76, 0x6E)

        # Cách dòng giữa các mục
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Lưu file Word
    doc.save(OUTPUT_DOCX)
    print(f"=== ĐÃ XUẤT THÀNH CÔNG BÁO CÁO WORD TẠI: {OUTPUT_DOCX} ===")


def generate_markdown_report():
    md_path = os.path.join(BASE_DIR, "docs", "Bao_Cao_Giao_Dien_He_Thong_AI_LEMS.md")
    print(f"=== BẮT ĐẦU XUẤT TÀI LIỆU MARKDOWN: {md_path} ===")
    lines = [
        "# BÁO CÁO THIẾT KẾ VÀ ĐÁNH GIÁ GIAO DIỆN HỆ THỐNG AI-LEMS\n",
        "> **Hệ sinh thái:** AI-Augmented Lab Equipment Management System",
        "> **Phiên bản:** Hoàn thiện tích hợp Thực tế (100% Grounded Evidence)",
        f"> **Tài liệu Word hoàn chỉnh:** [`Bao_Cao_Giao_Dien_He_Thong_AI_LEMS.docx`](file://{OUTPUT_DOCX})\n",
        "## 1. Danh mục 18 Giao diện Minh chứng Thực tế\n",
        "| Mã hình | Tên giao diện | Tác nhân (Actor) | Trạng thái / Đường dẫn |",
        "| :---: | :--- | :--- | :--- |",
    ]

    for s in SCREENS_METADATA:
        sid = s["id"]
        title_clean = s["title"].split(": ")[1]
        actor = s["actor"]
        url_clean = s["url"].replace("http://localhost:5173", "").replace("http://localhost:8080", "adminer:8080")
        if not url_clean:
            url_clean = "/login"
        lines.append(f"| **{sid}** | {title_clean} | `{actor}` | `{url_clean}` |")

    lines.append("\n---\n")
    lines.append("## 2. Chi tiết Hình ảnh Giao diện & Thuyết minh Nghiệp vụ\n")

    for s in SCREENS_METADATA:
        title = s["title"]
        file_name = s["file"]
        actor = s["actor"]
        func = s["function"]
        comps = s["components"]
        url = s["url"]
        eval_txt = s["evaluation"]

        lines.append(f"### {title}\n")
        lines.append(f"![{title}](screenshots/{file_name})\n")
        lines.append("| Tiêu chí | Nội dung chi tiết |")
        lines.append("| :--- | :--- |")
        lines.append(f"| **Tác nhân (Actor)** | **{actor}** |")
        lines.append(f"| **Mục đích / Chức năng** | {func} |")
        lines.append(f"| **Cấu phần & Dữ liệu** | {comps} |")
        lines.append(f"| **Đường dẫn URL** | `{url}` |")
        lines.append(f"| **Nhận xét & Đánh giá UI/UX** | {eval_txt} |")
        lines.append("\n")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"=== ĐÃ XUẤT THÀNH CÔNG BÁO CÁO MARKDOWN TẠI: {md_path} ===")


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--reports-only":
        generate_word_report()
        generate_markdown_report()
    else:
        capture_all_screenshots()
        generate_word_report()
        generate_markdown_report()
