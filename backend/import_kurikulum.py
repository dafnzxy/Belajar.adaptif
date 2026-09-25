import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

DB_PATH = Path(__file__).parent / "belajar.db"
KURIKULUM_ROOT = Path(__file__).parent.parent / "materi-kurikulum"
if not KURIKULUM_ROOT.exists():
    KURIKULUM_ROOT = Path(__file__).parent / "materi-kurikulum"

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)

def parse_frontmatter(text: str) -> dict:
    m = FRONTMATTER_RE.search(text)
    if not m:
        return {}
    d = {}
    for line in m.group(1).splitlines():
        if ":" not in line:
            continue
        k, v = line.split(":", 1)
        k = k.strip()
        v = v.strip().strip('"').strip("'")
        if k in ("kelas", "bab"):
            try:
                v = int(v)
            except: pass
        d[k] = v
    return d

def split_babs(body: str):
    parts = re.split(r"\n##\s+", body)
    babs = []
    for part in parts[1:]:
        lines = part.splitlines()
        judul = lines[0].strip()
        if judul.lower().startswith("daftar"):
            continue
        if judul.startswith("_diperbarui"):
            continue
        konten = "\n".join(lines[1:]).strip()
        if len(konten) < 20:
            continue
        judul_clean = judul.strip()
        babs.append((judul_clean, konten))
    return babs

def parse_md_file(path: Path):
    text = path.read_text(encoding="utf-8")
    fm = parse_frontmatter(text)
    body = FRONTMATTER_RE.sub("", text, count=1).strip()
    jenjang = str(fm.get("jenjang", "")).lower().strip()
    kelas = fm.get("kelas")
    mapel = fm.get("mapel", "")
    try:
        kelas = int(kelas) if kelas is not None else None
    except: pass
    # fallback from path: sd/kelas-1/01-matematika.md
    if not jenjang or not kelas:
        parts = path.relative_to(KURIKULUM_ROOT).parts
        if len(parts) >= 1:
            jenjang = jenjang or parts[0]
        if len(parts) >= 2 and "kelas-" in parts[1]:
            try:
                kelas = kelas or int(parts[1].split("-")[1])
            except: pass
    if not mapel:
        # from filename slug
        stem = path.stem  # 01-matematika
        slug = stem.split("-", 1)[-1] if "-" in stem else stem
        slug_map = {"matematika":"Matematika","ipa":"IPA","bahasa-indonesia":"Bahasa Indonesia","ips":"IPS","ppkn":"PPKn","bahasa-inggris":"Bahasa Inggris","fisika":"Fisika","kimia":"Kimia","biologi":"Biologi","ekonomi":"Ekonomi","sejarah":"Sejarah"}
        mapel = slug_map.get(slug, slug)

    babs = split_babs(body)
    if not babs:
        # file berisi satu bab utuh tanpa split -> pakai body sebagai 1 bab
        babs = [(fm.get("judul", path.stem), body[:8000])]

    rows = []
    for idx, (bab_judul, konten) in enumerate(babs, start=1):
        bab_judul = bab_judul.replace("—", "-").replace("–", "-")
        konten = konten.replace("—", "-").replace("–", "-")
        topik = re.sub(r"^Bab\s*\d+\s*[—\-]\s*", "", bab_judul).strip()
        topik = topik.replace("—", "-").replace("–", "-")
        rows.append({
            "jenjang": jenjang,
            "kelas": kelas,
            "mapel": mapel,
            "topik": topik,
            "judul": bab_judul,
            "konten": konten[:8000],
            "bab": idx,
            "urutan": idx,
        })
    return rows

def main(replace: bool = False):
    if not KURIKULUM_ROOT.exists():
        raise SystemExit(f"Folder tidak ditemukan: {KURIKULUM_ROOT}")

    files = sorted(KURIKULUM_ROOT.rglob("*.md"))
    files = [f for f in files if f.name.lower() != "readme.md"]
    print(f"Ditemukan {len(files)} file MD kurikulum di {KURIKULUM_ROOT}")
    if not files:
        print("Tidak ada file MD untuk di-import.")
        return

    import materi_bank
    materi_bank.init_db(str(DB_PATH))

    conn = sqlite3.connect(str(DB_PATH))
    before = conn.execute("SELECT COUNT(*) FROM materi WHERE source_type='builtin'").fetchone()[0]
    print(f"Builtin sebelum import: {before}")

    if replace:
        conn.execute("DELETE FROM materi WHERE source_type='builtin'")
        conn.commit()
        print("Semua builtin lama dihapus (replace mode).")

    all_rows = []
    for f in files:
        try:
            rows = parse_md_file(f)
            all_rows.extend(rows)
        except Exception as e:
            print(f"  ! gagal parse {f.name}: {e}")

    print(f"Total bab akan di-import: {len(all_rows)}")

    # deduplicate by (jenjang,kelas,mapel,bab) -> upsert
    inserted = 0
    skipped = 0
    for r in all_rows:
        cur = conn.execute(
            "SELECT id FROM materi WHERE source_type='builtin' AND jenjang=? AND kelas=? AND mapel=? AND bab=?",
            (r["jenjang"], r["kelas"], r["mapel"], r["bab"])
        ).fetchone()
        now = datetime.now(timezone.utc).isoformat()
        if cur:
            conn.execute(
                """UPDATE materi SET judul=?, topik=?, konten_asli=?, ringkasan=?, urutan=?, created_at=?
                   WHERE id=?""",
                (r["judul"], r["topik"], r["konten"], r["konten"], r["urutan"], now, cur[0])
            )
            skipped += 1
        else:
            conn.execute(
                """INSERT INTO materi (source_type, jenjang, kelas, mapel, topik, judul, konten_asli, ringkasan, bab, urutan, created_at)
                   VALUES ('builtin',?,?,?,?,?,?,?,?,?,?)""",
                (r["jenjang"], r["kelas"], r["mapel"], r["topik"], r["judul"], r["konten"], r["konten"], r["bab"], r["urutan"], now)
            )
            inserted += 1
    conn.commit()
    after = conn.execute("SELECT COUNT(*) FROM materi WHERE source_type='builtin'").fetchone()[0]
    conn.close()
    print(f"Selesai. Baru: {inserted}, update: {skipped}, total builtin sekarang: {after}")
    print("Cek: GET /api/materi?jenjang=sd&kelas=1&mapel=Matematika  seharusnya sudah terisi bab-bab SD kelas 1.")

if __name__ == "__main__":
    import argparse
    p = argparse.ArgumentParser(description="Import materi-kurikulum/*.md ke DB builtin")
    p.add_argument("--replace", action="store_true", help="Hapus semua builtin lama dulu sebelum import")
    p.add_argument("--db", type=str, default=None, help="Path DB custom")
    args = p.parse_args()
    if args.db:
        DB_PATH = Path(args.db)
    main(replace=args.replace)
