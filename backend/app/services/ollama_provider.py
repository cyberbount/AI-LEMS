from typing import Sequence

import httpx

from app.config import Settings
from app.schemas import ChatMessage


class OllamaProvider:
    name = "ollama"

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
        self.embedding_model = getattr(settings, "ollama_embedding_model", "bge-m3")
        self.timeout = settings.request_timeout_seconds
        self.num_predict = settings.ollama_num_predict

    async def chat(self, messages: Sequence[ChatMessage]) -> str:
        payload = {
            "model": self.model,
            "messages": [message.model_dump() for message in messages],
            "options": {"num_predict": self.num_predict},
            "stream": False,
        }
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.post(f"{self.base_url}/api/chat", json=payload)
            try:
                response.raise_for_status()
            except httpx.HTTPStatusError as exc:
                raise RuntimeError(f"Ollama HTTP {response.status_code}: {response.text}") from exc
        data = response.json()
        content = data.get("message", {}).get("content", "")
        if not content.strip():
            raise RuntimeError("Ollama returned an empty answer. Try a non-thinking/smaller model or increase num_predict.")
        return content

    async def embed(self, text: str, model: str | None = None) -> list[float]:
        target_model = model or self.embedding_model
        payload = {"model": target_model, "prompt": text}
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(f"{self.base_url}/api/embeddings", json=payload)
                if resp.status_code == 200:
                    return resp.json().get("embedding", [])
        except Exception:
            pass
        for fb_model in ("nomic-embed-text", "all-minilm"):
            if fb_model == target_model:
                continue
            try:
                async with httpx.AsyncClient(timeout=10.0) as client:
                    resp = await client.post(f"{self.base_url}/api/embeddings", json={"model": fb_model, "prompt": text})
                    if resp.status_code == 200:
                        return resp.json().get("embedding", [])
            except Exception:
                continue
        return []

    def embed_sync(self, text: str, model: str | None = None) -> list[float]:
        target_model = model or self.embedding_model
        payload = {"model": target_model, "prompt": text}
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(f"{self.base_url}/api/embeddings", json=payload)
                if resp.status_code == 200:
                    return resp.json().get("embedding", [])
        except Exception:
            pass
        for fb_model in ("nomic-embed-text", "all-minilm"):
            if fb_model == target_model:
                continue
            try:
                with httpx.Client(timeout=10.0) as client:
                    resp = client.post(f"{self.base_url}/api/embeddings", json={"model": fb_model, "prompt": text})
                    if resp.status_code == 200:
                        return resp.json().get("embedding", [])
            except Exception:
                continue
        return []

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                models = {item.get("name") for item in response.json().get("models", [])}
                return self.model in models
        except (httpx.HTTPError, ValueError):
            return False
