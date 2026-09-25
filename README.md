# BelajarAdaptif

Platform belajar adaptif personal berbasis AI. Lihat `PRD-BelajarAdaptif.md` (kalau kamu simpan di sini) untuk detail lengkap fitur & arsitektur.

## Struktur Project

```
belajar-adaptif/
├── backend/              # FastAPI — logic AI, database, RAG
│   ├── main.py           # entry point, semua endpoint
│   ├── llm_provider.py   # abstraksi OpenRouter/Ollama
│   ├── materi_bank.py    # perpustakaan materi (bawaan + upload)
│   ├── vault_rag.py      # retrieval dari vault Obsidian (opsional)
│   ├── obsidian_watcher.py  # auto-sync vault -> website
│   ├── requirements.txt
│   └── .env.example
├── frontend/             # React (Vite) — UI onboarding & soal
│   ├── src/
│   │   ├── main.jsx
│   │   └── App.jsx
│   ├── package.json
│   └── .env.example
└── .vscode/              # config debug & rekomendasi extension
```

## Setup Pertama Kali

### 1. Buka project di VS Code
```
code belajar-adaptif
```
VS Code akan menawarkan install extension yang direkomendasikan (Python, debugpy, ESLint, Prettier) — klik "Install All".

### 2. Setup Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Buka `.env` yang baru dibuat, isi minimal:
```
OPENROUTER_API_KEY=isi-key-openrouter-kamu-di-sini
SYNC_SECRET=buat-password-acak-sendiri
```

Di VS Code, pastikan interpreter Python yang dipakai adalah yang di `.venv` (klik versi Python di pojok kanan bawah status bar, pilih yang path-nya mengandung `.venv`).

Jalankan backend:
```bash
uvicorn main:app --reload --port 8000
```
Atau tekan **F5** di VS Code dan pilih konfigurasi "Backend: FastAPI (uvicorn)" (sudah disiapkan di `.vscode/launch.json`).

Cek di browser: buka `http://localhost:8000/docs` — kalau muncul halaman Swagger dengan daftar endpoint, backend sudah jalan dengan benar.

### 3. Setup Frontend

Buka terminal baru di VS Code (jangan tutup terminal backend):
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Buka `http://localhost:5173` di browser — harusnya langsung muncul halaman onboarding BelajarAdaptif.

### 4. Test End-to-End

1. Isi onboarding (jenjang, kelas, mapel, kuis gaya belajar, nada bicara)
2. Klik "Mulai belajar" — kalau backend & frontend sudah tersambung benar, soal pertama akan muncul dalam beberapa detik
3. Kalau muncul error "Gagal membuat soal, pastikan backend sedang jalan" — cek terminal backend, biasanya karena `OPENROUTER_API_KEY` belum diisi atau salah

## Menghubungkan Vault Obsidian (Opsional)

Lihat `backend/obsidian_watcher.py` untuk detail. Ringkasnya:

```bash
cd backend
source .venv/bin/activate
export BELAJAR_API_URL="http://localhost:8000"
export SYNC_SECRET="password-yang-sama-dengan-di-.env"
export VAULT_PATH="/path/ke/vault/obsidian/kamu"
python obsidian_watcher.py
```

Biarkan terminal ini tetap terbuka selagi kamu belajar di Obsidian — setiap catatan yang disimpan otomatis ter-sync & diringkas ke materi bank.

### Import semua catatan yang SUDAH ADA sekaligus (bulk sync)

Kalau kamu sudah punya banyak catatan lama dan tidak mau edit satu-satu supaya ke-sync, jalankan ini SEKALI saja (dengan environment variable yang sama seperti di atas):

```bash
python bulk_sync.py
```

Ini akan loop ke semua file `.md`/`.pdf` yang ada di vault kamu sekarang dan langsung mengirim semuanya. Setelah itu, tetap jalankan `obsidian_watcher.py` seperti biasa untuk sync otomatis ke depannya.

## Deploy ke Internet (kalau nanti mau online, bukan cuma localhost)

Karena sekarang full kamu develop sendiri (bukan lewat Emergent), untuk deploy nanti kamu bisa pakai:
- **Backend:** Railway, Render, atau Fly.io (semua ada tier gratis untuk project kecil)
- **Frontend:** Vercel atau Netlify (`npm run build` lalu upload folder `dist/`)
- Jangan lupa update `VITE_API_URL` di frontend `.env` supaya menunjuk ke URL backend yang sudah online, dan update CORS `allow_origins` di `backend/main.py` supaya tidak `"*"` lagi (ganti ke domain frontend kamu) untuk keamanan.

## Troubleshooting Umum

| Masalah | Kemungkinan Penyebab |
|---|---|
| `ModuleNotFoundError` saat run backend | Virtual environment belum aktif / `pip install -r requirements.txt` belum jalan |
| Frontend bisa buka tapi soal gagal generate | Backend belum jalan, atau `VITE_API_URL` di frontend `.env` salah |
| Error 429 dari OpenRouter | Kena rate limit gratis (~50 req/hari) — tunggu, atau ganti `LLM_PROVIDER=ollama` di `.env` |
| `obsidian_watcher.py` gagal konek | Cek `BELAJAR_API_URL` benar & backend memang sedang jalan |
