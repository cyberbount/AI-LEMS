"""One-shot migration: drop the legacy `raw_password` column from users.

The column stored plaintext passwords, which is a security violation
(passwords must only exist as bcrypt hashes in `password_hash`).
The application code no longer reads or writes it.

Usage (from the project root, with the venv active or any Python 3.10+):
    python remove_raw_password.py            # SQLite backend/lab.db or lab.db
    python remove_raw_password.py path/to/lab.db
"""

import sqlite3
import sys
from pathlib import Path

CANDIDATES = ["lab.db", "backend/lab.db", Path(__file__).parent / "lab.db"]


def migrate(db_path: str) -> None:
    conn = sqlite3.connect(db_path)
    try:
        cols = [row[1] for row in conn.execute("PRAGMA table_info(users);")]
        if "raw_password" not in cols:
            print(f"[skip] {db_path}: no raw_password column on users")
            return
        conn.execute("ALTER TABLE users DROP COLUMN raw_password;")
        conn.commit()
        print(f"[ok]   {db_path}: column users.raw_password dropped")
    finally:
        conn.close()


if __name__ == "__main__":
    targets = sys.argv[1:] or [p for p in CANDIDATES if Path(p).exists()]
    if not targets:
        print("No lab.db found. Pass the database path as an argument.")
        sys.exit(1)
    for t in targets:
        migrate(str(t))
