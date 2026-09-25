"""
test_llm_connection.py — Cek koneksi LLM secara langsung
=============================================================
Jalankan ini KAPAN SAJA kamu curiga ada masalah koneksi ke LLM (OpenRouter
atau Ollama), tanpa perlu bolak-balik lewat frontend/onboarding dulu.

Script ini akan:
  1. Cek provider yang aktif (dari .env)
  2. Kirim satu pesan tes sederhana
  3. Ukur berapa lama responnya
  4. Kasih diagnosis JELAS kalau gagal (bukan cuma traceback mentah)

CARA PAKAI:
    cd backend
    source .venv/bin/activate
    python test_llm_connection.py
"""

import os
import sys
import time

from dotenv import load_dotenv
load_dotenv()

from llm_provider import call_llm, LLM_PROVIDER, OLLAMA_BASE_URL, OLLAMA_CHAT_MODEL


def main():
    print("=" * 60)
    print("TES KONEKSI LLM")
    print("=" * 60)
    print(f"Provider aktif : {LLM_PROVIDER}")

    if LLM_PROVIDER == "openrouter":
        key = os.environ.get("OPENROUTER_API_KEY", "")
        if not key:
            print("\n[GAGAL] OPENROUTER_API_KEY kosong di .env")
            print("-> Buka backend/.env, isi baris OPENROUTER_API_KEY=")
            sys.exit(1)
        print(f"API key        : {key[:12]}...{key[-4:]} (tersamar demi keamanan)")
    elif LLM_PROVIDER == "ollama":
        print(f"Ollama URL     : {OLLAMA_BASE_URL}")
        print(f"Model chat     : {OLLAMA_CHAT_MODEL}")

    print("\nMengirim pesan tes...")
    start = time.time()
    try:
        result = call_llm(
            system_prompt="Kamu asisten tes. Balas HANYA dengan kata 'OK' tanpa embel-embel lain.",
            user_message="Tes koneksi.",
        )
        elapsed = time.time() - start
        print(f"\n[BERHASIL] Respons diterima dalam {elapsed:.2f} detik")
        print(f"Isi respons: {result.strip()[:200]}")
        print("\n✅ Koneksi LLM kamu sehat dan siap dipakai.")
    except Exception as exc:
        elapsed = time.time() - start
        print(f"\n[GAGAL] Setelah {elapsed:.2f} detik, error:")
        print(f"  {type(exc).__name__}: {exc}")
        print("\nDiagnosis kemungkinan penyebab:")
        if LLM_PROVIDER == "openrouter":
            print("  - API key salah/expired -> generate ulang di openrouter.ai/keys")
            print("  - Kena rate limit 429 -> tunggu beberapa menit, atau ganti model")
            print("  - Tidak ada koneksi internet")
        elif LLM_PROVIDER == "ollama":
            print("  - Ollama belum jalan -> buka aplikasi Ollama / jalankan `ollama serve`")
            print(f"  - Model belum di-pull -> jalankan `ollama pull {OLLAMA_CHAT_MODEL}`")
        sys.exit(1)


if __name__ == "__main__":
    main()
