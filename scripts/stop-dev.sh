#!/usr/bin/env bash

GREEN='\033[0;32m'
NC='\033[0m'

# ── Dung Frontend (Vite :5173) ──────────────────────────────────
VITE_PID=$(ss -tlnp 2>/dev/null | grep ':5173 ' | grep -oP 'pid=\K[0-9]+' | head -1)
if [ -n "$VITE_PID" ]; then
    kill "$VITE_PID" 2>/dev/null && echo -e "${GREEN}[OK]${NC} Da dung Frontend (PID $VITE_PID)" || true
fi

# ── Dung Backend (FastAPI :8000) ────────────────────────────────
UVICORN_PID=$(ss -tlnp 2>/dev/null | grep ':8000 ' | grep -oP 'pid=\K[0-9]+' | head -1)
if [ -n "$UVICORN_PID" ]; then
    kill "$UVICORN_PID" 2>/dev/null && echo -e "${GREEN}[OK]${NC} Da dung FastAPI (PID $UVICORN_PID)" || true
fi

echo -e "${GREEN}[OK]${NC} Da dung Frontend va Backend."
echo "Ollama van dang chay. De dung: pkill ollama"
