# PRD — BelajarAdaptif v4 — Responsive: Phone · Tablet · Desktop
**Final polish sebelum Q4 2026 — nol bug di HP**

| | |
|---|---|
| **Versi** | 4.0 — Final Responsive |
| **Tanggal** | 22 Sep 2026 |
| **Pemilik** | Frontend — Landing & App Shell + Dashboard |
| **Status** | Draft menunggu ACC → build langsung |
| **Stack** | React (Vite) + Tailwind native + CSS grid bento + Material Symbols |
| **Mode** | antislop DURING |
| **Prasyarat** | v3.1 live (Tailwind native FOUC fixed, onboarding persist, prompt adaptif), backend tetap |

---

## 1. Latar Belakang

Dashboard bento dan Landing udah rapi di desktop, tapi di HP masih ada celah: card mepet, grid nggak reflow, tap target belum 44px, hero Landing ada overflow di beberapa lebar. PRD ini nutup 0 bug di HP sebagai final sebelum launch.

Design Read: *Edukasi SMP/SMA untuk orang tua & siswa, notebook kertas hangat, ENERGY 2 / RHYTHM 3 / MOTION 1 di desktop jadi 2 di HP tetap varied tapi lebih stack, bukan shrink.*

---

## 2. Tujuan

1. Phone 390px: semua halaman bisa scroll vertikal halus, tidak ada horizontal overflow, semua tombol bisa di-tap jempol tanpa zoom.
2. Tablet/iPad 768–820px: bento 2 kolom, Landing grid tidak tabrakan, drawer mobile tidak dipakai (pakai nav tablet).
3. Desktop 1280–1440px: tetap seperti sekarang, tidak regresi.

---

## 3. Breakpoints & Grid Reflow (punca)

| Lebar | Nama | Grid utama | Nav | Hero Landing | Dashboard bento | Catatan |
|---|---|---|---|---|---|---|
| <640px | Phone | 1 kolom stack | Drawer `☰` dengan backdrop, trap focus, Esc tutup | Hero stack vertikal, floating pills hilang, font `text-display-lg-mobile` 36px | `bento-2col` → 1fr, `bento-3col` → 1fr, `hub-3col` → 1fr, SmartStrip 1fr | Padding `px-4` konsisten |
| 640–1023px | Tablet | 2 kolom | Nav tablet: 3 link utama visible, sisanya di drawer, CTA tetap | Hero 2 kolom sempit, pills scale 0.9 | `bento-2col` 1.2/0.8 tetap, `bento-3col` 2+1 wrap, `hub-3col` 2+1 | `lg:` Tailwind boundary di 1024 |
| ≥1024px | Desktop | Multi | Full nav `hidden md:flex` | Hero flex pusat, pills absolute terlihat | Grid penuh seperti sekarang | Max `max-w-7xl` / `maxWidth 980` di dashboard |

Semua `* { min-width: 0 }` di card biar tidak overflow, `img { max-width: 100% }`, `word-break: break-word` di judul panjang.

---

## 4. Aturan Global Responsive

| Atribut | Rule |
|---|---|
| Overflow | `html` & `body` `overflow-x: hidden`, root `overflow-x-hidden` di Landing sudah ada, App shell juga tambah |
| Tap target | Semua button minimal `44px` height, `md:hidden w-9 h-9` → `w-11 h-11` di HP biar 44px, `px-5 py-2.5` sudah 44px, `Pengaturan Belajar` & `Lihat Landing` juga 44px |
| Spacing vertikal | Gap antar section `gap-12` desktop, `gap-10` tablet, `gap-8` phone — tidak seragam 16px semua |
| Font scale | `font-display-lg 56px` desktop → `headline-lg-mobile 36px` phone, `body-lg 18px` → `body-md 15px` di phone biar tidak raksasa |
| Kartu | `card-academic` shadow sama semua → di phone shadow lebih tipis `0 4px 12px 4%` biar tidak berat |
| Modal/drawer | Backdrop `fixed inset-0`, body scroll lock saat open, close pakak Escape & klik luar, `role=dialog aria-modal` |
| Keyboard | Tab order mengikuti visual, focus ring `2px solid teal`, tidak ada `outline: none` tanpa ganti |

---

## 5. Landing — Perbaikan Phone & Tablet

| Bagian | Sebelum | Sesudah |
|---|---|---|
| Sticky nav | `w-9 h-9` tombol drawer, `px-4` | `w-11 h-11` (44px), drawer full `w-full` dengan padding `p-4`, link `py-3` 44px, ada backdrop gelap klik tutup |
| Hero | Pills `hidden lg:block` sudah bagus, tapi blur blob `w-[700px]` overflow di phone | Blob pakai `max(90vw, 700px)` tidak overflow, hero padding `pt-8 pb-12` di phone, `pt-16 pb-28` desktop |
| CTA hero | `flex-col sm:flex-row` sudah ada | `gap-3` phone, tombol full `w-full` phone, `w-auto` tablet+ |
| Section `metode` 3 col | `grid-cols-1 md:grid-cols-3` | tetap, tapi gap `gap-5` phone, card padding `p-6` phone `p-8` desktop |
| Section `program` chip | `inline-flex p-1.5 rounded-full` 3 pill — mepet di phone | Wrap `flex-wrap`, gap `1`, pill `px-4 py-2` phone (44px touch? pill kecil gapapa tapi gap antar pill 8px) |
| Fitur detail 12col | Sudah `grid-cols-1 lg:grid-cols-12` bagus | `order-2 / order-1` sudah handle phone, tambah `gap-8` phone |
| Biaya 3 tier | Render harga `Rp 199rb` — aman | Pastikan `grid-cols-1 md:grid-cols-3` reflow, tier highlight di tengah tetap border teal, di phone tier highlight full width tanpa scale aneh |

Acceptance Landing:
- [ ] Phone 390px: scroll halus, tidak ada scroll horizontal, nav drawer buka tutup Esc & backdrop, hero CTA full width, semua text tidak keluar container
- [ ] Tablet 820px: nav tidak tabrakan, hero tidak overlap, 3 col jadi 2+1 jika perlu, footer 4 kolom jadi 2 kolom
- [ ] Desktop tetap seperti screenshot v3

---

## 6. App Shell & Dashboard Bento — Perbaikan Phone & Tablet

| Bagian | Sebelum | Sesudah |
|---|---|---|
| App shell padding | `padding: 40px 20px 60px` rata semua lebar | `padding 20px 16px 40px` phone, `28px 20px 50px` tablet, `40px 20px 60px` desktop via media query |
| Adaptive Hub profil | `flex justify-between` — di phone sempit | Phone: stack vertikal `flex-col align-start`, avatar 44→48, gap 12, tombol `Pengaturan Belajar` & `Lihat Landing` full width phone, 2 kolom tablet |
| Gamifikasi 3col | `hub-3col` 3fr sudah ada → 1fr di phone via CSS | tetap, tapi di tablet 820px jadi 2 col + 1 di bawah (wrap), bukan 3 sempit |
| SmartSchedule strip | `1fr 1.6fr` → 1fr di phone sudah via `.bento-2col` | Phone: jam di atas, rekomendasi di bawah, tombol `Atur pengingat` full width |
| Bento 2col | `1.2fr 0.8fr` → 1fr phone via CSS, tapi Catatan Saya tinggi 148 belum proporsional di phone | Phone: minHeight 148 → auto, gap tetap 12, card padding sudah 32 kiri biar tidak mepet redline |
| Bento 3col | 3fr → 1fr phone, di tablet 3 kolom sempit rawan overflow | Tablet: grid `1fr 1fr` baris 1 dua kartu, baris 2 satu kartu full width |
| Leaderboard bar | `flex row` — di phone teks "Ajak teman kalau kelasmu masih sepi" kepotong | Phone: flex-col align-start, panah di bawah, text wrap `white-space: normal` |

Acceptance Dashboard:
- [ ] Phone 390px: bento 1 kolom, tidak ada card yang kepotong kanan, teks tidak mepet redline (jarak 8px dari garis), hover lift disable di touch, tap highlight jelas
- [ ] Tablet 820px: bento 2 & 3 tidak overflow, semua tombol 44px, App shell tidak scroll horizontal
- [ ] Desktop tidak regresi

---

## 7. Onboarding, Materi, Catatan, Quiz, Ujian — Perbaikan Phone

| View | Fix |
|---|---|
| Onboarding Langkah 1 | ChipGrid `columns=3` — di phone jadi `grid-cols-2` atau `3` kecil 48px terlalu sempit; ganti jadi `repeat(auto-fill, minmax(88px, 1fr))` di phone, gap 8 |
| Onboarding Langkah 2 | Pilihan `padding 13px 16px` sudah 44px tinggi — aman |
| Materi Saya list | Card `flex justify-between` — di phone stack `flex-col`, tombol Buka/Hapus `w-full` phone |
| Materi Saya form | `gridTemplateColumns 1fr 1fr` Judul/Mapel — di phone jadi 1fr stack, textarea `rows 7` tetap |
| Catatan editor | Rich controls & autosave — di phone toolbar wrap, modal tidak fixed overflow, `max-height 90vh` sudah ada |
| Pilih Mapel | ChipGrid 2 kolom — di phone tetap 2 kolom 44px tinggi, OK |
| QuizView | Skor badge & tombol — di phone skor di atas soal, tombol `Soal berikutnya` full width |
| UjianView | Progress `Soal 1/5` + gambar — gambar `max-width 100%` + `borderRadius 12` sudah, di phone margin top 8px |
| Pengaturan Belajar | `gridTemplateColumns 1fr 1fr` — di phone jadi 1fr stack (sudah handle via bento-2col? tambah kelas `pengaturan-grid` khusus) |

---

## 8. Footer & Tablet Detail

Footer sekarang 4 kolom `grid-cols-1 md:grid-cols-4` atau `flex` — di tablet jadi `grid-cols-2`, di phone `grid-cols-1 gap-6`, brand + copyright tetap center phone.

---

## 9. Testing Plan

Manual viewport di Chrome DevTools, bukan snapshot saja:

| Viewport | Device contoh | Halaman yang dibuka |
|---|---|---|
| 390×844 | iPhone 14 | Landing top→bottom, Dashboard, Materi Saya list+form, Catatan, Quiz, Ujian, Pengaturan, Login, Daftar |
| 820×1180 | iPad Air | Landing, Dashboard bento, Onboarding |
| 1440×900 | Desktop | Landing & Dashboard regresi check |
| 360×800 | Android kecil | Landing hero no overflow (edge case) |

Tiap viewport: scroll top→bottom, buka tutup drawer/modal, tap semua CTA, cek console error, check `document.documentElement.scrollWidth > innerWidth` harus false (no horizontal scroll).

---

## 10. Delivery Gate v4 (Responsive)

Block tambahan sebelum deliver:

- [ ] Tidak ada `scrollWidth > innerWidth` di 390, 820, 1440
- [ ] Semua button `getBoundingClientRect().height >= 44` di phone
- [ ] Tidak ada text yang keluar container (`overflow-wrap: break-word` di judul panjang)
- [ ] Modal/drawer bisa tutup via Escape & backdrop
- [ ] Build PASS, backend tidak berubah

---

## 11. Yang Dibutuhkan Darimu

Balas **ACC** untuk langsung build v4 responsive, atau **Revisi** sebut bagian mana mau ubah.

Begitu ACC, gue build, test 3 viewport, dan deliver dengan laporan scrollWidth & tap target.

---

*Draft v4.0 — final responsive. Belum di-build. Menunggu lampu hijau bre.*
