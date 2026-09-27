#!/usr/bin/env bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"
FRONTEND_DIR="$PROJECT_DIR/frontend"
MODEL="${OLLAMA_MODEL:-qwen2.5:3b}"
OLLAMA_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

log()  { echo -e "${GREEN}[OK]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
err()  { echo -e "${RED}[ERR]${NC} $1"; }

# ── 1. Ollama serve ──────────────────────────────────────────────
if curl -fsS "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
    log "Ollama dang chay"
else
    warn "Ollama chua chay. Dang khoi dong ollama serve..."
    setsid ollama serve >/dev/null 2>&1 &
    for i in $(seq 1 15); do
        if curl -fsS "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
            log "Ollama da khoi dong (PID $OLLAMA_PID)"
            break
        fi
        sleep 1
    done
    if ! curl -fsS "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
        err "Ollama khoi dong that bai. Chay thu cong: ollama serve"
        exit 1
    fi
fi

# ── 2. Kiem tra & load model ────────────────────────────────────
MODELS=$(curl -fsS "$OLLAMA_URL/api/tags" 2>/dev/null | grep -o '"name":"[^"]*"' | cut -d'"' -f4 || true)
if echo "$MODELS" | grep -q "^${MODEL}$"; then
    log "Model $MODEL da san sang"
else
    warn "Model $MODEL chua co. Dang pull..."
    ollama pull "$MODEL"
    log "Model $MODEL da pull xong"
fi

# ── 3. FastAPI backend ──────────────────────────────────────────
# Kiem tra /health chu khong phai chi port: process zombie co the van giu
# port 8000 ma khong phuc vu request — neu chi nhin port se bo khoi dong.
backend_alive() {
    curl -fsS --max-time 3 http://localhost:8000/health >/dev/null 2>&1
}

if backend_alive; then
    log "FastAPI dang chay tren :8000"
else
    if ss -tlnp 2>/dev/null | grep -q ':8000 '; then
        warn "Port 8000 bi giu boi process khong phuc vu (zombie). Dang don dep..."
        ss -tlnp 2>/dev/null | grep ':8000 ' | grep -oP 'pid=\K[0-9]+' | sort -u | xargs -r kill -9 2>/dev/null || true
        pkill -9 -f "uvicorn app.main:app" 2>/dev/null || true
        sleep 1
    fi
    warn "Dang khoi dong FastAPI..."
    cd "$PROJECT_DIR"
    VENV_PYTHON="$PROJECT_DIR/.venv/bin/python"
    if [ ! -f "$VENV_PYTHON" ]; then
        err "Chua co venv. Chay: python3 -m venv .venv && .venv/bin/pip install -r backend/requirements.txt"
        exit 1
    fi
    setsid "$VENV_PYTHON" -m uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000 \
        > "$PROJECT_DIR/logs/backend.log" 2>&1 &
    mkdir -p "$PROJECT_DIR/logs"
    for i in $(seq 1 15); do
        if backend_alive; then
            log "FastAPI da khoi dong va phan hoi /health"
            break
        fi
        sleep 1
    done
    if ! backend_alive; then
        err "FastAPI khoi dong that bai. Xem log: $PROJECT_DIR/logs/backend.log"
        exit 1
    fi
fi

# ── 4. Frontend Vite ────────────────────────────────────────────
if ss -tlnp 2>/dev/null | grep -q ':5173 '; then
    log "Frontend dang chay tren :5173"
else
    warn "Dang khoi dong Frontend..."
    cd "$FRONTEND_DIR"
    setsid npm run dev -- --host 0.0.0.0 --port 5173 \
        > "$PROJECT_DIR/logs/frontend.log" 2>&1 &
    mkdir -p "$PROJECT_DIR/logs"
    for i in $(seq 1 15); do
        if ss -tlnp 2>/dev/null | grep -q ':5173 '; then
            log "Frontend da khoi dong (PID $FRONTEND_PID)"
            break
        fi
        sleep 1
    done
    if ! ss -tlnp 2>/dev/null | grep -q ':5173 '; then
        err "Frontend khoi dong that bai. Xem log: $PROJECT_DIR/logs/frontend.log"
    fi
fi

echo ""
echo -e "${CYAN}=== He thong san sang ===${NC}"
echo -e "  Ollama:    $OLLAMA_URL  (model: $MODEL)"
echo -e "  Backend:   http://localhost:8000"
echo -e "  Frontend:  http://localhost:5173/login"
echo -e "  API docs:  http://localhost:8000/docs"
echo ""
