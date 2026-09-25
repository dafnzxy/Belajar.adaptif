"""
vault_rag.py — Retrieval dari vault Obsidian
================================================
Membaca file .md dan .pdf di vault Obsidian kamu, memecahnya jadi potongan
kecil (chunk), meng-embed tiap chunk (pakai model embedding lokal via Ollama),
lalu menyimpannya jadi index sederhana di file JSON.

Saat generate soal, sistem cari 3 chunk paling relevan dengan mapel/topik yang
lagi dipelajari, lalu diselipkan ke system prompt sebagai "referensi dari
catatan pribadi kamu" — jadi soal yang dibuat AI benar-benar berdasarkan
materi yang sudah kamu catat, bukan generik dari internet.

CATATAN PENTING:
- Jalankan `python vault_rag.py --ingest --vault "/path/ke/vault/kamu"` SEKALI
  di awal, dan ulangi tiap kali ada catatan baru yang mau dimasukkan.
- Vault-nya harus ada di komputer yang sama dengan backend FastAPI (karena
  ini baca file lokal langsung, bukan lewat cloud).
- Untuk vault besar (ratusan file), proses ingest bisa makan waktu karena
  tiap chunk perlu di-embed satu per satu.

Install dependency tambahan:
    pip install pypdf requests --break-system-packages
"""

import argparse
import json
import math
import os
import re
from pathlib import Path

import requests
from pypdf import PdfReader

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")
OLLAMA_EMBED_MODEL = os.environ.get("OLLAMA_EMBED_MODEL", "nomic-embed-text")
INDEX_PATH = os.environ.get("VAULT_INDEX_PATH", "vault_index.json")

CHUNK_SIZE = 800       # karakter per chunk
CHUNK_OVERLAP = 150    # overlap antar chunk supaya konteks tidak terpotong


# ---------------------------------------------------------------------------
# 1. Ekstraksi teks dari file
# ---------------------------------------------------------------------------

def extract_text_from_md(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def extract_text_from_pdf(path: Path) -> str:
    try:
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    except Exception as exc:
        print(f"  [!] Gagal baca PDF {path.name}: {exc}")
        return ""


def chunk_text(text: str, size: int = CHUNK_SIZE, overlap: int = CHUNK_OVERLAP) -> list[str]:
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    chunks = []
    start = 0
    while start < len(text):
        end = start + size
        chunks.append(text[start:end])
        start = end - overlap
    return [c.strip() for c in chunks if len(c.strip()) > 40]


def guess_mapel_from_path(path: Path) -> str:
    """
    Tebak mapel dari nama folder/file. Sesuaikan mapping ini dengan struktur
    vault kamu sendiri, atau ganti dengan tag Obsidian kalau mau lebih akurat.
    """
    name = str(path).lower()
    mapping = {
        "kalkulus": "Matematika", "matematika": "Matematika", "aljabar": "Matematika",
        "fisika": "Fisika", "kimia": "Kimia", "biologi": "Biologi",
        "bahasa indonesia": "Bahasa Indonesia", "b.indo": "Bahasa Indonesia",
        "english": "Bahasa Inggris", "bahasa inggris": "Bahasa Inggris",
        "ekonomi": "Ekonomi", "sejarah": "Sejarah",
    }
    for key, mapel in mapping.items():
        if key in name:
            return mapel
    return "Umum"


# ---------------------------------------------------------------------------
# 2. Embedding via Ollama
# ---------------------------------------------------------------------------

def embed_text(text: str) -> list[float]:
    resp = requests.post(
        f"{OLLAMA_BASE_URL}/api/embeddings",
        json={"model": OLLAMA_EMBED_MODEL, "prompt": text},
        timeout=60,
    )
    resp.raise_for_status()
    return resp.json()["embedding"]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


# ---------------------------------------------------------------------------
# 3. Ingest vault -> index
# ---------------------------------------------------------------------------

def ingest_vault(vault_path: str, index_path: str = INDEX_PATH) -> None:
    vault = Path(vault_path)
    if not vault.exists():
        raise FileNotFoundError(f"Vault tidak ditemukan: {vault_path}")

    files = list(vault.rglob("*.md")) + list(vault.rglob("*.pdf"))
    print(f"Ditemukan {len(files)} file (.md + .pdf) di vault.")

    index = []
    for i, path in enumerate(files, 1):
        print(f"[{i}/{len(files)}] Memproses: {path.name}")
        text = extract_text_from_md(path) if path.suffix == ".md" else extract_text_from_pdf(path)
        if not text.strip():
            continue
        mapel = guess_mapel_from_path(path)
        for chunk in chunk_text(text):
            try:
                vector = embed_text(chunk)
            except requests.exceptions.ConnectionError:
                print(
                    f"  [!] Tidak bisa konek ke Ollama embedding di {OLLAMA_BASE_URL}. "
                    f"Pastikan `ollama pull {OLLAMA_EMBED_MODEL}` sudah dijalankan."
                )
                return
            index.append({
                "source": path.name,
                "mapel": mapel,
                "text": chunk,
                "embedding": vector,
            })

    with open(index_path, "w", encoding="utf-8") as f:
        json.dump(index, f)
    print(f"Selesai. {len(index)} chunk tersimpan di {index_path}")


# ---------------------------------------------------------------------------
# 4. Retrieval saat generate soal
# ---------------------------------------------------------------------------

_cached_index: list[dict] | None = None


def _load_index(index_path: str = INDEX_PATH) -> list[dict]:
    global _cached_index
    if _cached_index is None:
        if not os.path.exists(index_path):
            _cached_index = []
        else:
            with open(index_path, "r", encoding="utf-8") as f:
                _cached_index = json.load(f)
    return _cached_index


def retrieve_context(query: str, mapel: str | None = None, k: int = 3) -> list[str]:
    """
    Cari k chunk paling relevan dengan `query` (biasanya nama topik/mapel),
    difilter dulu berdasarkan mapel kalau ada match di index.
    Return list string kosong kalau index belum di-ingest / tidak ada Ollama.
    """
    index = _load_index()
    if not index:
        return []

    candidates = [c for c in index if mapel is None or c["mapel"] == mapel] or index

    try:
        query_vec = embed_text(query)
    except requests.exceptions.ConnectionError:
        return []  # Ollama embedding tidak jalan -> generate soal tetap lanjut tanpa RAG

    scored = [
        (cosine_similarity(query_vec, c["embedding"]), c["text"], c["source"])
        for c in candidates
    ]
    scored.sort(key=lambda x: x[0], reverse=True)
    return [f"(dari catatan: {source})\n{text}" for _, text, source in scored[:k]]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Index vault Obsidian untuk RAG")
    parser.add_argument("--ingest", action="store_true", help="Jalankan proses ingest")
    parser.add_argument("--vault", type=str, help="Path ke folder vault Obsidian kamu")
    args = parser.parse_args()

    if args.ingest:
        if not args.vault:
            raise SystemExit("Wajib isi --vault \"/path/ke/vault\"")
        ingest_vault(args.vault)
    else:
        print("Pakai: python vault_rag.py --ingest --vault \"/path/ke/vault/kamu\"")
