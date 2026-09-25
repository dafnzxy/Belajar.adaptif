# PRD — BelajarAdaptif v3
**Quality Check Up: navigasi Landing, persist onboarding, dan prompt adaptif bergambar**

| | |
|---|---|
| **Versi** | 3.0 — Draft untuk Review |
| **Tanggal** | 22 Sep 2026 |
| **Pemilik** | Frontend + Backend — App Core |
| **Status** | Draft — menunggu review lu bre sebelum build |
| **Stack** | React (Vite) + FastAPI + SQLite + OpenRouter/Ollama + Image Gen |
| **Prasyarat** | v2 live, Tailwind native sudah fix FOUC (index.css + tailwind.config.js) |
| **Mode** | antislop DURING |

---

## 1. Latar Belakang — Hasil Quality Check

Tiga temuan dari quality check lu bre:

| # | Temuan | Dampak |
|---|---|---|
| QC-01 | Dari Dashboard tidak bisa kembali ke Landing dengan rapi, hanya logout yang balik ke Landing | User bingung, tidak bisa lihat landing lagi tanpa logout |
| QC-02 | Pilihan SD/SMP/SMA + gaya belajar hilang saat reload atau logout lalu login lagi, disuruh pilih ulang | Onboarding terasa tidak kepakai, tidak ada nilai persist, user frustrasi |
| QC-03 | Prompt gaya belajar hanya label satu baris `Gaya belajar: Visual`, tidak ada adaptasi nyata. User visual harusnya dapat gambar/diagram tapi cuma beda teks tipis. Single provider + single API key jadi bottleneck rate limit | Personalisasi palsu, visual learner tidak terlayani, skala mentok satu key |

v3 memperbaiki ketiganya tanpa merusak alur yang sudah jalan.

---

## 2. Tujuan

1. Navigasi Landing dan Dashboard saling terhubung rapi, tanpa flicker, tanpa paksa logout.
2. Pilihan jenjang, kelas, dan gaya belajar tersimpan permanen di database per user, survive reload, logout, dan ganti device, bisa diedit nanti.
3. Prompt AI benar-benar adaptif per gaya belajar, dan untuk visual learner ada gambar/diagram yang di-generate. Dukungan dual provider dan dual API key supaya tidak tergantung satu pintu.

---

## 3. Ruang Lingkup

**Masuk v3:**
- Tombol dan rute Dashboard ↔ Landing
- Migrasi DB users: kolom jenjang, kelas, learning_style, tone
- Endpoint simpan dan load preferensi onboarding
- Hydrate onboarding dari DB saat login dan reload
- Prompt engine per gaya belajar yang berbeda nyata
- Image generation untuk visual learner dengan failover dual provider
- Config dual API key dengan fallback

**Keluar v3 (tunda ke v4):**
- Avatar upload ulang
- Leaderboard filter per kelas
- Offline mode
- Mobile PWA install

---

## 4. Spesifikasi Detail

### 4.1 QC-01 — Navigasi Dashboard ↔ Landing yang Rapi

**Masalah sekarang:**
`showLanding` hanya dipakai saat `!token`. Begitu user login, Landing tidak bisa diakses lagi. Satu-satunya jalan balik adalah logout.

**Solusi v3 — Design Read:**
Landing untuk visitor, App untuk user login, tapi user login tetap boleh intip Landing sebagai halaman. Bukan dua dunia terpisah, satu navigasi utuh.

| Elemen | Detail |
|---|---|
| Sumber kebenaran | `view` di App.jsx jadi `landing`, `jenjang`, `gaya`, `dashboard`, `materi-saya`, `pilih-mapel`, `catatan`, `quiz`, `pilih-ujian`, `pilih-ujian-tersedia`, `ujian`, `jadwal`, `profil`, `leaderboard` |
| Dari Landing ke Dashboard | User sudah login lalu buka Landing, header Landing ganti CTA menjadi `Kembali ke Dashboard` (bukan Coba Gratis). Klik langsung `setView(dashboard)` tanpa minta login lagi |
| Dari Dashboard ke Landing | Header app tambah link `Lihat Landing` sebelah avatar. Klik `setView(landing)` tanpa logout, token tetap, sesi tetap |
| Logout | Tetap `setShowLanding(true)` dan `setView(jenjang)` tapi dengan konfirmasi ringan |
| URL | Tetap state based di v3, hash `#landing` opsional, tidak wajib react-router di v3 untuk jaga scope kecil. v4 baru pertimbangkan router |
| Loading | Preloader tetap 700–1500ms hanya saat `authLoading`, transisi landing ↔ dashboard tanpa preloader, hanya fade 180ms |
| Mobile | Link `Lihat Landing` masuk ke drawer mobile yang sudah ada, tap target minimal 44px |

**Acceptance QC-01:**
- [ ] Dari Dashboard bisa ke Landing dan balik tanpa logout, tanpa flicker, tanpa reload
- [ ] User belum login yang buka Landing tetap lihat CTA Masuk dan Daftar seperti biasa
- [ ] User sudah login yang buka Landing lihat CTA Kembali ke Dashboard
- [ ] Back button browser tidak jebak, tidak perlu double back untuk keluar

---

### 4.2 QC-02 — Database Persist Onboarding (SD/SMP/SMA + Gaya Belajar)

**Masalah sekarang:**
`jenjang`, `kelas`, `tally` ke `learningStyle`, dan `tone` hanya `useState` di App.jsx. Tidak ada localStorage, tidak ada kolom DB, tidak ada endpoint. Refresh langsung hilang, disuruh ulang dari Langkah 1.

**Solusi v3 — satu sumber kebenaran di DB:**

**Migrasi DB — `materi_bank.py`:**

```sql
ALTER TABLE users ADD COLUMN jenjang TEXT;
ALTER TABLE users ADD COLUMN kelas INTEGER;
ALTER TABLE users ADD COLUMN learning_style TEXT;
ALTER TABLE users ADD COLUMN tone TEXT;
ALTER TABLE users ADD COLUMN onboarding_selesai INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN updated_at TEXT;
```

Fungsi migrasi baru `_migrate_add_onboarding_columns` yang cek `PRAGMA table_info(users)` dulu, aman untuk DB lama. Tidak hapus data, tidak drop table.

**API baru dan ubahan:**

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| `GET` | `/api/auth/me` | Bearer | Sudah ada, tambah field `jenjang`, `kelas`, `learning_style`, `tone`, `onboarding_selesai` di response |
| `PUT` | `/api/auth/onboarding` | Bearer | Simpan `jenjang`, `kelas`, `learning_style`, `tone`, set `onboarding_selesai=1`. Validasi jenjang kelas sesuai `MAPEL_BY_JENJANG` |
| `GET` | `/api/auth/onboarding` | Bearer | Ambil preferensi onboarding user, dipakai hydrate |
| `PUT` | `/api/auth/profil` | Bearer | Tetap untuk nama dan foto, tidak campur onboarding biar tanggung jawab terpisah |

**Alur Frontend — App.jsx:**

```
App mount
  -> cekSesi() GET /api/auth/me
       -> kalau user.onboarding_selesai == 1
            hydrate jenjang, kelas, tally, tone dari DB
            setView(dashboard) langsung, skip Langkah 1 dan 2
       -> kalau 0 atau null
            setView(jenjang) seperti sekarang
  -> Langkah 1 selesai -> simpan jenjang dan kelas ke state sementara
  -> Langkah 2 selesai -> hitung learningStyle dari tally
       -> PUT /api/auth/onboarding {jenjang, kelas, learning_style, tone}
       -> baru setView(dashboard)
  -> Di Dashboard, Ubah kelas atau gaya belajar
       -> setView(jenjang) tapi form sudah ter-prefill dari DB
       -> simpan ulang ke endpoint yang sama
  -> Reload kapan pun -> hydrate lagi dari DB, tidak minta ulang
  -> handleLogout -> clear state onboarding juga (jenjang=null kelas=null tally reset tone=netral) biar akun baru tidak bocor data akun lama
```

**Kenapa tidak localStorage saja:**
localStorage hilang kalau ganti device atau clear cache. DB adalah sumber kebenaran, localStorage hanya cache opsional kalau mau, tapi di v3 tidak pakai localStorage untuk onboarding, semua dari DB.

**Acceptance QC-02:**
- [ ] User selesai onboarding, reload, langsung Dashboard tanpa disuruh pilih SD/SMP/SMA lagi
- [ ] Logout lalu login email yang sama, tetap Dashboard, tidak ngulang onboarding
- [ ] Login dengan akun berbeda, tidak bocor jenjang akun sebelumnya
- [ ] Ubah kelas atau gaya belajar dari Dashboard lalu reload, perubahan tetap ada
- [ ] DB lama tanpa kolom baru tetap bisa migrate tanpa error dan tanpa kehilangan user
- [ ] Validasi jenjang dan kelas salah balikin 400 dengan pesan jelas

---

### 4.3 QC-03 — Prompt Adaptif Nyata + Gambar untuk Visual + Dual Provider

**Masalah sekarang:**
`build_system_prompt` cuma inject `Gaya belajar siswa: Visual (gambar & diagram)` satu baris. LLM tidak dapat instruksi berbeda yang nyata. Visual learner tidak dapat gambar. Provider cuma satu `OPENROUTER_API_KEY` dan model pertama `openrouter/free` tidak valid, jadi selalu gagal lalu fallback ke `qwen`.

**Solusi v3 — tiga lapis:**

**Lapis A — Prompt engine per gaya (beda instruksi nyata):**

| Gaya | Instruksi prompt yang di-inject | Output yang diminta |
|---|---|---|
| `visual` | Jelaskan dengan struktur visual, pakai tabel markdown, diagram ASCII sederhana, dan langkah berurutan yang bisa digambar. Buat deskripsi gambar di field `image_prompt` | Teks + `image_prompt` + `image_alt` |
| `auditori` | Jelaskan seperti tutor ngobrol, pakai analogi suara, ritme, dan ajak siswa mengulang dengan kata sendiri. Hindari tabel padat | Teks naratif mengalir, ajakan diskusi |
| `kinestetik` | Jelaskan lewat aktivitas praktik, suruh siswa coba langsung dengan benda sekitar, langkah coba dan amati | Teks instruksional do and observe |
| `membaca` | Jelaskan lewat rangkuman terstruktur, poin-poin, definisi tegas, dan rujukan baca lanjutan | Teks poin-poin rapi |

Implementasi di `main.py`: `STYLE_PROMPT_INSTRUKTUR` dict baru, `build_system_prompt` dan `build_ujian_prompt` pakai instruksi sesuai `learning_style`, bukan label saja. Response JSON tambah field opsional `image_prompt` dan `image_alt` hanya untuk visual.

**Lapis B — Image generation untuk visual learner:**

```
QuizView / UjianView
  -> generate soal -> dapat image_prompt (kalau visual)
  -> POST /api/gambar/generate {image_prompt, gaya: visual}
       -> backend panggil image provider (lihat Lapis C)
       -> simpan ke uploads/gambar/{hash}.png
       -> return {url: /uploads/gambar/xxx.png, alt: ...}
  -> tampil di atas pertanyaan sebagai <img> dengan loading dan error state
  -> kalau bukan visual, tidak ada panggilan gambar sama sekali
```

Endpoint baru:

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| `POST` | `/api/gambar/generate` | Bearer | Terima `image_prompt`, generate gambar, simpan, return URL. Rate limit ringan per user |
| `GET` | `/uploads/gambar/{file}` | public | Static serve seperti avatar |

UI di `QuizView` dan `UjianView`: gambar di atas `pertanyaan` dengan `max-width 100%`, `border-radius 12px`, `alt` dari `image_alt`. State `gambarLoading`, `gambarError` dengan placeholder yang jujur `[Gambar tidak tersedia, lanjut ke soal]`, bukan skeleton palsu.

**Lapis C — Dual provider + dual API key dengan failover:**

**Teks LLM — `llm_provider.py`:**

```python
OPENROUTER_API_KEY
OPENROUTER_API_KEY_2
OPENROUTER_FALLBACK_API_KEY

GROQ_API_KEY
GROQ_API_KEY_2

LLM_PROVIDER = "auto" | "openrouter" | "groq" | "ollama"
```

Urutan coba di `call_llm` saat `LLM_PROVIDER=auto`:
1. OpenRouter key 1 dengan model `openai/gpt-4o-mini` atau `meta-llama/llama-3.1-8b-instruct:free`
2. OpenRouter key 2 dengan model yang sama
3. Groq key 1 dengan `llama-3.1-8b-instant`
4. Groq key 2
5. Ollama lokal kalau ada
Setiap 429 atau 5xx langsung failover ke berikutnya tanpa nunggu lama, retry max 2 kali per key. Tidak ada model `openrouter/free` lagi.

**Gambar — `image_provider.py` baru:**

```python
IMAGE_PROVIDER = "openrouter" | "huggingface" | "pollinations" | "auto"
HUGGINGFACE_API_KEY
HUGGINGFACE_API_KEY_2
```

Provider gambar ringan, prioritas:
1. HuggingFace `stabilityai/stable-diffusion-xl-base-1.0` via Inference API key 1
2. HuggingFace key 2
3. Pollinations gratis tanpa key sebagai fallback terakhir (tidak simpan key)
4. Kalau semua gagal, return error jujur, soal tetap tampil tanpa gambar

**Config .env.example baru:**

```
LLM_PROVIDER=auto
OPENROUTER_API_KEY=
OPENROUTER_API_KEY_2=
GROQ_API_KEY=
GROQ_API_KEY_2=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_CHAT_MODEL=llama3.2

IMAGE_PROVIDER=auto
HUGGINGFACE_API_KEY=
HUGGINGFACE_API_KEY_2=

SYNC_SECRET=
VAULT_INDEX_PATH=vault_index.json
```

Semua key baca via `os.environ.get`, tidak ada hardcode. `backend/.env` tetap gitignored, key lama yang pernah ter-commit harus di-rotate.

**Acceptance QC-03:**
- [ ] Visual learner dapat soal dengan gambar atau diagram di atas pertanyaan, auditori dan kinestetik tidak
- [ ] Gambar gagal tidak bikin soal hilang, soal tetap tampil dengan pesan jujur
- [ ] Prompt visual, auditori, kinestetik, membaca menghasilkan gaya penjelasan yang beda nyata saat diuji topik sama
- [ ] Satu API key limit atau error, otomatis failover ke key kedua tanpa user perlu retry manual
- [ ] OpenRouter dan Groq bisa dipakai bergantian, auto mode coba keduanya
- [ ] Tidak ada model invalid `openrouter/free` lagi
- [ ] Key tidak ter-commit ke git, `.env.example` cuma template kosong

---

## 5. Antislop — Dials dan Alasan

**Design Read v3:**
Landing untuk calon siswa dan orang tua, dengan bahasa visual notebook kertas yang sudah ada, dial `ENERGY 2 / RHYTHM 2 / MOTION 1`.

| Dials | Nilai | Alasan satu baris |
|---|---|---|
| ENERGY | 2 | Ramah dan hangat untuk orang tua dan anak, tidak se-dingin Linear, tidak se-ramai Awwwards |
| RHYTHM | 2 | Konsisten tapi ada break di hero dan CTA besar, tidak monoton grid sama semua |
| MOTION | 1 | Hanya hover dan reveal halus, tidak ada parallax yang ganggu fokus belajar |

| Keputusan | Alasan satu baris |
|---|---|
| Warna ink, paper, marigold, teal tetap | Sudah jadi identitas brand, ganti warna berarti ganti brand |
| Typography Plus Jakarta Sans + JetBrains Mono | Jakarta untuk judul hangat, Mono untuk skor teknis biar beda peran |
| Navigasi state based tanpa router di v3 | Scope kecil, tidak tambah dependency, router baru di v4 kalau perlu deep link |
| DB kolom baru bukan table baru | Preferensi adalah atribut user, bukan entitas terpisah |
| Prompt per gaya beda instruksi bukan beda model | Satu model cukup kalau instruksinya tajam, ganti model boros tanpa bukti |
| Gambar hanya untuk visual | Sesuai kebutuhan, tidak semua gaya butuh gambar |
| Dual key failover bukan load balancer | Failover simpel dan deterministik, load balancer butuh infra lebih |

**Yang dijaga dari antislop:**
- Tidak ada dekorasi tanpa tujuan (R-01, R-07, R-10)
- Tidak ada statistik palsu (R-17), tidak ada testimoni fiktif (R-18)
- Tidak ada link mati (R-24, R-26), semua tombol ada aksi nyata
- Mobile rapi (R-03), kontras AA (R-25), keyboard bisa (R-32)
- Verifikasi build dan click through sebelum deliver (R-35)

---

## 6. Urutan Build

| Tahap | Kerja | Estimasi |
|---|---|---|
| 1 | Migrasi DB + endpoint onboarding + hydrate App.jsx | QC-02 dulu karena paling kritis |
| 2 | Navigasi Landing ↔ Dashboard + header link | QC-01 |
| 3 | Prompt engine per gaya + image endpoint + dual provider | QC-03 |
| 4 | Build, preview, click through semua state, delivery gate | Verifikasi |

---

## 7. Yang Dibutuhkan Darimu

Balas salah satu:
- **ACC** — langsung gue build 3 tahap di atas sesuai PRD ini
- **Revisi** — sebut bagian mana yang mau diubah, gue revisi PRD dulu baru build
- **Potong scope** — kalau mau QC-03 image ditunda ke v4, gue build QC-01 dan QC-02 dulu

Begitu ACC, gue langsung push build dan preview di http://localhost:5173.

---

*Draft v3.0 — belum di-build. Menunggu lampu hijau bre.*
