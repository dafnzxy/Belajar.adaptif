# PRD — BelajarAdaptif
**Platform belajar adaptif personal berbasis AI**

| | |
|---|---|
| **Versi dokumen** | 1.0 |
| **Tanggal** | 28 Agustus 2026 |
| **Pemilik produk** | Kamu (single-user, personal project) |
| **Status** | Draft untuk direview sebelum development dimulai |

---

## 1. Latar Belakang & Visi

Banyak platform belajar adaptif seperti pelajaran.ai mengunci fitur personalisasi (deteksi gaya belajar, soal adaptif per kelas) di balik paywall. **BelajarAdaptif** adalah versi personal yang kamu bangun dan kontrol sendiri: gratis dijalankan (pakai AI API gratis), datanya milik kamu sendiri, dan bisa disesuaikan sepenuhnya dengan cara belajar kamu.

**Visi:** satu aplikasi ringan yang tahu jenjang/kelas, gaya belajar, dan preferensi bahasa kamu, lalu terus-menerus menghasilkan soal latihan yang pas — dan makin lama makin akurat karena belajar dari riwayat jawaban kamu.

---

## 2. Tujuan Produk

1. Punya alat latihan soal yang benar-benar personal — bukan soal generik dari bank soal statis.
2. Menghilangkan biaya berlangganan dengan memanfaatkan AI API gratis.
3. Membangun sistem yang **transparan** — kamu bisa lihat & edit persis instruksi (prompt) yang dikirim ke AI, bukan black box.
4. Jadi playground pribadi untuk belajar full-stack development (React + FastAPI + integrasi LLM).

## 3. Target Pengguna

Single-user — **hanya kamu**. Implikasinya penting untuk banyak keputusan teknis di dokumen ini:
- Tidak perlu sistem multi-tenant, role-based access, atau billing.
- Autentikasi bisa sangat sederhana (bahkan opsional di MVP — cukup dijalankan di localhost/domain pribadi).
- Skala data kecil → SQLite cukup, tidak perlu database server terpisah.
- Prioritas: **kecepatan development** dan **kualitas personalisasi**, bukan skalabilitas.

## 4. Masalah yang Diselesaikan

| Masalah | Solusi BelajarAdaptif |
|---|---|
| Soal latihan online generik, tidak sesuai kelas/gaya belajar | Soal digenerate real-time sesuai profil belajar |
| Platform berbayar untuk fitur personalisasi dasar | Dibangun sendiri dengan AI API gratis |
| Tidak ada insight progres belajar dari waktu ke waktu | Riwayat jawaban tersimpan & dipakai untuk menyesuaikan kesulitan soal |
| Nada bicara aplikasi belajar sering kaku | Nada bicara AI bisa diatur (santai/netral/formal) |

## 5. Lingkup (Scope)

### Masuk Scope (V1–V3, lihat roadmap §12)
- Onboarding: pilih jenjang, kelas, mata pelajaran
- Kuis deteksi gaya belajar
- Preferensi nada bicara AI
- Generator soal pilihan ganda adaptif (via LLM)
- Riwayat jawaban & statistik dasar (jumlah benar/salah, streak)
- Penyesuaian tingkat kesulitan otomatis berdasarkan performa
- Mode "review" untuk topik yang sering salah

### Luar Scope (tidak dibangun, kecuali direvisi nanti)
- Multi-user / login banyak akun
- Pembayaran / langganan
- Aplikasi mobile native (cukup web responsive)
- Soal esai/uraian panjang yang perlu penilaian kompleks (fokus V1 di pilihan ganda)
- Video pembelajaran atau konten multimedia buatan sendiri

## 6. Persona

**"Kamu" — Pelajar mandiri**
- Ingin latihan soal cepat sesuai kelas & topik yang sedang dipelajari di sekolah/kuliah
- Lebih suka penjelasan dengan gaya bahasa santai
- Ingin tahu progres belajarnya dari waktu ke waktu, bukan cuma "benar/salah" sesaat
- Nyaman dengan teknis (developer), jadi UI boleh fungsional dulu, estetika bisa menyusul

## 7. Functional Requirements

### 7.1 Onboarding & Profil Belajar
| ID | Requirement | Prioritas |
|---|---|---|
| F1.1 | User memilih jenjang (SD/SMP/SMA) dan kelas spesifik | Must |
| F1.2 | User memilih mata pelajaran dari daftar sesuai jenjang | Must |
| F1.3 | Sistem menampilkan kuis 3–5 pertanyaan untuk deteksi gaya belajar (visual/auditori/kinestetik/membaca-menulis) | Must |
| F1.4 | User memilih nada bicara AI (santai/netral/formal) | Must |
| F1.5 | Profil (jenjang, kelas, mapel, gaya belajar, nada bicara) tersimpan persisten, tidak perlu diulang tiap sesi | Should |
| F1.6 | User bisa mengubah profil kapan saja dari menu pengaturan | Should |

### 7.2 Generator Soal
| ID | Requirement | Prioritas |
|---|---|---|
| F2.1 | Sistem membangun system prompt dinamis dari profil belajar | Must |
| F2.2 | Sistem meminta LLM generate 1 soal pilihan ganda (4 opsi) dalam format JSON terstruktur | Must |
| F2.3 | Sistem memvalidasi response JSON (field lengkap, kunci jawaban valid) sebelum ditampilkan | Must |
| F2.4 | Jika parsing gagal, sistem retry otomatis maksimal 2x sebelum menampilkan error ke user | Should |
| F2.5 | Sistem menghindari mengulang topik yang sama persis dengan soal sebelumnya (kirim `topik_terakhir` di prompt) | Should |
| F2.6 | User bisa minta "soal berikutnya" tanpa mengulang onboarding | Must |
| F2.7 | Tingkat kesulitan soal menyesuaikan otomatis: naik setelah 3 jawaban benar berturut-turut di topik yang sama, turun setelah 2 salah berturut-turut | Could (V2) |

### 7.3 Riwayat & Progres
| ID | Requirement | Prioritas |
|---|---|---|
| F3.1 | Setiap soal & jawaban user (benar/salah, waktu) disimpan ke database | Must |
| F3.2 | Dashboard menampilkan statistik: total soal dikerjakan, persentase benar, streak harian | Should |
| F3.3 | Dashboard menampilkan breakdown performa per mata pelajaran & topik | Could (V2) |
| F3.4 | Mode "review": tampilkan ulang topik dengan tingkat kesalahan tertinggi | Could (V3) |

### 7.4 Transparansi & Kontrol
| ID | Requirement | Prioritas |
|---|---|---|
| F4.1 | User bisa melihat system prompt persis yang dikirim ke AI untuk tiap soal | Should |
| F4.2 | User bisa mengedit template prompt dasar (misal menambah instruksi khusus) | Could (V3) |

## 8. Non-Functional Requirements

| Kategori | Requirement |
|---|---|
| **Biaya** | Harus bisa berjalan 100% di tier gratis AI API untuk pemakaian normal (≤50 soal/hari) |
| **Performa** | Soal baru muncul dalam <5 detik dari klik "soal berikutnya" (tergantung latensi LLM) |
| **Keamanan** | API key AI disimpan di backend/env variable, tidak pernah dikirim ke frontend |
| **Reliabilitas** | Jika LLM gagal merespons/JSON invalid, aplikasi tidak crash — tampilkan pesan error yang bisa di-retry |
| **Portabilitas** | Data (profil, riwayat) tersimpan lokal (SQLite) supaya mudah backup/pindah hosting |
| **Maintainability** | Prompt template & daftar mapel disimpan terpisah dari logic (mudah diedit tanpa ubah kode inti) |

## 9. Arsitektur Teknis

```
┌─────────────────┐      HTTPS       ┌──────────────────┐      HTTPS      ┌─────────────────┐
│  Frontend React  │ ───────────────▶ │  Backend FastAPI  │ ──────────────▶ │  Gemini API      │
│  (onboarding,    │ ◀─────────────── │  (prompt builder,  │ ◀────────────── │  (generate soal) │
│  kartu soal, dsb)│                  │  validasi, DB)     │                  └─────────────────┘
└─────────────────┘                  └────────┬──────────┘
                                               │
                                        ┌──────▼──────┐
                                        │   SQLite    │
                                        │ (profil,    │
                                        │  riwayat)   │
                                        └─────────────┘
```

- **Frontend:** React (sudah ada dari prototype `BelajarAdaptif.jsx`)
- **Backend:** FastAPI (sudah sesuai stack project kamu di Emergent)
- **AI Provider:** Google Gemini API (free tier) — lihat §11
- **Database:** SQLite untuk V1 (cukup untuk single-user); bisa migrasi ke PostgreSQL kalau nanti perlu multi-device sync
- **Hosting:** tetap di Emergent, atau self-host (Railway/Render tier gratis + SQLite volume)

## 10. Data Model (draf)

**`learning_profile`**
| Field | Tipe | Keterangan |
|---|---|---|
| id | int, PK | |
| jenjang | text | sd/smp/sma |
| kelas | int | |
| mapel | text | mata pelajaran aktif saat ini |
| learning_style | text | visual/auditori/kinestetik/membaca |
| tone | text | santai/netral/formal |
| updated_at | datetime | |

**`question_history`**
| Field | Tipe | Keterangan |
|---|---|---|
| id | int, PK | |
| topik | text | |
| mapel | text | |
| pertanyaan | text | |
| pilihan_json | text (JSON) | |
| kunci | text | |
| jawaban_user | text | nullable |
| is_correct | bool | |
| difficulty_level | int | 1–5, untuk logic adaptif V2 |
| created_at | datetime | |

**`daily_stats`** (opsional, bisa dihitung on-the-fly dari `question_history` di V1)
| Field | Tipe |
|---|---|
| date | date, PK |
| total_soal | int |
| total_benar | int |
| streak | int |

## 11. Rekomendasi AI Provider

| Provider | Kuota gratis | Kelebihan | Kekurangan |
|---|---|---|---|
| **Google Gemini API** (rekomendasi utama) | 1.500 req/hari (Flash/Flash-Lite), 1M TPM | Kuota paling longgar, kualitas Bahasa Indonesia bagus, gratis tanpa expired | Prompt bisa dipakai training di tier gratis |
| **Groq API** | 1.000–14.400 req/hari tergantung model | Sangat cepat (300–800 token/detik) | Hanya model open-source, kualitas sedikit di bawah Gemini untuk instruksi kompleks |
| **OpenRouter** | Bervariasi per model `:free` | Bisa gonta-ganti model tanpa ubah kode | Kuota per model biasanya lebih ketat |

**Keputusan:** pakai **Gemini 2.5/3 Flash** sebagai provider utama di `backend_reference.py` (tinggal ganti client `anthropic` → Google Generative AI SDK). Struktur prompt & validasi JSON yang sudah dirancang tetap sama persis — cuma bagian pemanggilan API yang beda.

## 12. Algoritma Inti (Ringkasan)

1. **Deteksi gaya belajar** — tally sederhana dari 3–5 jawaban kuis, gaya dengan skor tertinggi dipakai. Bukan model ML terpisah.
2. **Personalisasi via prompt templating** — semua preferensi (jenjang, kelas, mapel, gaya belajar, nada bicara) dirangkai jadi satu system prompt yang mengikat LLM ke konteks siswa.
3. **Adaptive difficulty (V2)** — sistem melacak jawaban benar/salah beruntun per topik, mengirim level kesulitan target (1–5) ke prompt berikutnya.
4. **Anti-repetisi** — kirim `topik_terakhir` di prompt supaya AI menghindari topik yang baru saja dibahas.
5. **Structured output** — paksa AI membalas JSON valid dengan skema tetap, divalidasi sebelum ditampilkan; retry otomatis kalau gagal parse.

## 13. Metrik Keberhasilan (Personal)

Karena ini proyek personal, "sukses" diukur dari kegunaan nyata, bukan growth:
- Kamu benar-benar pakai aplikasi ini ≥3x/minggu untuk latihan
- Tingkat kesalahan parsing JSON dari AI <5% dari total request
- Waktu tunggu soal baru terasa cepat (<5 detik)
- Setelah beberapa minggu, statistik progres terasa mencerminkan pemahaman kamu yang sebenarnya

## 14. Roadmap Bertahap

| Fase | Fokus | Output |
|---|---|---|
| **V1 — MVP** | Onboarding + generator soal dasar + koneksi ke Gemini API | Aplikasi bisa dipakai end-to-end, tanpa riwayat/statistik |
| **V2 — Progres & Adaptif** | Simpan riwayat jawaban, dashboard statistik, tingkat kesulitan otomatis | Soal makin pas seiring waktu |
| **V3 — Review & Personalisasi Lanjut** | Mode review topik lemah, edit prompt manual, export data | Alat belajar yang benar-benar personal & bisa di-tuning |
| **V4 (opsional)** | Soal esai/uraian dengan penilaian AI, gamifikasi ringan (badge, level) | Fitur tambahan sesuai kebutuhan |

**Rencana kerja kita:** bangun satu fase sekaligus, uji dulu sebelum lanjut ke fase berikutnya — dimulai dari V1 begitu PRD ini kamu setujui.

## 15. Risiko & Pertanyaan Terbuka

| Risiko | Mitigasi |
|---|---|
| Kuota gratis Gemini berubah/dikurangi Google | Desain backend supaya provider LLM mudah diganti (abstraksi 1 fungsi `call_llm()`) |
| AI kadang membalas JSON tidak valid | Validasi ketat + retry otomatis + fallback pesan error yang jelas |
| Soal yang digenerate AI kadang salah secara faktual | (Pertanyaan terbuka) Perlu mekanisme "lapor soal salah" agar bisa direview manual? |
| Data hilang kalau hosting Emergent direset | Backup rutin file SQLite, atau simpan ke Google Drive/GitHub secara berkala |

**Pertanyaan buat kamu sebelum mulai development:**
1. Statistik/dashboard progres itu prioritas tinggi dari awal, atau boleh nyusul di V2 seperti di roadmap?
2. Mau tetap pakai Anthropic API (berbayar tapi kualitas tinggi) untuk soal-soal penting, dan Gemini gratis untuk sehari-hari? Atau full Gemini saja?
3. Ada mata pelajaran/topik spesifik yang jadi prioritas pertama buat ditest waktu development?

---

*Dokumen ini adalah baseline. Begitu kamu konfirmasi/revisi bagian manapun, kita mulai development Fase V1.*
