# PRD — BelajarAdaptif v3.1 (Revisi)
**Quality Check Up: navigasi Landing, persist onboarding, dan prompt adaptif bergambar**

| | |
|---|---|
| **Versi** | 3.1 — Draft Revisi untuk Review |
| **Tanggal** | 22 Sep 2026 |
| **Pemilik** | Frontend + Backend — App Core |
| **Status** | Draft revisi — menutup gap dari review v3.0, menunggu ACC final |
| **Stack** | React (Vite) + FastAPI + SQLite + OpenRouter/Ollama + Image Gen |
| **Prasyarat** | v2 live, Tailwind native sudah fix FOUC (index.css + tailwind.config.js) |
| **Mode** | antislop DURING |

> **Catatan revisi dari v3.0:** dokumen ini menambahkan 7 klarifikasi yang sebelumnya jadi celah — ditandai badge `[REVISI]` di bagian yang berubah.

---

## 1. Latar Belakang — Hasil Quality Check

| # | Temuan | Dampak |
|---|---|---|
| QC-01 | Dari Dashboard tidak bisa kembali ke Landing dengan rapi, hanya logout yang balik ke Landing | User bingung, tidak bisa lihat landing lagi tanpa logout |
| QC-02 | Pilihan SD/SMP/SMA + gaya belajar hilang saat reload atau logout lalu login lagi, disuruh pilih ulang | Onboarding terasa tidak kepakai, tidak ada nilai persist, user frustrasi |
| QC-03 | Prompt gaya belajar hanya label satu baris, tidak ada adaptasi nyata. Single provider + single API key jadi bottleneck rate limit | Personalisasi palsu, visual learner tidak terlayani, skala mentok satu key |

v3 memperbaiki ketiganya tanpa merusak alur yang sudah jalan.

---

## 2. Tujuan

1. Navigasi Landing dan Dashboard saling terhubung rapi, tanpa flicker, tanpa paksa logout, dan tanpa kehilangan progres kerja user.
2. Pilihan jenjang, kelas, dan gaya belajar tersimpan permanen di database per user, survive reload, logout, dan ganti device, dan bisa diedit dengan alur yang jelas.
3. Prompt AI benar-benar adaptif per gaya belajar, dengan gambar/diagram untuk visual learner yang cepat, aman, dan tidak boros kuota. Dual provider dan dual API key supaya tidak tergantung satu pintu, dengan batas jelas kalau semua provider gagal.

---

## 3. Ruang Lingkup

**Masuk v3:**
- Tombol dan rute Dashboard ↔ Landing, termasuk proteksi progres yang belum tersimpan
- Migrasi DB users: kolom jenjang, kelas, learning_style, tone
- Endpoint simpan dan load preferensi onboarding, dengan alur edit yang eksplisit
- Hydrate onboarding dari DB saat login dan reload, dengan loading state
- Prompt engine per gaya belajar yang berbeda nyata
- Image generation untuk visual learner dengan cache, timeout, filter prompt, dan failover dual provider
- Config dual API key dengan fallback, termasuk fallback kalau semua provider teks gagal
- Feature flag `IMAGE_GEN_ENABLED` untuk kill-switch cepat

**Keluar v3 (tunda ke v4):**
- Avatar upload ulang
- Leaderboard filter per kelas
- Offline mode
- Mobile PWA install
- React Router (dipertimbangkan v4 kalau butuh deep link)

---

## 4. Spesifikasi Detail

### 4.1 QC-01 — Navigasi Dashboard ↔ Landing yang Rapi

**Masalah sekarang:**
`showLanding` hanya dipakai saat `!token`. Begitu user login, Landing tidak bisa diakses lagi. Satu-satunya jalan balik adalah logout.

**Solusi v3 — Design Read:**
Landing untuk visitor, App untuk user login, tapi user login tetap boleh intip Landing sebagai halaman. Satu navigasi utuh, bukan dua dunia terpisah.

| Elemen | Detail |
|---|---|
| Sumber kebenaran | `view` di App.jsx jadi `landing`, `jenjang`, `gaya`, `dashboard`, `materi-saya`, `pilih-mapel`, `catatan`, `quiz`, `pilih-ujian`, `pilih-ujian-tersedia`, `ujian`, `jadwal`, `profil`, `leaderboard` |
| Dari Landing ke Dashboard | User sudah login lalu buka Landing, header Landing ganti CTA menjadi `Kembali ke Dashboard`. Klik langsung `setView(dashboard)` tanpa minta login lagi |
| Dari Dashboard ke Landing | Header app tambah link `Lihat Landing` sebelah avatar. Klik `setView(landing)` tanpa logout, token tetap, sesi tetap |
| **[REVISI] Proteksi progres belum tersimpan** | Kalau `view` saat ini adalah `quiz` atau `ujian` dan ada jawaban yang belum di-submit, klik `Lihat Landing` atau navigasi keluar memicu dialog konfirmasi ringan: "Progres belum disimpan, tetap keluar?". Kalau view lain (dashboard, materi, dll) yang stateless, langsung pindah tanpa konfirmasi |
| Logout | Tetap `setShowLanding(true)` dan `setView(jenjang)` tapi dengan konfirmasi ringan |
| **[REVISI] Back button browser** | Karena v3 masih state-based tanpa router, back button browser **tidak** dipetakan ke perpindahan `view` — itu tetap perilaku native browser (keluar dari tab/riwayat sebelumnya). Acceptance test diubah: yang diverifikasi adalah tidak ada trap di dalam app (misal modal yang tidak bisa ditutup), bukan back button jadi tombol navigasi internal. Kalau butuh back button jadi navigasi internal, itu didorong resmi ke v4 bareng React Router |
| URL | Tetap state based di v3, hash `#landing` opsional, tidak wajib react-router di v3 untuk jaga scope kecil |
| Loading | Preloader tetap 700–1500ms hanya saat `authLoading`, transisi landing ↔ dashboard tanpa preloader, hanya fade 180ms |
| Mobile | Link `Lihat Landing` masuk ke drawer mobile yang sudah ada, tap target minimal 44px |

**Acceptance QC-01:**
- [ ] Dari Dashboard bisa ke Landing dan balik tanpa logout, tanpa flicker, tanpa reload
- [ ] User belum login yang buka Landing tetap lihat CTA Masuk dan Daftar seperti biasa
- [ ] User sudah login yang buka Landing lihat CTA Kembali ke Dashboard
- [ ] **[REVISI]** Navigasi keluar dari quiz/ujian yang sedang berjalan dan belum submit memicu dialog konfirmasi; navigasi dari view stateless tidak memicu dialog
- [ ] **[REVISI]** Tidak ada state di dalam app yang menjebak user tanpa jalan keluar (modal tanpa tombol tutup, dsb) — back button browser diverifikasi berperilaku native, bukan navigasi internal

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
  -> setView('loading') sementara cekSesi() jalan   [REVISI: state loading eksplisit]
  -> cekSesi() GET /api/auth/me
       -> kalau user.onboarding_selesai == 1
            hydrate jenjang, kelas, tally, tone dari DB
            setView(dashboard) langsung, skip Langkah 1 dan 2
       -> kalau 0 atau null
            setView(jenjang) seperti sekarang
       -> kalau request gagal (network/500)
            setView('error-sesi') dengan tombol "Coba lagi", BUKAN otomatis balik ke jenjang
            [REVISI: cegah user dianggap belum onboarding gara-gara error jaringan]
  -> Langkah 1 selesai -> simpan jenjang dan kelas ke state sementara
  -> Langkah 2 selesai -> hitung learningStyle dari tally
       -> PUT /api/auth/onboarding {jenjang, kelas, learning_style, tone}
       -> baru setView(dashboard)
  -> Di Dashboard, ada menu "Pengaturan Belajar" (bukan ulang onboarding penuh)
       [REVISI: alur edit dipisah jadi dua opsi eksplisit]
       -> Opsi A: "Ubah jenjang/kelas" -> form dropdown langsung, prefill dari DB, submit -> PUT /api/auth/onboarding
       -> Opsi B: "Ulang tes gaya belajar" -> jalanin ulang kuis tally dari Langkah 2, hasil baru overwrite learning_style
       -> Kedua opsi TIDAK mereset jenjang/kelas milik opsi yang lain
  -> Reload kapan pun -> hydrate lagi dari DB, tidak minta ulang
  -> handleLogout -> clear state onboarding juga (jenjang=null kelas=null tally reset tone=netral) biar akun baru tidak bocor data akun lama
```

**Kenapa tidak localStorage saja:**
localStorage hilang kalau ganti device atau clear cache. DB adalah sumber kebenaran, localStorage hanya cache opsional kalau mau, tapi di v3 tidak pakai localStorage untuk onboarding, semua dari DB.

**Acceptance QC-02:**
- [ ] User selesai onboarding, reload, langsung Dashboard tanpa disuruh pilih SD/SMP/SMA lagi
- [ ] Logout lalu login email yang sama, tetap Dashboard, tidak ngulang onboarding
- [ ] Login dengan akun berbeda, tidak bocor jenjang akun sebelumnya
- [ ] **[REVISI]** Saat `cekSesi()` sedang berjalan, user melihat state loading yang jelas, bukan flash halaman pilih jenjang sebelum lompat ke dashboard
- [ ] **[REVISI]** Kalau `GET /api/auth/me` gagal karena network, user diberi opsi "Coba lagi", tidak dipaksa mengulang onboarding
- [ ] **[REVISI]** "Ubah jenjang/kelas" dan "Ulang tes gaya belajar" adalah dua aksi terpisah di menu Pengaturan Belajar, masing-masing tidak menyentuh data yang bukan miliknya
- [ ] Ubah kelas atau gaya belajar dari Dashboard lalu reload, perubahan tetap ada
- [ ] DB lama tanpa kolom baru tetap bisa migrate tanpa error dan tanpa kehilangan user
- [ ] Validasi jenjang dan kelas salah balikin 400 dengan pesan jelas

---

### 4.3 QC-03 — Prompt Adaptif Nyata + Gambar untuk Visual + Dual Provider

**Masalah sekarang:**
`build_system_prompt` cuma inject label satu baris. LLM tidak dapat instruksi berbeda yang nyata. Visual learner tidak dapat gambar. Provider cuma satu key dan model pertama tidak valid, jadi selalu gagal lalu fallback.

**Solusi v3 — tiga lapis:**

**Lapis A — Prompt engine per gaya (beda instruksi nyata):**

| Gaya | Instruksi prompt yang di-inject | Output yang diminta |
|---|---|---|
| `visual` | Jelaskan dengan struktur visual, pakai tabel markdown, diagram ASCII sederhana, dan langkah berurutan yang bisa digambar. Buat deskripsi gambar di field `image_prompt` | Teks + `image_prompt` + `image_alt` |
| `auditori` | Jelaskan seperti tutor ngobrol, pakai analogi suara, ritme, dan ajak siswa mengulang dengan kata sendiri. Hindari tabel padat | Teks naratif mengalir, ajakan diskusi |
| `kinestetik` | Jelaskan lewat aktivitas praktik, suruh siswa coba langsung dengan benda sekitar, langkah coba dan amati | Teks instruksional do and observe |
| `membaca` | Jelaskan lewat rangkuman terstruktur, poin-poin, definisi tegas, dan rujukan baca lanjutan | Teks poin-poin rapi |

Implementasi di `main.py`: `STYLE_PROMPT_INSTRUKTUR` dict baru, `build_system_prompt` dan `build_ujian_prompt` pakai instruksi sesuai `learning_style`, bukan label saja. Response JSON tambah field opsional `image_prompt` dan `image_alt` hanya untuk visual.

**[REVISI] Validasi schema respons LLM:**
Kalau `learning_style == visual` tapi LLM lupa mengembalikan `image_prompt`, backend generate fallback `image_prompt` otomatis dari isi `pertanyaan` (template sederhana: `"Diagram sederhana yang menjelaskan: {topik}"`), bukan biarkan visual learner tanpa gambar diam-diam.

**Lapis B — Image generation untuk visual learner:**

```
QuizView / UjianView
  -> generate soal -> dapat image_prompt (kalau visual)
  -> [REVISI] cek cache dulu: hash = sha256(image_prompt + gaya)
       -> kalau file uploads/gambar/{hash}.png sudah ada -> pakai langsung, skip API call
       -> kalau belum ada -> lanjut generate
  -> [REVISI] cek feature flag IMAGE_GEN_ENABLED
       -> kalau false -> skip generate, soal tampil tanpa gambar, tidak ada percobaan API sama sekali
  -> POST /api/gambar/generate {image_prompt, gaya: visual}
       -> [REVISI] backend jalankan content filter ringan dulu (blocklist kata kasar/tidak pantas
          + tolak kalau image_prompt menyebut nama orang nyata) sebelum kirim ke provider
       -> backend panggil image provider (lihat Lapis C) dengan [REVISI] timeout 12 detik per percobaan
       -> simpan ke uploads/gambar/{hash}.png
       -> return {url: /uploads/gambar/xxx.png, alt: ...}
  -> tampil di atas pertanyaan sebagai <img> dengan loading dan error state
  -> [REVISI] kalau melewati 12 detik x jumlah provider tanpa hasil, langsung tampilkan soal tanpa gambar
     dengan pesan "[Gambar tidak tersedia, lanjut ke soal]" — user tidak menunggu lebih dari ~25 detik total
  -> kalau bukan visual, tidak ada panggilan gambar sama sekali
```

Endpoint baru:

| Method | Endpoint | Auth | Fungsi |
|---|---|---|---|
| `POST` | `/api/gambar/generate` | Bearer | Terima `image_prompt`, generate gambar, simpan, return URL. **[REVISI] Rate limit: 20 request/jam per user**, balikin 429 dengan pesan jelas kalau kelewat |
| `GET` | `/uploads/gambar/{file}` | public | Static serve seperti avatar |

**[REVISI] Feature flag kill-switch:**
`IMAGE_GEN_ENABLED=true|false` di `.env`. Kalau provider gambar bermasalah di production (down, kena banned, kuota abis), admin cukup set `false` dan restart, seluruh fitur gambar mati bersih tanpa perlu deploy ulang kode. Default `true`.

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

**[REVISI] Kalau semua 5 opsi di atas gagal:**
Backend balikin `503 { "error": "layanan_sibuk", "pesan": "Semua penyedia AI sedang sibuk, coba lagi dalam beberapa menit" }`. Frontend tampilkan banner non-blocking di atas soal terakhir yang berhasil dimuat (bukan layar putih/crash), dengan tombol "Coba lagi" yang retry request yang sama. Ini state yang wajib ada di desain UI QuizView/UjianView, bukan cuma dianggap "edge case jarang terjadi".

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
IMAGE_GEN_ENABLED=true
IMAGE_GEN_TIMEOUT_SECONDS=12
IMAGE_GEN_RATE_LIMIT_PER_HOUR=20
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
- [ ] **[REVISI]** Prompt gambar yang identik (hash sama) tidak memicu API call kedua, langsung pakai file cache
- [ ] **[REVISI]** Kalau semua provider gambar tidak merespons dalam total ~25 detik, soal tetap tampil tanpa gambar, user tidak menunggu tanpa batas
- [ ] **[REVISI]** `image_prompt` yang mengandung kata tidak pantas atau nama orang nyata ditolak sebelum sampai ke provider eksternal
- [ ] **[REVISI]** `IMAGE_GEN_ENABLED=false` mematikan seluruh alur generate gambar tanpa perlu deploy ulang
- [ ] **[REVISI]** Lebih dari 20 request gambar/jam per user balikin 429 dengan pesan jelas
- [ ] **[REVISI]** Kalau semua 5 provider teks gagal, user melihat banner "Coba lagi" yang jelas, bukan layar putih/crash

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
| **[REVISI]** Cache gambar berbasis hash, bukan CDN/queue | Cukup untuk single-user/skala kecil, hemat kuota tanpa infra tambahan |
| **[REVISI]** Feature flag sederhana di .env, bukan admin panel | Kill-switch cepat cukup lewat env var, panel admin belum perlu di skala ini |

**Yang dijaga dari antislop:**
- Tidak ada dekorasi tanpa tujuan (R-01, R-07, R-10)
- Tidak ada statistik palsu (R-17), tidak ada testimoni fiktif (R-18)
- Tidak ada link mati (R-24, R-26), semua tombol ada aksi nyata
- Mobile rapi (R-03), kontras AA (R-25), keyboard bisa (R-32)
- Verifikasi build dan click through sebelum deliver (R-35)

---

## 6. Urutan Build

| Tahap | Kerja | Alasan Urutan |
|---|---|---|
| 1 | Migrasi DB + endpoint onboarding + hydrate App.jsx (termasuk loading state & alur edit) | QC-02 dulu karena paling kritis, dan menu Pengaturan Belajar dibutuhkan sebelum QC-01 selesai |
| 2 | Navigasi Landing ↔ Dashboard + header link + proteksi progres belum tersimpan | QC-01, bergantung pada view yang sudah stabil dari Tahap 1 |
| 3 | Prompt engine per gaya + image endpoint (cache, timeout, filter, rate limit, feature flag) + dual provider + fallback total gagal | QC-03, paling kompleks, butuh Tahap 1-2 selesai dulu biar testing tidak tabrakan state |
| 4 | Build, preview, click through semua state termasuk skenario gagal (network error, semua provider down, image timeout), delivery gate | Verifikasi menyeluruh sebelum deliver |

---

## 7. Yang Dibutuhkan Darimu

Balas salah satu:
- **ACC** — langsung gue build 3 tahap di atas sesuai PRD revisi ini
- **Revisi** — sebut bagian mana yang mau diubah lagi, gue revisi PRD dulu baru build
- **Potong scope** — kalau mau QC-03 image ditunda ke v4, gue build QC-01 dan QC-02 dulu

Begitu ACC, gue langsung push build dan preview di http://localhost:5173.

---

*Draft v3.1 — revisi menutup 7 gap dari review v3.0. Belum di-build. Menunggu lampu hijau bre.*
