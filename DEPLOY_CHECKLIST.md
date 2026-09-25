# Deploy Checklist — BelajarAdaptif (siap deploy)

## Wajib sebelum production

1. **Rotate secret** `backend/.env`:
   - `OPENROUTER_API_KEY` ganti dengan key baru (yang lama `sk-or-v1-648e...` sudah bocor di file & zip — revoke di openrouter.ai/keys)
   - `AUTH_SECRET_KEY` sudah terisi random `3d09b...` — JANGAN pakai default. Generate baru: `openssl rand -hex 32`
   - `ADMIN_PASSWORD` ganti ke password kuat 12+ char
   - `SYNC_SECRET` sudah terisi — ganti kalau pernah share

2. **ENV**:
   - Set `ENV=production` di backend/.env — kalau kosong/lupa, app akan WARNING tapi di production akan `RuntimeError` kalau secret kosong
   - `ALLOWED_ORIGINS` isi domain frontend production, contoh: `https://belajaradaptif.com,https://www.belajaradaptif.com`
   - `frontend/.env` / `VITE_API_URL` isi `https://api.kamu.com` (bukan localhost)

3. **CORS sudah dikunci** `main.py` → hanya `ALLOWED_ORIGINS`, methods terbatas, headers `Authorization/Content-Type/X-Sync-Token`.

4. **Auth sudah dikunci**:
   - `POST /api/generate-question`, `POST /api/ujian/generate`, `POST /api/materi/upload` wajib `Authorization: Bearer <token>` + rate limit
   - `/api/materi/saya`, `/api/catatan`, `/api/jadwal` scope per `user_id` — user A tidak bisa lihat/hapus data user B
   - `POST /api/materi/sync-text` fail-closed kalau `SYNC_SECRET` kosong (sebelumnya bypass)
   - `GET /api/health` tidak lagi bakar LLM — murah. `GET /api/health/llm` khusus admin.

5. **Token TTL 30d → 7d** `backend/auth.py:TOKEN_TTL_DETIK`. User harus relogin tiap minggu. Rate limit skor 20/menit, generate-q 12/menit, ujian 5/jam, upload 10/jam, gambar 20/jam.

6. **DB**: `DB_PATH` absolut, `PRAGMA journal_mode=WAL` + `foreign_keys=ON`. Volume Docker mount `backend/belajar.db` + `backend/uploads`. Orphan `belajar.db` di root sudah dihapus.

7. **.gitignore**: `uploads/`, `*.db-wal`, `*.log` sekarang ke-ignore. `frontend/vite.config.js` proxy + host 0.0.0.0.

## Deploy

```bash
# backend
docker compose up --build -d
# cek
curl http://localhost:8000/api/health

# frontend
cd frontend && npm ci && npm run build
# deploy dist/ ke Vercel/Netlify — set VITE_API_URL ke URL backend
```

## Setelah deploy

- Login `admin@belajaradaptif.local` → ganti password di Control Panel (jangan biarkan default).
- Test: coba hit `POST /api/generate-question` tanpa token → harus 401. Coba upload PDF tanpa login → 401.
- Monitor: `get_leaderboard`, `streak` — skor sekarang divalidasi `poin 0-50` & `sumber` allowlist.
