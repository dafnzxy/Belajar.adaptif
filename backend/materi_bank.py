"""
materi_bank.py — Perpustakaan materi belajar
================================================
Dua sumber materi yang disimpan di sini, dengan peran AI yang beda:

1. MATERI BAWAAN ("builtin")
   Materi kurikulum/UTBK-SNBT yang sudah disiapkan lebih dulu. AI memakai ini
   sebagai bahan untuk MEMBUAT SOAL (lihat generate_question di
   backend_reference.py) — sama seperti sebelumnya.

2. MATERI UPLOAD ("upload")
   PDF yang di-upload pengguna sendiri. AI di sini HANYA MERINGKAS — dilarang
   menambahkan fakta/informasi yang tidak ada di teks asli. Materi tetap milik
   pengguna; AI cuma bantu susun ulang & sesuaikan gaya bahasanya.

Data disimpan di SQLite lokal (`belajar.db`) — cukup untuk pemakaian personal.

Install dependency tambahan:
    pip install pypdf --break-system-packages
"""

import io
import json
import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

from pypdf import PdfReader

_BASE_DIR = Path(__file__).resolve().parent
DB_PATH = os.environ.get("DB_PATH") or str(_BASE_DIR / "belajar.db")


def _connect(db_path: str | None = None) -> sqlite3.Connection:
    p = db_path or DB_PATH
    conn = sqlite3.connect(p)
    try:
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA foreign_keys=ON;")
    except Exception:
        pass
    return conn

CHUNK_SIZE_FOR_SUMMARY = 8000  # karakter per chunk saat meringkas PDF panjang


# ---------------------------------------------------------------------------
# 1. Setup database
# ---------------------------------------------------------------------------

def _migrate_add_onboarding_columns(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    cols = [row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
    if "jenjang" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN jenjang TEXT")
    if "kelas" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN kelas INTEGER")
    if "learning_style" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN learning_style TEXT")
    if "tone" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN tone TEXT")
    if "onboarding_selesai" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN onboarding_selesai INTEGER DEFAULT 0")
    if "updated_at" not in cols:
        conn.execute("ALTER TABLE users ADD COLUMN updated_at TEXT")
    conn.commit()
    conn.close()


def _migrate_user_isolation(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    for tbl, col in [("materi", "user_id"), ("catatan", "user_id"), ("jadwal_belajar", "user_id")]:
        try:
            cols = [r[1] for r in conn.execute(f"PRAGMA table_info({tbl})").fetchall()]
            if col not in cols:
                conn.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} INTEGER")
        except Exception:
            pass
    conn.commit()
    conn.close()


def init_db(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS materi (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_type TEXT NOT NULL,
            jenjang TEXT,
            mapel TEXT NOT NULL,
            topik TEXT,
            judul TEXT NOT NULL,
            konten_asli TEXT,
            ringkasan TEXT,
            lanjutan_ai TEXT,
            user_id INTEGER,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    _migrate_add_lanjutan_ai_column(db_path)
    _migrate_add_buku_columns(db_path)
    _migrate_user_isolation(db_path)
    _seed_builtin_materi(db_path)
    init_catatan_table(db_path)
    init_jadwal_table(db_path)
    init_users_table(db_path)
    _migrate_add_onboarding_columns(db_path)
    init_sessions_table(db_path)
    init_streak_skor_table(db_path)
    init_akurasi_table(db_path)


def _migrate_add_lanjutan_ai_column(db_path: str) -> None:
    """Kalau database lama (sebelum kolom ini ada) tetap kompatibel."""
    conn = _connect(db_path)
    cols = [row[1] for row in conn.execute("PRAGMA table_info(materi)").fetchall()]
    if "lanjutan_ai" not in cols:
        conn.execute("ALTER TABLE materi ADD COLUMN lanjutan_ai TEXT")
        conn.commit()
    conn.close()


def _migrate_add_buku_columns(db_path: str) -> None:
    """
    Tambah kolom yang dipakai fitur 'Materi Tersedia jadi buku digital' +
    graph view di Control Panel: kelas (biar granular per kelas, bukan cuma
    jenjang), bab & urutan (posisi materi di dalam buku), terhubung_ke
    (JSON list id materi lain — edge graph di Control Panel).
    """
    conn = _connect(db_path)
    cols = [row[1] for row in conn.execute("PRAGMA table_info(materi)").fetchall()]
    if "kelas" not in cols:
        conn.execute("ALTER TABLE materi ADD COLUMN kelas INTEGER")
    if "bab" not in cols:
        conn.execute("ALTER TABLE materi ADD COLUMN bab INTEGER")
    if "urutan" not in cols:
        conn.execute("ALTER TABLE materi ADD COLUMN urutan INTEGER")
    if "terhubung_ke" not in cols:
        conn.execute("ALTER TABLE materi ADD COLUMN terhubung_ke TEXT")  # JSON: "[2, 5, 9]"
    conn.commit()
    conn.close()
    _migrate_builtin_unique_index(db_path)
    _migrate_strip_em_dash_judul(db_path)
    init_bingkai_tables(db_path)


def _migrate_builtin_unique_index(db_path: str) -> None:
    conn = _connect(db_path)
    idx = conn.execute(
        "SELECT name FROM sqlite_master WHERE type='index' AND name='uq_materi_builtin_bab'"
    ).fetchone()
    if not idx:
        try:
            conn.execute(
                "CREATE UNIQUE INDEX uq_materi_builtin_bab ON materi(jenjang, kelas, mapel, bab) WHERE source_type='builtin'"
            )
            conn.commit()
        except Exception:
            pass
    conn.close()


def _migrate_strip_em_dash_judul(db_path: str) -> None:
    conn = _connect(db_path)
    try:
        conn.execute("UPDATE materi SET judul = REPLACE(judul, '—', '-') WHERE judul LIKE '%—%'")
        conn.execute("UPDATE materi SET topik = REPLACE(topik, '—', '-') WHERE topik LIKE '%—%'")
        conn.commit()
    except Exception:
        pass
    conn.close()


def _seed_builtin_materi(db_path: str) -> None:
    """
    Contoh materi bawaan UTBK/SNBT & mapel sekolah. Ini cuma starter —
    tambahkan sendiri sebanyak yang kamu perlu lewat add_materi(), atau
    lewat endpoint admin yang bisa kamu buat nanti.
    """
    conn = _connect(db_path)
    count = conn.execute(
        "SELECT COUNT(*) FROM materi WHERE source_type = 'builtin'"
    ).fetchone()[0]
    conn.close()
    if count > 0:
        return  # sudah pernah di-seed, jangan dobel

    contoh_materi = [
        {
            "jenjang": "sma", "mapel": "Matematika", "topik": "Penalaran Kuantitatif UTBK",
            "judul": "Dasar Penalaran Kuantitatif UTBK",
            "konten_asli": (
                "Penalaran kuantitatif di UTBK menguji kemampuan berpikir logis dengan angka, "
                "tanpa banyak rumus rumit. Fokus pada: (1) perbandingan & rasio, "
                "(2) barisan & pola bilangan, (3) logika himpunan, (4) estimasi & pembulatan. "
                "Kunci utama: baca soal pelan-pelan, jangan buru-buru hitung sebelum paham "
                "apa yang ditanya."
            ),
            "ringkasan": None,
        },
        {
            "jenjang": "sma", "mapel": "Bahasa Indonesia", "topik": "Penalaran Umum SNBT",
            "judul": "Struktur Soal Penalaran Umum SNBT",
            "konten_asli": (
                "Penalaran Umum menguji kemampuan menarik simpulan logis dari suatu pernyataan. "
                "Jenis soal umum: silogisme (premis 1, premis 2, simpulan), analisis pernyataan "
                "sebab-akibat, dan menilai kekuatan suatu argumen. Strategi: identifikasi dulu "
                "premis-premisnya secara terpisah sebelum menarik simpulan."
            ),
            "ringkasan": None,
        },
    ]

    conn = _connect(db_path)
    for m in contoh_materi:
        conn.execute(
            """INSERT INTO materi (source_type, jenjang, mapel, topik, judul, konten_asli, ringkasan, created_at)
               VALUES ('builtin', ?, ?, ?, ?, ?, ?, ?)""",
            (m["jenjang"], m["mapel"], m["topik"], m["judul"], m["konten_asli"], m["ringkasan"],
             datetime.now(timezone.utc).isoformat()),
        )
    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# 2. Ekstraksi PDF
# ---------------------------------------------------------------------------

def extract_text_from_pdf_bytes(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    return "\n".join(page.extract_text() or "" for page in reader.pages)


def _chunk(text: str, size: int = CHUNK_SIZE_FOR_SUMMARY) -> list[str]:
    return [text[i:i + size] for i in range(0, len(text), size)] or [text]


# ---------------------------------------------------------------------------
# 3. Ringkas materi (STRICT — tidak boleh menambah info baru)
# ---------------------------------------------------------------------------

def build_summary_prompt(style_label: str, tone_desc: str) -> str:
    """
    Prompt ini SENGAJA dibuat ketat: AI dilarang keras menambahkan fakta di
    luar teks yang diberikan. Ini yang membedakan fitur ini dari generate
    soal — di sini materi tetap 100% milik pengguna.
    """
    return f"""Kamu adalah asisten peringkas materi belajar.

ATURAN KETAT — WAJIB DIPATUHI:
- HANYA gunakan informasi yang ADA di teks yang diberikan. DILARANG menambahkan
  fakta, contoh, angka, atau penjelasan yang tidak berasal dari teks asli.
- Kalau ada bagian yang tidak jelas/terpotong (misal karena ekstraksi PDF
  kurang sempurna), JANGAN ditebak-tebak isinya — cukup lewati bagian itu.
- Tugasmu murni MERINGKAS & MERAPIKAN STRUKTUR, bukan mengajar dari
  pengetahuan umummu sendiri.

Sesuaikan gaya penyampaian ringkasan dengan:
- Gaya belajar pembaca: {style_label}
- Nada bahasa: {tone_desc}

Format output: ringkasan terstruktur dengan poin-poin utama, boleh pakai
sub-judul kalau materinya punya beberapa bagian berbeda."""


def summarize_material(raw_text: str, style_label: str, tone_desc: str, call_llm) -> str:
    """
    `call_llm` di-pass sebagai parameter (bukan di-import langsung) supaya
    modul ini tidak terikat ke satu provider tertentu — backend_reference.py
    yang menentukan provider mana yang dipakai (OpenRouter/Ollama/dst).

    Untuk teks panjang: ringkas per-chunk dulu (supaya tidak kepotong konteks),
    lalu gabungkan jadi satu ringkasan akhir yang koheren.
    """
    system_prompt = build_summary_prompt(style_label, tone_desc)
    chunks = _chunk(raw_text)

    if len(chunks) == 1:
        return call_llm(system_prompt, f"Ringkas materi berikut:\n\n{chunks[0]}")

    # Map: ringkas tiap chunk dulu
    partial_summaries = []
    for i, chunk in enumerate(chunks, 1):
        partial = call_llm(
            system_prompt,
            f"Ini bagian {i}/{len(chunks)} dari materi. Ringkas poin-poin utamanya:\n\n{chunk}",
        )
        partial_summaries.append(partial)

    # Reduce: gabungkan semua ringkasan parsial jadi satu yang koheren
    combined_input = "\n\n---\n\n".join(partial_summaries)
    final_prompt = (
        f"{system_prompt}\n\nTambahan: teks di bawah ini sudah berupa beberapa ringkasan "
        "parsial dari bagian-bagian berbeda materi yang sama. Gabungkan jadi SATU ringkasan "
        "akhir yang koheren, tanpa duplikasi antar bagian."
    )
    return call_llm(final_prompt, f"Gabungkan ringkasan-ringkasan berikut:\n\n{combined_input}")


# ---------------------------------------------------------------------------
# 3b. Mode "lengkapi otomatis" — BEDA ATURAN dari ringkas ketat di atas.
# AI BOLEH menambahkan lanjutan materi yang belum ada, tapi bagian buatan AI
# harus dipisah & dilabeli jelas supaya tidak tercampur dengan materi asli
# pengguna (soal kepercayaan & akurasi — AI bisa saja keliru).
# ---------------------------------------------------------------------------

def build_completion_prompt(style_label: str, tone_desc: str) -> str:
    return f"""Kamu adalah asisten belajar yang membantu melengkapi materi yang belum lengkap.

Pengguna akan memberi materi yang KEMUNGKINAN BESAR baru sebagian (misal cuma
Bab 1-3 dari buku yang seharusnya sampai Bab 10). Tugasmu:

1. Kenali dulu materi asli itu tentang apa & sampai bagian mana dia berhenti.
2. Ringkas materi asli itu (ikuti aturan ringkas biasa: setia ke isi teks).
3. SETELAH itu, lanjutkan materi tersebut dari titik terakhir sampai ke
   penutup yang wajar, menggunakan pengetahuanmu sendiri tentang topik itu.
   Ini BOLEH beda dari sumber asli pengguna (misalnya edisi buku lain),
   karena tujuannya membantu pengguna belajar topik itu secara utuh.

Sesuaikan gaya penyampaian dengan:
- Gaya belajar pembaca: {style_label}
- Nada bahasa: {tone_desc}

WAJIB balas HANYA dengan JSON valid, tanpa markdown code fence, struktur persis:
{{
  "ringkasan_materi_asli": "ringkasan bagian yang benar-benar dari materi pengguna",
  "lanjutan_ai": "lanjutan materi dari AI, ditulis lengkap seperti bab-bab buku",
  "catatan": "satu kalimat singkat pengingat bahwa bagian lanjutan dibuat AI dan sebaiknya diverifikasi ulang"
}}"""


def complete_and_summarize_material(raw_text: str, style_label: str, tone_desc: str, call_llm) -> dict:
    """
    Return dict: {ringkasan_materi_asli, lanjutan_ai, catatan}.
    Beda dari summarize_material(): di sini AI SENGAJA diminta menambah
    konten baru untuk melengkapi materi, bukan cuma meringkas apa adanya.
    """
    system_prompt = build_completion_prompt(style_label, tone_desc)
    # Materi asli mungkin panjang -> tetap kirim utuh kalau muat, potong kalau
    # ekstrem panjang supaya tidak melebihi konteks model.
    trimmed = raw_text if len(raw_text) <= 20000 else raw_text[:20000]
    raw_response = call_llm(system_prompt, f"Materi yang sudah ada:\n\n{trimmed}")

    cleaned = raw_response.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json\n"):
            cleaned = cleaned[5:]
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        # Fallback: kalau model tidak balas JSON valid, tetap kasih sesuatu
        # yang berguna daripada error total.
        return {
            "ringkasan_materi_asli": raw_response,
            "lanjutan_ai": "",
            "catatan": "AI tidak mengembalikan format terstruktur; tampilkan apa adanya.",
        }


# ---------------------------------------------------------------------------
# 4. CRUD materi
# ---------------------------------------------------------------------------

def upsert_materi(
    source_type: str, mapel: str, judul: str,
    konten_asli: str, ringkasan: str | None = None,
    jenjang: str | None = None, topik: str | None = None,
    user_id: int | None = None,
    db_path: str = DB_PATH,
) -> int:
    """
    Seperti add_materi(), tapi kalau materi dengan judul+mapel yang sama sudah
    ada, di-UPDATE bukan bikin baris baru. Dipakai oleh sync Obsidian supaya
    edit ulang satu catatan tidak numpuk jadi banyak entri.
    """
    conn = _connect(db_path)
    if user_id is not None:
        existing = conn.execute(
            "SELECT id FROM materi WHERE judul = ? AND mapel = ? AND source_type = ? AND COALESCE(user_id, -1) = COALESCE(?, -1)",
            (judul, mapel, source_type, user_id),
        ).fetchone()
    else:
        existing = conn.execute(
            "SELECT id FROM materi WHERE judul = ? AND mapel = ? AND source_type = ?",
            (judul, mapel, source_type),
        ).fetchone()

    now = datetime.now(timezone.utc).isoformat()
    if existing:
        materi_id = existing[0]
        conn.execute(
            """UPDATE materi SET konten_asli = ?, ringkasan = ?, jenjang = ?, topik = ?, user_id = COALESCE(?, user_id), created_at = ?
               WHERE id = ?""",
            (konten_asli, ringkasan, jenjang, topik, user_id, now, materi_id),
        )
    else:
        cur = conn.execute(
            """INSERT INTO materi (source_type, jenjang, mapel, topik, judul, konten_asli, ringkasan, user_id, created_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (source_type, jenjang, mapel, topik, judul, konten_asli, ringkasan, user_id, now),
        )
        materi_id = cur.lastrowid
    conn.commit()
    conn.close()
    return materi_id


def add_materi(
    source_type: str, mapel: str, judul: str,
    konten_asli: str, ringkasan: str | None = None,
    lanjutan_ai: str | None = None,
    jenjang: str | None = None, topik: str | None = None,
    kelas: int | None = None, bab: int | None = None, urutan: int | None = None,
    user_id: int | None = None,
    db_path: str = DB_PATH,
) -> int:
    conn = _connect(db_path)
    cur = conn.execute(
        """INSERT INTO materi (source_type, jenjang, kelas, mapel, topik, judul, konten_asli, ringkasan, lanjutan_ai, bab, urutan, user_id, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
        (source_type, jenjang, kelas, mapel, topik, judul, konten_asli, ringkasan, lanjutan_ai, bab, urutan, user_id,
         datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def delete_materi(materi_id: int, db_path: str = DB_PATH, user_id: int | None = None) -> bool:
    conn = _connect(db_path)
    if user_id is not None:
        cur = conn.execute(
            "DELETE FROM materi WHERE id = ? AND source_type = 'upload' AND user_id = ?", (materi_id, user_id)
        )
    else:
        cur = conn.execute(
            "DELETE FROM materi WHERE id = ? AND source_type = 'upload'", (materi_id,)
        )
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def delete_materi_admin(materi_id: int, db_path: str = DB_PATH) -> bool:
    """Hapus materi TANPA batasan source_type — dipakai Control Panel admin
    untuk hapus bab dari 'Materi Tersedia' (builtin). Endpoint yang memanggil
    ini WAJIB dilindungi require_admin."""
    conn = _connect(db_path)
    cur = conn.execute("DELETE FROM materi WHERE id = ?", (materi_id,))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def list_materi(mapel: str | None = None, source_type: str | None = None, user_id: int | None = None, db_path: str = DB_PATH) -> list[dict]:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row

    conditions = []
    params: list = []

    if mapel:
        conditions.append("mapel = ?")
        params.append(mapel)
    if source_type:
        conditions.append("source_type = ?")
        params.append(source_type)
    if user_id is not None:
        conditions.append("user_id = ?")
        params.append(user_id)

    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    rows = conn.execute(
        f"SELECT * FROM materi {where} ORDER BY created_at DESC", params
    ).fetchall()
    conn.close()
    return [_parse_materi_row(dict(r)) for r in rows]


def _parse_materi_row(row: dict) -> dict:
    """Ubah kolom terhubung_ke (JSON text) jadi list[int] Python."""
    raw = row.get("terhubung_ke")
    row["terhubung_ke"] = json.loads(raw) if raw else []
    return row


def update_materi(
    materi_id: int,
    judul: str | None = None, mapel: str | None = None, topik: str | None = None,
    jenjang: str | None = None, kelas: int | None = None,
    konten_asli: str | None = None, ringkasan: str | None = None,
    bab: int | None = None, urutan: int | None = None,
    db_path: str = DB_PATH,
) -> bool:
    """Update sebagian field materi (dipakai editor Control Panel). Field yang None tidak diubah."""
    existing = get_materi_by_id(materi_id, db_path)
    if not existing:
        return False
    fields = {
        "judul": judul, "mapel": mapel, "topik": topik, "jenjang": jenjang, "kelas": kelas,
        "konten_asli": konten_asli, "ringkasan": ringkasan, "bab": bab, "urutan": urutan,
    }
    updates = {k: v for k, v in fields.items() if v is not None}
    if not updates:
        return True
    set_clause = ", ".join(f"{k} = ?" for k in updates)
    conn = _connect(db_path)
    cur = conn.execute(f"UPDATE materi SET {set_clause} WHERE id = ?", (*updates.values(), materi_id))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def list_materi_buku(jenjang: str, kelas: int, mapel: str, db_path: str = DB_PATH) -> list[dict]:
    """Materi Tersedia dalam format 'buku': builtin materi untuk jenjang+kelas+mapel,
    diurutkan Bab lalu urutan-dalam-bab — supaya siswa baca dari Bab 1 sampai akhir."""
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        """SELECT * FROM materi WHERE source_type = 'builtin' AND jenjang = ? AND kelas = ? AND mapel = ?
           ORDER BY COALESCE(bab, 999), COALESCE(urutan, 999), created_at ASC""",
        (jenjang, kelas, mapel),
    ).fetchall()
    conn.close()
    return [_parse_materi_row(dict(r)) for r in rows]


def list_materi_graph(jenjang: str | None = None, kelas: int | None = None, mapel: str | None = None, db_path: str = DB_PATH) -> list[dict]:
    """Semua materi builtin buat ditampilkan sebagai graph di Control Panel, filter opsional."""
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    conditions = ["source_type = 'builtin'"]
    params: list = []
    if jenjang:
        conditions.append("jenjang = ?")
        params.append(jenjang)
    if kelas:
        conditions.append("kelas = ?")
        params.append(kelas)
    if mapel:
        conditions.append("mapel = ?")
        params.append(mapel)
    where = "WHERE " + " AND ".join(conditions)
    rows = conn.execute(
        f"SELECT * FROM materi {where} ORDER BY jenjang, kelas, mapel, COALESCE(bab,999), COALESCE(urutan,999)", params
    ).fetchall()
    conn.close()
    return [_parse_materi_row(dict(r)) for r in rows]


def hubungkan_materi(id_a: int, id_b: int, db_path: str = DB_PATH) -> bool:
    """Buat edge dua arah antara dua node materi di graph."""
    a = get_materi_by_id(id_a, db_path)
    b = get_materi_by_id(id_b, db_path)
    if not a or not b:
        return False
    edges_a = set(json.loads(a["terhubung_ke"]) if a["terhubung_ke"] else [])
    edges_b = set(json.loads(b["terhubung_ke"]) if b["terhubung_ke"] else [])
    edges_a.add(id_b)
    edges_b.add(id_a)
    conn = _connect(db_path)
    conn.execute("UPDATE materi SET terhubung_ke = ? WHERE id = ?", (json.dumps(sorted(edges_a)), id_a))
    conn.execute("UPDATE materi SET terhubung_ke = ? WHERE id = ?", (json.dumps(sorted(edges_b)), id_b))
    conn.commit()
    conn.close()
    return True


def putuskan_materi(id_a: int, id_b: int, db_path: str = DB_PATH) -> bool:
    """Hapus edge dua arah antara dua node materi di graph."""
    a = get_materi_by_id(id_a, db_path)
    b = get_materi_by_id(id_b, db_path)
    if not a or not b:
        return False
    edges_a = set(json.loads(a["terhubung_ke"]) if a["terhubung_ke"] else [])
    edges_b = set(json.loads(b["terhubung_ke"]) if b["terhubung_ke"] else [])
    edges_a.discard(id_b)
    edges_b.discard(id_a)
    conn = _connect(db_path)
    conn.execute("UPDATE materi SET terhubung_ke = ? WHERE id = ?", (json.dumps(sorted(edges_a)), id_a))
    conn.execute("UPDATE materi SET terhubung_ke = ? WHERE id = ?", (json.dumps(sorted(edges_b)), id_b))
    conn.commit()
    conn.close()
    return True



def get_materi_by_id(materi_id: int, db_path: str = DB_PATH) -> dict | None:
    """Ambil satu baris materi berdasarkan id — dipakai fitur Ujian untuk ambil sumber soal."""
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM materi WHERE id = ?", (materi_id,)).fetchone()
    conn.close()
    return _parse_materi_row(dict(row)) if row else None


def get_context_for_mapel(mapel: str, topik: str | None = None, limit: int = 3, db_path: str = DB_PATH, jenjang: str | None = None, kelas: int | None = None) -> list[str]:
    """
    Ambil beberapa materi (ringkasan-nya) untuk dijadikan konteks generate soal.
    Kalau jenjang+kelas dikirim, UTAMAKAN materi dari kelas itu (mencegah soal SD1
    kecampur materi SMP/SMA). Fallback ke mapel umum kalau kelas itu belum ada materi.
    """
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row

    def _query(where_extra: str = "", params_extra: tuple = ()):
        base = "SELECT * FROM materi WHERE mapel = ?"
        params: list = [mapel]
        if jenjang and kelas:
            base += " AND jenjang = ? AND kelas = ?"
            params.extend([jenjang, kelas])
        elif jenjang:
            base += " AND jenjang = ?"
            params.append(jenjang)
        if where_extra:
            base += f" AND {where_extra}"
            params.extend(list(params_extra))
        base += " ORDER BY COALESCE(bab,999), COALESCE(urutan,999), created_at DESC LIMIT ?"
        params.append(limit)
        return conn.execute(base, params).fetchall()

    rows: list = []
    if topik:
        rows = _query("topik LIKE ?", (f"%{topik}%",))
        if not rows:
            rows = _query()
    else:
        rows = _query()

    if not rows and (jenjang or kelas):
        if topik:
            rows = conn.execute(
                "SELECT * FROM materi WHERE mapel = ? AND topik LIKE ? ORDER BY created_at DESC LIMIT ?",
                (mapel, f"%{topik}%", limit),
            ).fetchall()
            if not rows:
                rows = conn.execute(
                    "SELECT * FROM materi WHERE mapel = ? ORDER BY created_at DESC LIMIT ?", (mapel, limit)
                ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM materi WHERE mapel = ? ORDER BY created_at DESC LIMIT ?", (mapel, limit)
            ).fetchall()

    conn.close()

    context = []
    for r in rows:
        text = r["ringkasan"] or r["konten_asli"]
        if text:
            label = r["judul"]
            if r["jenjang"] and r["kelas"]:
                label = f"{r['judul']} ({r['jenjang'].upper()} kls {r['kelas']})"
            context.append(f"(materi: {label})\n{text}")
    return context


# ---------------------------------------------------------------------------
# 5. Catatan Pribadi — CRUD
# ---------------------------------------------------------------------------

def init_catatan_table(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS catatan (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            judul TEXT NOT NULL,
            isi TEXT NOT NULL,
            mapel TEXT,
            topik TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    _migrate_user_isolation(db_path)


def add_catatan(
    judul: str,
    isi: str,
    mapel: str | None = None,
    topik: str | None = None,
    user_id: int | None = None,
    db_path: str = DB_PATH,
) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = _connect(db_path)
    cur = conn.execute(
        """INSERT INTO catatan (user_id, judul, isi, mapel, topik, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (user_id, judul, isi, mapel or None, topik or None, now, now),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def list_catatan(mapel: str | None = None, user_id: int | None = None, db_path: str = DB_PATH) -> list[dict]:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    conditions = []
    params: list = []
    if mapel:
        conditions.append("mapel = ?")
        params.append(mapel)
    if user_id is not None:
        conditions.append("user_id = ?")
        params.append(user_id)
    where = ("WHERE " + " AND ".join(conditions)) if conditions else ""
    rows = conn.execute(
        f"SELECT * FROM catatan {where} ORDER BY updated_at DESC", params
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_catatan_by_id(catatan_id: int, db_path: str = DB_PATH, user_id: int | None = None) -> dict | None:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    if user_id is not None:
        row = conn.execute("SELECT * FROM catatan WHERE id = ? AND user_id = ?", (catatan_id, user_id)).fetchone()
    else:
        row = conn.execute("SELECT * FROM catatan WHERE id = ?", (catatan_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_catatan(
    catatan_id: int,
    judul: str,
    isi: str,
    mapel: str | None = None,
    topik: str | None = None,
    user_id: int | None = None,
    db_path: str = DB_PATH,
) -> bool:
    now = datetime.now(timezone.utc).isoformat()
    conn = _connect(db_path)
    if user_id is not None:
        cur = conn.execute(
            """UPDATE catatan SET judul = ?, isi = ?, mapel = ?, topik = ?, updated_at = ?
               WHERE id = ? AND user_id = ?""",
            (judul, isi, mapel or None, topik or None, now, catatan_id, user_id),
        )
    else:
        cur = conn.execute(
            """UPDATE catatan SET judul = ?, isi = ?, mapel = ?, topik = ?, updated_at = ?
               WHERE id = ?""",
            (judul, isi, mapel or None, topik or None, now, catatan_id),
        )
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def delete_catatan(catatan_id: int, db_path: str = DB_PATH, user_id: int | None = None) -> bool:
    conn = _connect(db_path)
    if user_id is not None:
        cur = conn.execute("DELETE FROM catatan WHERE id = ? AND user_id = ?", (catatan_id, user_id))
    else:
        cur = conn.execute("DELETE FROM catatan WHERE id = ?", (catatan_id,))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


# ---------------------------------------------------------------------------
# 6. Jadwal Belajar (kalender mingguan) — CRUD
# ---------------------------------------------------------------------------
# Model rekuring mingguan (sengaja bukan tanggal spesifik): user set "tiap
# Senin jam 19:00-20:00 belajar Matematika" sekali, lalu itu jadi acuan
# notifikasi setiap minggu tanpa perlu diinput ulang.

HARI_VALID = ["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"]


def init_jadwal_table(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS jadwal_belajar (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            judul TEXT NOT NULL,
            mapel TEXT,
            hari TEXT NOT NULL,
            jam_mulai TEXT NOT NULL,
            jam_selesai TEXT NOT NULL,
            catatan TEXT,
            aktif INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()
    _migrate_user_isolation(db_path)


def add_jadwal(
    judul: str,
    hari: str,
    jam_mulai: str,
    jam_selesai: str,
    mapel: str | None = None,
    catatan: str | None = None,
    user_id: int | None = None,
    db_path: str = DB_PATH,
) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = _connect(db_path)
    cur = conn.execute(
        """INSERT INTO jadwal_belajar (user_id, judul, mapel, hari, jam_mulai, jam_selesai, catatan, aktif, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)""",
        (user_id, judul, mapel or None, hari, jam_mulai, jam_selesai, catatan or None, now),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def list_jadwal(user_id: int | None = None, db_path: str = DB_PATH) -> list[dict]:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    if user_id is not None:
        rows = conn.execute("SELECT * FROM jadwal_belajar WHERE user_id = ? ORDER BY jam_mulai ASC", (user_id,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM jadwal_belajar ORDER BY jam_mulai ASC").fetchall()
    conn.close()
    items = [dict(r) for r in rows]
    items.sort(key=lambda r: (HARI_VALID.index(r["hari"]) if r["hari"] in HARI_VALID else 99, r["jam_mulai"]))
    return items


def get_jadwal_by_id(jadwal_id: int, db_path: str = DB_PATH, user_id: int | None = None) -> dict | None:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    if user_id is not None:
        row = conn.execute("SELECT * FROM jadwal_belajar WHERE id = ? AND user_id = ?", (jadwal_id, user_id)).fetchone()
    else:
        row = conn.execute("SELECT * FROM jadwal_belajar WHERE id = ?", (jadwal_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_jadwal(
    jadwal_id: int,
    judul: str,
    hari: str,
    jam_mulai: str,
    jam_selesai: str,
    mapel: str | None = None,
    catatan: str | None = None,
    aktif: bool = True,
    user_id: int | None = None,
    db_path: str = DB_PATH,
) -> bool:
    conn = _connect(db_path)
    if user_id is not None:
        cur = conn.execute(
            """UPDATE jadwal_belajar SET judul = ?, mapel = ?, hari = ?, jam_mulai = ?,
               jam_selesai = ?, catatan = ?, aktif = ? WHERE id = ? AND user_id = ?""",
            (judul, mapel or None, hari, jam_mulai, jam_selesai, catatan or None, 1 if aktif else 0, jadwal_id, user_id),
        )
    else:
        cur = conn.execute(
            """UPDATE jadwal_belajar SET judul = ?, mapel = ?, hari = ?, jam_mulai = ?,
               jam_selesai = ?, catatan = ?, aktif = ? WHERE id = ?""",
            (judul, mapel or None, hari, jam_mulai, jam_selesai, catatan or None, 1 if aktif else 0, jadwal_id),
        )
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def toggle_jadwal_aktif(jadwal_id: int, db_path: str = DB_PATH, user_id: int | None = None) -> dict | None:
    row = get_jadwal_by_id(jadwal_id, db_path, user_id=user_id)
    if not row:
        return None
    conn = _connect(db_path)
    new_state = 0 if row["aktif"] else 1
    if user_id is not None:
        conn.execute("UPDATE jadwal_belajar SET aktif = ? WHERE id = ? AND user_id = ?", (new_state, jadwal_id, user_id))
    else:
        conn.execute("UPDATE jadwal_belajar SET aktif = ? WHERE id = ?", (new_state, jadwal_id))
    conn.commit()
    conn.close()
    return get_jadwal_by_id(jadwal_id, db_path, user_id=user_id)


def delete_jadwal(jadwal_id: int, db_path: str = DB_PATH, user_id: int | None = None) -> bool:
    conn = _connect(db_path)
    if user_id is not None:
        cur = conn.execute("DELETE FROM jadwal_belajar WHERE id = ? AND user_id = ?", (jadwal_id, user_id))
    else:
        cur = conn.execute("DELETE FROM jadwal_belajar WHERE id = ?", (jadwal_id,))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


# ---------------------------------------------------------------------------
# 7. Users & Auth
# ---------------------------------------------------------------------------

def init_users_table(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nama TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            foto_profil TEXT,        -- path relatif ke /uploads/avatars/xxx.jpg, atau NULL
            role TEXT NOT NULL DEFAULT 'siswa',  -- 'siswa' atau 'admin'
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def init_sessions_table(db_path: str = DB_PATH) -> None:
    """
    Bukan buat validasi token (token kita stateless via HMAC, lihat auth.py),
    tapi buat CATATAN LOGIN — ini yang dipakai Control Panel untuk memantau
    kapan tiap siswa terakhir login/aktif.
    """
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS login_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def buat_user(nama: str, email: str, password_hash: str, salt: str, role: str = "siswa", db_path: str = DB_PATH) -> int:
    now = datetime.now(timezone.utc).isoformat()
    conn = _connect(db_path)
    cur = conn.execute(
        """INSERT INTO users (nama, email, password_hash, salt, role, created_at)
           VALUES (?, ?, ?, ?, ?, ?)""",
        (nama, email.lower().strip(), password_hash, salt, role, now),
    )
    conn.commit()
    new_id = cur.lastrowid
    conn.close()
    return new_id


def admin_sudah_ada(db_path: str = DB_PATH) -> bool:
    conn = _connect(db_path)
    count = conn.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'").fetchone()[0]
    conn.close()
    return count > 0


def get_user_by_email(email: str, db_path: str = DB_PATH) -> dict | None:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email.lower().strip(),)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: int, db_path: str = DB_PATH) -> dict | None:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def update_profil_user(user_id: int, nama: str | None = None, foto_profil: str | None = None, db_path: str = DB_PATH) -> bool:
    """Field yang None tidak diubah — dipanggil terpisah buat ubah nama saja atau foto saja."""
    fields = {k: v for k, v in {"nama": nama, "foto_profil": foto_profil}.items() if v is not None}
    if not fields:
        return True
    set_clause = ", ".join(f"{k} = ?" for k in fields)
    conn = _connect(db_path)
    cur = conn.execute(f"UPDATE users SET {set_clause} WHERE id = ?", (*fields.values(), user_id))
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def simpan_onboarding(user_id: int, jenjang: str, kelas: int, learning_style: str, tone: str, db_path: str = DB_PATH) -> bool:
    conn = _connect(db_path)
    cur = conn.execute(
        "UPDATE users SET jenjang=?, kelas=?, learning_style=?, tone=?, onboarding_selesai=1, updated_at=? WHERE id=?",
        (jenjang, kelas, learning_style, tone, datetime.now(timezone.utc).isoformat(), user_id),
    )
    conn.commit()
    affected = cur.rowcount
    conn.close()
    return affected > 0


def get_onboarding(user_id: int, db_path: str = DB_PATH) -> dict | None:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT jenjang, kelas, learning_style, tone, onboarding_selesai, updated_at FROM users WHERE id=?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def catat_login(user_id: int, db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute(
        "INSERT INTO login_log (user_id, login_at) VALUES (?, ?)",
        (user_id, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def list_siswa_dengan_aktivitas(db_path: str = DB_PATH) -> list[dict]:
    """Dipakai Control Panel — daftar semua siswa + login terakhir + streak + total poin."""
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    users = conn.execute("SELECT * FROM users WHERE role = 'siswa' ORDER BY created_at DESC").fetchall()
    hasil = []
    for u in users:
        u = dict(u)
        login_terakhir = conn.execute(
            "SELECT login_at FROM login_log WHERE user_id = ? ORDER BY login_at DESC LIMIT 1", (u["id"],)
        ).fetchone()
        total_poin = conn.execute(
            "SELECT COALESCE(SUM(poin), 0) FROM skor_log WHERE user_id = ?", (u["id"],)
        ).fetchone()[0]
        u["login_terakhir"] = login_terakhir[0] if login_terakhir else None
        u["total_poin"] = total_poin
        u.pop("password_hash", None)
        u.pop("salt", None)
        hasil.append(u)
    conn.close()
    return hasil


# ---------------------------------------------------------------------------
# 8. Streak & Skor (leaderboard)
# ---------------------------------------------------------------------------

def init_streak_skor_table(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS aktivitas_harian (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tanggal TEXT NOT NULL,  -- "YYYY-MM-DD", satu baris per user per hari
            UNIQUE(user_id, tanggal)
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS skor_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            poin INTEGER NOT NULL,
            sumber TEXT,           -- "ujian" / "quiz" / label bebas
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()


def catat_aktivitas_harian(user_id: int, db_path: str = DB_PATH) -> None:
    """Upsert 'user ini aktif hari ini' — dasar hitungan streak. Aman dipanggil berkali-kali per hari."""
    tanggal = datetime.now(timezone.utc).date().isoformat()
    conn = _connect(db_path)
    conn.execute(
        "INSERT OR IGNORE INTO aktivitas_harian (user_id, tanggal) VALUES (?, ?)",
        (user_id, tanggal),
    )
    conn.commit()
    conn.close()


def hitung_streak(user_id: int, db_path: str = DB_PATH) -> dict:
    """
    Streak sekarang = jumlah hari berturut-turut aktif sampai hari ini
    (atau sampai kemarin, kalau hari ini belum aktif — masih dianggap
    'streak-nya hidup', baru putus kalau ada hari yang benar-benar bolong).
    Streak terbaik = streak berturut-turut terpanjang sepanjang riwayat.
    """
    conn = _connect(db_path)
    rows = conn.execute(
        "SELECT tanggal FROM aktivitas_harian WHERE user_id = ? ORDER BY tanggal ASC", (user_id,)
    ).fetchall()
    conn.close()
    if not rows:
        return {"streak_sekarang": 0, "streak_terbaik": 0, "terakhir_aktif": None}

    tanggal_list = [datetime.fromisoformat(r[0]).date() for r in rows]

    # Streak terbaik: cari rangkaian tanggal berurutan terpanjang di seluruh riwayat
    terbaik = 1
    lari = 1
    for i in range(1, len(tanggal_list)):
        if (tanggal_list[i] - tanggal_list[i - 1]).days == 1:
            lari += 1
        else:
            lari = 1
        terbaik = max(terbaik, lari)

    # Streak sekarang: mundur dari tanggal terakhir aktif, selama hari-harinya berurutan
    hari_ini = datetime.now(timezone.utc).date()
    terakhir = tanggal_list[-1]
    if (hari_ini - terakhir).days > 1:
        sekarang = 0  # sudah lebih dari 1 hari bolong -> streak putus
    else:
        sekarang = 1
        for i in range(len(tanggal_list) - 1, 0, -1):
            if (tanggal_list[i] - tanggal_list[i - 1]).days == 1:
                sekarang += 1
            else:
                break

    return {"streak_sekarang": sekarang, "streak_terbaik": terbaik, "terakhir_aktif": terakhir.isoformat()}


def init_akurasi_table(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS akurasi_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            benar INTEGER NOT NULL,
            total INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.commit()
    conn.close()

def catat_akurasi(user_id: int, benar: int, total: int, db_path: str = DB_PATH) -> None:
    if total <= 0:
        return
    conn = _connect(db_path)
    conn.execute("INSERT INTO akurasi_log (user_id, benar, total, created_at) VALUES (?, ?, ?, ?)", (user_id, benar, total, datetime.now(timezone.utc).isoformat()))
    conn.commit()
    conn.close()

def get_akurasi(user_id: int, db_path: str = DB_PATH) -> dict:
    conn = _connect(db_path)
    row = conn.execute("SELECT COALESCE(SUM(benar),0), COALESCE(SUM(total),0) FROM akurasi_log WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    benar, total = row[0], row[1]
    if total == 0:
        return {"persen": 0, "benar": 0, "total": 0, "ada_data": False}
    return {"persen": round(benar/total*100), "benar": benar, "total": total, "ada_data": True}

def tambah_skor(user_id: int, poin: int, sumber: str, db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    conn.execute(
        "INSERT INTO skor_log (user_id, poin, sumber, created_at) VALUES (?, ?, ?, ?)",
        (user_id, poin, sumber, datetime.now(timezone.utc).isoformat()),
    )
    conn.commit()
    conn.close()


def get_leaderboard(limit: int = 20, db_path: str = DB_PATH) -> list[dict]:
    """Ranking siswa berdasarkan total poin — dipakai halaman Leaderboard."""
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    cols = [c[1] for c in conn.execute("PRAGMA table_info(users)").fetchall()]
    has_bingkai = "bingkai_aktif" in cols
    rows = conn.execute(f"""
        SELECT u.id, u.nama, u.foto_profil, {'u.bingkai_aktif,' if has_bingkai else ''}
               COALESCE(SUM(s.poin), 0) AS total_poin
        FROM users u
        LEFT JOIN skor_log s ON s.user_id = u.id
        WHERE u.role = 'siswa'
        GROUP BY u.id
        ORDER BY total_poin DESC, u.nama ASC
        LIMIT ?
    """, (limit,)).fetchall()
    conn.close()
    hasil = []
    for r in rows:
        r = dict(r)
        r["streak_sekarang"] = hitung_streak(r["id"], db_path)["streak_sekarang"]
        hasil.append(r)
    return hasil


# ---------------------------------------------------------------------------
# 9. Level, Bingkai, dan Inventori (v6.1)
# ---------------------------------------------------------------------------

def init_bingkai_tables(db_path: str = DB_PATH) -> None:
    conn = _connect(db_path)
    try:
        cols = [row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
        if "bingkai_aktif" not in cols:
            conn.execute("ALTER TABLE users ADD COLUMN bingkai_aktif TEXT")
    except Exception:
        pass
    conn.execute("""
        CREATE TABLE IF NOT EXISTS bingkai (
            id TEXT PRIMARY KEY,
            nama TEXT NOT NULL,
            level_buka INTEGER NOT NULL CHECK (level_buka >= 6),
            gaya TEXT NOT NULL,
            urutan INTEGER DEFAULT 0,
            aktif INTEGER DEFAULT 1,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS user_inventori (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            tipe_item TEXT NOT NULL DEFAULT 'bingkai',
            item_id TEXT NOT NULL,
            diperoleh_at TEXT NOT NULL,
            UNIQUE (user_id, tipe_item, item_id)
        )
    """)
    conn.commit()
    cnt = conn.execute("SELECT COUNT(*) FROM bingkai").fetchone()[0]
    if cnt == 0:
        seed = [
            ("daun-muda", "Daun Muda", 6, "preset:daun-muda:#2C7873:#E8F5E9", 1),
            ("bintang-kecil", "Bintang Kecil", 8, "preset:bintang-kecil:#F2A93B:#FFF8E1", 2),
            ("api-semangat", "Api Semangat", 11, "preset:api-semangat:#D64545:#FFEBEE", 3),
            ("ombak-biru", "Ombak Biru", 14, "preset:ombak-biru:#1B2A4A:#E3F2FD", 4),
            ("mahkota-tipis", "Mahkota Tipis", 16, "preset:mahkota-tipis:#C6A664:#FFFDE7", 5),
            ("pelangi-kelas", "Pelangi Kelas", 19, "preset:pelangi-kelas:rainbow", 6),
        ]
        now = datetime.now(timezone.utc).isoformat()
        for bid, nama, lvl, gaya, urutan in seed:
            conn.execute("INSERT OR IGNORE INTO bingkai (id, nama, level_buka, gaya, urutan, aktif, created_at) VALUES (?,?,?,?,?,?,?)",
                         (bid, nama, lvl, gaya, urutan, 1, now))
        conn.commit()
    conn.close()


def level_dari_xp(xp: int) -> tuple[int, int, int]:
    level = 1
    butuh = 0
    while True:
        need_next = 100 + (level - 1) * 25
        if xp < butuh + need_next:
            return level, butuh, butuh + need_next
        butuh += need_next
        level += 1
        if level > 100:
            return level, butuh, butuh


def get_total_xp(user_id: int, db_path: str = DB_PATH) -> int:
    conn = _connect(db_path)
    row = conn.execute("SELECT COALESCE(SUM(poin),0) FROM skor_log WHERE user_id=?", (user_id,)).fetchone()
    conn.close()
    return int(row[0] or 0)


def grant_bingkai_otomatis(user_id: int, level: int, db_path: str = DB_PATH) -> list[dict]:
    conn = _connect(db_path)
    conn.row_factory = sqlite3.Row
    owned = set(r[0] for r in conn.execute("SELECT item_id FROM user_inventori WHERE user_id=? AND tipe_item='bingkai'", (user_id,)).fetchall())
    cands = conn.execute("SELECT * FROM bingkai WHERE aktif=1 AND level_buka <= ? ORDER BY level_buka ASC", (level,)).fetchall()
    baru: list[dict] = []
    now = datetime.now(timezone.utc).isoformat()
    for r in cands:
        if r["id"] in owned:
            continue
        conn.execute("INSERT OR IGNORE INTO user_inventori (user_id, tipe_item, item_id, diperoleh_at) VALUES (?,?,?,?)",
                     (user_id, "bingkai", r["id"], now))
        baru.append(dict(r))
    conn.commit()
    conn.close()
    return baru

# ---------------------------------------------------------------------------
# 10. AI helper untuk Control Panel — generate draft bab & rapikan markdown
# ---------------------------------------------------------------------------
# Beda dari summarize_material() yang KETAT (dilarang nambah fakta) — di sini
# admin sengaja minta AI MENULISKAN materi baru dari topik yang dikasih
# (karena memang belum ada teks sumber sama sekali), atau merapikan draft
# admin sendiri tanpa mengubah substansinya.

def build_draft_materi_prompt(jenjang_label: str, kelas: int, mapel: str) -> str:
    return f"""Kamu adalah penulis buku ajar untuk siswa {jenjang_label} kelas {kelas},
mata pelajaran {mapel}, mengikuti cakupan Kurikulum Merdeka untuk jenjang & kelas ini.

Tulis SATU bab materi ajar yang lengkap, dengan bahasa yang sesuai umur siswa
(sederhana untuk SD, makin formal untuk SMP/SMA), terstruktur rapi pakai markdown
(judul bab dengan #, sub-bagian dengan ##, poin-poin dengan list kalau perlu).
Sertakan penjelasan konsep + minimal satu contoh konkret di setiap sub-bagian.

Balas HANYA dengan JSON valid, tanpa teks lain, tanpa markdown code fence,
dengan struktur persis seperti ini:
{{
  "judul_bab": "judul bab singkat",
  "konten_markdown": "isi lengkap bab dalam format markdown"
}}"""


def generate_draft_materi(jenjang_label: str, kelas: int, mapel: str, topik: str, call_llm) -> dict:
    system_prompt = build_draft_materi_prompt(jenjang_label, kelas, mapel)
    raw = call_llm(system_prompt, f"Tulis satu bab materi tentang topik: {topik}")
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        cleaned = cleaned.replace("json\n", "", 1) if cleaned.startswith("json") else cleaned
    return json.loads(cleaned)


def build_rapikan_prompt() -> str:
    return """Kamu adalah editor buku ajar. Tugasmu MERAPIKAN struktur & bahasa draft
materi di bawah, TANPA menghapus atau mengubah substansi/fakta yang sudah ada,
dan TANPA menambah topik baru yang tidak disinggung sama sekali di draft asli.

Yang BOLEH kamu lakukan:
- Perbaiki struktur jadi markdown rapi (# judul, ## sub-judul, list kalau perlu)
- Perbaiki tata bahasa & ejaan
- Rapikan urutan supaya mengalir logis (dasar dulu, baru lanjutan)
- Tambahkan SATU contoh konkret di bagian yang masih abstrak/sulit dipahami,
  kalau memang belum ada contoh sama sekali di bagian itu

Balas HANYA dengan markdown hasil rapikan, tanpa penjelasan tambahan,
tanpa code fence."""


def rapikan_materi(raw_markdown: str, call_llm) -> str:
    return call_llm(build_rapikan_prompt(), f"Rapikan draft materi berikut:\n\n{raw_markdown}")
