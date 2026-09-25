# PRD — BelajarAdaptif v6 — Level, XP, dan Hadiah Bingkai

| | |
|---|---|
| **Versi** | 6.0 — Level & Rewards |
| **Tanggal** | 24 Sep 2026 |
| **Pemilik** | Kamu — single player |
| **Status** | Draft untuk ACC → build langsung |
| **Stack** | React Vite + FastAPI + SQLite + LLM |
| **Mode antislop** | DURING |
| **Prasyarat** | v5.0.1 hierarki Mapel > Bab > Baca/Tes live, XP & akurasi sudah ada via `POST /api/skor/tambah` |

> Level bikin anak betah. XP bikin progres kelihatan. Hadiah bikin mereka balik lagi. Semua hadiah di v6 itu gratis, tidak ada pembayaran, tidak ada gacha berbayar. Fokus: bikin semangat tanpa bikin kantong bolong.

Design Read: *Koleksi dan progres untuk anak SD sampai SMA, notebook kertas hangat yang bisa dikoleksi bingkainya, untuk siswa yang suka lihat level naik dan orang tua yang mau anak rajin tanpa paksaan, ENERGY 2 / RHYTHM 2 / MOTION 1.*

---

## 1. Latar dan Masalah

Sekarang XP cuma angka di leaderboard. Tidak ada rasa naik level, tidak ada yang bisa dipamerin di profil. Anak yang rajin 7 hari berturut turut tidak dapat beda apa pun dengan yang baru login sekali. Akibatnya semangat cepat kempes.

Visi v6: tiap jawaban benar kasih XP, XP numpuk jadi level, tiap naik level buka hadiah baru. Mulai level 5 dapat bingkai profil yang bisa dipasang di avatar. Semua gratis, semua didapat dari belajar, bukan dari beli.

---

## 2. Tujuan v6

1. Siswa lihat level dan XP kapan pun di Dashboard dan Profil, update realtime setelah jawab soal.
2. Mulai level 5 ke atas tiap naik level atau tiap 2 level dapat hadiah bingkai baru yang bisa dipakai di avatar.
3. Semua hadiah bisa didapat gratis dari aktivitas belajar, tidak ada yang terkunci di balik bayar.
4. Tidak ada efek negatif ke yang belum level 5. Yang level 1 sampai 4 tetap dapat rasa progres.
5. Tetap ringan: satu tabel tambahan, tidak ada migrasi berat, tidak ada perubahan ke soal.

Bukan tujuan v6: toko koin, sistem beli, hadiah fisik, atau hadiah yang butuh biaya.

---

## 3. Siapa yang Pakai

**Siswa SD 1 sampai SMA 12.** SD suka koleksi visual. SMP suka pamer rank. SMA suka lihat progres angka. Orang tua suka lihat anak naik level tanpa harus nyuruh. Guru suka pakai level buat motivasi kelas.

---

## 4. Ide Hadiah Gratis — Saran Gue Bre

Gue bagi jadi tiga lapis, semuanya gratis dari belajar:

### A. Bingkai Avatar (utama v6)
Bingkai itu frame di sekeliling foto profil bulat. Dipasang di avatar di Dashboard, Profil, dan Leaderboard.

| Level buka | Nama bingkai | Gaya | Alasan |
|---|---|---|---|
| 5 | Bingkai Daun Muda | Hijau tipis, daun kecil di pinggir | Hadiah pertama, rasa tumbuh |
| 7 | Bingkai Bintang Kecil | Kuning, bintang 5 sudut halus | Rasa pencapaian |
| 10 | Bingkai Api Semangat | Oranye merah, ujung agak lancip | 10 itu angka bulat, butuh wow |
| 13 | Bingkai Ombak Biru | Biru teal, gelombang halus | Variasi warna dingin |
| 15 | Bingkai Mahkota Tipis | Emas tipis, mahkota kecil di atas | Rasa juara tanpa norak |
| 18 | Bingkai Pelangi Kelas | Pelangi lembut, untuk yang tekun lama | Kolektor akhir |

Semua bingkai cuma CSS/SVG border, tidak butuh gambar berbayar. Bisa pakai `border-image` atau `box-shadow` + SVG ring.

### B. Hadiah Pendukung Gratis (v6 atau v6.1, tetap gratis)
- Gelar teks di bawah nama: Penjelajah Cilik (lv5), Pemburu Soal (lv10), Penjaga Ilmu (lv15). Cuma teks, tidak butuh asset.
- Latar kartu profil mini: ganti warna paper jadi krem lebih hangat atau biru muda. Cuma warna.
- Stiker koleksi: ikon kecil di halaman Level (buku, lampu, roket). Cuma emoji atau Material Symbol yang sudah ada.
- Efek level up: confetti sederhana pakai CSS, tidak butuh library.

### C. Yang Jangan Dulu
- Koin yang bisa ditukar. Rawan disalahpahami jadi uang.
- Hadiah fisik. Butuh biaya dan logistik.
- Random box. Bikin anak kecewa kalau tidak dapat yang diinginkan.

Gue saranin v6 fokus di **A saja dulu**, B sebagai bonus kalau sempat. Semua tetap gratis.

---

## 5. Sistem XP dan Level

### 5.1 Sumber XP (tetap pakai yang ada)
- Jawab benar di Latihan Bebas: +10 XP (sudah ada `POST /api/skor/tambah` dengan `poin:10`)
- Selesai Tes Bab: +10 XP per soal benar (misal 8 dari 10 benar = +80 XP, sudah ada `poin: totalBenar * 10`)
- Bonus streak harian: +5 XP tiap hari aktif berturut turut di atas 3 hari (baru di v6, kecil saja biar tidak OP)
- Tidak ada XP untuk jawab salah. Salah tetap catat akurasi, tapi tidak dapat XP.

### 5.2 Rumus Level
Pakai kurva yang ramah di awal, agak berat di atas:

```
XP butuh untuk naik ke level L = 100 + (L-1) * 25
Level 1: 0 XP
Level 2: 100 XP
Level 3: 225 XP (100+125)
Level 4: 375 XP (225+150)
Level 5: 550 XP  <- bingkai pertama buka di sini
...
Level 10: sekitar 1625 XP
Level 15: sekitar 3250 XP
Level 20: sekitar 5375 XP
```

Rumus ini bikin SD yang jawab 10 soal benar sehari bisa naik level tiap 2 sampai 3 hari di awal, tidak terlalu cepat bosan, tidak terlalu lambat nyerah. Level dihitung dari total XP kumulatif, bukan reset tiap level.

### 5.3 Aturan Naik Level
- XP total disimpan di `skor_log` yang sudah ada (sum `poin`). Tidak buat tabel XP baru untuk skor utama.
- Level dihitung di backend tiap `GET /api/level/saya` dari total XP. Tidak simpan level di DB biar tidak perlu sync kalau ada koreksi.
- Saat naik level, frontend tampilkan animasi kecil dan toast "Naik ke Level 5! Bingkai Daun Muda terbuka!"

---

## 6. Alur Utama

1. Siswa login Dashboard. Di kartu profil sudah ada lencana `Lv 4 - 420 XP` dan progress bar ke Lv 5.
2. Kerjakan 4 soal benar (+40 XP) jadi 460 XP, belum level up, bar jalan 60 persen.
3. Besok kerjakan Tes Bab 10 soal, 9 benar (+90 XP) jadi 550 XP pas naik Lv 5.
4. Muncul modal Level Up dengan bingkai Daun Muda. Tombol `Pasang Sekarang` atau `Lihat Koleksi`.
5. Buka halaman Level. Lihat daftar bingkai: Lv5 terbuka, Lv7 terkunci dengan tulisan `Butuh Lv 7 (825 XP)`. Tap bingkai Lv5 lalu `Pakai`. Avatar di Dashboard langsung pakai bingkai hijau.
6. Teman lihat di Leaderboard, avatar dengan bingkai kelihatan beda.

Tiga ketukan dari Dashboard ke koleksi: Profil atau ikon Level > Halaman Level > Pilih Bingkai > Pakai.

---

## 7. Kebutuhan Fungsional

### 7.1 Level dan XP

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F6.1 | Tampilkan level, XP total, dan progress ke level berikutnya di Dashboard (dekat avatar) dan di Profil | Must |
| F6.2 | Hitung level dari total XP via rumus §5.2. Satu sumber kebenaran di backend | Must |
| F6.3 | Endpoint `GET /api/level/saya` kembalikan `level, xp_total, xp_level_bawah, xp_level_atas, persen, hadiah_terbuka` | Must |
| F6.4 | Bonus streak +5 XP otomatis saat streak >=3 dan ada aktivitas hari ini (hitung di `POST /api/skor/tambah` atau job kecil) | Should |
| F6.5 | Animasi naik level (confetti CSS + suara opsional mute) saat `level` baru > `level` lama setelah tambah XP | Should |

### 7.2 Hadiah Bingkai

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F6.6 | Mulai level 5, tiap level hadiah di §4A terbuka otomatis saat level tercapai | Must |
| F6.7 | Halaman `Level` tampilkan grid koleksi bingkai: yang terbuka bisa di-preview dan dipakai, yang terkunci tampil abu dengan label `Buka di Lv X` | Must |
| F6.8 | Simpan pilihan bingkai aktif per user (`users.bingkai_aktif` atau tabel `user_kosmetik`). Default null (tanpa bingkai) | Must |
| F6.9 | Endpoint `POST /api/level/bingkai/pakai` dengan body `bingkai_id` validasi: hanya boleh pakai yang sudah terbuka untuk level user | Must |
| F6.10 | Avatar dengan bingkai tampil di Dashboard, Profil, Leaderboard, dan Control Panel (admin lihat) | Must |
| F6.11 | Tombol `Lepas Bingkai` untuk kembali ke avatar polos | Should |
| F6.12 | Semua bingkai gratis. Tidak ada endpoint beli, tidak ada harga, tidak ada kunci berbayar | Must |

### 7.3 Halaman Level

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F6.13 | Route `level` di App.jsx, bisa dibuka dari Dashboard (tap lencana level) dan dari Profil | Must |
| F6.14 | Halaman Level tampilkan: level besar, XP, progress bar, grid bingkai, dan tombol kembali ke Dashboard | Must |
| F6.15 | State: loading `Memuat level...`, empty tidak ada (level selalu ada), error `Gagal memuat, coba lagi` | Must |
| F6.16 | Keyboard: Tab bisa pindah antar bingkai, Enter untuk pakai, Escape tutup modal preview | Must |

---

## 8. Model Data

Hanya satu migrasi kecil:

```sql
ALTER TABLE users ADD COLUMN bingkai_aktif TEXT; -- null atau id bingkai seperti 'daun-muda'
```

Tidak tambah tabel XP baru. `skor_log` tetap jadi sumber XP. Level dihitung on the fly:

```sql
SELECT COALESCE(SUM(poin),0) as total_xp FROM skor_log WHERE user_id = ?
```

Daftar bingkai itu konstanta di backend (array di `materi_bank.py` atau file `bingkai.py`), bukan baris DB:

```py
BINGKAI = [
  {"id":"daun-muda", "level_buka":5, "nama":"Daun Muda", "css":"..."},
  {"id":"bintang-kecil", "level_buka":7, ...},
  ...
]
```

Alasan: biar tidak perlu seed DB, cukup update konstanta kalau mau tambah bingkai baru.

---

## 9. API — Yang Baru di v6

| Method | Path | Auth | Catatan |
|---|---|---|---|
| GET | `/api/level/saya` | Bearer | Hitung level dari total XP, kembalikan level, xp_total, xp_butuh_next, persen, list bingkai dengan status terbuka atau terkunci |
| POST | `/api/level/bingkai/pakai` | Bearer | Body `{bingkai_id: string | null}`. null berarti lepas. Validasi level cukup, kalau belum buka kembalikan 403 |
| GET | `/api/level/bingkai` | Bearer | List semua bingkai dengan status untuk user itu (dipakai halaman Level) |

Endpoint lama tetap: `POST /api/skor/tambah`, `GET /api/leaderboard`, `GET /api/streak/saya`.

---

## 10. Aturan Hitung Level (Pseudocode)

```py
def level_dari_xp(xp: int):
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
```

Contoh:
- xp 550 -> level 5, bawah 375, atas 550, persen 100
- xp 600 -> level 6, bawah 550, atas 750, persen 25

Bingkai terbuka jika `level >= bingkai.level_buka`.

---

## 11. Desain UI — Keputusan dan Alasan (antislop DURING)

**Token tetap:** ink #1B2A4A, paper #F6F5F0, marigold #F2A93B, teal #2C7873, red #D64545. Poppins 700 untuk angka level, Inter untuk label, JetBrains Mono untuk XP.

| Keputusan | Alasan satu baris |
|---|---|
| Lencana level di Dashboard kecil di dekat avatar, bukan banner besar | Biar progres kelihatan tanpa nutupin materi belajar |
| Progress bar tipis di bawah lencana, warna teal, animasi lebar 400ms | Biar gerak terasa pas naik XP, tidak heboh |
| Halaman Level pakai grid 2 kolom di phone, 3 di desktop, kartu bingkai bulat preview | Biar koleksi terasa seperti album, bukan list panjang |
| Bingkai terkunci pakai overlay abu 40 persen + ikon gembok kecil, bukan hide | Biar anak tahu ada yang bisa dikejar, tetap jujur |
| Modal preview bingkai pakai avatar besar 96px di tengah | Biar jelas bedanya sebelum dipasang |
| Tidak ada gradient pelangi full page, tidak ada glow di semua bingkai | Biar bingkai yang jadi bintang, bukan background |
| Tombol Pakai warna teal solid, Lepas warna ghost | Biar aksi utama jelas satu |

Dilarang di v6: badge kapsul `AI Powered` di atas judul Level, card bingkai semua pakai shadow tebal, animasi confetti di semua halaman, harga atau label beli.

---

## 12. Rincian Layar

### 12.1 Lencana di Dashboard
- Di kartu Adaptive Engine Hub, di bawah nama, tambah baris `Lv 5 - 550 XP` 11px mono + bar 4px tinggi. Tap lencana buka Halaman Level.

### 12.2 Halaman Level
- Header: `Level 5` 32px Poppins 800, `550 XP` 13px abu, progress bar 100 persen dengan label `550 / 550  menuju Lv 6 (750 XP)`.
- Grid bingkai: tiap kartu 120px bulat, ada bingkai SVG di sekeliling avatar preview. Yang terbuka bisa tap `Preview`, yang terkunci ada label `Buka di Lv 7`.
- Modal preview: avatar 96px dengan bingkai, nama bingkai, tombol `Pakai Bingkai Ini` atau `Sudah Dipakai`.
- Empty tidak ada, loading dan error seperti §7.

### 12.3 Avatar dengan Bingkai
- Wrapper `div` relative, avatar `img` bulat 40px, bingkai `div` absolute inset -3px dengan border 3px dan SVG ring. Di Leaderboard kecilkan ke 32px.

---

## 13. Analitik dan Progres

- Tidak tambah tabel. Pakai `skor_log` yang ada.
- Event yang dicatat tetap `sumber: quiz` atau `ujian`. Bonus streak catat `sumber: streak_bonus`.
- Progres level bisa dipakai di v6.1 untuk filter Leaderboard per level band (misal Lv 1-5, 6-10).

---

## 14. Pengujian

| Skenario | Harus lulus |
|---|---|
| Akun baru 0 XP buka Halaman Level | Tampil Lv1, 0 persen, semua bingkai terkunci kecuali belum ada yang buka |
| Jawab 55 soal benar (550 XP) | Naik Lv5, toast level up, bingkai Daun Muda terbuka dan bisa dipakai |
| Pakai bingkai Lv5 lalu lihat Dashboard dan Leaderboard | Avatar pakai bingkai hijau di kedua tempat |
| Coba pakai bingkai Lv10 saat masih Lv5 | Backend tolak 403, frontend tampil `Belum terbuka, butuh Lv 10` |
| Lepas bingkai | Avatar kembali polos, `bingkai_aktif` jadi null |
| Phone 390px buka Halaman Level | Grid 2 kolom, tidak ada scroll horizontal, semua tombol 44px, Tab dan Enter jalan |

---

## 15. Roadmap

| Fase | Isi | Status |
|---|---|---|
| v6.0 | Level, XP, 6 bingkai gratis mulai Lv5, Halaman Level, pakai atau lepas bingkai | PRD ini |
| v6.1 | Gelar teks, latar kartu, stiker koleksi, filter Leaderboard per band level | Next |
| v6.2 | Misi harian (kerjakan 3 soal) kasih XP bonus tanpa ubah soal | Later |
| v7 | Teman dan pamer koleksi (lihat profil teman) | Later |

---

## 16. Risiko dan Mitigasi

| Risiko | Mitigasi |
|---|---|
| XP farming dengan soal gampang | Level butuh 100+ XP, tetap butuh banyak soal benar. Tidak ada XP untuk salah, jadi tidak bisa spam asal jawab |
| Anak kecewa bingkai terkunci lama | Bingkai pertama di Lv5 tidak jauh (550 XP sekitar 55 soal benar). Cukup 1 sampai 2 minggu untuk SD rajin |
| Bingkai bikin avatar jadi norak | Bingkai tipis 3px, warna kalem, tidak pakai animasi. Preview dulu baru pakai |
| Performa hitung level tiap request | Sum `poin` dengan index `user_id` di `skor_log` sudah cepat untuk single player. Cache 10 detik di frontend cukup |

---

## 17. Kriteria Selesai v6

- [ ] `GET /api/level/saya` hitung level dari total XP dengan rumus §5.2 dan kembalikan persen dengan benar
- [ ] Halaman Level tampil grid bingkai, yang Lv5 ke atas terbuka sesuai level, bisa pakai dan lepas
- [ ] Avatar dengan bingkai tampil di Dashboard, Profil, Leaderboard
- [ ] Naik level tampil toast dan tidak ada em dash di teks UI maupun data
- [ ] Semua hadiah gratis, tidak ada label harga atau beli
- [ ] Build pass, tidak ada console error, semua tombol punya aksi nyata, keyboard Tab dan Enter jalan, phone 390px aman
- [ ] Kamu ACC

---

## 18. Yang Dibutuhkan Darimu

Balas **ACC** untuk langsung build v6 level dan bingkai sesuai PRD ini, atau **Revisi** sebut bagian mana mau ubah. Begitu ACC, gue build migrasi `bingkai_aktif`, 6 bingkai SVG/CSS, Halaman Level, dan pasang bingkai di avatar, lalu deliver dengan laporan klik dan cek phone 390px.

---

*PRD v6.0 — level, XP, dan hadiah bingkai gratis. Dokumen ini adalah filter antislop DURING, bukan hiasan. Setiap teknik di §11 punya alasan satu baris, setiap klaim di §14 bisa diuji.*
