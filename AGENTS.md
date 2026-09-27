# AGENTS.md

Hướng dẫn cho AI agent (Codex / ZCode / ...) làm việc trong repository này.
Phương pháp tham khảo: `Anthropic-Cybersecurity-Skills` (agentskills.io) — điều chỉnh cho AI-Augmented SDLC.

## Repository này là gì

AI-LEMS (LyxLab) — Hệ thống quản lý thiết bị phòng thí nghiệm tích hợp AI (Đề tài 23).
React/Vite frontend + FastAPI backend + Ollama `qwen2.5:3b` local + SQLite/MySQL.
Nguồn thẩm quyền nghiệp vụ: `../BaoCao_UDTTNT.docx` (báo cáo nhóm) và `de_tai_23 (1).txt` (đề bài).
Mọi thay đổi phải đối chiếu được với hai tài liệu đó và bộ baseline trong `docs/`.

## Thứ tự đọc khi bắt đầu một tác vụ

1. `docs/requirements.md` — baseline FR/NFR/BR (G1). Đừng đề xuất gì trái "Constraints/Out of scope".
2. `docs/architecture.md` + `docs/architecture-decisions.md` — ranh giới kiến trúc và ADR.
3. `docs/api-design.md`, `docs/database-design.md` — hợp đồng API + dữ liệu trước khi viết code.
4. `docs/security-review.md` + `docs/human-verification.md` — các gap đang mở và cổng phê duyệt.

## Quy ước bắt buộc

- **Ngôn ngữ nghiệp vụ là tiếng Việt**; mã định danh code giữ nguyên tiếng Anh.
- **Múi giờ**: lưu naive giờ Hà Nội (`app.utils.tz.hanoi_now_naive`), xuất ISO `+07:00` (`to_hanoi_iso`).
- **RBAC**: role lấy từ JWT ở backend, không bao giờ tin role do client gửi. AI là read-only (BR-011).
- **Tri thức RAG**: mọi chunk truy hồi phải đi qua lọc `documents.allowed_roles` (BR-015) và
  envelope `BEGIN/END UNTRUSTED REFERENCE CONTEXT`. Mode AI bị giới hạn theo vai (`MODE_ALLOWED_ROLES`).
- **Mật khẩu**: chỉ bcrypt hash. Cấm cột/endpoint lưu hay trả plaintext (SEC-006).
- **Audit**: mọi thao tác thay đổi trạng thái và mọi lượt hỏi AI phải ghi `audit_logs`.
- **Tests**: chạy `PYTHONPATH=backend .venv/bin/python -m pytest -q tests/` trước khi báo hoàn thành;
  số test phải được cập nhật vào `docs/test-report.md`. Cấm sửa test cho pass — sửa code hoặc ghi nhận lỗi.

## Chống hallucination (từ thư viện tham khảo)

- Không bịa endpoint, bảng, CVE, framework ID. Framework mapping (ATLAS/AI RMF/OWASP) chỉ dùng ID đã đối chiếu.
- Trạng thái triển khai phải dùng đúng từ vựng bằng chứng: `CODE EXISTS < TEST EXECUTED < TEST PASSED < NOT VERIFIED`.
- Không tài liệu nào được tuyên bố coverage mà test không chứng minh.

## Skills

- 13 skill nằm phẳng tại `.agents/skills/<tên>/SKILL.md` (chuẩn agentskills.io).
- `description` là tín hiệu duy nhất để agent chọn skill — viết theo 4 phần: làm gì cụ thể /
  `Use when...` / `Keywords:` / negative trigger. Thân skill < 500 dòng; chiều sâu đưa vào `references/`.
- Sau khi sửa SKILL.md: chạy `PYTHONPATH=. python tools/validate_skills.py` (nếu tồn tại) và rà lại `docs/`.

## Làm việc với git

- Working tree phải sạch trước khi tuyên bố "đã hoàn thành" một gate/evidence.
- Không rewrite lịch sử commit cũ (kể cả các commit phase rỗng — đã được audit ghi nhận).
- Không commit `.env`, `lab.db`, `logs/`, `dist/` (đã có `.gitignore`).
