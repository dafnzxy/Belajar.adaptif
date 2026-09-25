import hashlib
import os
import time
import requests
from fastapi import HTTPException

IMAGE_GEN_ENABLED = os.environ.get("IMAGE_GEN_ENABLED", "true").lower() not in ("false", "0", "no")
IMAGE_TIMEOUT = int(os.environ.get("IMAGE_GEN_TIMEOUT_SECONDS", "12"))
BANNED_SUBSTRINGS = ["telanjang", "nude", "explicit", "porn", "seks", "kekerasan ekstrem", "gore"]
REAL_PERSON_HINTS = ["foto ", "wajah ", "orang bernama", "selebriti", "celebrity"]


def _content_filter(image_prompt: str) -> None:
    low = image_prompt.lower()
    for w in BANNED_SUBSTRINGS:
        if w in low:
            raise HTTPException(status_code=400, detail="Prompt gambar mengandung kata tidak pantas")
    for h in REAL_PERSON_HINTS:
        if h in low:
            raise HTTPException(status_code=400, detail="Prompt gambar tidak boleh menyebut nama orang nyata")


def _hash_prompt(prompt: str) -> str:
    return hashlib.sha256(prompt.encode()).hexdigest()[:16]


def _call_huggingface(prompt: str, api_key: str) -> bytes:
    headers = {"Authorization": f"Bearer {api_key}"}
    resp = requests.post(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        headers=headers,
        json={"inputs": prompt},
        timeout=IMAGE_TIMEOUT,
    )
    resp.raise_for_status()
    ctype = resp.headers.get("content-type", "")
    if "image" not in ctype and "octet" not in ctype:
        try:
            body = resp.json()
            if "error" in body:
                raise HTTPException(status_code=502, detail=f"HuggingFace: {body['error']}")
        except Exception:
            pass
        raise HTTPException(status_code=502, detail="HuggingFace tidak mengembalikan gambar")
    return resp.content


def _call_pollinations(prompt: str) -> bytes:
    import urllib.parse
    encoded = urllib.parse.quote(prompt[:300])
    url = f"https://image.pollinations.ai/p/{encoded}?width=512&height=512&nologo=true"
    resp = requests.get(url, timeout=IMAGE_TIMEOUT)
    resp.raise_for_status()
    if len(resp.content) < 5000:
        raise HTTPException(status_code=502, detail="Pollinations gagal")
    return resp.content


def generate_image_bytes(image_prompt: str) -> tuple[bytes, str]:
    if not IMAGE_GEN_ENABLED:
        raise HTTPException(status_code=503, detail="Fitur gambar dimatikan (IMAGE_GEN_ENABLED=false)")
    _content_filter(image_prompt)
    errors = []
    for key in [os.environ.get("HUGGINGFACE_API_KEY"), os.environ.get("HUGGINGFACE_API_KEY_2")]:
        if not key:
            continue
        try:
            data = _call_huggingface(image_prompt, key)
            return data, "huggingface"
        except HTTPException as e:
            errors.append(str(e.detail))
            continue
        except Exception as e:
            errors.append(str(e))
            continue
    try:
        data = _call_pollinations(image_prompt)
        return data, "pollinations"
    except Exception as e:
        errors.append(str(e))
    raise HTTPException(status_code=502, detail=f"Semua provider gambar gagal: {'; '.join(errors[:2])}")
