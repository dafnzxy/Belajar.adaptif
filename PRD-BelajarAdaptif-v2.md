# PRD — BelajarAdaptif v2
**Platform belajar adaptif personal berbasis AI — Landing + App terpadu**

| | |
|---|---|
| **Versi** | 2.0 |
| **Tanggal** | 19 Sep 2026 |
| **Status** | Implemented — Landing live, Auth terintegrasi |
| **Stack** | React (Vite) + FastAPI + SQLite + OpenRouter/Ollama |

---

## 1. Ringkasan Perubahan v2

| Area | v1 | v2 |
|---|---|---|
| **Akses publik** | Langsung AuthScreen | **Landing page** dulu → CTA “Masuk” / “Coba Gratis” → AuthScreen |
| **Navigasi** | Tidak ada landing | `showLanding` state + `authInitialMode` (“login”/“daftar”) |
| **Akun admin** | Auto-create | Tetap, tapi landing tetap tampil untuk visitor non-login |
| **Desain** | Notebook paper only | Landing hero + preview soal + fitur grid + CTA footer |

---

## 2. Model Desain — Landing Page

### 2.1 Design Tokens
```
COLORS.ink        #1B2A4A   header, tombol primer
COLORS.paper      #F6F5F0   background halaman
COLORS.marigold   #F2A93B   aksen, badge, CTA sekunder
COLORS.teal       #2C7873   aksen sukses, chip mapel, lencana
COLORS.red        #D64545   error
Font Poppins 800  judul hero, logo
Font Inter 400-700 body, card
Font JetBrains Mono badge, skor, jam
```

### 2.2 Layout (top → bottom)
```
┌─────────────────────────────────────────────────┐
│ NAV (sticky, blur)  Logo BA | Fitur Cara Jenjang | Masuk | Coba Gratis │
├──────────────┬──────────────────────────────────┤
│ HERO TEXT    │  PRATINJAU SOAL (NotebookCard)   │
│ badge beta   │  Topik: Persamaan Linear         │
│ h1 "Belajar  │  4 opsi (B benar hijau)          │
│  lebih pintar"│  penjelasan + streak 12 hari    │
│ CTA primer + │  badge AI "Soal buat kamu"       │
│ sekunder     │                                  │
│ 3 statistik  │                                  │
├──────────────┴──────────────────────────────────┤
│ Chip bar: Kurikulum Merdeka — SD/SMP/SMA — Gratis │
├─────────────────────────────────────────────────┤
│ FITUR UTAMA (6 cards grid 3 col)                │
│ 🧠 Soal AI Adaptif  🎨 Gaya Belajar  📄 Materi Saya │
│ 📚 Buku Kurikulum   📝 Catatan & Ujian  🏆 Streak    │
│ + 3 cards: Jadwal & Notif | Graph Admin | Privasi │
├─────────────────────────────────────────────────┤
│ CARA KERJA (3 langkah horizontal)               │
│ 01 Onboarding → 02 Pilih sumber → 03 AI + poin  │
├─────────────────────────────────────────────────┤
│ UNTUK SIAPA (3 cards SD/SMP/SMA)                │
├─────────────────────────────────────────────────┤
│ CTA BESAR (gradient ink→teal)                   │
│ "Siap coba? Gratis..."  [Daftar] [Masuk]        │
├─────────────────────────────────────────────────┤
│ FOOTER  © 2026  Kurikulum — Privasi — Support   │
└─────────────────────────────────────────────────┘
```

### 2.3 Wireframe ASCII — Hero
```
+-------------------------------------------------+
| [BA] BelajarAdaptif [BETA]    Fitur | Masuk | CTA|
+-------------------------------------------------+
| ● AI Tutor Personal · Gratis selamanya            |
|                                                   |
| Belajar lebih         ┌─ PRATINJAU LATIHAN SOAL ─┐|
| pintar, bukan         │ TOPIK: PERSAMAAN LINEAR   │|
| lebih lama.           │ Jika 3x+7=22, x=?        │|
|                       │ ○ A 3  ● B 5 ✓ Benar!   │|
| [Mulai Gratis →] [Demo]│ ○ C 7  ○ D 9            │|
| ⭐ 4.9/5 • Tanpa kartu│ Betul! 3x=15 → x=5        │|
| [10rb+][SD-SMA][<5dtk] └────────────────────────┘|
+-------------------------------------------------+
```

### 2.4 Interaksi & State
- Visitor **belum login** (`!token`): lihat `Landing`.
- Klik **“Masuk”** → `authInitialMode="login"` → `showLanding=false` → `AuthScreen` mode login.
- Klik **“Coba Gratis / Daftar”** → `authInitialMode="daftar"` → `AuthScreen` mode daftar.
- Di AuthScreen ada **“← Kembali ke halaman utama”** → `setShowLanding(true)`.
- Setelah `handleLoggedIn` sukses → `setShowLanding(false)`, masuk app/dashboard atau Control Panel (jika admin).
- Logout → `setShowLanding(true)` kembali ke landing.
- Landing anchor links (`#fitur`, `#cara-kerja`, `#jenjang`) scroll native.

### 2.5 Responsive
- Grid hero `1.05fr 0.95fr` → `@media(max-width:820px)` jadi `1fr` (stack vertikal).
- Nav links `.hide-mobile` hilang di mobile, sisakan Masuk + CTA.
- Semua card grid pakai `repeat(auto-fit, minmax(260–280px, 1fr))` jadi reflow otomatis.

---

## 3. Alur Pengguna Lengkap v2

```
Visitor buka http://localhost:5173
    │
    ├─ belum ada ba_token → Landing
    │     ├─ [Masuk] → AuthScreen(login) ──→ Dashboard siswa / Control Panel
    │     └─ [Coba Gratis] → AuthScreen(daftar) ──→ Dashboard
    │
    └─ sudah ada ba_token + valid
          ├─ role=siswa → Dashboard langsung
          └─ role=admin → Control Panel (preview siswa opsional)
```

---

## 4. PRD Fungsional — Landing

| ID | Requirement | Prioritas |
|---|---|---|
| L1 | Halaman landing tampil untuk visitor belum login, sebelum AuthScreen | Must |
| L2 | Hero: headline, subheadline, 2 CTA (primer Daftar, sekunder Masuk/Demo) | Must |
| L3 | Preview soal notebook (mirip QuizView) sebagai social proof | Must |
| L4 | Section Fitur (6+3 cards) menjelaskan semua fitur app | Must |
| L5 | Section Cara Kerja 3 langkah | Should |
| L6 | Section Untuk Siapa (SD/SMP/SMA) | Should |
| L7 | CTA besar gradient di bawah + footer | Should |
| L8 | Nav sticky + anchor scroll ke section | Should |
| L9 | AuthScreen punya tombol kembali ke landing | Must |
| L10 | Setelah login/logout, routing landing ↔ app tidak flicker | Must |

---

## 5. File & Routing

| File | Peran |
|---|---|
| `frontend/src/Landing.jsx` | Komponen landing, props `onMasuk`, `onDaftar` |
| `frontend/src/App.jsx` | State `showLanding`, `authInitialMode`; conditional render Landing vs AuthScreen vs App |
| `frontend/src/main.jsx` | Tetap render `<App />` |
| `frontend/index.html` | Title tetap `BelajarAdaptif` |

---

## 6. Cara Menjalankan (Windows)

```powershell
# Terminal 1 — Backend
cd "belajar-adaptif (3)\belajar-adaptif\backend"
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --reload --port 8000
# cek http://localhost:8000/docs

# Terminal 2 — Frontend
cd "belajar-adaptif (3)\belajar-adaptif\frontend"
npm run dev
# cek http://localhost:5173
```

- Login admin: `admin@belajaradaptif.local` / `admin123`
- Hapus sesi: `localStorage.removeItem("ba_token")` di console browser → akan balik ke landing.

---

## 7. Next Improvements (opsional)

- Tambah animasi fade/slide di hero (Framer Motion)
- Testimoni carousel siswa beta
- SEO meta tags + Open Graph di `index.html`
- Hash routing (`/#fitur`) pakai `react-router-dom` kalau butuh deep link
- Dark mode toggle (ikuti COLORS)

---

*Dokumen ini menggantikan ringkasan desain landing yang sebelumnya hanya ada di kepala. Untuk lihat langsung, buka `http://localhost:5173` dalam keadaan logout.*
