import json
import os
import subprocess
import sys
import time
import urllib.error
import urllib.request

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
BACKEND_BASE_URL = os.getenv("BACKEND_BASE_URL", "http://localhost:8000").rstrip("/")
MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:3b")
TIMEOUT_SECONDS = int(os.getenv("TEST_TIMEOUT_SECONDS", "240"))

TEST_MESSAGES = [
    "Xin chào, bạn là ai?",
    "Hãy giải thích RAG là gì.",
    "Hãy giải thích sự khác nhau giữa RAG và fine-tuning.",
    "Hãy đóng vai trợ lý quản lý phòng thí nghiệm.",
]


def request_json(base_url, path, payload=None, timeout=TIMEOUT_SECONDS):
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    request = urllib.request.Request(
        f"{base_url}{path}",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        return json.load(response)


def run_command(args):
    try:
        result = subprocess.run(args, capture_output=True, text=True, timeout=10, check=False)
        return (result.stdout or result.stderr).strip()
    except (FileNotFoundError, subprocess.SubprocessError) as exc:
        return str(exc)


def snapshot_resources():
    return {
        "nvidia_smi": run_command(
            [
                "nvidia-smi",
                "--query-gpu=name,utilization.gpu,memory.used,memory.total",
                "--format=csv,noheader,nounits",
            ]
        ),
        "ollama_process": run_command(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-Process ollama* -ErrorAction SilentlyContinue | Select-Object ProcessName,Id,CPU,WorkingSet64 | ConvertTo-Json -Compress",
            ]
        ),
    }


def pass_gate(name, details):
    return {"gate": name, "status": "PASS", **details}


def fail_gate(name, error):
    return {"gate": name, "status": "FAIL", "error": str(error)}


def main():
    results = []

    try:
        tags = request_json(OLLAMA_BASE_URL, "/api/tags", timeout=10)
        results.append(pass_gate("ollama_health", {"base_url": OLLAMA_BASE_URL}))
    except Exception as exc:
        results.append(fail_gate("ollama_health", exc))
        print(json.dumps({"status": "FAIL", "results": results}, ensure_ascii=False, indent=2))
        return 1

    names = {item.get("name") for item in tags.get("models", [])}
    if MODEL not in names:
        results.append(fail_gate("model_exists", f"Model {MODEL!r} not found. Available: {sorted(names)}"))
        print(json.dumps({"status": "FAIL", "results": results}, ensure_ascii=False, indent=2))
        return 1
    results.append(pass_gate("model_exists", {"model": MODEL}))

    direct_chat = []
    try:
        started = time.perf_counter()
        response = request_json(
            OLLAMA_BASE_URL,
            "/api/chat",
            {"model": MODEL, "messages": [{"role": "user", "content": TEST_MESSAGES[0]}], "stream": False},
        )
        elapsed = time.perf_counter() - started
        direct_chat.append(
            {
                "message": TEST_MESSAGES[0],
                "seconds": round(elapsed, 2),
                "response": response.get("message", {}).get("content", ""),
                "resources": snapshot_resources(),
            }
        )
        results.append(pass_gate("model_load", {"seconds": round(elapsed, 2)}))
    except Exception as exc:
        results.append(fail_gate("model_load", exc))
        print(json.dumps({"status": "FAIL", "results": results}, ensure_ascii=False, indent=2))
        return 1

    try:
        health = request_json(BACKEND_BASE_URL, "/health", timeout=10)
        if health.get("status") not in {"ok", "degraded"}:
            raise RuntimeError(f"Unexpected health response: {health}")
        results.append(pass_gate("backend_health", health))
    except Exception as exc:
        results.append(fail_gate("backend_health", exc))
        print(json.dumps({"status": "FAIL", "results": results, "direct_chat": direct_chat}, ensure_ascii=False, indent=2))
        return 1

    backend_chat = []
    try:
        for message in TEST_MESSAGES:
            before = snapshot_resources()
            started = time.perf_counter()
            response = request_json(BACKEND_BASE_URL, "/api/chat", {"message": message, "history": []})
            elapsed = time.perf_counter() - started
            if not response.get("answer"):
                raise RuntimeError(f"Empty answer for message: {message}")
            backend_chat.append(
                {
                    "message": message,
                    "seconds": round(elapsed, 2),
                    "provider": response.get("provider"),
                    "model": response.get("model"),
                    "response": response.get("answer"),
                    "resources_before": before,
                    "resources_after": snapshot_resources(),
                }
            )
        results.append(pass_gate("backend_chat", {"requests": len(backend_chat)}))
    except Exception as exc:
        results.append(fail_gate("backend_chat", exc))
        print(json.dumps({"status": "FAIL", "results": results, "direct_chat": direct_chat, "backend_chat": backend_chat}, ensure_ascii=False, indent=2))
        return 1

    timings = [item["seconds"] for item in backend_chat]
    print(
        json.dumps(
            {
                "status": "PASS",
                "model": MODEL,
                "ollama_base_url": OLLAMA_BASE_URL,
                "backend_base_url": BACKEND_BASE_URL,
                "results": results,
                "performance": {
                    "first_response_seconds": backend_chat[0]["seconds"],
                    "average_response_seconds": round(sum(timings) / len(timings), 2),
                },
                "direct_chat": direct_chat,
                "backend_chat": backend_chat,
            },
            ensure_ascii=False,
            indent=2,
        )
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
