from typing import Sequence

import httpx

from app.config import Settings
from app.schemas import ChatMessage


class OllamaProvider:
    name = "ollama"

    def __init__(self, settings: Settings) -> None:
        self.base_url = settings.ollama_base_url.rstrip("/")
        self.model = settings.ollama_model
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

    async def health(self) -> bool:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                models = {item.get("name") for item in response.json().get("models", [])}
                return self.model in models
        except (httpx.HTTPError, ValueError):
            return False
