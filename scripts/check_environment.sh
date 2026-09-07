#!/usr/bin/env bash
set -u
OLLAMA_BASE_URL="${OLLAMA_BASE_URL:-http://localhost:11434}"

echo "OS: $(uname -a)"
if grep -qi microsoft /proc/version 2>/dev/null; then
  echo "WSL: detected"
else
  echo "WSL: not detected"
fi
echo "Python: $(python3 --version 2>&1 || true)"
echo "pip: $(python3 -m pip --version 2>&1 || true)"
echo "CPU cores: $(nproc 2>/dev/null || true)"
echo "CPU model: $(awk -F: '/model name/ {gsub(/^ /, "", $2); print $2; exit}' /proc/cpuinfo 2>/dev/null || true)"
echo "RAM: $(free -h 2>/dev/null | awk '/Mem:/ {print $2 " total, " $7 " available"}' || true)"
echo "Ollama: $(ollama --version 2>&1 || true)"
echo "Ollama endpoint: ${OLLAMA_BASE_URL}"
echo "Ollama tags: $(curl -fsS "${OLLAMA_BASE_URL}/api/tags" 2>&1 | head -c 500 || true)"
echo "NVIDIA GPU: $(nvidia-smi --query-gpu=name,memory.total,driver_version,utilization.gpu --format=csv,noheader 2>&1 || true)"
echo "NVIDIA driver/CUDA:"
nvidia-smi 2>&1 || true
