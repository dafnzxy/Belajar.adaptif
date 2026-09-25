"""
bulk_sync.py — Import SEMUA catatan vault sekaligus (sekali jalan)
=======================================================================
Beda dengan obsidian_watcher.py (yang terus jalan di background dan sync
tiap ada perubahan), script ini jalan SEKALI, langsung loop ke semua file
.md dan .pdf yang ADA SEKARANG di vault kamu, dan kirim semuanya ke website.

Pakai ini kalau kamu mau semua catatan yang sudah ada langsung masuk ke
materi bank, tanpa perlu buka & save ulang satu-satu di Obsidian.

Setelah ini selesai, kamu tetap bisa jalankan obsidian_watcher.py seperti
biasa untuk sync otomatis ke depannya (catatan baru / yang diedit lagi).

CARA PAKAI:
    export BELAJAR_API_URL="http://localhost:8000"
    export SYNC_SECRET="password-yang-sama-dengan-di-.env"
    export VAULT_PATH="/path/ke/vault/obsidian/kamu"
    python bulk_sync.py
"""

import os
import time
from pathlib import Path

# reuse semua fungsi yang sudah ada di obsidian_watcher.py — tidak duplikasi logic
from obsidian_watcher import (
    BELAJAR_API_URL, SYNC_SECRET, VAULT_PATH,
    guess_mapel, extract_text, sync_file,
)


def main():
    if not VAULT_PATH:
        raise SystemExit("Wajib set env var VAULT_PATH ke folder vault Obsidian kamu")

    vault = Path(VAULT_PATH)
    if not vault.exists():
        raise SystemExit(f"Vault tidak ditemukan: {VAULT_PATH}")

    files = list(vault.rglob("*.md")) + list(vault.rglob("*.pdf"))
    print(f"Ditemukan {len(files)} file (.md + .pdf) di vault.")
    print(f"Target website: {BELAJAR_API_URL}\n")

    if not files:
        print("Tidak ada file untuk di-sync.")
        return

    confirm = input(f"Lanjut sync {len(files)} file sekarang? (y/n): ").strip().lower()
    if confirm != "y":
        print("Dibatalkan.")
        return

    berhasil, gagal = 0, 0
    for i, path in enumerate(files, 1):
        print(f"[{i}/{len(files)}] {path.name}")
        try:
            sync_file(path)
            berhasil += 1
        except Exception as exc:
            print(f"  [GAGAL] {exc}")
            gagal += 1
        time.sleep(1)  # jeda kecil antar request, sopan ke rate limit OpenRouter

    print(f"\nSelesai. Berhasil: {berhasil}, Gagal: {gagal}")
    print("Cek hasilnya di: " + BELAJAR_API_URL + "/api/materi")


if __name__ == "__main__":
    main()
