import json
from typing import Any

import httpx

from .config import settings


def _enabled() -> bool:
    return bool(settings.upstash_redis_rest_url and settings.upstash_redis_rest_token)


def cache_enabled() -> bool:
    return _enabled()


async def get_cache(key: str) -> dict[str, Any] | None:
    if not _enabled():
        return None
    url = settings.upstash_redis_rest_url.rstrip("/")
    headers = {"Authorization": f"Bearer {settings.upstash_redis_rest_token}"}
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.post(url, headers=headers, json=["GET", key])
        response.raise_for_status()
        payload = response.json()

    value = payload.get("result")
    return json.loads(value) if value else None


async def set_cache(key: str, value: dict[str, Any], ttl_seconds: int = 2_592_000) -> None:
    if not _enabled():
        return

    url = settings.upstash_redis_rest_url.rstrip("/")
    headers = {"Authorization": f"Bearer {settings.upstash_redis_rest_token}"}
    body = ["SET", key, json.dumps(value), "EX", ttl_seconds]
    async with httpx.AsyncClient(timeout=8) as client:
        response = await client.post(url, headers=headers, json=body)
        response.raise_for_status()
