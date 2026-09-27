"""One-shot migration: add `documents.allowed_roles` (RBAC tri thức cho RAG).

Theo mục 2.11 Báo cáo: "Quyền truy cập tài liệu phải được kiểm soát trước khi
tài liệu được đưa vào pipeline RAG". SOP vận hành nội bộ (SOP-05 hàn SMD/ESD,
SOP-06 xử lý sự cố) bị giới hạn cho admin/manager/technician; các SOP dùng chung
(SOP-01..04) mở cho mọi vai trò.

Usage:
    python add_allowed_roles.py [đường_dẫn_lab.db]
"""

import sqlite3
import sys
from pathlib import Path

DEFAULT_ALL = "admin,manager,technician,user"
STAFF_ONLY = "admin,manager,technician"


def migrate(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        cols = [row[1] for row in conn.execute("PRAGMA table_info(documents);")]
        if "allowed_roles" in cols:
            print(f"[skip] {db_path}: cột allowed_roles đã tồn tại")
        else:
            conn.execute(
                f"ALTER TABLE documents ADD COLUMN allowed_roles VARCHAR(120) NOT NULL DEFAULT '{DEFAULT_ALL}';"
            )
            print(f"[ok]   {db_path}: thêm cột documents.allowed_roles (default: mọi vai trò)")
        # SOP vận hành nội bộ chỉ dành cho cán bộ/kỹ thuật
        cur = conn.execute(
            "UPDATE documents SET allowed_roles = ? WHERE name LIKE 'SOP-05%' OR name LIKE 'SOP-06%';",
            (STAFF_ONLY,),
        )
        conn.commit()
        print(f"[ok]   {db_path}: giới hạn {cur.rowcount} SOP nội bộ (SOP-05/SOP-06) cho admin,manager,technician")
    finally:
        conn.close()


if __name__ == "__main__":
    targets = sys.argv[1:] or [str(Path(__file__).parent / "lab.db")]
    for t in targets:
        if Path(t).exists():
            migrate(t)
        else:
            print(f"[skip] {t}: không tồn tại")
