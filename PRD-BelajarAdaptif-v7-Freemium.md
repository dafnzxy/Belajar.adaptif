# PRD — BelajarAdaptif v7 — Freemium Gratis + Pro Berbayar (No-Lock)

| | |
|---|---|
| **Versi** | 7.0 — Freemium |
| **Tanggal** | 27 Sep 2026 |
| **Pemilik** | Kamu — single player |
| **Status** | Draft ACC → build |
| **Stack** | React Vite + FastAPI + SQLite + LLM + Midtrans Snap |
| **Mode antislop** | DURING |
| **Prasyarat** | v6 Level & Bingkai live |

> Gratis tetap bisa belajar penuh. Pro cuma buka batas harian dan kasih prioritas, bukan kunci fitur. Semua orang bisa coba dulu, bayar kalau sudah merasa layak.

Design Read: *paywall yang tidak mengunci untuk siswa SD sampai SMA yang suka gratisan, bahasa santai yang jujur, notebook kertas hangat, ENERGY 2 / RHYTHM 2 / MOTION 1.*

---

## 1. Latar

Sekarang semua fitur bisa dipakai tanpa batas, enak buat demo tapi rawan jebol quota LLM free (50 req/hari per key untuk semua user). Kalau 20 orang barengan generate soal, key habis dan semua kena 503. Perlu batas per user yang adil dan global guard, plus jalur naik ke berbayar yang tidak bikin user gratis merasa dikunci.

Visi v7: tetap gratis no-lock, cuma batasi pemakaian harian. Lewat batas kasih ajakan Pro, besok reset. Pro bayar buka batas, tidak ubah cara belajar.

## 2. Tujuan

1. Free Rp0 tetap pakai semua fitur. Hanya soal dan ujian dibatasi harian. Lewat batas tidak terkunci, cuma tunggu besok atau upgrade.
2. Pro berbayar buka unlimited dan prioritas AI, aktif 30 hari atau 365 hari, habis balik Free otomatis tanpa ganggu data.
3. Bayar lewat Midtrans Snap sandbox dulu, webhook verifikasi, tidak ada pembayaran manual.
4. Global guard 45 req/hari jaga key free tidak jebol untuk semua user.
5. Tetap ringan: 2 tabel baru, tidak ubah soal atau level.

Bukan tujuan: kunci materi di balik paywall, potong fitur Free, atau paksa bayar.

## 3. Siapa yang Pakai

**Siswa SD 1 sampai SMA 12** yang mau coba gratis dulu. Orang tua yang mau lihat anak cocok sebelum bayar. Guru yang mau pakai kelas tanpa pungut. Pro untuk yang sudah yakin dan mau unlimited.

## 4. Model Freemium — Saran Gue Bre

### 4.1 Paket

| Paket | Harga | Batas harian | Lainnya |
|---|---|---|---|
| **Free** | Rp0 selamanya | 10 soal/hari, 2 ujian/hari, 10 upload/hari | Semua materi, level, bingkai tetap jalan |
| **Pro Bulanan** | Rp19rb early bird, normal Rp29rb | Unlimited soal dan ujian | Prioritas AI, ringkasan panjang |
| **Pro Tahunan** | Rp199rb | Unlimited | Hemat 43 persen vs bulanan, badge hemat di pricing |

Free tidak pernah dikunci. Tombol Pro cuma ajakan, bukan pintu.

### 4.2 Kenapa Angka Ini

- 10 soal/hari cukup untuk 1 sesi belajar 20 menit, terasa cukup untuk coba, tidak cukup untuk eksploitasi.
- 2 ujian/hari cukup untuk tes 1 bab pagi dan 1 malam.
- 45 global jaga 50 limit free OpenRouter, sisa 5 buat jaga-jaga webhook dan health.
- 19rb itu di bawah uang jajan minggu, 29rb normal, 199rb tahunan bikin hemat terasa.

### 4.3 Yang Tidak Dibatasi

Level, bingkai, catatan, jadwal, leaderboard, profil, baca materi. Semua tetap jalan di Free.

## 5. Batas — Aturan Hitung

### 5.1 Hitung Harian

- Hari pakai WIB 00:00 sampai 23:59.
- Sumber hitung: `skor_log` dan `materi` dengan `created_at` hari ini per `user_id` untuk soal dan ujian, plus counter memory untuk cepat.
- Pro lewat tanpa cek.

### 5.2 Respon Saat Habis

- `429` dengan pesan: Habis untuk hari ini, reset jam 00:00 WIB. Mau lanjut sekarang, jadi Pro yuk.
- Frontend baca 429 dan tampilkan banner di Quiz dan Ujian, bukan modal paksa. Ada tombol Lihat Paket dan Besok Lagi.
- Tidak ada redirect paksa, user tetap bisa baca materi.

### 5.3 Global Guard

- File atau tabel `global_llm_hits` hitung semua `call_llm` hari ini.
- Kalau >=45, semua Free kena 429, Pro tetap pakai key berbayar atau antre Ollama. Fallback Ollama tetap jalan kalau ada.

## 6. Pembayaran — Midtrans Snap

### 6.1 Kenapa Midtrans

Pasar Indonesia, QRIS, VA BCA Mandiri BNI, Gopay, ShopeePay, Alfamart semua dalam satu Snap. Fee 2.9 persen tanpa bulanan, daftar gratis, sandbox langsung bisa coba pakai kartu test 4811 1111 1111 1114. Trust lokal lebih tinggi dari Stripe untuk rupiah. Stripe belum full rupiah. Xendit jadi plan B kalau Midtrans ribet, fee sama.

### 6.2 Biaya

Pro 19rb fee 551, bersih 18449. Tahunan 199rb fee 5771, bersih 193229. Cukup buat ganti key berbayar setelah 100 pelanggan.

### 6.3 Alur

1. User klik Jadi Pro di Pricing atau banner habis batas.
2. Frontend `POST /api/payment/create` dengan `plan: monthly atau yearly`, pakai Bearer token.
3. Backend bikin `order_id` `BA-{user_id}-{timestamp}`, simpan `payments` pending, panggil Midtrans Snap create transaction. Kalau `MIDTRANS_SERVER_KEY` belum ada, pakai mock token untuk demo.
4. Balik `snap_token` dan `redirect_url`. Frontend buka Snap popup.
5. User bayar. Di sandbox pakai kartu test atau QRIS simulator.
6. Midtrans `POST /api/payment/webhook` dengan signature. Backend cek `SHA512(order_id+status+amount+server_key)`, kalau valid set `payments.status=settlement` dan `subscriptions` active dengan `end_at` +30 atau +365 hari.
7. Frontend polling `GET /api/payment/status?order_id=...` tiap 2 detik sampai settlement, lalu tampil Pro aktif sampai 27 Okt, limits hilang.

### 6.4 Aman

- Webhook cek signature, tolak kalau tidak cocok.
- `order_id` unik, tidak bisa dipakai ulang.
- Expired 24 jam kalau tidak dibayar, cron ubah jadi expired.
- Habis masa Pro balik Free otomatis, tidak hapus data.

## 7. Alur Utama

1. Siswa baru daftar, langsung Free. Kerjakan 10 soal, habis, muncul banner. Masih bisa baca materi dan lihat level.
2. Besok reset, bisa 10 lagi. Atau klik Jadi Pro, pilih bulanan 19rb, bayar QRIS, 1 menit jadi Pro, lanjut unlimited hari itu juga.
3. Pro habis 30 hari, balik Free, data tetap, mau lanjut bayar lagi dari Pricing.
4. Admin lihat daftar Pro di Control Panel, tidak bisa ubah manual tanpa webhook.

## 8. Kebutuhan Fungsional

### 8.1 Batas

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F7.1 | Free 10 soal/hari, 2 ujian/hari, cek di `POST /api/generate-question` dan `POST /api/ujian/generate` | Must |
| F7.2 | 429 dengan pesan reset 00:00 WIB dan ajakan Pro, bukan blokir fitur lain | Must |
| F7.3 | Pro skip cek batas | Must |
| F7.4 | `GET /api/payment/usage` kembalikan `soal_hari_ini, batas_soal, ujian_hari_ini, batas_ujian, is_pro, pro_sampai` | Must |
| F7.5 | Global 45/hari, Pro tidak kena, Free kena | Must |

### 8.2 Langganan dan Bayar

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F7.6 | `POST /api/payment/create` bikin order dan Snap token | Must |
| F7.7 | `POST /api/payment/webhook` verifikasi signature dan aktifkan langganan | Must |
| F7.8 | `GET /api/payment/status` cek status order | Must |
| F7.9 | `GET /api/payment/subscription` cek Pro aktif dan tanggal habis | Must |
| F7.10 | Cron atau cek tiap request: kalau `end_at` lewat, status jadi expired, user balik Free | Must |
| F7.11 | Pricing page di frontend dengan dua paket, tidak 3 kolom default | Must |

### 8.3 Halaman Harga

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F7.12 | Route `pricing` bisa dibuka dari Dashboard, banner habis, dan Profil | Must |
| F7.13 | Dua kartu Free dan Pro, Tahunan sebagai varian di kartu Pro, bukan kolom ketiga | Must |
| F7.14 | Tombol Pilih Free tetap jalan tanpa bayar, tombol Jadi Pro buka Snap | Must |
| F7.15 | State loading, error, dan sukses bayar ada | Must |

## 9. Model Data

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL, -- monthly, yearly
  status TEXT NOT NULL, -- active, expired, pending
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  order_id TEXT UNIQUE,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL, -- pending, settlement, expired, deny
  snap_token TEXT,
  midtrans_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS global_llm_hits (
  tanggal TEXT PRIMARY KEY, -- 2026-09-27
  hits INTEGER NOT NULL DEFAULT 0
);
```

Tidak ubah `users`, `skor_log`, `materi`. Migrasi ringan.

Env baru:

```
MIDTRANS_SERVER_KEY=SB-Mid-server-xxx
MIDTRANS_CLIENT_KEY=SB-Mid-client-xxx
MIDTRANS_IS_PRODUCTION=false
FREE_SOAL_PER_HARI=10
FREE_UJIAN_PER_HARI=2
GLOBAL_LLM_PER_HARI=45
PRO_PRICE_MONTHLY=19000
PRO_PRICE_YEARLY=199000
```

## 10. API Baru

| Method | Path | Auth | Catatan |
|---|---|---|---|
| POST | `/api/payment/create` | Bearer | Body `{plan: monthly\|yearly}` kembalikan `order_id, snap_token, redirect_url` |
| POST | `/api/payment/webhook` | Midtrans signature | Terima notif Midtrans, aktifkan langganan |
| GET | `/api/payment/status` | Bearer | Query `order_id`, kembalikan status payments |
| GET | `/api/payment/subscription` | Bearer | Kembalikan `is_pro, plan, end_at` |
| GET | `/api/payment/usage` | Bearer | Kembalikan batas harian §5.1 |

Endpoint lama tetap, tambah cek Pro di generate.

## 11. Aturan Cek (Pseudocode)

```py
def is_pro(user_id):
    row = db.execute("SELECT * FROM subscriptions WHERE user_id=? AND status='active' AND end_at > now()", [user_id])
    return row is not None

def can_use_llm(user_id, jenis): # jenis soal atau ujian
    if is_pro(user_id): return True
    hari = today_wib()
    if global_hits(hari) >= 45: raise 429 global
    if jenis == "soal" and soal_hari_ini(user_id, hari) >= 10: raise 429 soal
    if jenis == "ujian" and ujian_hari_ini(user_id, hari) >= 2: raise 429 ujian
    return True
```

## 12. Desain UI — Keputusan dan Alasan (antislop DURING)

Token tetap: ink #1B2A4A, paper #F6F5F0, marigold #F2A93B, teal #2C7873, red #D64545. Poppins 700 untuk harga, Inter untuk label.

| Keputusan | Alasan satu baris |
|---|---|
| Pricing dua kartu, tidak 3 kolom | Karena cuma dua paket beneran, tiga itu template AI |
| Pro tidak selalu di tengah, badge Hemat di tahunan | Biar highlight ikut nilai hemat, bukan posisi tengah default |
| CTA Pro solid teal, Free ghost, harga 19rb besar 28px | Biar fokus ke aksi bayar tanpa nutupin Free |
| Banner habis batas di Quiz pakai krem hangat, bukan merah blok | Biar ajakan terasa teman, bukan hukuman |
| Tidak ada gradient biru ungu full page, tidak ada pill AI Powered di atas H1 | Biar pricing terasa kertas notebook, bukan landing AI generik |
| Snap popup native Midtrans, tidak bikin modal custom | Biar trust bayar ikut brand Midtrans yang dikenal |

Dilarang di v7: 3 pricing tiers dengan tengah paling populer, badge kapsul tipis glow di atas judul, animasi pulse di badge bayar, stat palsu 10K pengguna.

## 13. Rincian Layar

### 13.1 Pricing

- Header Harga yang jujur 24px Poppins 800, sub 13px abu: Gratis buat coba, Pro buat yang mau lanjut tanpa batas, reset tiap 00:00 WIB.
- Dua kartu 1 kolom di phone, 2 kolom di desktop, gap 16. Kartu Free border #E4E2D8, Kartu Pro border teal 2px.
- Di kartu Pro ada switch Bulanan dan Tahunan, tahunan tampil hemat 43 persen.
- Tombol 44px, Tab dan Enter jalan, Escape tutup Snap.

### 13.2 Banner Habis

- Di Quiz dan Ujian saat 429: bar krem dengan teks Habis untuk hari ini, reset 00:00 WIB, tombol Lihat Paket dan Besok Lagi. Tidak nutupin soal.

## 14. Pengujian

| Skenario | Harus lulus |
|---|---|
| Free bikin 10 soal hari ini, coba ke 11 | 429 dengan ajakan Pro, masih bisa baca materi |
| Besok 00:01 WIB bikin lagi | Bisa lagi 10 |
| Pro bikin 50 soal sehari | Tidak kena 429 |
| Bayar Pro bulanan via Snap sandbox | Webhook settlement, subscription active 30 hari, usage jadi unlimited |
| Habis 30 hari | Balik Free, soal ke 11 kena 429 lagi |
| Global 45 tercapai | Free kena 429 global, Pro tetap bisa |
| Phone 390px buka Pricing | Stack 1 kolom, tidak ada scroll horizontal, CTA 44px, keyboard jalan |

## 15. Roadmap

| Fase | Isi | Status |
|---|---|---|
| v7.0 | Freemium no-lock, batas harian, global guard, Midtrans sandbox, Pricing | PRD ini |
| v7.1 | Admin lihat list Pro dan manual extend untuk testing | Next |
| v7.2 | Export PDF ringkasan untuk Pro | Later |
| v8 | Kupon dan referral | Later |

## 16. Risiko

| Risiko | Mitigasi |
|---|---|
| User marah dibatasi | Free tetap 10, cukup untuk coba, pesan ramah, tidak kunci baca |
| Key free jebol sebelum global guard | Global 45 jaga, fallback Ollama tetap jalan |
| Webhook Midtrans gagal | Polling status tiap 2 detik dan tombol Cek Status manual |
| Phone pricing berantakan | Stack 1 kolom, cek 390px, 44px tap |

## 17. Kriteria Selesai

- [ ] Free 10 soal dan 2 ujian per hari, 429 ramah, besok reset
- [ ] Pro skip batas, global 45 jalan
- [ ] Midtrans sandbox create dan webhook settlement aktifkan 30 hari
- [ ] Pricing 2 kartu tampil, Snap popup jalan, polling status jalan
- [ ] Build pass, tidak ada console error, Tab Enter Escape jalan, phone 390px aman, tidak ada em dash
- [ ] Kamu ACC

## 18. Yang Dibutuhkan Darimu

Balas ACC untuk build v7 freemium dan Midtrans sandbox sesuai PRD ini, atau Revisi sebut bagian mana. Begitu ACC, gue build migrasi subscriptions dan payments, batas harian, webhook, dan Pricing, lalu deliver dengan laporan klik dan cek phone.

---

*PRD v7.0 — freemium no-lock, Pro buka batas, Midtrans Snap. Dokumen ini filter antislop DURING, tiap teknik di §12 ada alasan satu baris.*
