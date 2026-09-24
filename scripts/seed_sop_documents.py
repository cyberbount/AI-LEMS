import sqlite3
import os

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "lab.db"))

CHUNKS = [
    (
        1,
        "SOP-01: Quy trình an toàn phòng thí nghiệm và bảo hộ lao động",
        "Nguyên tắc an toàn chung: Luôn mang kính bảo hộ và trang phục gọn gàng khi làm việc với thiết bị điện. Cấm mang đồ ăn, thức uống vào khu vực thí nghiệm. Luôn xác định vị trí nút dừng khẩn cấp (E-Stop) và bình chữa cháy CO2 trước khi bắt đầu ca thực hành.",
        0,
    ),
    (
        1,
        "SOP-01: Quy trình an toàn phòng thí nghiệm và bảo hộ lao động",
        "Quy trình xử lý sự cố rò điện hoặc chập cháy: Lập tức ngắt nguồn bằng nút E-Stop, ngắt cầu dao aptomat chính và thông báo ngay cho Kỹ thuật viên hoặc Quản lý phòng lab. Không được dùng nước dập đám cháy thiết bị điện.",
        1,
    ),
    (
        2,
        "SOP-02: Hướng dẫn vận hành máy hiện sóng Tektronix TBS1102B",
        "Quy trình vận hành máy hiện sóng Tektronix (mã EQ-014): Kết nối que đo vào cổng BNC CH1 hoặc CH2. Luôn kiểm tra công tắc gạt hệ số suy hao trên que đo (1X hoặc 10X). Bấm phím Autoset để máy tự động nhận diện dạng sóng cơ bản.",
        0,
    ),
    (
        2,
        "SOP-02: Hướng dẫn vận hành máy hiện sóng Tektronix TBS1102B",
        "Giới hạn điện áp và bảo dưỡng que đo: Điện áp ngõ vào tối đa qua que đo 10X là 300V RMS CAT II. Tuyệt đối không đo trực tiếp điện áp lưới 220VAC mà không có biến áp cách ly hoặc que đo vi sai chuyên dụng. Khi kết thúc ca làm việc, vệ sinh đầu kẹp que đo và cuộn dây nhẹ nhàng.",
        1,
    ),
    (
        3,
        "SOP-03: Quy chuẩn vận hành nguồn DC Keysight E3631A",
        "Cài đặt nguồn DC Keysight E3631A (mã EQ-022): Cung cấp 3 ngõ ra độc lập (6V/5A, +25V/1A, -25V/1A). Trước khi bấm nút bật ngõ ra Output On/Off, bắt buộc phải cài đặt giới hạn dòng bảo vệ (Current Limit) để chống ngắn mạch phá hỏng vi mạch nhạy cảm.",
        0,
    ),
    (
        3,
        "SOP-03: Quy chuẩn vận hành nguồn DC Keysight E3631A",
        "Cảnh báo bảo trì nguồn điện: Nếu màn hình hiển thị nhấp nháy dòng CC (Constant Current) hoặc OVP, kiểm tra ngay mạch tải có bị chập hay không. Kỹ thuật viên định kỳ kiểm tra độ gợn sóng (ripple & noise) 6 tháng một lần.",
        1,
    ),
    (
        4,
        "SOP-04: Quy định mượn, trả và bàn giao thiết bị phòng Lab",
        "Quy trình mượn thiết bị: Người dùng tìm kiếm thiết bị ở trạng thái Sẵn sàng (available) và gửi yêu cầu mượn trên hệ thống LyxLab. Quản lý phòng lab duyệt yêu cầu trước khi thiết bị được giao nhận thực tế tại tủ chứa.",
        0,
    ),
    (
        4,
        "SOP-04: Quy định mượn, trả và bàn giao thiết bị phòng Lab",
        "Quy định trả và kiểm tra hoàn trả: Sau khi kết thúc thời gian mượn, người dùng phải kiểm tra ngoại quan, phụ kiện đầy đủ và bấm 'Trả thiết bị' trên hệ thống. Nếu có hỏng hóc hoặc thiếu phụ kiện, phải lập biên bản bảo trì ngay.",
        1,
    ),
]

def seed():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Check if table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='document_chunks'")
    if not cursor.fetchone():
        print("Table document_chunks does not exist yet. Please run app startup first.")
        return
        
    cursor.execute("DELETE FROM document_chunks")
    cursor.executemany(
        "INSERT INTO document_chunks (document_id, document_name, content, chunk_index) VALUES (?, ?, ?, ?)",
        CHUNKS,
    )
    conn.commit()
    count = cursor.execute("SELECT COUNT(*) FROM document_chunks").fetchone()[0]
    print(f"Successfully seeded {count} SOP document chunks for AI RAG!")
    conn.close()

if __name__ == "__main__":
    seed()

