import os
import time
import requests
from fastapi import HTTPException

LLM_PROVIDER = os.environ.get("LLM_PROVIDER", "auto")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_CHAT_MODEL = os.environ.get("OLLAMA_CHAT_MODEL", "llama3.2")

CANDIDATE_OPENROUTER_MODELS = [
    "openai/gpt-4o-mini",
    "meta-llama/llama-3.1-8b-instruct:free",
    "qwen/qwen3-coder:free",
]
GROQ_MODEL = "llama-3.1-8b-instant"


def _call_ollama(system_prompt: str, user_message: str) -> str:
    try:
        resp = requests.post(
            f"{OLLAMA_BASE_URL}/api/chat",
            json={
                "model": OLLAMA_CHAT_MODEL,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.7},
            },
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()["message"]["content"]
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail=f"Tidak bisa konek ke Ollama di {OLLAMA_BASE_URL}.",
        )
    except requests.exceptions.Timeout:
        raise HTTPException(status_code=504, detail="Ollama terlalu lama merespons.")


def _get_openrouter_client(api_key: str):
    from openai import OpenAI
    import httpx
    try:
        return OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key)
    except TypeError as exc:
        if "proxies" in str(exc):
            http_client = httpx.Client()
            return OpenAI(base_url="https://openrouter.ai/api/v1", api_key=api_key, http_client=http_client)
        raise


def _call_openrouter_with_key(api_key: str, system_prompt: str, user_message: str, max_tokens: int = 1200) -> str:
    from openai import APIStatusError
    client = _get_openrouter_client(api_key)
    last_error = None
    for model in CANDIDATE_OPENROUTER_MODELS:
        for attempt in range(2):
            try:
                response = client.chat.completions.create(
                    model=model,
                    max_tokens=max_tokens,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                )
                return response.choices[0].message.content
            except APIStatusError as exc:
                last_error = exc
                if exc.status_code in (429, 500, 502, 503) and attempt == 0:
                    time.sleep(1)
                    continue
                break
            except Exception as e:
                last_error = e
                break
    raise HTTPException(status_code=502, detail=f"OpenRouter gagal: {last_error}")


def _get_groq_client(api_key: str):
    from openai import OpenAI
    import httpx
    try:
        return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key)
    except TypeError as exc:
        if "proxies" in str(exc):
            http_client = httpx.Client()
            return OpenAI(base_url="https://api.groq.com/openai/v1", api_key=api_key, http_client=http_client)
        raise


def _call_groq_with_key(api_key: str, system_prompt: str, user_message: str, max_tokens: int = 1200) -> str:
    from openai import APIStatusError
    client = _get_groq_client(api_key)
    last_error = None
    for attempt in range(2):
        try:
            response = client.chat.completions.create(
                model=GROQ_MODEL,
                max_tokens=max_tokens,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
            )
            return response.choices[0].message.content
        except APIStatusError as exc:
            last_error = exc
            if exc.status_code in (429, 500, 502, 503) and attempt == 0:
                time.sleep(1)
                continue
            break
        except Exception as e:
            last_error = e
            break
    raise HTTPException(status_code=502, detail=f"Groq gagal: {last_error}")


def _estimate_max_tokens(jumlah_soal: int | None = None) -> int:
    if jumlah_soal is None:
        return 1500
    return min(16000, max(2500, 900 + jumlah_soal * 420))


def _call_openrouter(system_prompt: str, user_message: str, max_tokens: int = 1500) -> str:
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY belum di-set")
    return _call_openrouter_with_key(api_key, system_prompt, user_message, max_tokens=max_tokens)


def _call_groq(system_prompt: str, user_message: str, max_tokens: int = 1500) -> str:
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="GROQ_API_KEY belum di-set")
    return _call_groq_with_key(api_key, system_prompt, user_message, max_tokens=max_tokens)


def _call_auto(system_prompt: str, user_message: str, max_tokens: int = 1500) -> str:
    errors = []
    for key in [os.environ.get("OPENROUTER_API_KEY"), os.environ.get("OPENROUTER_API_KEY_2"), os.environ.get("OPENROUTER_FALLBACK_API_KEY")]:
        if not key:
            continue
        try:
            return _call_openrouter_with_key(key, system_prompt, user_message, max_tokens=max_tokens)
        except HTTPException as e:
            errors.append(f"openrouter:{e.detail}")
            continue
    for key in [os.environ.get("GROQ_API_KEY"), os.environ.get("GROQ_API_KEY_2")]:
        if not key:
            continue
        try:
            return _call_groq_with_key(key, system_prompt, user_message, max_tokens=max_tokens)
        except HTTPException as e:
            errors.append(f"groq:{e.detail}")
            continue
    try:
        return _call_ollama(system_prompt, user_message)
    except HTTPException as e:
        errors.append(f"ollama:{e.detail}")
    raise HTTPException(status_code=503, detail=f"Semua penyedia AI sedang sibuk, coba lagi dalam beberapa menit. Detail: {'; '.join(errors[:2])}")


def call_llm(system_prompt: str, user_message: str, max_tokens: int = 1500) -> str:
    provider = os.environ.get("LLM_PROVIDER", "auto").lower()
    if provider == "auto":
        return _call_auto(system_prompt, user_message, max_tokens=max_tokens)
    if provider == "ollama":
        return _call_ollama(system_prompt, user_message)
    if provider == "openrouter":
        api_key = os.environ.get("OPENROUTER_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="OPENROUTER_API_KEY belum di-set")
        return _call_openrouter_with_key(api_key, system_prompt, user_message, max_tokens=max_tokens)
    if provider == "groq":
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise HTTPException(status_code=500, detail="GROQ_API_KEY belum di-set")
        return _call_groq_with_key(api_key, system_prompt, user_message, max_tokens=max_tokens)
    raise HTTPException(status_code=500, detail=f"LLM_PROVIDER tidak dikenal: {provider}")
