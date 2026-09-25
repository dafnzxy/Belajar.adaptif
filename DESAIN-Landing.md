# Desain Landing — BelajarAdaptif

Preview cepat: buka http://localhost:5173 (logout dulu) — kamu akan lihat landing, bukan langsung login.

## Screenshot mental (deskripsi)
- **Nav**: logo BA box + BETA pill, link Fitur/Cara/Jenjang (hilang di HP), tombol Masuk (outline) + Coba Gratis (ink solid)
- **Hero**: kiri teks besar + CTA, kanan kartu notebook pratinjau soal dengan 4 opsi (B hijau benar) + badge streak & AI
- **Fitur**: 6 cards + 3 cards bawah (jadwal, graph, privasi)
- **Cara Kerja**: 3 langkah bernomor 01-02-03
- **Jenjang**: 3 cards SD/SMP/SMA
- **CTA**: gradient gelap dengan 2 tombol
- **Footer**: copyright + links

## File
- `frontend/src/Landing.jsx` — komponen landing
- `frontend/src/App.jsx` — routing `showLanding` ↔ `AuthScreen`

## Flow
Landing → [Masuk] → login → Dashboard
Landing → [Daftar] → register → Dashboard
AuthScreen → [← Kembali] → Landing
Logout → Landing

## Tokens
ink #1B2A4A · paper #F6F5F0 · marigold #F2A93B · teal #2C7873 · red #D64545
Fonts: Poppins 800 (hero), Inter (body), JetBrains Mono (badge)

## PRD lengkap
Lihat `PRD-BelajarAdaptif-v2.md` §2–§5 untuk layout grid, wireframe ASCII, dan tabel requirement L1-L10.
