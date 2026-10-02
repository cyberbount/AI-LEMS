#!/usr/bin/env bash

GREEN='\033[0;32m'
NC='\033[0m'

# ── Dung Frontend (Vite :5173) ──────────────────────────────────
VITE_PIDS=$(ss -tlnp 2>/dev/null | grep ':5173 ' | grep -oP 'pid=\K[0-9]+' | sort -u)
if [ -n "$VITE_PIDS" ]; then
    kill $VITE_PIDS 2>/dev/null || true
    echo -e "${GREEN}[OK]${NC} Da dung Frontend (PID: $(echo $VITE_PIDS | tr '\n' ' '))"
fi
pkill -f "vite --host" 2>/dev/null || true

# ── Dung Backend (FastAPI :8000) ────────────────────────────────
# uvicorn --reload chay thanh 2 process: reloader cha giu socket + worker con
# phuc vu request. Phai kill TAT CA moi khong de lai zombie van giu port 8000
# (zombie lam start-dev.sh tuong backend van song va bo khoi dong).
UVICORN_PIDS=$(ss -tlnp 2>/dev/null | grep ':8000 ' | grep -oP 'pid=\K[0-9]+' | sort -u)
if [ -n "$UVICORN_PIDS" ]; then
    kill $UVICORN_PIDS 2>/dev/null || true
    echo -e "${GREEN}[OK]${NC} Da dung FastAPI (PID: $(echo $UVICORN_PIDS | tr '\n' ' '))"
fi
pkill -f "uvicorn app.main:app" 2>/dev/null || true
if command -v docker >/dev/null 2>&1 && docker ps -q --filter "name=lab_backend" 2>/dev/null | grep -q .; then
    docker stop lab_backend >/dev/null 2>&1 || true
fi

# ── Cho port that su ranh (toi da 5 giay) ───────────────────────
for i in $(seq 1 5); do
    if ! ss -tln 2>/dev/null | grep -q ':8000 ' && ! ss -tln 2>/dev/null | grep -q ':5173 '; then
        break
    fi
    pkill -9 -f "uvicorn app.main:app" 2>/dev/null || true
    pkill -9 -f "vite --host" 2>/dev/null || true
    sleep 1
done

echo -e "${GREEN}[OK]${NC} Da dung Frontend va Backend."
echo "Ollama van dang chay. De dung: pkill ollama"
