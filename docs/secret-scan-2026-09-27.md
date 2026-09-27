# Báo cáo quét secrets — 2026-09-27

**Tool:** `detect-secrets` (IBM, cài trong `.venv`) — phương pháp tham khảo từ skill
`implementing-secrets-scanning-in-ci-cd` (Anthropic-Cybersecurity-Skills).
**Phạm vi:** toàn bộ mã nguồn + docs + cấu hình của dự án (loại trừ `.venv`, `node_modules`,
`archify/`, `Anthropic-Cybersecurity-Skills/`, `dist/`, logs, DB nhị phân, .docx).
**Lệnh:**

```bash
.venv/bin/detect-secrets scan backend/app backend/init.sql backend/requirements.txt \
  database frontend/src frontend/public docs tests scripts docker-compose.yml nginx.conf .env \
  README.md traceability-report.md > docs/secret-scan-2026-09-27.json
```

## Kết quả: 13 phát hiện thô — 100% false positive sau phân loại

| Vị trí | Loại | Phân loại |
|---|---|---|
| `docs/api.md:65,101` | Secret Keyword | Ví dụ JSON minh họa với mật khẩu giả trong tài liệu API — cố ý, không phải secret thật |
| `tests/test_api.py`, `tests/test_auth_real.py`, `tests/test_g3.py` (8 chỗ) | Secret Keyword | Mật khẩu tài khoản kiểm thử (`matkhau123456`, `user123`...) — dữ liệu test công khai theo thiết kế |
| `docs/baseline-audit.md:24`, `docs/database-verification.md:56` | Basic Auth | Chuỗi kết nối ví dụ `lab:lab@mysql` — credential mẫu của tài liệu |
| `frontend/src/App.jsx:1952` | Secret Keyword | Nhãn tiếng Việt "Đặt lại MK" (từ khóa "MK" trùng keyword detector) |

## Ghi nhận thủ công ngoài tool

- `.env:5` — `JWT_SECRET_KEY=dev-local-secret-key-change-me`: placeholder cho môi trường dev local
  (tool tự lọc nhờ bộ lọc known-placeholder). Theo SEC-001: Docker/production **bắt buộc** cung cấp
  secret qua biến môi trường; file `.env` đã nằm trong `.gitignore` từ đầu.
- Không phát hiện AWS key, private key, GitHub token, chuỗi kết nối production thật nào trong repo.

## Kết luận

Pass — không có secret thật nào trong repo. Khuyến nghị: chạy lại lệnh trên trước mỗi lần nộp
và giữ `detect-secrets-hook` trong pre-commit khi dự án mở rộng.
