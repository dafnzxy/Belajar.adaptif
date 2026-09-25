# PRD — BelajarAdaptif v5 — Hierarki Materi Bertingkat (Mapel > Bab > Baca / Tes)

| | |
|---|---|
| **Versi** | 5.0.1 — Hierarki Materi (revisi) |
| **Tanggal** | 24 Sep 2026 |
| **Pemilik** | Kamu — single player |
| **Status** | Draft revisi untuk ACC → build langsung |
| **Stack** | React Vite + FastAPI + SQLite + LLM (OpenRouter/Groq/Ollama) |
| **Mode antislop** | DURING |
| **Prasyarat** | v4 responsive live, `materi-kurikulum/` 69 MD (266 bab) terimport ke builtin |

> Catatan revisi: dokumen ini memperbaiki 7 titik ambigu dari draft v5.0 — penghitungan langkah, karakter terlarang di data, rentang jumlah soal, kunci unik upsert, alur tombol vs tab di Detail Bab, kekuatan validasi lingkup materi LLM, dan verifikasi angka bab sebelum dipakai sebagai kriteria lulus. Perubahan ditandai **[REVISI]**.

---

## 1. Latar dan Masalah

Sekarang alur masih datar: pilih mapel lalu langsung dapat soal acak satu bank. Siswa SD kelas 1 yang pilih Matematika bisa bingung: belajar apa dulu, tambah atau kurang, baca dulu atau langsung tes. Tidak ada rasa buku yang bertahap.

Visi v5: alur bertingkat seperti buka buku sungguhan. Pilih mapel, lihat daftar bab yang tepat untuk kelas itu, pilih satu bab (misal Penjumlahan sampai 20), lalu di dalam bab ada dua jalur yang jelas: baca materi dulu atau langsung uji pemahaman. Tiap langkah terasa kecil dan selesai, bukan dinding pilihan yang membingungkan.

Design Read: *Aplikasi baca dan latihan untuk anak SD sampai SMA, notebook kertas hangat dengan kartu yang bisa disentuh, untuk siswa dan orang tua yang ingin alur jelas tanpa pusing, ENERGY 2 / RHYTHM 3 / MOTION 1.*

---

## 2. Tujuan v5

1. Siswa SD 1 yang pilih Matematika hanya melihat bab-bab SD 1, bukan materi SMP atau SMA.
2. Tiap bab bisa dibuka seperti halaman buku dan bisa dites terpisah.
3. **[REVISI]** Waktu dari Dashboard sampai soal pertama tampil di layar tidak lebih dari **empat ketukan**: `Materi Tersedia` > `Mapel` > `Bab` > `Mulai Tes`. Pemilihan jumlah soal terjadi di tap terakhir yang sama (chip sudah punya default terpilih, jadi tidak menambah tap terpisah).
4. Guru atau admin tetap bisa tambah atau ubah bab tanpa ubah kode.

Bukan tujuan v5: video, soal esai panjang, atau mobile native. Tetap web.

---

## 3. Siapa yang Pakai

**Siswa SD 1 sampai SMA 12.** Butuh alur yang tidak bikin takut. SD butuh kata pendek dan angka kecil. SMP butuh langkah yang rapi. SMA butuh rangkuman padat. Orang tua ikut lihat progres dari jauh.

---

## 4. Arsitektur Informasi — Tulang Punggung v5

```
Jenjang (SD/SMP/SMA) + Kelas (1-12)  — dari onboarding, tersimpan di users
  |
  +-- Mapel (sesuai MAPEL_BY_JENJANG + KURIKULUM_SCOPE)
        |
        +-- Daftar Bab (urut bab 1..n untuk mapel dan kelas itu)
              |
              +-- Detail Bab
                    |-- Tab BACA (materi markdown, contoh, kata kunci)
                    +-- Tab TES (generate soal khusus bab itu)
```

Aturan keras:

- Daftar bab selalu filter `jenjang + kelas + mapel`. Tidak ada fallback lintas jenjang di daftar. Jika kelas itu belum ada bab, tampilkan empty state yang jujur, bukan bab dari kelas lain.
- Soal di Tab Tes hanya dari konten bab itu. Prompt ujian tetap `materi_tersedia` per `materi_id` bab, bukan soal acak lintas bab.
- Soal latihan bebas tetap ada sebagai jalan pintas, tapi bukan jalan utama.
- Kedalaman hierarki dikunci di 3 level: Mapel > Bab > Baca/Tes. Tidak ada sub-bab di v5 (lihat §15 untuk v5.2).

---

## 5. Alur Utama — Contoh Nyata SD 1 Matematika Penjumlahan

1. Siswa login, Dashboard menampilkan kartu profil `SD Kelas 1` dan pilihan `Materi Tersedia`.
2. Ketuk `Materi Tersedia` lalu pilih `Matematika`. Sistem panggil `GET /api/materi?jenjang=sd&kelas=1&mapel=Matematika` dan tampilkan 4 bab: Bilangan 1-20, Penjumlahan dan Pengurangan sampai 20, Bentuk dan Ruang, Pengukuran dan Waktu.
3. Ketuk `Bab 2 - Penjumlahan dan Pengurangan sampai 20`. Masuk halaman Detail Bab dengan header bab, ringkasan 2-3 paragraf, contoh `5 kelereng + 4 kelereng = 9`, dan dua tombol utama: `Baca Materi` dan `Kerjakan Tes Bab Ini`.
4. **[REVISI - lihat §12.3 untuk detail mekanisme]** Kedua tombol ini adalah *shortcut* yang langsung mengaktifkan tab yang sesuai (`Baca Materi` -> aktifkan Tab Baca, `Kerjakan Tes Bab Ini` -> aktifkan Tab Tes). Tidak ada halaman "overview" terpisah sebelum tab; tombol dan tab bar mengontrol state yang sama.
5. Jalur A Baca: buka Tab Baca, scroll materi, ada tombol `Sudah paham, lanjut tes` di bawah.
6. Jalur B Tes: pilih jumlah soal 5/10/15/20 (default 10 sudah terpilih), ketuk `Mulai Tes`, kerjakan soal yang semuanya tentang penjumlahan dan pengurangan sampai 20 dengan angka kecil dan bahasa SD 1. Selesai tes, lihat skor dan tombol `Baca lagi` atau `Ulangi tes`.

Empat ketukan dari Dashboard ke soal pertama: `Materi Tersedia` > `Matematika` > `Bab 2` > `Mulai Tes` (chip jumlah soal sudah punya default, tidak dihitung tap terpisah).

---

## 6. Kebutuhan Fungsional

### 6.1 Navigasi Mapel ke Bab

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F5.1 | Dashboard punya pintu `Materi Tersedia` yang bawa ke `Pilih Mapel` dengan daftar mapel sesuai jenjang dan kelas aktif | Must |
| F5.2 | Setelah pilih mapel, tampilkan `Daftar Bab` untuk `jenjang+kelas+mapel` itu, urut `bab` lalu `urutan` | Must |
| F5.3 | Tiap kartu bab tampilkan `BAB n`, judul, 1 baris cuplikan, dan indikator sudah dibaca atau belum (opsional v5.1) | Must |
| F5.4 | Jika belum ada bab untuk kombinasi itu, tampilkan empty state jujur: belum ada materi, ajak latihan bebas atau hubungi admin | Must |
| F5.5 | Breadcrumb selalu tampil: `Dashboard > Matematika SD 1 > Bab 2` dan bisa diketuk untuk kembali | Should |

### 6.2 Detail Bab — Dua Jalur

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F5.6 | Halaman `Detail Bab` punya dua tab: `Baca` dan `Tes`, dikontrol satu state `tabAktif`. Default `tabAktif = 'baca'` saat halaman dibuka | Must |
| F5.7 | Tab Baca render `konten_asli` atau `ringkasan` bab sebagai markdown rapi, plus contoh dan kata kunci | Must |
| F5.8 | Tab Tes tampilkan pemilih jumlah soal (chip 5/10/15/20, default 10 terpilih) dan tombol `Mulai Tes Bab Ini` | Must |
| F5.9 | Soal di Tab Tes generate via `POST /api/ujian/generate` dengan `sumber=materi_tersedia` dan `sumber_id=bab.id` | Must |
| F5.10 | **[REVISI]** Soal di Tab Tes terkunci pada materi bab itu, divalidasi dua lapis: (1) prompt `BATAS MATERI WAJIB` yang menyertakan hanya `konten_asli`/`ringkasan` bab tsb sebagai konteks, (2) pengecekan pasca-generate berbasis daftar kata kunci topik-berat per jenjang (lihat §10.4) sebelum soal ditampilkan. Kata kunci matching adalah mitigasi tambahan, bukan satu-satunya lapisan pertahanan | Must |
| F5.11 | Tombol `Sudah paham, lanjut tes` di bawah Tab Baca mengubah `tabAktif` ke `'tes'` tanpa reload | Should |
| F5.12 | Setelah tes selesai, tampilkan skor dan dua aksi: `Baca lagi` (set `tabAktif = 'baca'`) dan `Ulangi tes` (reset state tes, tetap di `tabAktif = 'tes'`) | Should |

### 6.3 Soal Bebas Tetap Ada

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F5.13 | Dari Daftar Bab tetap ada tombol `Latihan Bebas` yang panggil `POST /api/generate-question` dengan `jenjang+kelas+mapel` dan prompt `KURIKULUM_SCOPE` | Must |
| F5.14 | Soal bebas tidak masuk hitung progres bab | Should |

### 6.4 Admin dan Kurikulum

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F5.15 | Admin bisa tambah, ubah, hapus bab per `jenjang+kelas+mapel+bab` lewat `POST/PUT/DELETE /api/admin/materi-buku` | Must |
| F5.16 | `GET /api/admin/materi-graph` tetap untuk lihat graph antar bab | Should |
| F5.17 | **[REVISI]** Import massal `python backend/import_kurikulum.py --replace` tetap jadi sumber kebenaran kurikulum 69 MD. Sebelum dipakai di produksi, pastikan kolom `jenjang, kelas, mapel, bab` punya **unique index/constraint** di tabel `materi` (tambahkan migrasi kecil jika belum ada), supaya proses upsert tidak membuat baris duplikat saat re-import | Must |

---

## 7. Kebutuhan Non Fungsional

| Kategori | Aturan |
|---|---|
| Biaya | Tetap gratis tier, `POST /api/generate-question` 1 soal dan `POST /api/ujian/generate` 5-20 soal harus jalan di free model |
| Performa | Daftar Bab muncul di bawah 600ms tanpa LLM. Tes bab muncul di bawah 8 detik untuk 5 soal di free tier |
| Keamanan | `ADMIN_EMAIL` dan `SYNC_SECRET` tetap di env, tidak ke frontend. Hapus bab hanya untuk role admin |
| Reliabilitas | Jika LLM gagal JSON, tampilkan pesan yang bisa diulang, jangan crash. Jika daftar bab kosong, empty state bukan error |
| Portabilitas | Satu file `backend/belajar.db` tetap bisa di backup. Folder `materi-kurikulum/` adalah sumber yang bisa di versioning |
| **[REVISI] Integritas data** | Kolom `judul` dan teks UI lainnya tidak boleh mengandung em dash (`—`). Gunakan tanda hubung biasa (`-`) atau titik dua saat seeding dari MD, lihat §8 |

---

## 8. Model Data

Tidak ada migrasi baru untuk v5, kecuali unique constraint di §6.4/F5.17. Tabel `materi` sudah punya kolom yang dibutuhkan:

```
materi (
  id PK,
  source_type 'builtin'|'upload',
  jenjang TEXT,        -- sd/smp/sma
  kelas INTEGER,       -- 1..12
  mapel TEXT,
  topik TEXT,          -- tanpa prefix Bab
  judul TEXT,          -- "Bab 2 - Penjumlahan dan Pengurangan sampai 20"
  konten_asli TEXT,    -- markdown bab
  ringkasan TEXT,
  bab INTEGER,         -- 1..n
  urutan INTEGER,
  terhubung_ke TEXT,   -- JSON edge graph
  created_at TEXT,
  UNIQUE (jenjang, kelas, mapel, bab)   -- [REVISI] wajib ada agar upsert aman
)
users (jenjang, kelas, learning_style, tone, onboarding_selesai) sudah ada
```

**[REVISI]** Aturan seed: satu file MD `sd/kelas-1/01-matematika.md` dipecah jadi n baris `materi` dengan `bab` berurutan. Upsert key `jenjang+kelas+mapel+bab`, didukung unique constraint di atas. Saat generate kolom `judul`, script import **wajib mengganti em dash (`—`) dengan tanda hubung biasa (`-`)** sebelum insert, supaya tidak melanggar kriteria selesai di §17.

---

## 9. API — Yang Dipakai v5

| Method | Path | Auth | Catatan v5 |
|---|---|---|---|
| GET | `/api/materi?jenjang=&kelas=&mapel=` | - | Daftar Bab untuk kelas itu, urut bab. Dipanggil di Pilih Mapel. Sudah ada `list_materi_buku` |
| GET | `/api/materi/{id}` | - | Detail satu bab. Jika belum ada, tambah endpoint ini di v5 (tipis, select by id) |
| POST | `/api/generate-question` | - | Latihan bebas, body bawa `jenjang, kelas, mapel, learning_style, tone`. Prompt sudah kunci `KURIKULUM_SCOPE` per kelas |
| POST | `/api/ujian/generate` | - | Tes bab, body `sumber=materi_tersedia, sumber_id=bab.id, jumlah_soal, learning_style, tone`. Sudah kunci konten bab |
| GET | `/api/admin/materi-graph` | admin | Graph semua bab |
| POST/PUT/DELETE | `/api/admin/materi-buku` | admin | Kelola bab |

**[REVISI]** Validasi yang dijaga v5: `mapel` harus ada di `MAPEL_BY_JENJANG[jenjang]`, `kelas` harus di rentang jenjang itu. `jumlah_soal` divalidasi backend pada rentang **5-20** — disamakan dengan pilihan chip di UI (F5.8) supaya tidak ada gap antara apa yang backend izinkan dan apa yang bisa dipilih user.

---

## 10. Aturan Prompt LLM v5

1. `build_system_prompt` tetap pakai `KURIKULUM_SCOPE[(jenjang,kelas)][mapel]` sebagai daftar yang diizinkan. Ada blok `BATAS MATERI WAJIB` yang melarang soal di luar daftar untuk kelas itu.
2. `materi_bank.get_context_for_mapel` sudah filter `jenjang+kelas` dulu, fallback baru ke mapel umum. Jadi SD 1 tidak kecampur SMP.
3. `build_ujian_prompt` untuk Tes Bab tetap `SATU-SATUNYA sumber soal adalah konten bab itu`. Jangan tambah fakta luar.
4. Untuk SD 1-3, saring `context_chunks` yang mengandung kata SMP, SMA, atau topik berat sebelum masuk prompt.
5. **[REVISI]** Lapis validasi pasca-generate (dua lapis, bukan cuma keyword matching):
   - **Lapis 1 - keyword filter**: cek respons LLM terhadap daftar kata kunci topik-berat per jenjang (mis. "turunan", "integral", "aljabar lanjut" untuk SD). Kalau kena, langsung tolak dan regenerate.
   - **Lapis 2 - cek relevansi ringan**: bandingkan istilah kunci di `konten_asli`/`ringkasan` bab dengan istilah yang muncul di soal hasil generate (overlap kata kunci minimal). Kalau soal tidak menyentuh istilah dari bab sama sekali, tandai sebagai kemungkinan bocor dan regenerate sekali sebelum ditampilkan ke user.

---

## 11. Desain UI — Keputusan dan Alasan (antislop DURING)

**Token tetap:** ink #1B2A4A, paper #F6F5F0, marigold #F2A93B, teal #2C7873, red #D64545. Poppins 700 untuk judul, Inter untuk isi, JetBrains Mono untuk badge. Notebook paper dengan redline dan lubang binder sebagai motif identitas.

| Keputusan | Alasan satu baris |
|---|---|
| Daftar Bab pakai kartu vertikal dengan label `BAB 1` kecil di atas judul | Biar urutan buku langsung kebaca tanpa harus buka |
| Detail Bab pakai dua tab `Baca` dan `Tes` di satu halaman, bukan dua halaman terpisah | Biar siswa bisa bolak balik tanpa hilang konteks |
| Tombol utama di Detail Bab hanya dua: `Baca Materi` dan `Kerjakan Tes Bab Ini`, dan keduanya cuma switch tab (lihat §12.3) | Biar pilihan tidak bikin bingung, satu ketukan satu jalur, tanpa nambah halaman baru |
| Breadcrumb `Dashboard > Mapel > Bab` selalu ada di atas | Biar tidak tersesat di hierarki bertingkat |
| Kartu bab pakai border teal tipis saat dipilih, bukan shadow tebal di semua kartu | Biar hierarki jelas tanpa bikin halaman terasa mengambang |
| Empty state Daftar Bab pakai teks jujur dan tombol `Latihan Bebas` | Biar tidak ada bagian kosong yang pura pura ada |
| Tab Tes pakai chip `5/10/15/20 soal` bukan input angka bebas | Biar tap target 44px dan pilihan tidak liar, sekaligus sesuai batas backend §9 |

Dilarang di v5: gradient biru ungu full page, glassmorphism di semua kartu, grid dot sebagai background, badge kapsul `AI Powered` di atas judul, animasi Fade Up di semua elemen sekaligus, **em dash di teks maupun data (lihat §8)**.

---

## 12. Rincian Layar

### 12.1 Pilih Mapel (sudah ada, dipoles)

Grid 2 kolom di desktop, 1 kolom di phone. Chip mapel 44px tinggi, pilih satu lalu daftar bab muncul di bawah tanpa pindah halaman. Tombol `Latihan Bebas` di header daftar bab.

State: loading `Memuat bab...`, empty `Belum ada bab untuk Matematika kelas 1`, error `Gagal memuat, coba lagi`.

### 12.2 Daftar Bab

List vertikal, tiap item:

- Baris atas: `BAB 2` 10px marigold
- Judul: `Penjumlahan dan Pengurangan sampai 20` 14.5px Poppins 700
- Cuplikan 1 baris 12.5px abu
- Panah `>` di kanan, klik buka Detail Bab

Ketuk kartu buka Detail Bab. Tidak ada modal.

### 12.3 Detail Bab

Header: judul besar 22px, badge mapel dan `SD Kelas 1`, tanggal simpan kecil, dua tombol utama `Baca Materi` / `Kerjakan Tes Bab Ini` tepat di bawah header.

**[REVISI - mekanisme tombol vs tab]** Halaman ini punya satu state `tabAktif` (`'baca'` atau `'tes'`). Tab bar (`Baca` / `Tes` dengan underline teal untuk yang aktif) dan dua tombol besar di header **mengontrol state yang sama** — tidak ada layer/halaman terpisah di antaranya. Klik tombol `Baca Materi` = set `tabAktif = 'baca'`. Klik tombol `Kerjakan Tes Bab Ini` = set `tabAktif = 'tes'`. Ini murni soal *affordance* ganda (tombol besar untuk first-time visual cue, tab bar untuk navigasi ulang), bukan dua mekanisme berbeda. Tab bar bisa dioperasikan dengan keyboard Tab dan Enter.

Tab Baca: render markdown bab, contoh soal gambaran, kata kunci. Di bawah ada `Sudah paham, lanjut tes` yang set `tabAktif = 'tes'`.

Tab Tes: chip jumlah soal (5/10/15/20, default 10), tombol `Mulai Tes Bab Ini` warna teal, loading `Menyusun 10 soal dari bab ini`, error bisa diulang, hasil tampil skor dan daftar benar atau salah per soal, plus `Baca lagi` (`tabAktif = 'baca'`) dan `Ulangi tes` (reset state tes, tetap `tabAktif = 'tes'`).

Semua teks tidak keluar container, semua tombol 44px di phone, tidak ada horizontal scroll di 390px.

---

## 13. Analitik dan Progres (tipis di v5)

v5 tidak tambah tabel baru. Manfaatkan yang ada:

- `POST /api/skor/tambah` dan `POST /api/akurasi/tambah` sudah dipanggil tiap jawab benar dan tiap selesai tes. Skor masuk leaderboard.
- Progres per bab bisa dihitung nanti dari `akurasi_log` per `mapel+topik` di v5.1 tanpa migrasi sekarang.

---

## 14. Pengujian

| Skenario | Harus lulus |
|---|---|
| Login sebagai SD 1, buka Materi Tersedia > Matematika, lihat hanya bab-bab SD 1 sesuai kurikulum terimpor | Daftar benar, tidak ada bab SMP, jumlah bab dicek dulu terhadap isi `materi-kurikulum/` sebelum dijadikan angka pasti di §17 |
| Buka Bab 2 SD 1, Tab Baca, baca contoh 5+4 | Render benar, tombol lanjut tes pindah tab tanpa reload |
| Tab Tes Bab 2, pilih 5 soal, mulai tes | 5 soal semua tentang penjumlahan atau pengurangan sampai 20, angka kecil, bahasa sederhana |
| Login sebagai SMA 12, buka Matematika, lihat bab-bab SMA 12 sesuai kurikulum terimpor | Daftar benar, soal tes pakai turunan dan integral sesuai bab yang dipilih |
| Phone 390px, buka Daftar Bab dan Detail Bab | Tidak ada scroll horizontal, semua tombol 44px, tab bisa pakai keyboard |
| Admin tambah bab baru untuk SD 1 Matematika | Muncul di Daftar Bab tanpa restart frontend selain refresh, tidak membuat baris duplikat saat re-import (cek unique constraint §8) |
| **[REVISI]** Cek seluruh kolom `judul` hasil import | Tidak ada karakter em dash (`—`) tersisa di data |

---

## 15. Roadmap

| Fase | Isi | Status |
|---|---|---|
| v5.0 | Hierarki Mapel > Bab > Baca/Tes seperti PRD ini | PRD ini, build setelah ACC |
| v5.1 | Tandai bab sudah dibaca, progres lingkaran per mapel, filter Leaderboard per kelas | Next |
| v5.2 | Sub bab di dalam bab besar untuk SMP dan SMA (misal Trigonometri pecah jadi 3 sub) | Later |
| v6 | Mode Buku berkelanjutan: baca Bab 1 lalu lanjut Bab 2 tanpa kembali ke daftar | Later |

---

## 16. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| LLM tetap bocor soal SMP ke SD 1 | Kunci `KURIKULUM_SCOPE` plus filter konteks per kelas plus validasi `mapel` di endpoint, ditambah dua lapis pengecekan pasca-generate di §10.5 |
| Daftar bab kosong untuk kelas baru | Empty state jujur plus tombol Latihan Bebas. Admin bisa isi lewat Control Panel atau import MD |
| Hierarki terlalu dalam bikin siswa bingung | Batasi kedalaman 3: Mapel > Bab > Baca/Tes. Tidak ada sub sub bab di v5 |
| Banyak bab (jumlah tepatnya diverifikasi dulu dari `materi-kurikulum/`, lihat §14) bikin load lambat | `GET /api/materi?jenjang=&kelas=&mapel=` hanya kembalikan bab untuk satu kombinasi, bukan semua bab sekaligus |
| **[REVISI]** Re-import kurikulum membuat baris duplikat | Pastikan unique constraint `jenjang+kelas+mapel+bab` terpasang di tabel `materi` sebelum `import_kurikulum.py --replace` dipakai di produksi |

---

## 17. Kriteria Selesai v5

- [ ] **[REVISI]** Jumlah bab per kombinasi jenjang+kelas+mapel diverifikasi dulu terhadap isi aktual `materi-kurikulum/` (bukan diasumsikan dari draft), lalu didokumentasikan sebagai angka pasti sebelum dipakai sebagai kriteria tes otomatis
- [ ] Detail Bab punya Tab Baca dan Tab Tes yang berfungsi dengan keyboard dan di phone 390px, dengan tombol header dan tab bar mengontrol state yang sama (§12.3)
- [ ] Tes Bab 5 soal untuk SD 1 hanya keluar soal penjumlahan dan pengurangan sampai 20
- [ ] Tidak ada em dash di teks UI **maupun di data seed** (kolom `judul` dan sejenisnya), tidak ada badge kapsul generik, tidak ada gradient biru ungu full page
- [ ] Rentang `jumlah_soal` di backend (§9) sinkron dengan pilihan chip di UI (§12.3)
- [ ] Unique constraint `jenjang+kelas+mapel+bab` terpasang di tabel `materi` (§8)
- [ ] Build pass, tidak ada console error, semua tombol punya aksi nyata
- [ ] Kamu ACC

---

## 18. Yang Dibutuhkan Darimu

Balas **ACC** untuk langsung build v5 hierarki sesuai PRD revisi ini, atau **Revisi** sebut bagian mana mau ubah lagi. Begitu ACC, gue build Daftar Bab, Detail Bab Baca/Tes, kunci prompt per kelas, dan deliver dengan laporan klik dan cek phone 390px.

---

*PRD v5.0.1 — hierarki materi bertingkat, versi revisi. Dokumen ini adalah filter antislop DURING, bukan hiasan. Setiap teknik di §11 punya alasan satu baris, setiap klaim di §14 bisa diuji.*
