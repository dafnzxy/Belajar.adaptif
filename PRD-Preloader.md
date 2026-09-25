# PRD — Preloader BelajarAdaptif

| | |
|---|---|
| **Versi** | 1.0 — Draft untuk Approval |
| **Tanggal** | 21 Sep 2026 |
| **Pemilik** | Frontend — Landing & App Shell |
| **Status** | ⏳ Menunggu ACC → lanjut build desain |
| **Stack** | React (Vite), CSS keyframes + Framer-motion-ready, no extra dep di v1 |

---

## 1. Latar Belakang

Landing & App sekarang load instant tanpa feedback. Di koneksi lambat / cold start, user lihat blank putih 1–3 dtk — kesan ngelag. Preloader ngasih **first impression polish** sekaligus reinforce brand (logo buku + panah orange).

## 2. Tujuan

- Tutup blank gap saat `tailwind CDN + fonts + API health` loading.
- Branding: logo `logo1.png` (265×265) tampil besar, tanpa bulat, warna teks `Belajar #1B2A4A` + `.Adaptif #F2A93B`.
- Terasa ringan, durasi pendek (<1.8 dtk), tidak bikin user nunggu.

## 3. Ruang Lingkup

**Masuk:**
- Fullscreen overlay `fixed inset-0 z-[90]` di atas Landing (dan App root saat `authLoading`).
- Animasi logo + teks + progress bar.
- Auto-dismiss saat `window.load` + minimal 900ms, max 1800ms.
- Support dark/light via `COLORS.paper`.

**Luar:**
- Tidak pakai Lottie / video berat.
- Tidak block interaksi setelah dismiss.
- Skeleton per-section (opsional v2).

## 4. Konsep Desain (3 opsi — pilih 1)

### Opsi A — **Book Open + Arrow Draw** (Rekomendasi — paling on-brand)
```
Frame 0: logo fade-in scale 0.92 → 1
Frame 1: garis panah orange di-trace pakai SVG stroke-dasharray (0.6s)
Frame 2: teks Belajar.Adaptif typing fade (Belajar dulu, .Adaptif orange nyusul 0.2s)
Frame 3: progress bar tipis di bawah (teal → orange)
```
Feel: premium, edukatif, cocok dengan logo Image 1.

### Opsi B — **Dots Notebook**
Background `paper` + dot grid, logo di tengah dengan 3 dot bouncing di bawah. Simple, playful. Cocok untuk vibe playful SD/SMP.

### Opsi C — **Minimal Pulse**
Logo besar + `Belajar.Adaptif` + satu spinner ring `border-t-transparent` orange. Paling ringan, paling cepat.

> **Usulan default: Opsi A** — karena paling nempel ke logo, tetap ringan (<4KB CSS).

## 5. Animasi Sequence Detail (Opsi A)

| Waktu | Elemen | Animasi | Easing |
|---|---|---|---|
| 0–0.25s | Overlay | fade-in `opacity 0→1` | easeOut |
| 0–0.45s | Logo `w-16 h-16 lg:w-20` | `scale 0.92→1` + `opacity` | cubic-bezier(.16,1,.3,1) |
| 0.15–0.75s | Panah overlay SVG (stroke) | `stroke-dashoffset 100→0` | easeInOut |
| 0.45–0.85s | Teks `Belajar` navy → `.Adaptif` orange | `translateY 8px→0` + fade stagger 80ms/huruf | spring |
| 0.5–1.4s | Tagline `Platform #1...` | fade-in | ease |
| 0–1.6s | Progress bar (2px, bottom) | `scaleX 0→1` | linear |
| 1.4–1.8s | Exit | `opacity 1→0` + `scale 1→1.02` lalu `display:none` | easeIn |

**Total dirasakan: ~1.4–1.6 dtk.** Kalau load lebih cepat → tetap tahan min 900ms biar tidak flicker. Kalau lambat → max 1800ms lalu force dismiss.

## 6. Spesifikasi Visual

```
Logo: /logo.png, w-16 h-16 (64px) mobile, lg:w-20 (80px) desktop, object-contain, TANPA bulat/border/bg
Teks: Poppins 800, 18px mobile / 20px desktop
  Belajar  #1B2A4A
  .Adaptif #F2A93B  (orange marigold — sesuai permintaan terakhir)
Tagline: Inter 500, 11px, #6B7280, letterSpacing .4
Progress: h-[2px], bg #EDEBE2, fill #2C7873 → #F2A93B gradient
Overlay: bg #F6F5F0 (paper), backdrop-blur 0, z-[90]
```

## 7. Spesifikasi Teknis

- File: `frontend/src/Preloader.jsx` + `frontend/src/preloader.css` (atau inline `<style>` di Landing — reuse pola landing sekarang).
- Tidak tambah dependency di v1. v2 opsional pakai `framer-motion` kalau mau spring lebih halus.
- Trigger:
  ```jsx
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t0 = Date.now();
    const done = () => {
      const elapsed = Date.now() - t0;
      setTimeout(()=>setLoading(false), Math.max(0, 900 - elapsed));
    };
    if (document.readyState === "complete") done();
    else window.addEventListener("load", done, { once: true });
    const max = setTimeout(()=>setLoading(false), 1800);
    return ()=>clearTimeout(max);
  }, []);
  ```
- Mount di `Landing.jsx` top + di `App.jsx` saat `authLoading`.

## 8. Interaksi

- Tidak ada button di preloader. Klik apapun tidak dismiss manual (hindari accidental).
- Support `prefers-reduced-motion`: kalau true → semua animasi jadi `fade` simple 0.2s, tanpa scale/translate.

## 9. Performance

- CSS only, <4KB, 0 JS tambahan.
- Tidak block FCP — overlay di atas, content tetap render di bawah.
- 60fps, hanya `opacity` + `transform` (GPU-friendly), hindari `filter/blur` berat.

## 10. Acceptance Criteria

- [ ] Landing tidak blank kosong >200ms — preloader muncul instant.
- [ ] Logo besar, tanpa lingkaran/bulat/border.
- [ ] Warna teks `Belajar #1B2A4A` + `.Adaptif #F2A93B`.
- [ ] Durasi 900–1800ms, auto hilang tanpa manual.
- [ ] Tidak bikin build gagal, framer-motion tidak wajib.
- [ ] Reduced-motion fallback jalan.
- [ ] Responsive mobile — logo tetap center, tidak kepotong.

## 11. Yang Dibutuhkan Darimu (ACC)

Balas salah satu:
- **ACC Opsi A** — langsung gue build `Preloader.jsx` + integrasi.
- **ACC Opsi B / C** — gue build varian itu.
- **Revisi** — sebut warna/durasi/logo size yang mau diubah.

Begitu ACC, gue langsung push desain + preview di `http://localhost:5173`.

---

*Draft v1.0 — belum di-build. Menunggu lampu hijau bre.*
