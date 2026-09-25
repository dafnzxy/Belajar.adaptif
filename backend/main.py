"""
Referensi backend FastAPI — BelajarAdaptif
============================================
Ini contoh implementasi server-side dari logika yang sama seperti di prototype
React: membangun system prompt dinamis dari pilihan onboarding (jenjang, kelas,
mapel, gaya belajar, nada bicara), lalu meminta LLM men-generate satu soal
dalam format JSON terstruktur.

Cara pakai di project kamu (yang sudah React + FastAPI):
1. Copy file ini bersama `llm_provider.py` dan `vault_rag.py` ke folder backend kamu.
2. Pilih provider LLM lewat env var (lihat `llm_provider.py` untuk detail):
       export LLM_PROVIDER=ollama          # default, lokal & gratis
       export OLLAMA_CHAT_MODEL=llama3.2   # sesuaikan model yang sudah di-pull
   Atau kalau mau tetap pakai cloud sebagai fallback:
       export LLM_PROVIDER=openrouter
       export OPENROUTER_API_KEY="key-kamu"   # JANGAN hardcode, JANGAN commit ke git
3. (Opsional, untuk RAG dari catatan Obsidian) Jalankan sekali di awal:
       python vault_rag.py --ingest --vault "/path/ke/vault/obsidian/kamu"
   Ulangi tiap kali ada catatan baru yang mau ikut jadi sumber soal.
4. Sesuaikan `MAPEL_BY_JENJANG` / `STYLE_QUIZ` kalau mapel atau kurikulum kamu beda.
5. Frontend cukup kirim hasil onboarding ke endpoint ini setiap kali user minta
   soal baru / soal berikutnya.

Install dependency:
    pip install fastapi uvicorn openai pydantic requests pypdf --break-system-packages
Jalankan:
    uvicorn backend_reference:app --reload
"""

from dotenv import load_dotenv
load_dotenv()  # baca file .env sebelum modul lain (llm_provider, dll) baca os.environ

import json
import os
from datetime import datetime
from typing import Literal

from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

import auth as authmod
from llm_provider import call_llm
from vault_rag import retrieve_context
import materi_bank

app = FastAPI(title="BelajarAdaptif API")
materi_bank.init_db()

from pathlib import Path as _Path
_BASE_DIR = _Path(__file__).resolve().parent
def _resolve_upload(p: str) -> str:
    pp = _Path(p)
    return str(pp if pp.is_absolute() else _BASE_DIR / pp)
_raw_upload = os.environ.get("UPLOAD_DIR") or "uploads/avatars"
UPLOAD_DIR = _resolve_upload(_raw_upload)
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(str(_BASE_DIR / "uploads"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(_BASE_DIR / "uploads")), name="uploads")

if not materi_bank.admin_sudah_ada():
    _admin_email = os.environ.get("ADMIN_EMAIL", "admin@belajaradaptif.local")
    _admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if not _admin_password:
        if os.environ.get("ENV", "development") == "production":
            raise RuntimeError("ADMIN_PASSWORD wajib di-set di production")
        _admin_password = "admin123"
        print("[BelajarAdaptif] WARNING: pakai ADMIN_PASSWORD default dev — ganti di production!")
    _pw_hash, _salt = authmod.hash_password(_admin_password)
    materi_bank.buat_user("Admin", _admin_email, _pw_hash, _salt, role="admin")
    print(f"[BelajarAdaptif] Akun admin dibuat otomatis -> email: {_admin_email}")
    print("[BelajarAdaptif] GANTI PASSWORD default ini setelah login pertama ke Control Panel!")

SYNC_SECRET = os.environ.get("SYNC_SECRET")
if not SYNC_SECRET or not SYNC_SECRET.strip():
    if os.environ.get("ENV", "development") == "production":
        raise RuntimeError("SYNC_SECRET wajib di-set di production")

def _allowed_origins() -> list[str]:
    raw = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
    return [o.strip() for o in raw.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Sync-Token"],
    allow_credentials=True,
)

# ---------------------------------------------------------------------------
# 1. Data referensi (bisa dipindah ke database kalau mau dinamis / bisa
#    diedit dari admin panel)
# ---------------------------------------------------------------------------

JENJANG_LABEL = {"sd": "SD", "smp": "SMP", "sma": "SMA"}

MAPEL_BY_JENJANG = {
    "sd": ["Matematika", "IPA", "Bahasa Indonesia", "IPS", "PPKn"],
    "smp": ["Matematika", "IPA", "Bahasa Indonesia", "Bahasa Inggris", "IPS"],
    "sma": [
        "Matematika", "Fisika", "Kimia", "Biologi",
        "Bahasa Indonesia", "Bahasa Inggris", "Ekonomi", "Sejarah",
    ],
}

KURIKULUM_SCOPE = {
    ("sd", 1): {
        "Matematika": "Bilangan 1-20, penjumlahan & pengurangan sampai 20, mengenal bentuk bangun datar sederhana (persegi, segitiga, lingkaran), pengukuran panjang dengan satuan tidak baku, mengenal waktu (pagi/siang/malam)",
        "Bahasa Indonesia": "Mengenal huruf alfabet, suku kata, membaca kata sederhana, menulis huruf, kosakata benda sekitar, kalimat sederhana, dongeng pendek",
        "IPA": "Bagian tubuh & panca indera, benda hidup vs tak hidup, benda padat-cair, cuaca & musim sederhana, menjaga kebersihan diri",
        "IPS": "Identitas diri & keluarga, aturan di rumah & sekolah, lingkungan sekitar (rumah, sekolah), teman & tetangga",
        "PPKn": "Aturan di rumah/sekolah, Pancasila sila 1-2 sederhana, hidup rukun, hak & kewajiban sebagai anak",
    },
    ("sd", 2): {
        "Matematika": "Bilangan 1-100, nilai tempat puluhan-satuan, penjumlahan & pengurangan sampai 100, perkalian dasar (2,3,5), pengukuran berat & panjang baku (cm, kg), bangun datar & waktu (jam)",
        "Bahasa Indonesia": "Membaca kalimat, tanda baca titik & koma, menulis kalimat sederhana, cerita pendek, kosakata, pantun sederhana",
        "IPA": "Sifat benda, perubahan wujud sederhana, hewan & tumbuhan sekitar, energi (panas, cahaya), kebersihan lingkungan",
        "IPS": "Keluarga & kerabat, pekerjaan orang tua, lingkungan RT/RW, kegiatan ekonomi sederhana (jual-beli)",
        "PPKn": "Pancasila sila 1-3, aturan & norma, musyawarah, tanggung jawab di rumah & sekolah",
    },
    ("sd", 3): {
        "Matematika": "Bilangan sampai 1.000, perkalian & pembagian dasar, pecahan sederhana (1/2, 1/3, 1/4), keliling bangun datar, pengukuran waktu & uang",
        "Bahasa Indonesia": "Paragraf, gagasan pokok, menulis cerita, imbuhan me-/ber-, surat sederhana, puisi anak",
        "IPA": "Ciri makhluk hidup, daur hidup hewan, energi & perubahannya, gaya & gerak sederhana, cuaca & iklim",
        "IPS": "Lingkungan kabupaten/kota, peta sederhana, kenampakan alam, kegiatan ekonomi & koperasi",
        "PPKn": "Pancasila 5 sila lengkap sederhana, Bhineka Tunggal Ika, hak & kewajiban warga, musyawarah",
    },
    ("sd", 4): {
        "Matematika": "Bilangan sampai 10.000, FPB & KPK, pecahan senilai & desimal, keliling & luas persegi/persegi panjang, sudut, diagram batang",
        "Bahasa Indonesia": "Teks deskripsi & narasi, gagasan pokok & pendukung, surat resmi, pantun & syair, majas sederhana",
        "IPA": "Gaya, bunyi, cahaya, bagian tumbuhan & fotosintesis, rantai makanan, siklus air",
        "IPS": "Peta & kenampakan alam Indonesia, sumber daya alam, kegiatan ekonomi, keragaman suku & budaya",
        "PPKn": "Pancasila sebagai dasar negara, UUD 1945, keberagaman & toleransi, hak-kewajiban warga negara",
    },
    ("sd", 5): {
        "Matematika": "Pecahan & desimal lanjut, persen, KPK/FPB soal cerita, volume kubus & balok, kecepatan & debit, penyajian data (diagram lingkaran)",
        "Bahasa Indonesia": "Teks eksplanasi & laporan, unsur cerita (tokoh/latar/amanat), peribahasa, pidato sederhana, iklan",
        "IPA": "Peredaran darah & pernapasan, ekosistem & rantai makanan, wujud zat, listrik sederhana, bumi & tata surya",
        "IPS": "Kenampakan alam & sosial Indonesia, interaksi manusia-lingkungan, ekonomi kreatif, sejarah kerajaan Hindu-Buddha & Islam",
        "PPKn": "Nilai Pancasila, norma & peraturan perundang-undangan, bentuk pemerintahan Indonesia, kebinekaan",
    },
    ("sd", 6): {
        "Matematika": "Bilangan bulat negatif, operasi hitung campuran, lingkaran (keliling & luas), bangun ruang, statistika sederhana (mean/median/modus)",
        "Bahasa Indonesia": "Teks eksplanasi, pidato, surat resmi, unsur intrinsik cerita, majas & peribahasa, karya sastra anak",
        "IPA": "Rangka & otot, perkembangbiakan tumbuhan/hewan, listrik & magnet, sistem tata surya, pelestarian lingkungan",
        "IPS": "ASEAN & globalisasi, kegiatan ekonomi & perdagangan internasional, sejarah proklamasi, kenampakan alam dunia",
        "PPKn": "Pancasila & UUD 1945, hak & kewajiban warga negara, demokrasi, persatuan & kesatuan",
    },
    ("smp", 7): {
        "Matematika": "Bilangan bulat & pecahan, himpunan, bentuk aljabar dasar, persamaan linear satu variabel, perbandingan & skala, garis & sudut, penyajian data",
        "IPA": "Klasifikasi makhluk hidup, zat & perubahannya, suhu & kalor, gerak lurus, ekosistem & pencemaran",
        "Bahasa Indonesia": "Teks deskripsi, prosedur, narasi, surat pribadi/dinas, unsur puisi, debat sederhana",
        "Bahasa Inggris": "Greeting, introduction, daily activities (Simple Present), descriptive text (people/animals), telling time & date",
        "IPS": "Interaksi sosial, peta & kondisi geografis Indonesia, kegiatan ekonomi, sejarah Hindu-Buddha & Islam di Indonesia",
    },
    ("smp", 8): {
        "Matematika": "Pola bilangan, koordinat Kartesius, relasi & fungsi, persamaan garis lurus, SPLDV, Teorema Pythagoras, lingkaran, statistika",
        "IPA": "Sistem gerak & pencernaan manusia, zat aditif, getaran & gelombang, cahaya & optik, struktur bumi & gempa",
        "Bahasa Indonesia": "Teks eksposisi, eksplanasi, berita, ulasan, cerpen, puisi, drama",
        "Bahasa Inggris": "Simple Past & Present Continuous, recount text, narrative text, asking/giving opinion, advertisement",
        "IPS": "Mobilitas sosial, keunggulan & keterbatasan ruang, perdagangan internasional, sejarah kolonialisme & pergerakan nasional",
    },
    ("smp", 9): {
        "Matematika": "Bilangan berpangkat & akar, persamaan kuadrat, fungsi kuadrat, transformasi geometri, kesebangunan & kekongruenan, bangun ruang sisi lengkung, statistika & peluang",
        "IPA": "Pewarisan sifat & bioteknologi, listrik statis & dinamis, kemagnetan, tata surya & kemagnetan bumi",
        "Bahasa Indonesia": "Teks laporan percobaan, pidato persuasif, cerpen & novel, syair & pantun, tanggapan kritis",
        "Bahasa Inggris": "Passive voice, reported speech, procedure text, cause-effect, application letter, long functional texts",
        "IPS": "Perubahan sosial, ketergantungan antar ruang, ekonomi kreatif & perdagangan internasional, sejarah pasca-kemerdekaan & reformasi",
    },
    ("sma", 10): {
        "Matematika": "Eksponen & logaritma, barisan & deret, vektor, trigonometri dasar, sistem persamaan linear, fungsi kuadrat & statistika",
        "Fisika": "Gerak lurus & parabola, hukum Newton, usaha & energi, momentum & impuls, fluida, suhu & kalor",
        "Kimia": "Struktur atom & SPU, ikatan kimia, stoikiometri, larutan & koloid, termokimia dasar",
        "Biologi": "Keanekaragaman hayati, virus & bakteri, protista & fungi, ekologi, pencemaran lingkungan",
        "Bahasa Indonesia": "Teks observasi, eksposisi, anekdot, hikayat, debat & negosiasi, puisi & cerpen",
        "Bahasa Inggris": "Narrative, descriptive, recount, announcement, simple past vs present perfect, expression of suggestion/offer",
        "Ekonomi": "Konsep ekonomi & kelangkaan, sistem ekonomi, pasar & harga, lembaga keuangan, koperasi & BUMN",
        "Sejarah": "Sejarah Indonesia pra-aksara, kerajaan Hindu-Buddha, Islam, kolonialisme & perlawanan rakyat",
    },
    ("sma", 11): {
        "Matematika": "Fungsi komposisi & invers, matriks, induksi matematika, program linear, limit & turunan dasar, statistika lanjut",
        "Fisika": "Dinamika rotasi, elastisitas, fluida statis & dinamis, gelombang bunyi & cahaya, termodinamika, listrik statis",
        "Kimia": "Hidrokarbon & minyak bumi, kesetimbangan kimia, asam-basa, larutan penyangga, hidrolisis & Ksp",
        "Biologi": "Sel & jaringan, sistem gerak, peredaran darah, pencernaan, pernapasan & ekskresi manusia",
        "Bahasa Indonesia": "Teks prosedur kompleks, eksplanasi, ceramah, resensi, drama, novel, kritik sastra",
        "Bahasa Inggris": "Analytical exposition, hortatory exposition, explanation text, conditional sentences, passive voice lanjut",
        "Ekonomi": "Pendapatan nasional, APBN/APBD, perpajakan, pasar modal & uang, ketenagakerjaan & pembangunan",
        "Sejarah": "Pergerakan nasional, proklamasi & revolusi kemerdekaan, Orde Lama & Orde Baru, Reformasi",
    },
    ("sma", 12): {
        "Matematika": "Dimensi tiga, statistika inferensial, peluang lanjut, limit tak hingga, turunan & integral, kaidah pencacahan",
        "Fisika": "Listrik dinamis, medan magnet, induksi elektromagnetik, fisika kuantum, relativitas, teknologi digital",
        "Kimia": "Sifat koligatif, redoks & elektrokimia, kimia unsur, senyawa karbon & polimer, biokimia sederhana",
        "Biologi": "Pertumbuhan & perkembangan, reproduksi, genetika & mutasi, evolusi, bioteknologi & kultur jaringan",
        "Bahasa Indonesia": "Teks editorial, opini, artikel, novel sejarah, kritik & esai sastra, karya ilmiah sederhana",
        "Bahasa Inggris": "Discussion text, review text, news item, understanding UTBK/SNBT reading, advanced grammar & writing",
        "Ekonomi": "Akuntansi perusahaan jasa & dagang, manajemen, ekonomi internasional, pembangunan berkelanjutan",
        "Sejarah": "Perang Dunia & pengaruhnya, sejarah dunia kontemporer, globalisasi & peran Indonesia, historiografi",
    },
}

STYLE_LABEL = {
    "visual": "Visual (gambar & diagram)",
    "auditori": "Auditori (penjelasan lisan)",
    "kinestetik": "Kinestetik (praktik langsung)",
    "membaca": "Membaca/Menulis (teks & catatan)",
}

STYLE_PROMPT_INSTRUKTUR = {
    "visual": "Gaya VISUAL: jelaskan dengan struktur yang mudah divisualkan. Pakai tabel markdown kalau ada perbandingan, beri langkah berurutan yang bisa digambar, dan sertakan deskripsi gambar singkat di field image_prompt dan alt text di image_alt. Hindari paragraf panjang tanpa struktur.",
    "auditori": "Gaya AUDITORI: jelaskan seperti tutor yang ngobrol. Pakai analogi suara atau cerita, ajak siswa mengulang dengan kata sendiri, dan hindari tabel padat. Nada mengalir seperti dialog.",
    "kinestetik": "Gaya KINESTETIK: jelaskan lewat aktivitas. Suruh siswa mencoba langsung dengan benda sekitar, beri langkah coba dan amati. Setiap konsep kaitkan dengan gerakan atau percobaan kecil.",
    "membaca": "Gaya MEMBACA: jelaskan lewat rangkuman terstruktur. Pakai poin-poin, definisi tegas, dan rujukan baca lanjutan. Rapi dan padat, cocok untuk siswa yang suka mencatat.",
}

TONE_DESC = {
    "santai": "Ngobrol kayak teman belajar, boleh pakai bahasa gaul yang sopan",
    "netral": "Jelas dan ringkas, tanpa terlalu formal atau terlalu santai",
    "formal": "Bahasa baku, cocok buat gaya belajar yang serius",
}

LearningStyle = Literal["visual", "auditori", "kinestetik", "membaca"]
Tone = Literal["santai", "netral", "formal"]
Jenjang = Literal["sd", "smp", "sma"]


# ---------------------------------------------------------------------------
# 2. Skema request/response
# ---------------------------------------------------------------------------

class QuestionRequest(BaseModel):
    jenjang: Jenjang
    kelas: int
    mapel: str
    learning_style: LearningStyle
    tone: Tone
    topik_terakhir: str | None = None  # opsional: hindari topik yang baru saja dibahas
    gunakan_catatan: bool = True  # kalau True, sistem coba ambil konteks dari vault Obsidian


class QuestionResponse(BaseModel):
    topik: str
    pertanyaan: str
    pilihan: dict[str, str]
    kunci: str
    penjelasan: str
    image_prompt: str | None = None
    image_alt: str | None = None


class StyleQuizAnswer(BaseModel):
    """Satu jawaban dari kuis gaya belajar di frontend."""
    style: LearningStyle


class StyleQuizResult(BaseModel):
    dominant_style: LearningStyle
    tally: dict[str, int]


class MateriResponse(BaseModel):
    id: int
    source_type: str
    jenjang: str | None
    kelas: int | None = None
    mapel: str
    topik: str | None
    judul: str
    ringkasan: str | None
    lanjutan_ai: str | None = None
    bab: int | None = None
    urutan: int | None = None
    terhubung_ke: list[int] = []
    created_at: str


class SyncTextRequest(BaseModel):
    judul: str          # dipakai sebagai key upsert (nama file dari Obsidian)
    mapel: str
    konten: str         # isi mentah catatan (markdown/teks hasil ekstraksi PDF)
    topik: str | None = None
    jenjang: str | None = None
    learning_style: LearningStyle = "visual"
    tone: Tone = "netral"


class CatatanRequest(BaseModel):
    judul: str
    isi: str
    mapel: str | None = None
    topik: str | None = None


class CatatanResponse(BaseModel):
    id: int
    judul: str
    isi: str
    mapel: str | None
    topik: str | None
    created_at: str
    updated_at: str


class UjianRequest(BaseModel):
    """Sumber soal ujian: materi upload user, catatan user, ATAU materi
    tersedia (builtin, dikurasi admin dari Control Panel) — pilih salah satu.
    Untuk Tes Bab (F5.8), jumlah_soal divalidasi 5-20 agar sinkron dengan chip UI."""
    sumber: Literal["materi", "catatan", "materi_tersedia"]
    sumber_id: int
    jumlah_soal: int = 10
    learning_style: LearningStyle = "visual"
    tone: Tone = "netral"


class UjianSoal(BaseModel):
    pertanyaan: str
    pilihan: dict[str, str]
    kunci: str
    penjelasan: str
    image_prompt: str | None = None
    image_alt: str | None = None


class UjianResponse(BaseModel):
    judul_sumber: str
    mapel: str | None = None
    soal: list[UjianSoal]


Hari = Literal["senin", "selasa", "rabu", "kamis", "jumat", "sabtu", "minggu"]


class JadwalRequest(BaseModel):
    judul: str
    hari: Hari
    jam_mulai: str   # "HH:MM"
    jam_selesai: str  # "HH:MM"
    mapel: str | None = None
    catatan: str | None = None
    aktif: bool = True


class JadwalResponse(BaseModel):
    id: int
    judul: str
    mapel: str | None
    hari: str
    jam_mulai: str
    jam_selesai: str
    catatan: str | None
    aktif: bool
    created_at: str


# --- Auth & Profil ---

class RegisterRequest(BaseModel):
    nama: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class UserPublic(BaseModel):
    id: int
    nama: str
    email: str
    foto_profil: str | None = None
    role: str
    created_at: str
    jenjang: str | None = None
    kelas: int | None = None
    learning_style: str | None = None
    tone: str | None = None
    onboarding_selesai: int = 0
    bingkai_aktif: str | None = None


class LoginResponse(BaseModel):
    token: str
    user: UserPublic


class UpdateProfilRequest(BaseModel):
    nama: str


class OnboardingRequest(BaseModel):
    jenjang: Jenjang
    kelas: int
    learning_style: LearningStyle
    tone: Tone = "netral"


class OnboardingResponse(BaseModel):
    jenjang: str
    kelas: int
    learning_style: str
    tone: str
    onboarding_selesai: int


# --- Streak & Leaderboard ---

class StreakResponse(BaseModel):
    streak_sekarang: int
    streak_terbaik: int
    terakhir_aktif: str | None


class LeaderboardEntry(BaseModel):
    id: int
    nama: str
    foto_profil: str | None
    total_poin: int
    streak_sekarang: int
    bingkai_aktif: str | None = None


class TambahSkorRequest(BaseModel):
    poin: int
    sumber: str

class CatatAkurasiRequest(BaseModel):
    benar: int
    total: int

class AkurasiResponse(BaseModel):
    persen: int
    benar: int
    total: int
    ada_data: bool


# --- Admin — monitoring siswa ---

class SiswaMonitorResponse(BaseModel):
    id: int
    nama: str
    email: str
    foto_profil: str | None
    created_at: str
    login_terakhir: str | None
    total_poin: int


# --- Admin — Kelola "Materi Tersedia" (buku + graph) ---

class MateriBukuRequest(BaseModel):
    jenjang: Jenjang
    kelas: int
    mapel: str
    judul: str
    konten_asli: str
    topik: str | None = None
    bab: int | None = None
    urutan: int | None = None


class KoneksiRequest(BaseModel):
    id_a: int
    id_b: int


class GenerateDraftRequest(BaseModel):
    jenjang: Jenjang
    kelas: int
    mapel: str
    topik: str


class DraftMateriResponse(BaseModel):
    judul_bab: str
    konten_markdown: str


class RapikanRequest(BaseModel):
    konten_markdown: str


class RapikanResponse(BaseModel):
    konten_rapi: str


# ---------------------------------------------------------------------------
# 3. Algoritma inti
# ---------------------------------------------------------------------------

def detect_learning_style(answers: list[StyleQuizAnswer]) -> StyleQuizResult:
    """
    Bukan model ML terpisah — cukup tally sederhana dari pilihan jawaban kuis.
    Setiap opsi jawaban di kuis sudah di-mapping ke satu gaya belajar
    (lihat STYLE_QUIZ di frontend). Gaya dengan skor tertinggi yang dipakai.
    """
    tally = {"visual": 0, "auditori": 0, "kinestetik": 0, "membaca": 0}
    for a in answers:
        tally[a.style] += 1
    dominant = max(tally, key=tally.get)
    return StyleQuizResult(dominant_style=dominant, tally=tally)


def _scope_for(req: QuestionRequest) -> str:
    return KURIKULUM_SCOPE.get((req.jenjang, req.kelas), {}).get(req.mapel, "")


def build_system_prompt(req: QuestionRequest, context_chunks: list[str] | None = None) -> str:
    jenjang_label = JENJANG_LABEL[req.jenjang]
    style_label = STYLE_LABEL[req.learning_style]
    style_instr = STYLE_PROMPT_INSTRUKTUR[req.learning_style]
    tone_desc = TONE_DESC[req.tone]
    scope = _scope_for(req)

    avoid_clause = (
        f"Hindari membuat soal dengan topik yang sama seperti: {req.topik_terakhir}."
        if req.topik_terakhir else ""
    )

    scope_block = f"""
BATAS MATERI WAJIB — JANGAN DILANGGAR:
Kamu mengajar {jenjang_label} KELAS {req.kelas} mapel {req.mapel}.
Cakupan Kurikulum Merdeka yang BOLEH dipakai HANYA ini:
{scope if scope else "(ikuti kurikulum Merdeka untuk jenjang/kelas ini secara umum)"}
ATURAN KERAS:
- DILARANG membuat soal dari materi kelas lebih tinggi, jenjang lebih tinggi (mis. SD kelas 1 dilarang dapat soal SMP/SMA), atau topik di luar daftar di atas.
- Soal harus bisa dijawab siswa {jenjang_label} kelas {req.kelas} yang baru belajar topik tersebut — pakai kosakata & angka sesuai umur.
- Jika ragu, pilih topik paling dasar dari daftar di atas, jangan mengarang topik lanjutan.
""" if scope else ""

    context_block = ""
    if context_chunks:
        safe_chunks = []
        for c in context_chunks:
            lc = c.lower()
            if req.jenjang == "sd" and req.kelas <= 3:
                if any(k in lc for k in ["smp", "sma", "persamaan kuadrat", "trigonometri", "stoikiometri", "integral", "vektor"]):
                    continue
            safe_chunks.append(c)
        if safe_chunks:
            joined = "\n\n---\n\n".join(safe_chunks[:2])
            context_block = f"""
Berikut cuplikan dari catatan belajar pribadi siswa (sudah difilter untuk kelas ini). UTAMAKAN membuat soal
berdasarkan materi di cuplikan ini JIKA masih dalam batas materi di atas. Jika cuplikan di luar batas, ABAIKAN dan pakai batas materi di atas:

{joined}
"""

    visual_extra = ""
    if req.learning_style == "visual":
        visual_extra = """
Untuk gaya visual, tambahkan dua field di JSON:
  "image_prompt": "deskripsi gambar/diagram sederhana yang membantu memahami soal, maksimal 1 kalimat, tanpa menyebut nama orang nyata",
  "image_alt": "alt text singkat untuk aksesibilitas"
"""

    return f"""Kamu adalah tutor AI untuk siswa {jenjang_label} kelas {req.kelas}.
Mata pelajaran: {req.mapel}.
Gaya belajar siswa: {style_label}. {style_instr}
Gaya bahasa: {req.tone} — {tone_desc}.
{scope_block}{avoid_clause}
{context_block}
Tugas kamu: buat SATU soal latihan pilihan ganda yang relevan dengan mata
pelajaran dan kelas di atas. Balas HANYA dengan JSON valid, tanpa teks lain,
tanpa markdown code fence, dengan struktur persis seperti ini:
{{
  "topik": "nama topik singkat (harus salah satu dari cakupan di atas)",
  "pertanyaan": "teks soal",
  "pilihan": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
  "kunci": "A" | "B" | "C" | "D",
  "penjelasan": "penjelasan kenapa jawaban itu benar, gaya bahasa sesuai instruksi di atas"{', "image_prompt": "...", "image_alt": "..."' if req.learning_style=='visual' else ''}
}}{visual_extra}
Sebelum menjawab, cek: apakah topik yang kamu pilih ADA di daftar BATAS MATERI di atas? Jika tidak, GANTI ke topik yang ada di daftar."""


def build_ujian_prompt(konten: str, judul_sumber: str, jumlah_soal: int, style_label: str, tone_desc: str, learning_style: str = "visual") -> str:
    style_instr = STYLE_PROMPT_INSTRUKTUR.get(learning_style, "")
    visual_extra = ""
    if learning_style == "visual":
        visual_extra = ' Setiap item soal tambahkan "image_prompt" dan "image_alt" seperti di atas.'
    return f"""Kamu adalah pembuat soal ujian untuk siswa.
Gaya belajar siswa: {style_label}. {style_instr} Gaya bahasa: {tone_desc}.

Berikut adalah materi/catatan berjudul "{judul_sumber}" yang menjadi SATU-SATUNYA
sumber soal. WAJIB buat soal HANYA berdasarkan isi materi ini — jangan
menambahkan fakta atau konsep yang tidak ada di dalamnya. Jangan naikkan tingkat kesulitan di luar materi sumber:

---
{konten}
---

Tugas kamu: buat {jumlah_soal} soal pilihan ganda yang menguji pemahaman siswa
atas materi di atas, dengan variasi tingkat kesulitan (mudah ke sedang) dan
tidak ada soal yang mengulang topik yang sama persis.{visual_extra} Balas HANYA dengan JSON
valid, tanpa teks lain, tanpa markdown code fence, dengan struktur persis
seperti ini:
{{
  "soal": [
    {{
      "pertanyaan": "teks soal",
      "pilihan": {{"A": "...", "B": "...", "C": "...", "D": "..."}},
      "kunci": "A" | "B" | "C" | "D",
      "penjelasan": "penjelasan kenapa jawaban itu benar, merujuk ke materi di atas"{', "image_prompt": "...", "image_alt": "..."' if learning_style=='visual' else ''}
    }}
  ]
}}
Pastikan array "soal" berisi TEPAT {jumlah_soal} item."""


def _extract_json_object(text: str) -> str:
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1 and end > start:
        return text[start:end + 1]
    return text


def _try_repair_truncated_json(raw_text: str) -> dict | None:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json\n"):
            cleaned = cleaned[5:]
        elif cleaned.startswith("json"):
            cleaned = cleaned[4:]
    cleaned = _extract_json_object(cleaned)
    if not cleaned:
        return None
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as exc:
        msg = str(exc)
        if "Unterminated string" in msg or "Expecting" in msg:
            truncated = cleaned[: exc.pos] if exc.pos else cleaned
            last_quote = truncated.rfind('"')
            if last_quote != -1:
                truncated = truncated[: last_quote + 1]
            open_braces = truncated.count("{") - truncated.count("}")
            open_brackets = truncated.count("[") - truncated.count("]")
            repaired = truncated.rstrip(", \n\r\t")
            if repaired.endswith('"') and open_brackets > 0:
                pass
            repaired += "]" * max(0, open_brackets)
            repaired += "}" * max(0, open_braces)
            try:
                data = json.loads(repaired)
                if isinstance(data.get("soal"), list) and len(data["soal"]) >= 1:
                    return data
            except Exception:
                pass
            try:
                last_complete = truncated.rfind("},")
                if last_complete != -1:
                    cut = truncated[: last_complete + 1]
                    cut += "]" * max(0, open_brackets)
                    cut += "}" * max(0, open_braces)
                    data = json.loads(cut)
                    if isinstance(data.get("soal"), list) and len(data["soal"]) >= 1:
                        return data
            except Exception:
                pass
        return None


def parse_llm_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.startswith("json\n"):
            cleaned = cleaned[5:]
        elif cleaned.startswith("json"):
            cleaned = cleaned[4:]
    extracted = _extract_json_object(cleaned)
    try:
        return json.loads(extracted)
    except json.JSONDecodeError as exc:
        repaired = _try_repair_truncated_json(raw_text)
        if repaired is not None:
            return repaired
        raise HTTPException(
            status_code=502,
            detail=f"AI tidak mengembalikan JSON yang valid: {exc}. Coba lagi, atau kurangi jumlah soal.",
        )


# ---------------------------------------------------------------------------
# 4. Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/detect-learning-style", response_model=StyleQuizResult)
def detect_style(answers: list[StyleQuizAnswer]):
    return detect_learning_style(answers)


@app.post("/api/generate-question", response_model=QuestionResponse)
def generate_question(req: QuestionRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    _check_rate(payload["user_id"], _genq_rate, limit=12, window_s=60)
    if req.mapel not in MAPEL_BY_JENJANG.get(req.jenjang, []):
        raise HTTPException(status_code=400, detail="Mapel tidak sesuai untuk jenjang ini")

    context_chunks = []
    if req.gunakan_catatan:
        query = req.topik_terakhir or req.mapel
        context_chunks += retrieve_context(query, mapel=req.mapel, k=2)
    context_chunks += materi_bank.get_context_for_mapel(req.mapel, topik=req.topik_terakhir, limit=2, jenjang=req.jenjang, kelas=req.kelas)

    system_prompt = build_system_prompt(req, context_chunks=context_chunks)
    raw_text = call_llm(system_prompt, "Buat satu soal latihan sesuai instruksi.")
    parsed = parse_llm_json(raw_text)

    required_keys = {"topik", "pertanyaan", "pilihan", "kunci", "penjelasan"}
    if not required_keys.issubset(parsed):
        raise HTTPException(status_code=502, detail="Struktur JSON dari AI tidak lengkap")
    if parsed["kunci"] not in parsed["pilihan"]:
        raise HTTPException(status_code=502, detail="Kunci jawaban tidak ada di daftar pilihan")
    if req.learning_style == "visual" and not parsed.get("image_prompt"):
        parsed["image_prompt"] = f"Diagram sederhana yang menjelaskan: {parsed.get('topik','materi ini')}"
        parsed["image_alt"] = parsed.get("image_alt") or f"Diagram {parsed.get('topik','materi')}"

    return parsed


@app.get("/api/health")
def health_check():
    import time
    start = time.time()
    try:
        db_ok = False
        try:
            import sqlite3 as _sq
            c = _sq.connect(materi_bank.DB_PATH)
            c.execute("SELECT 1")
            c.close()
            db_ok = True
        except Exception:
            pass
        elapsed_ms = round((time.time() - start) * 1000)
        return {"status": "ok" if db_ok else "error", "db": "ok" if db_ok else "error", "provider": os.environ.get("LLM_PROVIDER", "openrouter"), "latency_ms": elapsed_ms}
    except Exception as exc:
        elapsed_ms = round((time.time() - start) * 1000)
        return {"status": "error", "detail": "health check failed", "latency_ms": elapsed_ms}


@app.get("/api/health/llm")
def health_llm(payload: dict = Depends(authmod.require_admin_payload)):
    import time
    start = time.time()
    try:
        result = call_llm(system_prompt="Balas HANYA dengan kata 'OK'.", user_message="ping")
        elapsed_ms = round((time.time() - start) * 1000)
        return {"status": "ok", "provider": os.environ.get("LLM_PROVIDER", "openrouter"), "latency_ms": elapsed_ms}
    except Exception as exc:
        elapsed_ms = round((time.time() - start) * 1000)
        return {"status": "error", "provider": os.environ.get("LLM_PROVIDER", "openrouter"), "latency_ms": elapsed_ms, "detail": str(exc)}


@app.get("/api/mapel/{jenjang}")
def get_mapel(jenjang: Jenjang):
    return {"mapel": MAPEL_BY_JENJANG.get(jenjang, [])}


@app.post("/api/materi/upload", response_model=MateriResponse)
async def upload_materi(
    payload: dict = Depends(authmod.get_current_user_payload),
    file: UploadFile | None = File(None),
    teks: str = Form(""),
    mapel: str = Form(...),
    topik: str = Form(""),
    jenjang: str = Form(""),
    learning_style: LearningStyle = Form("visual"),
    tone: Tone = Form("netral"),
    mode: str = Form("ringkas_ketat"),
):
    """
    Upload materi milik user sendiri — lewat file PDF ATAU tempel teks langsung.

    Dua mode, PENTING bedanya:
    - "ringkas_ketat": AI HANYA meringkas, dilarang menambah info di luar teks
      (lihat materi_bank.build_summary_prompt). Materi tetap 100% milik user.
    - "lengkapi_otomatis": kalau materi user baru sebagian (mis. cuma Bab 1-3),
      AI boleh MELANJUTKAN sampai selesai pakai pengetahuannya sendiri — tapi
      bagian lanjutan itu disimpan terpisah (`lanjutan_ai`) dan diberi catatan,
      supaya user tahu persis mana yang asli dan mana buatan AI.
    """
    _check_rate(payload["user_id"], _upload_rate, limit=10, window_s=3600)
    if file is not None and file.filename:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail="File yang didukung saat ini hanya PDF")
        file_bytes = await file.read()
        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File terlalu besar (maks 10MB)")
        try:
            raw_text = materi_bank.extract_text_from_pdf_bytes(file_bytes)
        except Exception:
            raise HTTPException(status_code=422, detail="Gagal membaca PDF (mungkin terenkripsi atau rusak)")
        judul = file.filename
    elif teks.strip():
        raw_text = teks
        judul = topik or f"Materi {mapel} (ditempel {datetime.now().strftime('%d %b %Y')})"
    else:
        raise HTTPException(status_code=400, detail="Kirim file PDF atau isi teks materi")

    if not raw_text.strip():
        raise HTTPException(
            status_code=422,
            detail="Tidak ada teks yang bisa diproses (PDF mungkin hasil scan gambar tanpa OCR).",
        )

    style_label = STYLE_LABEL[learning_style]
    tone_desc = TONE_DESC[tone]

    if mode == "lengkapi_otomatis":
        result = materi_bank.complete_and_summarize_material(raw_text, style_label, tone_desc, call_llm=call_llm)
        ringkasan = result.get("ringkasan_materi_asli", "")
        lanjutan_ai = result.get("lanjutan_ai", "")
        if result.get("catatan"):
            lanjutan_ai = f"[Catatan AI: {result['catatan']}]\n\n{lanjutan_ai}"
    else:
        ringkasan = materi_bank.summarize_material(raw_text, style_label, tone_desc, call_llm=call_llm)
        lanjutan_ai = None

    materi_id = materi_bank.add_materi(
        source_type="upload",
        mapel=mapel,
        judul=judul,
        konten_asli=raw_text,
        ringkasan=ringkasan,
        lanjutan_ai=lanjutan_ai,
        jenjang=jenjang or None,
        topik=topik or None,
        user_id=payload["user_id"],
    )

    rows = materi_bank.list_materi(mapel=mapel, source_type="upload", user_id=payload["user_id"])
    saved = next(r for r in rows if r["id"] == materi_id)
    return saved


@app.get("/api/materi", response_model=list[MateriResponse])
def get_materi(mapel: str | None = None, jenjang: str | None = None, kelas: int | None = None):
    """
    Materi Tersedia — hanya materi bawaan (builtin), bukan upload user.
    Kalau jenjang+kelas+mapel lengkap dikirim, hasilnya terurut Bab 1 sampai
    akhir (format buku, dipakai halaman baca siswa). Kalau tidak, list biasa.
    """
    if jenjang and kelas and mapel:
        return materi_bank.list_materi_buku(jenjang, kelas, mapel)
    return materi_bank.list_materi(mapel=mapel, source_type="builtin")


@app.get("/api/materi/saya", response_model=list[MateriResponse])
def get_materi_saya(mapel: str | None = None, payload: dict = Depends(authmod.get_current_user_payload)):
    return materi_bank.list_materi(mapel=mapel, source_type="upload", user_id=payload["user_id"])


@app.get("/api/materi/{materi_id}", response_model=MateriResponse)
def get_materi_detail(materi_id: int):
    row = materi_bank.get_materi_by_id(materi_id)
    if not row or row["source_type"] != "builtin":
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan")
    return row


@app.delete("/api/materi/{materi_id}")
def hapus_materi(materi_id: int, payload: dict = Depends(authmod.get_current_user_payload)):
    ok = materi_bank.delete_materi(materi_id, user_id=payload["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Materi tidak ditemukan atau bukan milik kamu")
    return {"message": "Materi berhasil dihapus", "id": materi_id}


@app.post("/api/materi/sync-text", response_model=MateriResponse)
def sync_text_materi(req: SyncTextRequest, x_sync_token: str | None = Header(None)):
    if not SYNC_SECRET:
        raise HTTPException(status_code=500, detail="SYNC_SECRET belum dikonfigurasi")
    if x_sync_token != SYNC_SECRET:
        raise HTTPException(status_code=401, detail="Token sync tidak valid")

    if not req.konten.strip():
        raise HTTPException(status_code=422, detail="Konten kosong, tidak ada yang bisa diringkas")

    style_label = STYLE_LABEL[req.learning_style]
    tone_desc = TONE_DESC[req.tone]
    ringkasan = materi_bank.summarize_material(req.konten, style_label, tone_desc, call_llm=call_llm)

    materi_id = materi_bank.upsert_materi(
        source_type="upload",
        mapel=req.mapel,
        judul=req.judul,
        konten_asli=req.konten,
        ringkasan=ringkasan,
        jenjang=req.jenjang,
        topik=req.topik,
    )

    rows = materi_bank.list_materi(mapel=req.mapel, source_type="upload")
    saved = next(r for r in rows if r["id"] == materi_id)
    return saved


# ---------------------------------------------------------------------------
# 5. Endpoints — Catatan Pribadi
# ---------------------------------------------------------------------------

@app.post("/api/catatan", response_model=CatatanResponse)
def buat_catatan(req: CatatanRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if not req.judul.strip() or not req.isi.strip():
        raise HTTPException(status_code=400, detail="Judul dan isi catatan tidak boleh kosong")
    catatan_id = materi_bank.add_catatan(judul=req.judul.strip(), isi=req.isi.strip(), mapel=req.mapel or None, topik=req.topik or None, user_id=payload["user_id"])
    rows = materi_bank.list_catatan(user_id=payload["user_id"])
    saved = next(r for r in rows if r["id"] == catatan_id)
    return saved


@app.get("/api/catatan", response_model=list[CatatanResponse])
def get_catatan(mapel: str | None = None, payload: dict = Depends(authmod.get_current_user_payload)):
    return materi_bank.list_catatan(mapel=mapel, user_id=payload["user_id"])


@app.put("/api/catatan/{catatan_id}", response_model=CatatanResponse)
def edit_catatan(catatan_id: int, req: CatatanRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if not req.judul.strip() or not req.isi.strip():
        raise HTTPException(status_code=400, detail="Judul dan isi catatan tidak boleh kosong")
    ok = materi_bank.update_catatan(catatan_id=catatan_id, judul=req.judul.strip(), isi=req.isi.strip(), mapel=req.mapel or None, topik=req.topik or None, user_id=payload["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Catatan tidak ditemukan")
    rows = materi_bank.list_catatan(user_id=payload["user_id"])
    updated = next(r for r in rows if r["id"] == catatan_id)
    return updated


@app.delete("/api/catatan/{catatan_id}")
def hapus_catatan(catatan_id: int, payload: dict = Depends(authmod.get_current_user_payload)):
    ok = materi_bank.delete_catatan(catatan_id, user_id=payload["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Catatan tidak ditemukan")
    return {"message": "Catatan berhasil dihapus", "id": catatan_id}


# ---------------------------------------------------------------------------
# 6. Endpoints — Ujian (generate soal dari Materi Saya atau Catatan Saya)
# ---------------------------------------------------------------------------

@app.post("/api/ujian/generate", response_model=UjianResponse)
def generate_ujian(req: UjianRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    _check_rate(payload["user_id"], _ujian_rate, limit=5, window_s=3600)
    if req.sumber == "materi_tersedia":
        if req.jumlah_soal < 5 or req.jumlah_soal > 20:
            raise HTTPException(status_code=400, detail="Jumlah soal untuk Tes Bab harus 5-20 (pilih 5, 10, 15, atau 20)")
        jumlah_soal = req.jumlah_soal
    else:
        jumlah_soal = max(5, min(req.jumlah_soal, 40))

    mapel = None
    if req.sumber == "materi":
        row = materi_bank.get_materi_by_id(req.sumber_id)
        if not row or row["source_type"] != "upload":
            raise HTTPException(status_code=404, detail="Materi tidak ditemukan atau bukan milik kamu")
        if row.get("user_id") is not None and row.get("user_id") != payload["user_id"]:
            raise HTTPException(status_code=404, detail="Materi tidak ditemukan atau bukan milik kamu")
        judul_sumber = row["judul"]
        mapel = row["mapel"]
        # Gabungkan ringkasan asli + lanjutan AI (kalau ada) sebagai sumber soal
        konten = row["ringkasan"] or row["konten_asli"] or ""
        if row.get("lanjutan_ai"):
            konten += f"\n\n{row['lanjutan_ai']}"
    elif req.sumber == "materi_tersedia":
        row = materi_bank.get_materi_by_id(req.sumber_id)
        if not row or row["source_type"] != "builtin":
            raise HTTPException(status_code=404, detail="Materi tersedia tidak ditemukan")
        judul_sumber = row["judul"]
        mapel = row["mapel"]
        konten = row["ringkasan"] or row["konten_asli"] or ""
    else:  # sumber == "catatan"
        row = materi_bank.get_catatan_by_id(req.sumber_id, user_id=payload["user_id"])
        if not row:
            raise HTTPException(status_code=404, detail="Catatan tidak ditemukan")
        judul_sumber = row["judul"]
        mapel = row.get("mapel")
        konten = row["isi"] or ""

    if not konten.strip():
        raise HTTPException(status_code=422, detail="Sumber ini belum punya isi yang bisa dijadikan soal")

    style_label = STYLE_LABEL[req.learning_style]
    tone_desc = TONE_DESC[req.tone]
    prompt = build_ujian_prompt(konten, judul_sumber, jumlah_soal, style_label, tone_desc, learning_style=req.learning_style)
    from llm_provider import _estimate_max_tokens
    max_tok = _estimate_max_tokens(jumlah_soal)
    raw_text = None
    parsed = None
    last_exc = None
    for attempt in range(2):
        try:
            tok = max_tok if attempt == 0 else min(16000, max_tok + 3000)
            raw_text = call_llm(prompt, f"Buat {jumlah_soal} soal ujian sesuai instruksi.", max_tokens=tok)
            parsed = parse_llm_json(raw_text)
            break
        except HTTPException as e:
            if "JSON yang valid" in str(e.detail) and attempt == 0:
                last_exc = e
                continue
            raise
    if parsed is None:
        raise last_exc or HTTPException(status_code=502, detail="AI tidak mengembalikan daftar soal yang valid")

    soal_list = parsed.get("soal")
    if not isinstance(soal_list, list) or not soal_list:
        if last_exc:
            raise last_exc
        raise HTTPException(status_code=502, detail="AI tidak mengembalikan daftar soal yang valid")

    if len(soal_list) < jumlah_soal:
        kurang = jumlah_soal - len(soal_list)
        prompt_topup = f"Konten yang sama. Tambahkan {kurang} soal lagi dengan format JSON yang sama, total tetap {jumlah_soal} soal. Materi:\n{konten[:3000]}"
        try:
            raw2 = call_llm(prompt_topup, f"Tambah {kurang} soal lagi.", max_tokens=min(16000, _estimate_max_tokens(kurang) + 500))
            parsed2 = parse_llm_json(raw2)
            extra = parsed2.get("soal") if isinstance(parsed2.get("soal"), list) else []
            for s in extra:
                if len(soal_list) >= jumlah_soal:
                    break
                if {"pertanyaan", "pilihan", "kunci", "penjelasan"}.issubset(s) and s["kunci"] in s.get("pilihan", {}):
                    soal_list.append(s)
        except Exception:
            pass
        soal_list = soal_list[:jumlah_soal]

    if len(soal_list) != jumlah_soal:
        raise HTTPException(status_code=502, detail=f"AI hanya mengembalikan {len(soal_list)} dari {jumlah_soal} soal yang diminta. Coba lagi atau pilih 10-15 soal.")

    # Validasi ringan tiap soal sebelum dikirim ke frontend
    required_keys = {"pertanyaan", "pilihan", "kunci", "penjelasan"}
    for i, s in enumerate(soal_list):
        if not required_keys.issubset(s):
            raise HTTPException(status_code=502, detail=f"Soal ke-{i+1} dari AI strukturnya tidak lengkap")
        if s["kunci"] not in s["pilihan"]:
            raise HTTPException(status_code=502, detail=f"Soal ke-{i+1} kunci jawabannya tidak ada di pilihan")
        if req.learning_style == "visual" and not s.get("image_prompt"):
            s["image_prompt"] = f"Diagram sederhana yang menjelaskan soal {i+1}"
            s["image_alt"] = s.get("image_alt") or "Diagram soal"

    return {"judul_sumber": judul_sumber, "mapel": mapel, "soal": soal_list}


# ---------------------------------------------------------------------------
# 7. Endpoints — Jadwal Belajar (kalender mingguan)
# ---------------------------------------------------------------------------

def _validasi_format_jam(jam: str, field: str) -> None:
    import re
    if not re.fullmatch(r"[0-2]\d:[0-5]\d", jam):
        raise HTTPException(status_code=400, detail=f"Format {field} harus HH:MM, contoh 19:00")


@app.post("/api/jadwal", response_model=JadwalResponse)
def buat_jadwal(req: JadwalRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if not req.judul.strip():
        raise HTTPException(status_code=400, detail="Judul jadwal tidak boleh kosong")
    _validasi_format_jam(req.jam_mulai, "jam mulai")
    _validasi_format_jam(req.jam_selesai, "jam selesai")
    if req.jam_selesai <= req.jam_mulai:
        raise HTTPException(status_code=400, detail="Jam selesai harus setelah jam mulai")
    jadwal_id = materi_bank.add_jadwal(judul=req.judul.strip(), hari=req.hari, jam_mulai=req.jam_mulai, jam_selesai=req.jam_selesai, mapel=req.mapel, catatan=req.catatan, user_id=payload["user_id"])
    row = materi_bank.get_jadwal_by_id(jadwal_id, user_id=payload["user_id"])
    return {**row, "aktif": bool(row["aktif"])}


@app.get("/api/jadwal", response_model=list[JadwalResponse])
def daftar_jadwal(payload: dict = Depends(authmod.get_current_user_payload)):
    rows = materi_bank.list_jadwal(user_id=payload["user_id"])
    return [{**r, "aktif": bool(r["aktif"])} for r in rows]


@app.put("/api/jadwal/{jadwal_id}", response_model=JadwalResponse)
def edit_jadwal(jadwal_id: int, req: JadwalRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if not req.judul.strip():
        raise HTTPException(status_code=400, detail="Judul jadwal tidak boleh kosong")
    _validasi_format_jam(req.jam_mulai, "jam mulai")
    _validasi_format_jam(req.jam_selesai, "jam selesai")
    if req.jam_selesai <= req.jam_mulai:
        raise HTTPException(status_code=400, detail="Jam selesai harus setelah jam mulai")
    ok = materi_bank.update_jadwal(jadwal_id=jadwal_id, judul=req.judul.strip(), hari=req.hari, jam_mulai=req.jam_mulai, jam_selesai=req.jam_selesai, mapel=req.mapel, catatan=req.catatan, aktif=req.aktif, user_id=payload["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    row = materi_bank.get_jadwal_by_id(jadwal_id, user_id=payload["user_id"])
    return {**row, "aktif": bool(row["aktif"])}


@app.patch("/api/jadwal/{jadwal_id}/toggle", response_model=JadwalResponse)
def toggle_jadwal(jadwal_id: int, payload: dict = Depends(authmod.get_current_user_payload)):
    row = materi_bank.toggle_jadwal_aktif(jadwal_id, user_id=payload["user_id"])
    if not row:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return {**row, "aktif": bool(row["aktif"])}


import hashlib as _hashlib
import time as _time

_gambar_rate: dict[int, list[float]] = {}
_skor_rate: dict[int, list[float]] = {}
_genq_rate: dict[int, list[float]] = {}
_ujian_rate: dict[int, list[float]] = {}
_upload_rate: dict[int, list[float]] = {}


def _check_rate(uid: int, bucket: dict, limit: int, window_s: int):
    now = _time.time()
    b = bucket.setdefault(uid, [])
    b[:] = [t for t in b if now - t < window_s]
    if len(b) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit tercapai ({limit}/{window_s//60} menit). Coba lagi nanti.")
    b.append(now)
GAMBAR_DIR = _resolve_upload(os.environ.get("GAMBAR_DIR") or "uploads/gambar")
os.makedirs(GAMBAR_DIR, exist_ok=True)


class GambarRequest(BaseModel):
    image_prompt: str
    image_alt: str | None = None


class GambarResponse(BaseModel):
    url: str
    alt: str
    cached: bool


@app.post("/api/gambar/generate", response_model=GambarResponse)
def generate_gambar(req: GambarRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if not req.image_prompt.strip():
        raise HTTPException(status_code=400, detail="image_prompt tidak boleh kosong")
    limit = int(os.environ.get("IMAGE_GEN_RATE_LIMIT_PER_HOUR", "20"))
    now = _time.time()
    uid = payload["user_id"]
    bucket = _gambar_rate.setdefault(uid, [])
    bucket[:] = [t for t in bucket if now - t < 3600]
    if len(bucket) >= limit:
        raise HTTPException(status_code=429, detail=f"Rate limit gambar tercapai ({limit}/jam). Coba lagi nanti.")
    h = _hashlib.sha256(req.image_prompt.encode()).hexdigest()[:16]
    cached_path = os.path.join(GAMBAR_DIR, f"{h}.png")
    if os.path.exists(cached_path):
        return {"url": f"/uploads/gambar/{h}.png", "alt": req.image_alt or req.image_prompt[:80], "cached": True}
    try:
        from image_provider import generate_image_bytes
        data, _provider = generate_image_bytes(req.image_prompt)
        with open(cached_path, "wb") as f:
            f.write(data)
        bucket.append(now)
        return {"url": f"/uploads/gambar/{h}.png", "alt": req.image_alt or req.image_prompt[:80], "cached": False}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))


@app.delete("/api/jadwal/{jadwal_id}")
def hapus_jadwal(jadwal_id: int, payload: dict = Depends(authmod.get_current_user_payload)):
    ok = materi_bank.delete_jadwal(jadwal_id, user_id=payload["user_id"])
    if not ok:
        raise HTTPException(status_code=404, detail="Jadwal tidak ditemukan")
    return {"message": "Jadwal berhasil dihapus", "id": jadwal_id}


# ---------------------------------------------------------------------------
# 8. Endpoints — Auth & Profil
# ---------------------------------------------------------------------------

def _user_ke_public(row: dict) -> dict:
    keys = ("id", "nama", "email", "foto_profil", "role", "created_at", "jenjang", "kelas", "learning_style", "tone", "onboarding_selesai", "bingkai_aktif")
    return {k: row.get(k) for k in keys}


@app.post("/api/auth/register", response_model=LoginResponse)
def register(req: RegisterRequest):
    if not req.nama.strip() or not req.email.strip() or len(req.password) < 6:
        raise HTTPException(status_code=400, detail="Nama & email wajib diisi, password minimal 6 karakter")
    if materi_bank.get_user_by_email(req.email):
        raise HTTPException(status_code=409, detail="Email ini sudah terdaftar, coba login")

    pw_hash, salt = authmod.hash_password(req.password)
    user_id = materi_bank.buat_user(req.nama.strip(), req.email, pw_hash, salt, role="siswa")
    materi_bank.catat_login(user_id)
    materi_bank.catat_aktivitas_harian(user_id)
    row = materi_bank.get_user_by_id(user_id)
    token = authmod.buat_token(user_id, row["role"])
    return {"token": token, "user": _user_ke_public(row)}


@app.post("/api/auth/login", response_model=LoginResponse)
def login(req: LoginRequest):
    row = materi_bank.get_user_by_email(req.email)
    if not row or not authmod.verify_password(req.password, row["password_hash"], row["salt"]):
        raise HTTPException(status_code=401, detail="Email atau password salah")

    materi_bank.catat_login(row["id"])
    materi_bank.catat_aktivitas_harian(row["id"])
    token = authmod.buat_token(row["id"], row["role"])
    return {"token": token, "user": _user_ke_public(row)}


@app.get("/api/auth/me", response_model=UserPublic)
def me(payload: dict = Depends(authmod.get_current_user_payload)):
    row = materi_bank.get_user_by_id(payload["user_id"])
    if not row:
        raise HTTPException(status_code=404, detail="User tidak ditemukan")
    return _user_ke_public(row)


@app.get("/api/auth/onboarding", response_model=OnboardingResponse)
def get_onboarding(payload: dict = Depends(authmod.get_current_user_payload)):
    data = materi_bank.get_onboarding(payload["user_id"])
    if not data or not data.get("jenjang"):
        raise HTTPException(status_code=404, detail="Belum ada data onboarding")
    return {
        "jenjang": data["jenjang"],
        "kelas": data["kelas"],
        "learning_style": data["learning_style"],
        "tone": data["tone"],
        "onboarding_selesai": data["onboarding_selesai"] or 0,
    }


@app.put("/api/auth/onboarding", response_model=OnboardingResponse)
def put_onboarding(req: OnboardingRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    valid_kelas = JENJANG_LABEL.get(req.jenjang)
    if not valid_kelas:
        raise HTTPException(status_code=400, detail="Jenjang tidak valid")
    allowed = {"sd": [1,2,3,4,5,6], "smp": [7,8,9], "sma": [10,11,12]}.get(req.jenjang, [])
    if req.kelas not in allowed:
        raise HTTPException(status_code=400, detail=f"Kelas {req.kelas} tidak sesuai untuk jenjang {req.jenjang}")
    materi_bank.simpan_onboarding(payload["user_id"], req.jenjang, req.kelas, req.learning_style, req.tone)
    return {
        "jenjang": req.jenjang,
        "kelas": req.kelas,
        "learning_style": req.learning_style,
        "tone": req.tone,
        "onboarding_selesai": 1,
    }


@app.put("/api/auth/profil", response_model=UserPublic)
def update_profil(req: UpdateProfilRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if not req.nama.strip():
        raise HTTPException(status_code=400, detail="Nama tidak boleh kosong")
    materi_bank.update_profil_user(payload["user_id"], nama=req.nama.strip())
    row = materi_bank.get_user_by_id(payload["user_id"])
    return _user_ke_public(row)


@app.post("/api/auth/profil/foto", response_model=UserPublic)
async def upload_foto_profil(file: UploadFile = File(...), payload: dict = Depends(authmod.get_current_user_payload)):
    ext = (file.filename or "").lower().rsplit(".", 1)[-1] if "." in (file.filename or "") else ""
    if ext not in ("jpg", "jpeg", "png", "webp"):
        raise HTTPException(status_code=400, detail="Format foto harus JPG, PNG, atau WEBP")
    if file.content_type and file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/jpg"):
        raise HTTPException(status_code=400, detail="Content-Type foto tidak valid")
    isi = await file.read()
    if len(isi) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Ukuran foto maksimal 5MB")
    if isi[:4] not in (b"\xff\xd8\xff\xe0", b"\xff\xd8\xff\xe1", b"\x89PNG", b"RIFF") and isi[:4] != b"\x89PNG" and not isi.startswith(b"\xff\xd8"):
        if ext == "webp" and not isi.startswith(b"RIFF"):
            raise HTTPException(status_code=400, detail="File bukan gambar valid")
        if ext in ("jpg", "jpeg") and not isi.startswith(b"\xff\xd8"):
            raise HTTPException(status_code=400, detail="File bukan gambar valid")
        if ext == "png" and not isi.startswith(b"\x89PNG"):
            raise HTTPException(status_code=400, detail="File bukan gambar valid")
    import uuid as _uuid
    nama_file = f"{payload['user_id']}_{_uuid.uuid4().hex[:8]}.{ext}"
    for old in [f for f in os.listdir(UPLOAD_DIR) if f.startswith(f"{payload['user_id']}.") or f.startswith(f"{payload['user_id']}_")]:
        try:
            os.remove(os.path.join(UPLOAD_DIR, old))
        except Exception:
            pass
    with open(os.path.join(UPLOAD_DIR, nama_file), "wb") as f:
        f.write(isi)

    path_relatif = f"/uploads/avatars/{nama_file}"
    materi_bank.update_profil_user(payload["user_id"], foto_profil=path_relatif)
    row = materi_bank.get_user_by_id(payload["user_id"])
    return _user_ke_public(row)


# ---------------------------------------------------------------------------
# 9. Endpoints — Streak & Leaderboard
# ---------------------------------------------------------------------------

@app.get("/api/streak/saya", response_model=StreakResponse)
def streak_saya(payload: dict = Depends(authmod.get_current_user_payload)):
    return materi_bank.hitung_streak(payload["user_id"])


@app.post("/api/skor/tambah")
def tambah_skor(req: TambahSkorRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if req.poin < 0 or req.poin > 50:
        raise HTTPException(status_code=400, detail="Poin harus 0-50")
    if req.sumber not in ("quiz", "ujian", "latihan", "streak_bonus"):
        raise HTTPException(status_code=400, detail="Sumber skor tidak valid")
    _now = _time.time()
    _bucket = _skor_rate.setdefault(payload["user_id"], [])
    _bucket[:] = [t for t in _bucket if _now - t < 60]
    if len(_bucket) >= 20:
        raise HTTPException(status_code=429, detail="Terlalu banyak request skor, coba lagi sebentar")
    _bucket.append(_now)
    materi_bank.tambah_skor(payload["user_id"], req.poin, req.sumber)
    materi_bank.catat_aktivitas_harian(payload["user_id"])
    bonus = 0
    try:
        import sqlite3 as _sql
        from datetime import datetime as _dt, timezone as _tz
        dbp = materi_bank.DB_PATH
        today = _dt.now(_tz.utc).date().isoformat()
        conn = _sql.connect(dbp)
        already = conn.execute("SELECT 1 FROM skor_log WHERE user_id=? AND sumber='streak_bonus' AND substr(created_at,1,10)=?", (payload["user_id"], today)).fetchone()
        conn.close()
        if not already and materi_bank.hitung_streak(payload["user_id"])["streak_sekarang"] >= 3:
            materi_bank.tambah_skor(payload["user_id"], 5, "streak_bonus")
            bonus = 5
    except Exception:
        pass
    out = {"message": "Skor tercatat", "poin": req.poin}
    if bonus:
        out["bonus_streak"] = bonus
    return out


class LevelSayaResponse(BaseModel):
    level: int
    xp_total: int
    xp_level_bawah: int
    xp_level_atas: int
    persen: int
    bingkai_baru: list[dict] = []


@app.get("/api/level/saya", response_model=LevelSayaResponse)
def level_saya(payload: dict = Depends(authmod.get_current_user_payload)):
    xp = materi_bank.get_total_xp(payload["user_id"])
    lvl, bawah, atas = materi_bank.level_dari_xp(xp)
    persen = 0 if atas == bawah else round((xp - bawah) / max(1, atas - bawah) * 100)
    baru = materi_bank.grant_bingkai_otomatis(payload["user_id"], lvl)
    return {"level": lvl, "xp_total": xp, "xp_level_bawah": bawah, "xp_level_atas": atas, "persen": persen, "bingkai_baru": baru}


class PakaiBingkaiRequest(BaseModel):
    bingkai_id: str | None = None


@app.post("/api/level/bingkai/pakai")
def pakai_bingkai(req: PakaiBingkaiRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    if req.bingkai_id is None:
        import sqlite3 as _sql
        conn = _sql.connect(materi_bank.DB_PATH)
        conn.execute("UPDATE users SET bingkai_aktif=NULL WHERE id=?", (payload["user_id"],))
        conn.commit(); conn.close()
        return {"bingkai_aktif": None}
    import sqlite3 as _sql
    conn = _sql.connect(materi_bank.DB_PATH)
    conn.row_factory = _sql.Row
    own = conn.execute("SELECT 1 FROM user_inventori WHERE user_id=? AND tipe_item='bingkai' AND item_id=?", (payload["user_id"], req.bingkai_id)).fetchone()
    if not own:
        conn.close()
        raise HTTPException(status_code=403, detail="Bingkai belum dimiliki. Capai level yang dibutuhkan dulu")
    conn.execute("UPDATE users SET bingkai_aktif=? WHERE id=?", (req.bingkai_id, payload["user_id"]))
    conn.commit(); conn.close()
    return {"bingkai_aktif": req.bingkai_id}


@app.get("/api/level/bingkai")
def list_bingkai_saya(payload: dict = Depends(authmod.get_current_user_payload)):
    import sqlite3 as _sql
    xp = materi_bank.get_total_xp(payload["user_id"])
    lvl, _, _ = materi_bank.level_dari_xp(xp)
    conn = _sql.connect(materi_bank.DB_PATH)
    conn.row_factory = _sql.Row
    rows = conn.execute("SELECT * FROM bingkai WHERE aktif=1 ORDER BY level_buka ASC, urutan ASC").fetchall()
    owned = set(r[0] for r in conn.execute("SELECT item_id FROM user_inventori WHERE user_id=? AND tipe_item='bingkai'", (payload["user_id"],)).fetchall())
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        d["dimiliki"] = r["id"] in owned
        d["terbuka"] = lvl >= r["level_buka"]
        out.append(d)
    return out


@app.get("/api/profil/inventori")
def profil_inventori(payload: dict = Depends(authmod.get_current_user_payload)):
    import sqlite3 as _sql
    conn = _sql.connect(materi_bank.DB_PATH)
    conn.row_factory = _sql.Row
    rows = conn.execute("""
        SELECT ui.item_id, ui.diperoleh_at, b.nama, b.level_buka, b.gaya, b.urutan
        FROM user_inventori ui JOIN bingkai b ON b.id=ui.item_id
        WHERE ui.user_id=? AND ui.tipe_item='bingkai'
        ORDER BY b.level_buka ASC
    """, (payload["user_id"],)).fetchall()
    conn.close()
    return [{"tipe_item":"bingkai","item_id":r["item_id"],"nama":r["nama"],"level_buka":r["level_buka"],"gaya":r["gaya"],"diperoleh_at":r["diperoleh_at"]} for r in rows]


@app.get("/api/leaderboard", response_model=list[LeaderboardEntry])
def leaderboard(payload: dict = Depends(authmod.get_current_user_payload)):
    return materi_bank.get_leaderboard()


@app.get("/api/akurasi/saya", response_model=AkurasiResponse)
def akurasi_saya(payload: dict = Depends(authmod.get_current_user_payload)):
    return materi_bank.get_akurasi(payload["user_id"])


@app.post("/api/akurasi/tambah")
def tambah_akurasi(req: CatatAkurasiRequest, payload: dict = Depends(authmod.get_current_user_payload)):
    materi_bank.catat_akurasi(payload["user_id"], req.benar, req.total)
    return materi_bank.get_akurasi(payload["user_id"])


# ---------------------------------------------------------------------------
# 10. Endpoints — Control Panel (Admin)
# ---------------------------------------------------------------------------

@app.get("/api/admin/siswa", response_model=list[SiswaMonitorResponse])
def admin_daftar_siswa(payload: dict = Depends(authmod.require_admin_payload)):
    return materi_bank.list_siswa_dengan_aktivitas()


@app.get("/api/admin/materi-graph", response_model=list[MateriResponse])
def admin_materi_graph(
    jenjang: str | None = None, kelas: int | None = None, mapel: str | None = None,
    payload: dict = Depends(authmod.require_admin_payload),
):
    """Semua bab 'Materi Tersedia' (builtin) buat ditampilkan sebagai graph di Control Panel."""
    return materi_bank.list_materi_graph(jenjang=jenjang, kelas=kelas, mapel=mapel)


@app.post("/api/admin/materi-buku", response_model=MateriResponse)
def admin_tambah_bab(req: MateriBukuRequest, payload: dict = Depends(authmod.require_admin_payload)):
    if req.mapel not in MAPEL_BY_JENJANG.get(req.jenjang, []):
        raise HTTPException(status_code=400, detail="Mapel tidak sesuai untuk jenjang ini")
    if not req.judul.strip() or not req.konten_asli.strip():
        raise HTTPException(status_code=400, detail="Judul & konten bab tidak boleh kosong")

    materi_id = materi_bank.add_materi(
        source_type="builtin", mapel=req.mapel, judul=req.judul.strip(),
        konten_asli=req.konten_asli, jenjang=req.jenjang, topik=req.topik,
        kelas=req.kelas, bab=req.bab, urutan=req.urutan,
    )
    return materi_bank.get_materi_by_id(materi_id)


@app.put("/api/admin/materi-buku/{materi_id}", response_model=MateriResponse)
def admin_edit_bab(materi_id: int, req: MateriBukuRequest, payload: dict = Depends(authmod.require_admin_payload)):
    ok = materi_bank.update_materi(
        materi_id, judul=req.judul.strip(), mapel=req.mapel, topik=req.topik,
        jenjang=req.jenjang, kelas=req.kelas, konten_asli=req.konten_asli,
        bab=req.bab, urutan=req.urutan,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Bab tidak ditemukan")
    return materi_bank.get_materi_by_id(materi_id)


@app.delete("/api/admin/materi-buku/{materi_id}")
def admin_hapus_bab(materi_id: int, payload: dict = Depends(authmod.require_admin_payload)):
    ok = materi_bank.delete_materi_admin(materi_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Bab tidak ditemukan")
    return {"message": "Bab berhasil dihapus", "id": materi_id}


@app.post("/api/admin/materi-graph/hubungkan")
def admin_hubungkan_bab(req: KoneksiRequest, payload: dict = Depends(authmod.require_admin_payload)):
    ok = materi_bank.hubungkan_materi(req.id_a, req.id_b)
    if not ok:
        raise HTTPException(status_code=404, detail="Salah satu atau kedua bab tidak ditemukan")
    return {"message": "Terhubung"}


@app.post("/api/admin/materi-graph/putuskan")
def admin_putuskan_bab(req: KoneksiRequest, payload: dict = Depends(authmod.require_admin_payload)):
    ok = materi_bank.putuskan_materi(req.id_a, req.id_b)
    if not ok:
        raise HTTPException(status_code=404, detail="Salah satu atau kedua bab tidak ditemukan")
    return {"message": "Koneksi diputus"}


@app.post("/api/admin/materi-buku/generate-draft", response_model=DraftMateriResponse)
def admin_generate_draft(req: GenerateDraftRequest, payload: dict = Depends(authmod.require_admin_payload)):
    """AI menulis draft satu bab baru dari topik yang dikasih admin — HANYA
    preview, admin masih bisa edit sebelum benar-benar disimpan lewat
    endpoint /api/admin/materi-buku di atas."""
    jenjang_label = JENJANG_LABEL[req.jenjang]
    try:
        hasil = materi_bank.generate_draft_materi(jenjang_label, req.kelas, req.mapel, req.topik, call_llm=call_llm)
    except (json.JSONDecodeError, KeyError) as exc:
        raise HTTPException(status_code=502, detail=f"AI tidak mengembalikan draft yang valid: {exc}")
    return hasil


@app.post("/api/admin/materi-buku/rapikan", response_model=RapikanResponse)
def admin_rapikan_draft(req: RapikanRequest, payload: dict = Depends(authmod.require_admin_payload)):
    """AI merapikan struktur & bahasa draft yang admin tulis/tempel sendiri,
    tanpa mengubah substansinya — hasil ini juga cuma preview."""
    if not req.konten_markdown.strip():
        raise HTTPException(status_code=400, detail="Konten tidak boleh kosong")
    hasil = materi_bank.rapikan_materi(req.konten_markdown, call_llm=call_llm)
    return {"konten_rapi": hasil}


class BingkaiAdminRequest(BaseModel):
    id: str | None = None
    nama: str
    level_buka: int
    gaya: str
    urutan: int = 0
    aktif: bool = True


@app.get("/api/admin/bingkai")
def admin_list_bingkai(payload: dict = Depends(authmod.require_admin_payload)):
    import sqlite3 as _sql
    conn = _sql.connect(materi_bank.DB_PATH)
    conn.row_factory = _sql.Row
    rows = conn.execute("SELECT * FROM bingkai ORDER BY level_buka ASC, urutan ASC").fetchall()
    out = []
    for r in rows:
        d = dict(r)
        cnt = conn.execute("SELECT COUNT(*) FROM user_inventori WHERE tipe_item='bingkai' AND item_id=?", (r["id"],)).fetchone()[0]
        d["jumlah_pemilik"] = cnt
        out.append(d)
    conn.close()
    return out


@app.post("/api/admin/bingkai")
def admin_tambah_bingkai(req: BingkaiAdminRequest, payload: dict = Depends(authmod.require_admin_payload)):
    if not req.nama.strip():
        raise HTTPException(status_code=400, detail="Nama bingkai tidak boleh kosong")
    if req.level_buka < 6:
        raise HTTPException(status_code=400, detail="Level buka minimal 6")
    if not req.gaya.strip():
        raise HTTPException(status_code=400, detail="Gaya tidak boleh kosong")
    bid = req.id.strip().lower().replace(" ", "-") if req.id and req.id.strip() else req.nama.strip().lower().replace(" ", "-")
    import sqlite3 as _sql, re as _re
    bid = _re.sub(r"[^a-z0-9-]", "", bid)[:32] or "bingkai"
    conn = _sql.connect(materi_bank.DB_PATH)
    if conn.execute("SELECT 1 FROM bingkai WHERE id=?", (bid,)).fetchone():
        conn.close()
        raise HTTPException(status_code=409, detail="ID bingkai sudah ada")
    from datetime import datetime as _dt, timezone as _tz
    conn.execute("INSERT INTO bingkai (id, nama, level_buka, gaya, urutan, aktif, created_at) VALUES (?,?,?,?,?,?,?)",
                 (bid, req.nama.strip(), req.level_buka, req.gaya.strip(), req.urutan, 1 if req.aktif else 0, _dt.now(_tz.utc).isoformat()))
    conn.commit()
    row = conn.execute("SELECT * FROM bingkai WHERE id=?", (bid,)).fetchone()
    conn.close()
    return dict(row)


@app.put("/api/admin/bingkai/{bingkai_id}")
def admin_ubah_bingkai(bingkai_id: str, req: BingkaiAdminRequest, payload: dict = Depends(authmod.require_admin_payload)):
    if not req.nama.strip():
        raise HTTPException(status_code=400, detail="Nama bingkai tidak boleh kosong")
    if req.level_buka < 6:
        raise HTTPException(status_code=400, detail="Level buka minimal 6")
    import sqlite3 as _sql
    conn = _sql.connect(materi_bank.DB_PATH)
    if not conn.execute("SELECT 1 FROM bingkai WHERE id=?", (bingkai_id,)).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Bingkai tidak ditemukan")
    conn.execute("UPDATE bingkai SET nama=?, level_buka=?, gaya=?, urutan=?, aktif=? WHERE id=?",
                 (req.nama.strip(), req.level_buka, req.gaya.strip(), req.urutan, 1 if req.aktif else 0, bingkai_id))
    conn.commit()
    row = conn.execute("SELECT * FROM bingkai WHERE id=?", (bingkai_id,)).fetchone()
    conn.close()
    return dict(row)


@app.delete("/api/admin/bingkai/{bingkai_id}")
def admin_hapus_bingkai(bingkai_id: str, payload: dict = Depends(authmod.require_admin_payload)):
    import sqlite3 as _sql
    conn = _sql.connect(materi_bank.DB_PATH)
    if not conn.execute("SELECT 1 FROM bingkai WHERE id=?", (bingkai_id,)).fetchone():
        conn.close()
        raise HTTPException(status_code=404, detail="Bingkai tidak ditemukan")
    cnt = conn.execute("SELECT COUNT(*) FROM user_inventori WHERE tipe_item='bingkai' AND item_id=?", (bingkai_id,)).fetchone()[0]
    if cnt > 0:
        conn.close()
        raise HTTPException(status_code=409, detail="Tidak bisa hapus, sudah dimiliki siswa. Nonaktifkan saja")
    conn.execute("DELETE FROM bingkai WHERE id=?", (bingkai_id,))
    conn.commit(); conn.close()
    return {"message": "Bingkai dihapus", "id": bingkai_id}
