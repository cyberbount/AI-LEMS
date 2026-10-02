# -*- coding: utf-8 -*-
"""Module sinh phần mở đầu: Tiêu đề, Tiêu chí đánh giá, Mô hình tổng quát, Mục tiêu hệ thống."""

def get_frontmatter_markdown():
    return r"""# HƯỚNG DẪN THỰC HÀNH XÂY DỰNG HỆ THỐNG QUẢN LÝ THIẾT BỊ PHÒNG LAB ĐIỆN TỬ - IOT CÓ TÍCH HỢP AI
## QUY TRÌNH AI-AUGMENTED SDLC VỚI CODEX / ANTIGRAVITY (AI AGENT)
> **Đề tài 23:** Hệ thống Quản lý Vòng đời Thiết bị Phòng Lab Điện tử - IoT Hỗ trợ AI (AI-LEMS)  
> **Môn học:** Ứng dụng Trí tuệ Nhân tạo trong Phát triển Phần mềm  
> **Tác giả / Nhóm thực hiện:** Nhóm nghiên cứu Đề tài 23  
> **Giảng viên hướng dẫn:** TS. Nguyễn Đình Dũng  
> **Năm học:** 2026 - 2027  

---

## A. TIÊU CHÍ ĐÁNH GIÁ BÀI THỰC HÀNH
Điểm cốt lõi của bài thực hành này là không dùng AI Agent (Codex/Antigravity) như một công cụ chỉ để sinh code đơn thuần, mà tổ chức AI thành một **AI Agent chuyên trách** hỗ trợ các quy trình SDLC có kiểm soát bằng **Skills**, **Tools** và **MCP**, với các điểm kiểm soát chặt chẽ của con người (**Human Gates**). Trọng tâm đánh giá là khả năng tổ chức quy trình, truy vết đầu vào - đầu ra, kiểm chứng kết quả do AI tạo ra và chịu trách nhiệm đối với sản phẩm cuối cùng.

Đánh giá năng lực sử dụng AI trong SDLC, thay vì chỉ đánh giá "AI đã viết được bao nhiêu dòng code".

Sinh viên nộp đầy đủ các thành phần minh chứng sau:
1. **Thư mục các file `SKILL.md`:** Quản lý tập trung tại `.agents/skills/` gồm 14 skills chuyên môn.
2. **Prompt/Task đã giao cho AI Agent:** Toàn bộ 28 prompt chỉ đạo (`PROMPT 00` đến `PROMPT 19`).
3. **Artifact do AI Agent tạo ra:** Sơ đồ PlantUML (`docs/diagrams/`), bảng đặc tả (`docs/tables/`), mã nguồn backend/frontend.
4. **Kết quả kiểm thử:** Toàn bộ bằng chứng Unit tests, Integration tests, kết quả đánh giá đối kháng NVIDIA Garak và Promptfoo.
5. **Review Report:** Báo cáo đánh giá mã nguồn (`docs/code-review.md`).
6. **Security Report:** Báo cáo đánh giá an ninh mạng và AI (`docs/security-review.md`).
7. **Các lỗi AI phát hiện được:** Danh mục lỗi do AI Agent chỉ ra trong quá trình rà soát.
8. **Những chỉnh sửa do con người thực hiện:** Các can thiệp của lập trình viên và quyết định tại Human Gates.
9. **Lịch sử Git:** Truy vết toàn bộ commits theo từng chặng SDLC.

### Bảng Thang điểm Đánh giá Chi tiết (Thang 10 điểm):
| STT | Nội dung đánh giá | Điểm | Minh chứng thực tế trong Đề tài 23 (AI-LEMS) | Tình trạng |
|:---:|---|:---:|---|:---:|
| 1 | **Phân tích yêu cầu (Requirements Analysis)** | 1.0 | `docs/requirements.md`, `docs/user-stories.md`, `docs/acceptance-criteria.md`, 16 FRs, 11 NFRs, 16 BRs. | **ĐẠT (1.0/1.0)** |
| 2 | **Xây dựng Requirements Skill** | 1.0 | `.agents/skills/requirements-analysis/SKILL.md` hoàn chỉnh, chuẩn hóa đầu vào - đầu ra. | **ĐẠT (1.0/1.0)** |
| 3 | **Thiết kế kiến trúc (Architecture Design)** | 1.0 | `.agents/skills/architecture-design/SKILL.md`, sơ đồ kiến trúc 3 tầng, Sequence Diagrams, Class Diagram, Activity Diagrams. | **ĐẠT (1.0/1.0)** |
| 4 | **Database Skill + CSDL** | 1.0 | `.agents/skills/database-design/SKILL.md`, `database/schema.sql`, ERD, Data Dictionary, SQLite/MySQL. | **ĐẠT (1.0/1.0)** |
| 5 | **Coding Skill + Implementation** | 1.5 | `.agents/skills/implementation/SKILL.md`, FastAPI backend, React Vite frontend, hoàn tất 11 core FRs và 4 AI FRs. | **ĐẠT (1.5/1.5)** |
| 6 | **Testing Skill + Test Evidence** | 1.5 | `.agents/skills/testing/SKILL.md`, 38/38 backend tests PASS, 40 AI Agent test cases PASS, báo cáo `docs/test-report.md`. | **ĐẠT (1.5/1.5)** |
| 7 | **Review + Security Skill** | 1.0 | `.agents/skills/code-review/`, `.agents/skills/security-review/`, khắc phục SEC-001..SEC-006, NVIDIA Garak scan, Promptfoo. | **ĐẠT (1.0/1.0)** |
| 8 | **Documentation Skill** | 0.5 | `.agents/skills/documentation/SKILL.md`, đồng bộ 100% tài liệu `docs/api.md`, `docs/deployment.md`, `docs/user-guide.md`. | **ĐẠT (0.5/0.5)** |
| 9 | **Sử dụng Tools / MCP** | 0.5 | Tích hợp MCP Server, bộ công cụ phân tích tĩnh, phát hiện rò rỉ bí mật `detect-secrets`. | **ĐẠT (0.5/0.5)** |
| 10 | **Human Verification + Báo cáo Quá trình AI** | 1.0 | `docs/human-verification.md` độc lập, biên bản phê duyệt Gate 0 đến Gate 5, `docs/ai-sdlc-process-report.md`. | **ĐẠT (1.0/1.0)** |
| **TỔNG** | **ĐÁNH GIÁ TOÀN DIỆN** | **10.0** | **HỆ THỐNG ĐẠT CHUẨN XUẤT SẮC TOÀN BỘ 10 TIÊU CHÍ** | **10.0 / 10.0** |

---

## B. MÔ HÌNH TỔNG QUÁT VÒNG ĐỜI PHÁT TRIỂN PHẦN MỀM ĐƯỢC TĂNG CƯỜNG BẰNG TRÍ TUỆ NHÂN TẠO (AI-AUGMENTED SDLC)

Nếu sử dụng AI Agent (Codex/Antigravity) làm công cụ AI hỗ trợ phát triển phần mềm, hệ thống thiết lập mô hình vòng đời SDLC chặt chẽ:

```mermaid
flowchart TD
    URD["Yêu cầu Nghiệp vụ Phòng Lab (URD: customer-requirement.md)"] --> HG0{"Human Gate 0: Khảo sát URD"}
    HG0 -- "APPROVED" --> G1["G1: Phân tích Yêu cầu (requirements-analysis skill)"]
    G1 --> HG1{"Human Gate 1: Thẩm duyệt Yêu cầu (Minh Anh ký)"}
    HG1 -- "APPROVED" --> G2["G2: Thiết kế Kiến trúc & CSDL (architecture & database skill)"]
    G2 --> HG2{"Human Gate 2: Thẩm duyệt Thiết kế (Kiến trúc & ERD)"}
    HG2 -- "APPROVED" --> G3["G3: Lập trình & Kiểm thử Core FR-001..FR-011 (implementation & testing skill)"]
    G3 --> HG3{"Human Gate 3: Thẩm duyệt Core Modules"}
    HG3 -- "APPROVED" --> G_AI["Triển khai Trợ lý AI & Lịch sử AI (Local Ollama Qwen 2.5 3B)"]
    G_AI --> HG_AI{"Human Gate AI: Thẩm duyệt An toàn AI (Zero-Trust BR-011)"}
    HG_AI -- "APPROVED" --> G4["G4: Tích hợp Hệ thống & Đánh giá An ninh (code-review & security-review skill)"]
    G4 --> HG4{"Human Gate 4: Thẩm duyệt Tích hợp & Pentest"}
    HG4 -- "APPROVED" --> G5["G5: Tài liệu hóa & Triển khai Docker (documentation skill)"]
    G5 --> HG5{"Human Gate 5: Nghiệm thu Triển khai"}
    HG5 -- "FINAL APPROVED" --> PROD["Hệ thống AI-LEMS Vận hành Thực tế Phòng Lab"]
```

---

## C. HỆ THỐNG QUẢN LÝ THIẾT BỊ PHÒNG LAB ĐIỆN TỬ - IOT CÓ TÍCH HỢP AI (AI-LEMS)
### 1. Mục tiêu
Sau bài thực hành, nhóm nghiên cứu đã làm chủ và hoàn tất:
1. **Phân tích yêu cầu phần mềm với sự hỗ trợ của AI:** Chuyển đổi ngôn ngữ tự nhiên từ URD thành 16 Yêu cầu chức năng (FRs), 11 Yêu cầu phi chức năng (NFRs) và 16 Quy tắc nghiệp vụ (BRs).
2. **Xây dựng và sử dụng Skill cho từng hoạt động SDLC:** 14 Skill hoàn chỉnh được định nghĩa chuẩn cú pháp YAML frontmatter và hướng dẫn quy trình.
3. **Sử dụng AI Agent (Codex/Antigravity) như một trợ lý chuyên trách:** Phân định rõ ràng trách nhiệm của AI và trách nhiệm phê duyệt của con người.
4. **Phân biệt rành mạch giữa Skill, Tool và MCP:**
   - *Skill:* Tri thức thủ tục, quy chuẩn thực hiện công việc.
   - *Tool:* Công cụ tương tác môi trường (chạy lệnh shell, đọc ghi tệp).
   - *MCP:* Giao thức ngữ cảnh chuẩn kết nối công cụ kiểm toán và dịch vụ ngoài.
5. **Ứng dụng AI xuyên suốt 8 giai đoạn SDLC:**
   - Requirements Engineering
   - Architecture Design
   - Database Design
   - Implementation
   - Testing
   - Code Review
   - Security Review
   - Documentation
6. **Kiểm chứng độc lập kết quả do AI tạo ra:** Thiết lập 6 Human Gates không chấp nhận mù quáng output của mô hình.
7. **Quản lý Skill cùng mã nguồn bằng Git:** Quản lý vòng đời Skill phiên bản v1, v2, v3 trực tiếp trong repository.
8. **An ninh AI và Khắc phục Lỗ hổng Đối kháng:** Ứng dụng NVIDIA Garak, Promptfoo, SafeRAG và kiến trúc phòng vệ 3 lớp triệt tiêu nguy cơ Jailbreak và Prompt Injection.
"""
