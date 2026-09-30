from app.db import SessionLocal
from app.models import DocumentChunk

def enrich():
    db = SessionLocal()
    db.query(DocumentChunk).delete()

    sops = [
        {
            'doc_id': 1,
            'doc_name': 'SOP-01: Quy trình an toàn phòng thí nghiệm và bảo hộ lao động',
            'chunks': [
                '''Quy định an toàn chung & Trang bị bảo hộ lao động cá nhân (PPE):
1. Trang phục: Bắt buộc mặc áo blouse trắng cài khuy gọn gàng, đeo kính bảo hộ khi thao tác cắt chân linh kiện hoặc hàn mạch, đi giày kín mũi chống trượt, tháo bỏ trang sức kim loại ở cổ tay và ngón tay.
2. Vệ sinh & Quy tắc phòng lab: Tuyệt đối cấm mang đồ ăn, nước uống, chất lỏng vào khu vực bàn máy. Giữ mặt bàn làm việc khô ráo, sạch bụi kim loại.
3. Nhận diện vị trí khẩn cấp: Mọi người dùng trước khi bắt đầu ca thực hành bắt buộc phải định vị chính xác vị trí nút dừng khẩn cấp (E-Stop), cầu dao tổng và bình chữa cháy khí CO2 (loại chuyên dụng cho thiết bị điện tử, cấm dùng bình nước/bọt).''',
                '''Quy trình xử lý khẩn cấp khi xảy ra chập cháy hoặc tai nạn điện:
Bước 1: Ngay lập tức nhấn nút Dừng khẩn cấp (E-Stop) tại bàn hoặc gạt cầu dao Aptomat nhánh để ngắt nguồn điện toàn bộ bàn làm việc.
Bước 2: Hô hoán cảnh báo mọi người xung quanh và báo ngay cho Kỹ thuật viên / Quản lý phòng lab (Hotline nội bộ 102).
Bước 3: Nếu xảy ra đám cháy điện tử, sử dụng bình khí CO2 đứng cách 1.5 - 2m xịt dập tắt lửa. Tuyệt đối KHÔNG sử dụng nước dập cháy thiết bị điện.
Bước 4: Sơ cứu nạn nhân: Tách nạn nhân khỏi nguồn điện bằng vật cách điện (thước gỗ, gậy nhựa), kiểm tra đường thở, thực hiện ép tim CPR nếu ngừng thở và gọi cấp cứu 115.'''
            ]
        },
        {
            'doc_id': 2,
            'doc_name': 'SOP-02: Hướng dẫn vận hành máy hiện sóng Tektronix TBS1102B',
            'chunks': [
                '''Thông số kỹ thuật & Cài đặt que đo máy hiện sóng Tektronix TBS1102B:
- Băng thông: 100 MHz, 2 kênh tương tự (CH1, CH2), tốc độ lấy mẫu thời gian thực 2.0 GS/s, độ sâu bộ nhớ 20k điểm.
- Cổng kết nối: Chuẩn BNC cho CH1, CH2, ngõ vào Trigger ngoài Ext Trig.
- Cài đặt hệ số que đo: Que đo đi kèm TPP0101 có công tắc gạt hệ số suy hao 1X hoặc 10X.
  + Thang 1X: Dải đo điện áp thấp (tối đa 30V RMS), băng thông giới hạn ~6 MHz, trở kháng vào 1 MΩ song song ~100 pF.
  + Thang 10X: Khuyên dùng cho hầu hết các phép đo tín hiệu logic và xung cao tần; chịu điện áp tối đa 300V RMS CAT II, trở kháng ngõ vào 10 MΩ song song ~12 pF (giảm thiểu tải lên mạch cần đo).
- Bắt buộc kiểm tra cài đặt 'Probe Attenuation' trong menu kênh CH1/CH2 trên màn hình trùng khớp với vị trí công tắc gạt trên thân que đo.''',
                '''Quy trình 5 bước vận hành máy hiện sóng Tektronix TBS1102B:
Bước 1: Bật nguồn bằng phím Power ở góc trên bên trái. Chờ máy tự kiểm tra (Power-on Self Test) hoàn tất trong 15 giây.
Bước 2: Kết nối que đo vào cổng BNC CH1. Kẹp đầu kẹp mass (Ground alligator clip) vào điểm GND của mạch cần đo trước khi chạm đầu que đo vào điểm tín hiệu.
Bước 3: Bấm phím 'Autoset' màu trắng ở cụm điều khiển bên phải. Máy sẽ tự động phân tích và căn chỉnh thang đo điện áp (Volts/Div), thang thời gian (Sec/Div) và mức kích khởi (Trigger Level) để hiển thị dạng sóng ổn định.
Bước 4: Tinh chỉnh thủ công:
  - Vặn núm 'Scale' (Vertical) để phóng to/thu nhỏ biên độ tín hiệu.
  - Vặn núm 'Scale' (Horizontal) để xem chi tiết chu kỳ xung hoặc xem tổng thể chuỗi xung.
  - Vặn núm 'Level' tại cụm Trigger để cố định điểm kích khởi dạng sóng, tránh hiện tượng trôi sóng (rolling wave).
Bước 5: Đọc thông số tự động: Bấm nút 'Measure', chọn kênh CH1, gán các phép đo tự động quan trọng như: Vpp (điện áp đỉnh-đỉnh), Vrms (điện áp hiệu dụng), Frequency (tần số) và Duty Cycle (chu kỳ nhiệm vụ).''',
                '''Quy trình bù que đo (Probe Compensation) & Quy tắc an toàn sống còn:
- Bù que đo trước khi đo xung vuông: Kẹp đầu que đo vào móc tín hiệu 'PROBE COMP ~5V @ 1kHz' và kẹp kẹp mass vào cổng GND cạnh đó.
  + Nếu cạnh trên xung vuông bị nhọn (Overcompensated) hoặc bị vát tròn (Undercompensated): Dùng tuốc-nơ-vít cách điện vi chỉnh ốc bù trên đầu cắm BNC của que đo cho đến khi dạng sóng vuông hiển thị phẳng và vuông góc tuyệt đối.
- CẢNH BÁO AN TOÀN SỐNG CÒN: Kẹp mass của que đo máy hiện sóng được nối tắt trực tiếp với dây tiếp địa bảo vệ (Chassis Ground) của nguồn điện lưới 220V qua chân cắm PE.
  + TUYỆT ĐỐI KHÔNG kẹp kẹp mass vào bất kỳ điểm nào có điện thế khác 0V (ví dụ: chân cực âm cầu diode nắn điện lưới, nguồn switching không cách ly).
  + Vi phạm sẽ gây ngắn mạch pha-đất, làm nổ que đo, cháy máy hiện sóng và gây nguy hiểm tính mạng! Bắt buộc dùng que đo vi sai cách ly (Differential Probe) hoặc biến áp cách ly khi đo mạch nguồn trực tiếp.'''
            ]
        },
        {
            'doc_id': 3,
            'doc_name': 'SOP-03: Quy chuẩn vận hành nguồn DC Keysight E3631A',
            'chunks': [
                '''Thông số ngõ ra & Quy tắc cài đặt nguồn DC lập trình Keysight E3631A:
- Cấu hình 3 ngõ ra độc lập, độ ồn cực thấp:
  + Ngõ 1: 0 đến +6V, dòng tải tối đa 5A (chuyên cấp nguồn vi điều khiển 3.3V, 5V, logic TTL/CMOS).
  + Ngõ 2: 0 đến +25V, dòng tải tối đa 1A (cấp nguồn Op-Amp, mạch công suất, relay, động cơ DC).
  + Ngõ 3: 0 đến -25V, dòng tải tối đa 1A (cấp nguồn đối xứng âm cho mạch khuếch đại tương tự).
- Quy tắc bảo vệ quá dòng (Current Limit - I Limit) BẮT BUỘC:
  Trước khi bấm nút 'Output On/Off', người vận hành bắt buộc phải bấm nút 'I Limit' và xoay núm vặn để cài đặt giới hạn dòng phù hợp với tải (ví dụ: mạch vi điều khiển đặt giới hạn 200mA - 500mA). Nếu xảy ra chạm chập trên board thí nghiệm, nguồn sẽ tự động chuyển sang chế độ dòng không đổi CC (Constant Current) và hạ điện áp xuống 0V, ngăn chặn hoàn toàn việc cháy linh kiện!''',
                '''Quy trình vận hành nguồn DC Keysight E3631A:
Bước 1: Bật công tắc Power. Kiểm tra đèn chỉ thị trạng thái.
Bước 2: Bấm phím chọn kênh ngõ ra: '+6V', '+25V' hoặc '-25V'.
Bước 3: Cài đặt điện áp mong muốn: Bấm phím 'Voltage/Current', dùng phím mũi tên di chuyển con trỏ và xoay núm Knob để đặt điện áp chính xác đến 1mV.
Bước 4: Cài đặt dòng bảo vệ: Bấm 'I Limit', đặt ngưỡng dòng an toàn.
Bước 5: Đấu nối dây tải: Đảm bảo cọc cắm màu đỏ (+) và màu đen (-) kết nối đúng cực tính đến mạch thí nghiệm. Cọc màu xanh lá (GND tiếp địa) chỉ đấu nối khi cần nối đất vỏ máy.
Bước 6: Nhấn nút 'Output On/Off' để bắt đầu cấp nguồn ra tải. Quan sát màn hình LCD: Nếu đèn 'CV' sáng nghĩa là mạch hoạt động bình thường ở chế độ ổn áp; nếu đèn 'CC' nhấp nháy hoặc sáng đỏ, chứng tỏ mạch tải đang bị quá tải hoặc ngắn mạch -> lập tức bấm 'Output On/Off' để ngắt nguồn và kiểm tra lại mạch.'''
            ]
        },
        {
            'doc_id': 4,
            'doc_name': 'SOP-04: Quy định mượn, trả và bàn giao thiết bị phòng Lab',
            'chunks': [
                '''Quy trình mượn thiết bị phòng Lab trên hệ thống:
1. Điều kiện tiên quyết: Chỉ người dùng có tài khoản hợp lệ, không có yêu cầu quá hạn (overdue) chưa giải quyết và đã hoàn thành bài tập an toàn đầu kỳ mới được gửi yêu cầu mượn.
2. Tạo yêu cầu: Chọn thiết bị trong danh mục có trạng thái 'available' (Sẵn sàng). Điền mục đích nghiên cứu/thực hành, thời gian bắt đầu mượn và thời gian dự kiến hoàn trả (tối đa 07 ngày cho một lượt mượn thông thường).
3. Thẩm quyền duyệt: Chỉ Quản lý phòng lab (Manager) có quyền phê duyệt (Approved) hoặc từ chối (Rejected) yêu cầu. Hệ thống ghi nhật ký Audit Log mọi thao tác phê duyệt.''',
                '''Quy trình bàn giao tại tủ, hoàn trả và chế tài xử lý:
1. Bàn giao: Sau khi yêu cầu được Manager duyệt, người mượn đến gặp Kỹ thuật viên tại phòng Lab để nhận thiết bị. Kỹ thuật viên kiểm tra ngoại quan, bật thử nguồn, bàn giao đủ que đo, cáp nguồn và xác nhận bàn giao trên hệ thống.
2. Hoàn trả: Đến hạn, người mượn mang trả thiết bị tại tủ quy định, đăng nhập hệ thống và bấm 'Hoàn trả thiết bị'. Kỹ thuật viên kiểm tra tình trạng máy, que đo và xác nhận thu hồi.
3. Xử lý quá hạn & Sự cố:
   - Chậm hoàn trả không xin phép: Khóa quyền mượn thiết bị trong 14 ngày.
   - Thiết bị gặp sự cố hoặc hư hỏng trong lúc sử dụng: Người dùng phải bấm nút 'Báo sự cố' ngay lập tức trên hệ thống và báo Kỹ thuật viên lập Biên bản sự cố kỹ thuật. Không tự ý sửa chữa.'''
            ]
        },
        {
            'doc_id': 5,
            'doc_name': 'SOP-05: Quy trình hàn linh kiện SMD và an toàn tĩnh điện ESD',
            'chunks': [
                '''Quy chuẩn nhiệt độ hàn linh kiện điện tử và vi mạch dán SMD (Chuyên biệt Kỹ thuật viên):
- Dải nhiệt độ mỏ hàn tiếp xúc (Soldering Iron - Hakko FX-888D / Quick 936):
  + Thiếc hàn có chì (Sn63/Pb37, điểm nóng chảy 183°C): Cài đặt nhiệt độ mũi hàn 300°C - 330°C (tối đa 350°C khi hàn chân mass pad lớn).
  + Thiếc hàn không chì Lead-Free (SAC305, điểm nóng chảy 217°C): Cài đặt nhiệt độ mũi hàn 350°C - 370°C (tối đa 380°C).
  + Thời gian tiếp xúc mũi hàn: Tuyệt đối không giữ mũi hàn quá 3 giây trên mỗi pad của IC dán SMD để tránh bong tróc mạch in (PCB delamination) hoặc làm chết chip vì sốc nhiệt.
- Trạm khò nhiệt Hot Air (Quick 858D / 861DW):
  + Khò tháo IC dán SOP, QFP, BGA: Đặt gió mức 3-5, nhiệt độ 330°C - 360°C; luôn quét đều mũi khò theo hình vòng tròn quanh chip từ khoảng cách 1-2cm, kết hợp mỡ hàn Gel Flux no-clean.''',
                '''Quy chuẩn kiểm soát tĩnh điện ESD & Quy trình hoàn thiện bo mạch (Kỹ thuật viên):
- Kiểm soát chống tĩnh điện ESD (Theo tiêu chuẩn ANSI/ESD S20.20):
  + Điện áp tĩnh điện trên cơ thể người có thể vượt quá 3000V trong khi cổng MOSFET và IC CMOS bị đánh thủng ở điện áp dưới 100V!
  + Kỹ thuật viên bắt buộc đeo vòng đeo tay chống tĩnh điện (ESD Wrist Strap) có điện trở an toàn 1 MΩ và kẹp mass vào thanh nối đất phòng lab trước khi mở túi bảo quản chip.
  + Trải thảm cao su chống tĩnh điện (ESD Mat) có nối đất trên mặt bàn thao tác.
- Vệ sinh sau hàn:
  + Dùng cồn Isopropyl Alcohol (IPA) nồng độ > 99% và bàn chải tĩnh điện lông mềm để chải sạch cặn nhựa thông (Flux residue).
  + Kiểm tra bằng kính hiển vi soi nổi để phát hiện hiện tượng cầu chì thiếc (Solder Bridge) gây ngắn mạch giữa các chân chip IC trước khi cấp nguồn thử nghiệm.'''
            ]
        },
        {
            'doc_id': 6,
            'doc_name': 'SOP-06: Hướng dẫn xử lý sự cố thiết bị và kích hoạt bảo trì khẩn cấp',
            'chunks': [
                '''Quy trình phân loại sự cố và xử lý sự cố kỹ thuật (Kỹ thuật viên & Quản lý):
- Phân loại cấp độ sự cố thiết bị:
  + Cấp 1 (Nguy cơ an toàn / Khẩn cấp): Thiết bị bốc khói, phát ra mùi khét, phát tia lửa điện hoặc rò rỉ điện ra vỏ kim loại -> Kích hoạt E-Stop, cách ly thiết bị, ngắt điện hoàn toàn.
  + Cấp 2 (Hư hỏng chức năng chính): Máy không lên nguồn, mất kênh đo CH1/CH2, màn hình LCD trắng xóa, cầu chì đứt liên tục -> Thu hồi máy, dán nhãn 'HỎNG - CHỜ BẢO TRÌ' và chuyển trạng thái sang Maintenance trên phần mềm.
  + Cấp 3 (Suy giảm hiệu năng / Lỗi phụ kiện): Que đo bị đứt ngầm, lỏng jack BNC, sai lệch hiệu chuẩn -> Lập phiếu thay thế linh kiện cục bộ.
- Kích hoạt trên phần mềm: Khi tiếp nhận Báo sự cố từ người dùng hoặc qua kiểm định định kỳ, Kỹ thuật viên mở trang 'Bảo trì', tạo phiếu bảo trì mới (loại corrective/repair), cập nhật tình trạng thiết bị thành 'maintenance' để khóa mượn tự động.''',
                '''Các bước sửa chữa và kiểm tra nghiệm thu tái hòa mạng:
Bước 1: Cô lập thiết bị tại bàn kỹ thuật, kiểm tra bằng đồng hồ vạn năng DMM xem có ngắn mạch nguồn cấp ngõ vào (Short circuit test) trước khi cắm điện.
Bước 2: Mở nắp máy theo đúng sơ đồ dịch vụ (Service Manual), kiểm tra tụ lọc nguồn (phồng/chảy dịch), cầu chì bảo vệ, mạch nắn cầu và các IC ổn áp.
Bước 3: Thay thế linh kiện hỏng bằng linh kiện đúng thông số kỹ thuật xuất xưởng.
Bước 4: Kiểm định sau sửa chữa (Post-repair Calibration): Chạy chế độ Self-Calibration trên thiết bị, đo kiểm tra bằng nguồn chuẩn và thiết bị tham chiếu.
Bước 5: Lập biên bản hoàn thành bảo trì trên hệ thống LyxLab: Cập nhật tình trạng, ghi chú nguyên nhân và chuyển trạng thái thiết bị về 'available' (Sẵn sàng).'''
            ]
        }
    ]

    total_chunks = 0
    for sop in sops:
        for idx, c_text in enumerate(sop['chunks']):
            chunk = DocumentChunk(
                document_id=sop['doc_id'],
                document_name=sop['doc_name'],
                content=c_text.strip(),
                chunk_index=idx
            )
            db.add(chunk)
            total_chunks += 1

    db.commit()
    print(f"Successfully inserted {total_chunks} rich SOP chunks into database!")

if __name__ == "__main__":
    enrich()
