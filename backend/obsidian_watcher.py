"""
obsidian_watcher.py — Auto-sync vault Obsidian ke website BelajarAdaptif
===========================================================================
Jalankan script ini DI KOMPUTER TEMPAT VAULT OBSIDIAN KAMU ADA (bukan di
server website). Dia akan terus memantau folder vault, dan setiap kali ada
file .md atau .pdf yang dibuat/diubah, otomatis:
  1. Ekstrak teksnya
  2. Kirim ke endpoint /api/materi/sync-text di website kamu (yang online di
     Emergent atau dimanapun kamu deploy)
  3. Backend akan meringkasnya (dengan aturan ketat: tidak menambah info baru)
     dan menyimpan/update ke materi bank

CARA PAKAI:
  1. Install dependency:
       pip install watchdog requests pypdf --break-system-packages
  2. Set environment variable:
       export BELAJAR_API_URL="https://nama-project-kamu.emergentagent.com"
       export SYNC_SECRET="token-rahasia-yang-sama-dengan-di-backend"
       export VAULT_PATH="/path/ke/vault/obsidian/kamu"
  3. Jalankan:
       python obsidian_watcher.py
  4. Biarkan tetap jalan di background selama kamu belajar. Setiap Ctrl+S di
     Obsidian akan otomatis ter-sync (ada jeda debounce beberapa detik supaya
     tidak spam request tiap ketikan).

TIPS supaya jalan terus tanpa kamu buka terminal manual:
  - Windows: bikin Task Scheduler yang jalankan script ini saat startup
  - Mac: bikin LaunchAgent, atau jalankan lewat `nohup python obsidian_watcher.py &`
  - Linux: bikin systemd service, atau screen/tmux session
"""

import os
import time
from pathlib import Path

import requests
from pypdf import PdfReader
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

BELAJAR_API_URL = os.environ.get("BELAJAR_API_URL", "http://localhost:8000")
SYNC_SECRET = os.environ.get("SYNC_SECRET", "")
VAULT_PATH = os.environ.get("VAULT_PATH")

DEBOUNCE_SECONDS = 3  # tunggu sebentar setelah file berubah sebelum kirim
                       # (biar tidak kirim berkali-kali saat masih ngetik)

# Kalau True (default): catatan yang tidak terdeteksi sebagai mapel sekolah
# manapun (jadi "Umum") akan DILEWATI, tidak ikut ke materi bank. Ini penting
# kalau vault kamu isinya campur (catatan kerja, buku non-akademik, dll),
# supaya materi bank tetap bersih cuma berisi materi pelajaran.
# Set SKIP_UMUM=false kalau kamu justru mau semuanya ikut masuk.
SKIP_UMUM = os.environ.get("SKIP_UMUM", "true").lower() != "false"

MAPEL_KEYWORDS = {
    "kalkulus": "Matematika", "matematika": "Matematika", "aljabar": "Matematika",
    "fisika": "Fisika", "kimia": "Kimia", "biologi": "Biologi",
    "bahasa indonesia": "Bahasa Indonesia", "b.indo": "Bahasa Indonesia",
    "english": "Bahasa Inggris", "bahasa inggris": "Bahasa Inggris",
    "ekonomi": "Ekonomi", "sejarah": "Sejarah", "utbk": "Matematika", "snbt": "Bahasa Indonesia",
}


def guess_mapel(path: Path, text: str = "") -> str:
    """
    Sesuaikan mapping ini kalau struktur folder vault kamu beda.
    Cek dua sumber: (1) nama file/folder, (2) isi konten (misal header
    "Kalkulus 1 (SCMA601002)" yang muncul di dalam PDF walau nama filenya
    generik seperti "bab0_pendahuluan_01.pdf").
    """
    combined = (str(path) + " " + text[:1500]).lower()
    for key, mapel in MAPEL_KEYWORDS.items():
        if key in combined:
            return mapel
    return "Umum"


def extract_text(path: Path) -> str:
    if path.suffix == ".md":
        return path.read_text(encoding="utf-8", errors="ignore")
    elif path.suffix == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return ""


def sync_file(path: Path) -> None:
    if not path.exists():
        return  # file sempat dihapus lagi sebelum sempat diproses

    text = extract_text(path)
    if not text.strip():
        print(f"  [skip] {path.name} — tidak ada teks yang bisa diekstrak")
        return

    mapel = guess_mapel(path, text=text)
    if mapel == "Umum" and SKIP_UMUM:
        print(f"  [skip] {path.name} — tidak terdeteksi sebagai mapel sekolah (mapel='Umum'), dilewati")
        return

    print(f"  -> Sync '{path.name}' sebagai mapel '{mapel}' ({len(text)} karakter)...")

    try:
        resp = requests.post(
            f"{BELAJAR_API_URL}/api/materi/sync-text",
            headers={"X-Sync-Token": SYNC_SECRET},
            json={
                "judul": path.name,
                "mapel": mapel,
                "konten": text,
                "topik": path.stem,
            },
            timeout=120,  # ringkas materi panjang bisa makan waktu
        )
        if resp.status_code == 200:
            print(f"  [OK] {path.name} berhasil di-sync & diringkas")
        else:
            print(f"  [GAGAL] {path.name}: {resp.status_code} {resp.text[:200]}")
    except requests.exceptions.ConnectionError:
        print(f"  [GAGAL] Tidak bisa konek ke {BELAJAR_API_URL} — apakah website-nya online?")


class VaultChangeHandler(FileSystemEventHandler):
    def __init__(self):
        self._pending: dict[str, float] = {}

    def _schedule(self, path_str: str):
        if not (path_str.endswith(".md") or path_str.endswith(".pdf")):
            return
        self._pending[path_str] = time.time()

    def on_created(self, event):
        if not event.is_directory:
            self._schedule(event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._schedule(event.src_path)

    def process_pending(self):
        now = time.time()
        ready = [p for p, t in self._pending.items() if now - t >= DEBOUNCE_SECONDS]
        for path_str in ready:
            del self._pending[path_str]
            sync_file(Path(path_str))


def main():
    if not VAULT_PATH:
        raise SystemExit("Wajib set env var VAULT_PATH ke folder vault Obsidian kamu")
    if not SYNC_SECRET:
        print("[!] SYNC_SECRET belum di-set — hanya aman kalau backend kamu juga tanpa proteksi token.")

    print(f"Memantau vault: {VAULT_PATH}")
    print(f"Sync ke: {BELAJAR_API_URL}")
    print("Tekan Ctrl+C untuk berhenti.\n")

    handler = VaultChangeHandler()
    observer = Observer()
    observer.schedule(handler, VAULT_PATH, recursive=True)
    observer.start()

    try:
        while True:
            time.sleep(1)
            handler.process_pending()
    except KeyboardInterrupt:
        observer.stop()
    observer.join()


if __name__ == "__main__":
    main()
