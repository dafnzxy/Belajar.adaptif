"""
auth.py — Autentikasi ringan tanpa dependency tambahan
========================================================
Sengaja tidak pakai library JWT/bcrypt eksternal — semua pakai modul
stdlib Python (hashlib, hmac, secrets) supaya tidak nambah beban install
untuk project personal/kelas kecil seperti ini. Cukup aman untuk skala
banyak siswa di satu sekolah/kelas, TAPI kalau nanti mau dipakai skala
besar/publik, pertimbangkan ganti ke library auth yang matang (misal
`python-jose` + bcrypt asli) dan taruh SECRET_KEY di env var yang kuat.

Skema token: JSON {user_id, role, exp} di-encode base64url, ditandatangani
HMAC-SHA256 pakai SECRET_KEY. Mirip struktur JWT tapi lebih sederhana.
"""

import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Header, HTTPException

_AUTH_ENV = os.environ.get("AUTH_SECRET_KEY")
if not _AUTH_ENV or _AUTH_ENV.strip() == "" or _AUTH_ENV == "ganti-ini-di-production-jangan-dipakai-asal":
    if os.environ.get("ENV", "development") == "production":
        raise RuntimeError("AUTH_SECRET_KEY wajib di-set di production — generate dengan: openssl rand -hex 32")
    _AUTH_ENV = "dev-only-jangan-dipakai-di-production-" + os.urandom(8).hex()
    print("[auth] WARNING: AUTH_SECRET_KEY pakai fallback DEV — jangan pakai di production!")
SECRET_KEY = _AUTH_ENV
TOKEN_TTL_DETIK = 60 * 60 * 24 * 7


# ---------------------------------------------------------------------------
# Hashing password — PBKDF2-HMAC-SHA256, 200rb iterasi (standar aman & cepat
# tanpa perlu compile native library seperti bcrypt)
# ---------------------------------------------------------------------------

def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    salt = salt or base64.b64encode(os.urandom(16)).decode()
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000)
    return base64.b64encode(dk).decode(), salt


def verify_password(password: str, hash_tersimpan: str, salt: str) -> bool:
    dk, _ = hash_password(password, salt)
    return hmac.compare_digest(dk, hash_tersimpan)


# ---------------------------------------------------------------------------
# Token — dibuat saat login, divalidasi di setiap request yang butuh auth
# ---------------------------------------------------------------------------

def _b64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b"=").decode()


def _b64url_decode(s: str) -> bytes:
    padding = "=" * (-len(s) % 4)
    return base64.urlsafe_b64decode(s + padding)


def buat_token(user_id: int, role: str) -> str:
    payload = {"user_id": user_id, "role": role, "exp": int(time.time()) + TOKEN_TTL_DETIK}
    payload_b64 = _b64url_encode(json.dumps(payload).encode())
    signature = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
    signature_b64 = _b64url_encode(signature)
    return f"{payload_b64}.{signature_b64}"


def verifikasi_token(token: str) -> dict:
    try:
        payload_b64, signature_b64 = token.split(".")
        expected_sig = hmac.new(SECRET_KEY.encode(), payload_b64.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_b64url_encode(expected_sig), signature_b64):
            raise ValueError("Signature tidak cocok")
        payload = json.loads(_b64url_decode(payload_b64))
        if payload["exp"] < time.time():
            raise ValueError("Token sudah expired")
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Sesi login tidak valid atau sudah kadaluarsa, silakan login ulang")


# ---------------------------------------------------------------------------
# Dependency FastAPI — dipasang di endpoint yang butuh login
# ---------------------------------------------------------------------------

def get_current_user_payload(authorization: str | None = Header(None)) -> dict:
    """Ambil & validasi token dari header 'Authorization: Bearer <token>'."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Silakan login terlebih dahulu")
    token = authorization.removeprefix("Bearer ").strip()
    return verifikasi_token(token)


def require_admin_payload(authorization: str | None = Header(None)) -> dict:
    payload = get_current_user_payload(authorization)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Halaman ini hanya untuk admin")
    return payload
