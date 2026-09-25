import React, { useState, useMemo, useEffect, useRef } from "react";
import Landing from "./Landing.jsx";
import Preloader from "./Preloader.jsx";
import GlideSelect from "./GlideSelect.jsx";

/* ============================================================
   BELAJAR ADAPTIF - v2
   Onboarding: kelas + gaya belajar SAJA (mapel dipilih di Dashboard)
   Dashboard: Materi Saya (upload+lengkapi) & Materi Tersedia (soal+bacaan)
   ============================================================ */

const FONT_IMPORT = `
@import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@500;600&display=swap');
`;

const COLORS = {
  ink: "#1B2A4A",
  paper: "#F6F5F0",
  paperDark: "#EDEBE2",
  marigold: "#F2A93B",
  teal: "#2C7873",
  red: "#D64545",
  white: "#FFFFFF",
};

const JENJANG = [
  { id: "sd", label: "SD", kelas: [1, 2, 3, 4, 5, 6] },
  { id: "smp", label: "SMP", kelas: [7, 8, 9] },
  { id: "sma", label: "SMA", kelas: [10, 11, 12] },
];

const MAPEL_BY_JENJANG = {
  sd: ["Matematika", "IPA", "Bahasa Indonesia", "IPS", "PPKn"],
  smp: ["Matematika", "IPA", "Bahasa Indonesia", "Bahasa Inggris", "IPS"],
  sma: [
    "Matematika", "Fisika", "Kimia", "Biologi",
    "Bahasa Indonesia", "Bahasa Inggris", "Ekonomi", "Sejarah",
  ],
};

const STYLE_QUIZ = [
  {
    q: "Kalau lagi belajar hal baru, kamu paling gampang paham kalau...",
    opts: [
      { text: "Lihat gambar, diagram, atau videonya", style: "visual" },
      { text: "Dengar orang jelasin langsung", style: "auditori" },
      { text: "Langsung coba praktik sendiri", style: "kinestetik" },
      { text: "Baca catatan atau rangkuman", style: "membaca" },
    ],
  },
  {
    q: "Waktu ngingat sesuatu, kamu biasanya...",
    opts: [
      { text: "Kebayang posisinya di halaman buku", style: "visual" },
      { text: "Keinget nada suara/kata-kata pas dijelasin", style: "auditori" },
      { text: "Keinget gerakan tangan pas ngerjain", style: "kinestetik" },
      { text: "Nulis ulang biar makin nempel", style: "membaca" },
    ],
  },
  {
    q: "Kalau disuruh milih media belajar, kamu pilih...",
    opts: [
      { text: "Infografis atau peta konsep", style: "visual" },
      { text: "Podcast atau rekaman penjelasan", style: "auditori" },
      { text: "Simulasi / eksperimen interaktif", style: "kinestetik" },
      { text: "Artikel atau e-book", style: "membaca" },
    ],
  },
];

const TONE_OPTIONS = [
  { id: "santai", label: "Santai", desc: "Ngobrol kayak teman belajar" },
  { id: "netral", label: "Netral", desc: "Jelas & ringkas" },
  { id: "formal", label: "Formal", desc: "Bahasa baku, serius" },
];

const STYLE_LABEL = {
  visual: "Visual (gambar & diagram)",
  auditori: "Auditori (penjelasan lisan)",
  kinestetik: "Kinestetik (praktik langsung)",
  membaca: "Membaca/Menulis (teks & catatan)",
};

const HARI_LIST = [
  { id: "senin", label: "Senin" },
  { id: "selasa", label: "Selasa" },
  { id: "rabu", label: "Rabu" },
  { id: "kamis", label: "Kamis" },
  { id: "jumat", label: "Jumat" },
  { id: "sabtu", label: "Sabtu" },
  { id: "minggu", label: "Minggu" },
];
const HARI_JS_INDEX = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"]; // Date.getDay(): 0=Minggu

const BULAN_LABEL = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const MOTIVASI_MULAI = [
  "Waktunya belajar! Kamu pasti bisa 🔥",
  "Semangat! Sesi belajarmu dimulai sekarang 💪",
  "Yuk fokus 20 menit, progres kecil tetap progres 🚀",
  "Jadwalmu sudah menunggu - ayo mulai! ✨",
];

function hariIniId() {
  return HARI_JS_INDEX[new Date().getDay()];
}

function formatTanggalIndonesia(date) {
  const hariLabel = HARI_LIST.find((h) => h.id === HARI_JS_INDEX[date.getDay()])?.label || "";
  return `${hariLabel}, ${date.getDate()} ${BULAN_LABEL[date.getMonth()]} ${date.getFullYear()}`;
}

function formatJam(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/* Jam digital real-time - update tiap detik lewat interval sendiri */
function JamRealtime({ size = 30 }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: size, color: COLORS.ink, letterSpacing: 1 }}>
        {formatJam(now)}
      </div>
      <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>{formatTanggalIndonesia(now)}</div>
    </div>
  );
}

/* ---------------- Komponen kecil yang dipakai berulang ---------------- */

function StepDots({ step, total }) {
  return (
    <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 22 : 8, height: 8, borderRadius: 4,
          background: i <= step ? COLORS.marigold : COLORS.paperDark,
          transition: "all 0.25s ease",
        }} />
      ))}
    </div>
  );
}

function NotebookCard({ children, tabLabel, maxWidth = 640 }) {
  return (
    <div className="notebook-card" style={{ maxWidth }}>
      {tabLabel && <div className="notebook-card__tab">{tabLabel}</div>}
      <div className="notebook-card__inner">
        <div className="notebook-card__redline" />
        <div className="notebook-card__holes" aria-hidden="true">
          {Array.from({ length: 7 }).map((_, i) => <span key={i} />)}
        </div>
        {children}
      </div>
    </div>
  );
}

function ChipGrid({ items, selected, onSelect, columns = 3 }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: 8 }}>
      {items.map((item) => {
        const isSel = selected === item;
        return (
          <button key={item} onClick={() => onSelect(item)} style={{
            padding: "10px 8px", borderRadius: 10, minHeight: 44,
            border: isSel ? `2px solid ${COLORS.teal}` : "2px solid #E4E2D8",
            background: isSel ? "rgba(44,120,115,0.08)" : COLORS.white,
            color: COLORS.ink, fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 13, cursor: "pointer",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {item}
          </button>
        );
      })}
    </div>
  );
}

const btnPrimary = {
  background: COLORS.ink, color: COLORS.white, border: "none", borderRadius: 10,
  padding: "12px 22px", fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer",
};
const btnGhost = {
  background: "transparent", color: COLORS.ink, border: "none", fontFamily: "'Inter', sans-serif",
  fontWeight: 600, fontSize: 14, cursor: "pointer", padding: "12px 10px",
};
const inputStyle = {
  border: "1px solid #D9D7D2", borderRadius: 10, padding: "10px 12px", fontSize: 14,
  fontFamily: "'Inter', sans-serif", width: "100%", boxSizing: "border-box",
};
const labelStyle = { display: "grid", gap: 6, fontSize: 12.5, fontWeight: 600, color: COLORS.ink };

/* Path foto profil dari backend berupa path relatif ("/uploads/avatars/2.jpg") - perlu digabung API_URL */
function fotoUrl(API_URL, path) {
  if (!path) return null;
  return `${API_URL}${path}`;
}

const BINGKAI_PRESET = {
  "daun-muda": { border: "3px solid #2C7873", bg: "linear-gradient(135deg, #E8F5E9, #C8E6C9)", label: "Daun Muda" },
  "bintang-kecil": { border: "3px solid #F2A93B", bg: "linear-gradient(135deg, #FFF8E1, #FFECB3)", label: "Bintang Kecil" },
  "api-semangat": { border: "3px solid #D64545", bg: "linear-gradient(135deg, #FFEBEE, #FFCDD2)", label: "Api Semangat" },
  "ombak-biru": { border: "3px solid #1B2A4A", bg: "linear-gradient(135deg, #E3F2FD, #BBDEFB)", label: "Ombak Biru" },
  "mahkota-tipis": { border: "3px solid #C6A664", bg: "linear-gradient(135deg, #FFFDE7, #FFECB3)", label: "Mahkota Tipis" },
  "pelangi-kelas": { border: "3px solid transparent", bg: "linear-gradient(135deg, #FCE4EC, #E1F5FE, #FFF8E1, #E8F5E9)", label: "Pelangi Kelas" },
};
function bingkaiStyle(id) {
  if (!id) return null;
  if (BINGKAI_PRESET[id]) return BINGKAI_PRESET[id];
  return { border: "3px solid #9A978F", bg: COLORS.white, label: id };
}
function AvatarBulat({ API_URL, fotoProfil, nama, size = 40, bingkaiId }) {
  const src = fotoUrl(API_URL, fotoProfil);
  const inisial = (nama || "?").trim().charAt(0).toUpperCase();
  const b = bingkaiId ? bingkaiStyle(bingkaiId) : null;
  const inner = src ? (
    <img src={src} alt={nama} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: `2px solid ${COLORS.white}`, display:"block" }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: "50%", background: COLORS.teal, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: size * 0.4 }}>{inisial}</div>
  );
  if (!b) return inner;
  return (
    <div style={{ position:"relative", width: size+6, height: size+6, display:"inline-flex", alignItems:"center", justifyContent:"center", borderRadius:"50%", padding:3, background: b.bg, border: b.border, boxSizing:"border-box" }}>
      {inner}
    </div>
  );
}

function HalamanLevel({ API_URL, token, onBack, onPakai }) {
  const [data, setData] = useState(null);
  const [katalog, setKatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  async function muat() {
    setLoading(true); setError(null);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/level/saya`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_URL}/api/level/bingkai`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (!r1.ok) throw new Error("Gagal memuat level");
      setData(await r1.json());
      setKatalog(r2.ok ? await r2.json() : []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{ muat(); }, []);
  async function pakai(id) {
    try {
      const resp = await fetch(`${API_URL}/api/level/bingkai/pakai`, { method:"POST", headers: { "Content-Type":"application/json", Authorization:`Bearer ${token}` }, body: JSON.stringify({ bingkai_id: id }) });
      if (!resp.ok) { const e=await resp.json().catch(()=>({})); throw new Error(e.detail||"Gagal pakai"); }
      setPreview(null); muat(); onPakai && onPakai(id);
    } catch(e) { alert(e.message); }
  }
  if (loading) return <NotebookCard tabLabel="LEVEL" maxWidth={760}><div style={{color:"#6B7280",fontSize:13,padding:"20px 0",textAlign:"center"}}>Memuat level...</div></NotebookCard>;
  if (error) return <NotebookCard tabLabel="LEVEL" maxWidth={760}><div style={{color:COLORS.red,fontSize:13}}>{error}</div><button style={{...btnGhost,marginTop:10}} onClick={muat}>Coba lagi</button><button style={{...btnGhost,marginTop:8,display:"block"}} onClick={onBack}>Kembali</button></NotebookCard>;
  return (
    <NotebookCard tabLabel="LEVEL" maxWidth={760}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><h2 style={{fontFamily:"'Poppins', sans-serif",fontWeight:800,fontSize:24,margin:0,color:COLORS.ink}}>Level {data.level}</h2><button style={btnGhost} onClick={onBack}>Kembali</button></div>
      <div style={{fontFamily:"'JetBrains Mono', monospace",fontSize:12,color:"#6B7280",marginTop:2}}>{data.xp_total} XP - {data.persen}% menuju Lv {data.level+1}</div>
      <div style={{height:6,background:"#EDEBE2",borderRadius:99,marginTop:10,overflow:"hidden"}}><div style={{height:"100%",width:`${data.persen}%`,background:COLORS.teal,transition:"width 400ms ease"}}/></div>
      <div style={{fontSize:11,color:"#9A978F",marginTop:6}}>{data.xp_level_bawah} / {data.xp_level_atas} XP - {Math.max(0,data.xp_level_atas-data.xp_total)} XP lagi ke level berikutnya{data.level<6?" - bingkai pertama buka di Lv 6":""}</div>
      {data.bingkai_baru?.length>0 && <div style={{marginTop:10,background:"rgba(44,120,115,0.08)",border:"1px solid rgba(44,120,115,0.18)",borderRadius:10,padding:10,fontSize:12.5,color:COLORS.teal}}>Baru masuk inventori: {data.bingkai_baru.map(b=>b.nama).join(", ")}</div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12,marginTop:18}}>
        {katalog.map(b=>{
          const locked = !b.terbuka;
          const owned = b.dimiliki;
          const s = bingkaiStyle(b.id);
          return (
            <div key={b.id} style={{border:`1.5px solid ${owned?COLORS.teal:locked?"#E4E2D8":"#E4E2D8"}`,borderRadius:14,padding:14,textAlign:"center",background: owned?"rgba(44,120,115,0.06)":COLORS.white,position:"relative",overflow:"hidden"}}>
              {locked && <div style={{position:"absolute",inset:0,background:"rgba(246,245,240,0.72)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:4,zIndex:1}}><span className="material-symbols-outlined" style={{fontSize:20,color:"#9A978F"}}>lock</span><span style={{fontSize:11,color:"#9A978F",fontWeight:600}}>Buka di Lv {b.level_buka}</span></div>}
              <div style={{width:64,height:64,borderRadius:"50%",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",background: s? s.bg : COLORS.paper,border: s? s.border : "2px solid #E4E2D8",fontSize:22}}>◯</div>
              <div style={{fontWeight:700,fontSize:12.5,color:COLORS.ink,marginTop:8}}>{b.nama}</div>
              <div style={{fontSize:11,color:"#9A978F"}}>Lv {b.level_buka}{owned?" - Dimiliki":""}</div>
              <button disabled={locked||!owned} onClick={()=>setPreview(b)} style={{marginTop:10,width:"100%",padding:"7px 8px",borderRadius:8,border: owned?`1.5px solid ${COLORS.teal}`:"1px solid #E4E2D8",background: owned? COLORS.teal:COLORS.paper,color: owned?COLORS.white:"#9A978F",fontWeight:600,fontSize:12,cursor: locked||!owned?"not-allowed":"pointer"}}>{owned?"Preview & Pakai":"Terkunci"}</button>
            </div>
          );
        })}
      </div>
      {katalog.length===0 && <div style={{textAlign:"center",color:"#9A978F",fontSize:13,padding:"20px 0"}}>Belum ada bingkai aktif. Admin bisa tambah di Control Panel.</div>}
      {preview && (
        <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} role="dialog" aria-modal="true">
          <div onClick={()=>setPreview(null)} style={{position:"absolute",inset:0,background:"rgba(27,42,74,0.45)",backdropFilter:"blur(4px)"}}/>
          <div style={{position:"relative",background:COLORS.white,borderRadius:16,padding:20,maxWidth:360,width:"100%",textAlign:"center",border:"1.5px solid #E4E2D8"}}>
            <div style={{width:96,height:96,borderRadius:"50%",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",background: (bingkaiStyle(preview.id)?.bg||COLORS.paper),border: bingkaiStyle(preview.id)?.border||"2px solid #E4E2D8",fontSize:28}}>◯</div>
            <div style={{fontWeight:700,marginTop:12,color:COLORS.ink}}>{preview.nama}</div>
            <div style={{fontSize:11,color:"#9A978F"}}>Lv {preview.level_buka}</div>
            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button style={{...btnPrimary,flex:1,background:COLORS.teal}} onClick={()=>pakai(preview.id)}>Pakai Bingkai Ini</button>
              <button style={btnGhost} onClick={()=>setPreview(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}
    </NotebookCard>
  );
}

function InventoriTab({ API_URL, token, onPakai }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeId, setActiveId] = useState(null);
  async function muat() {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API_URL}/api/profil/inventori`, { headers:{Authorization:`Bearer ${token}`}});
      if(!r.ok) throw new Error("Gagal memuat inventori");
      const d=await r.json();
      setItems(d);
      const me=await fetch(`${API_URL}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}).then(x=>x.json()).catch(()=>null);
      if(me) setActiveId(me.bingkai_aktif||null);
    } catch(e){ setError(e.message);} finally{ setLoading(false);}
  }
  useEffect(()=>{ muat(); },[]);
  async function pakai(id){
    try{
      const r=await fetch(`${API_URL}/api/level/bingkai/pakai`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({bingkai_id:id})});
      if(!r.ok){const e=await r.json().catch(()=>({})); throw new Error(e.detail||"Gagal");}
      setActiveId(id); onPakai&&onPakai(id);
    } catch(e){ alert(e.message); }
  }
  async function lepas(){
    try{
      const r=await fetch(`${API_URL}/api/level/bingkai/pakai`,{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({bingkai_id:null})});
      if(!r.ok) throw new Error("Gagal lepas");
      setActiveId(null); onPakai&&onPakai(null);
    } catch(e){ alert(e.message); }
  }
  if(loading) return <div style={{color:"#6B7280",fontSize:13,padding:"12px 0"}}>Memuat inventori...</div>;
  if(error) return <div><div style={{color:COLORS.red,fontSize:13}}>{error}</div><button style={btnGhost} onClick={muat}>Coba lagi</button></div>;
  if(items.length===0) return <div style={{border:"1.5px dashed #E4E2D8",borderRadius:12,padding:18,textAlign:"center"}}><div style={{fontSize:13,color:"#6B7280"}}>Belum ada koleksi. Terus belajar sampai Level 6 untuk dapat bingkai pertama!</div><div style={{fontSize:11,color:"#9A978F",marginTop:6}}>Bingkai akan otomatis masuk ke sini saat kamu naik level yang punya hadiah.</div></div>;
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{fontWeight:700,fontSize:13,color:COLORS.ink}}>Inventori ({items.length})</div>{activeId&&<button style={{...btnGhost,fontSize:12,border:"1px solid #E4E2D8",borderRadius:8,padding:"5px 10px"}} onClick={lepas}>Lepas Bingkai</button>}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:12}}>
        {items.map(it=>{
          const s=bingkaiStyle(it.item_id);
          const isActive=activeId===it.item_id;
          return (
            <div key={it.item_id} style={{border:`1.5px solid ${isActive?COLORS.teal:"#E4E2D8"}`,borderRadius:14,padding:14,textAlign:"center",background: isActive?"rgba(44,120,115,0.06)":COLORS.white}}>
              <div style={{width:64,height:64,borderRadius:"50%",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",background: s?.bg||COLORS.paper,border: s?.border||"2px solid #E4E2D8",fontSize:22}}>◯</div>
              <div style={{fontWeight:700,fontSize:12.5,color:COLORS.ink,marginTop:8}}>{it.nama}</div>
              <div style={{fontSize:11,color:"#9A978F"}}>Lv {it.level_buka}</div>
              <button onClick={()=>pakai(it.item_id)} style={{marginTop:10,width:"100%",padding:"7px 8px",borderRadius:8,border: isActive?`1.5px solid ${COLORS.teal}`:`1.5px solid ${COLORS.teal}`,background: isActive?COLORS.teal:COLORS.white,color: isActive?COLORS.white:COLORS.teal,fontWeight:600,fontSize:12,cursor:"pointer"}}>{isActive?"Sudah Dipakai":"Pakai"}</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ============================== AUTH (LOGIN & DAFTAR) ============================== */

function AuthScreen({ API_URL, onLoggedIn, onBackToLanding, initialMode = "login" }) {
  const [mode, setMode] = useState(initialMode); // "login" | "daftar"
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { nama, email, password };
      const resp = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Gagal, coba lagi");
      onLoggedIn(data.token, data.user);
    } catch (e) {
      setError(e.message || "Gagal, coba lagi");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ width: "100%", maxWidth: 400 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <img src="/logo.png" alt="BelajarAdaptif" style={{ width: 88, height: 88, objectFit: "contain", margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 26, color: COLORS.ink, letterSpacing: -0.4 }}>
            Belajar<span style={{ color: COLORS.marigold }}>.Adaptif</span>
          </div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
            {mode === "login" ? "Masuk untuk lanjut belajar" : "Daftar akun baru - gratis"}
          </div>
        </div>

        <div style={{ background: COLORS.white, borderRadius: 14, boxShadow: "0 12px 30px rgba(27,42,74,0.10)", padding: 28 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
            <button onClick={() => setMode("login")} style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === "login" ? COLORS.ink : COLORS.paper, color: mode === "login" ? COLORS.white : COLORS.ink,
              fontWeight: 700, fontSize: 13,
            }}>Masuk</button>
            <button onClick={() => setMode("daftar")} style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none", cursor: "pointer",
              background: mode === "daftar" ? COLORS.ink : COLORS.paper, color: mode === "daftar" ? COLORS.white : COLORS.ink,
              fontWeight: 700, fontSize: 13,
            }}>Daftar</button>
          </div>

          <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
            {mode === "daftar" && (
              <label style={labelStyle}>Nama lengkap
                <input style={inputStyle} value={nama} onChange={(e) => setNama(e.target.value)} required />
              </label>
            )}
            <label style={labelStyle}>Email
              <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label style={labelStyle}>Password
              <input style={inputStyle} type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </label>

            {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}

            <button type="submit" style={{ ...btnPrimary, opacity: loading ? 0.6 : 1, marginTop: 4 }} disabled={loading}>
              {loading ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar & Mulai Belajar"}
            </button>
          </form>
          {onBackToLanding && (
            <button onClick={onBackToLanding} style={{ ...btnGhost, width: "100%", textAlign: "center", marginTop: 12, fontSize: 12.5 }}>
              ← Kembali ke halaman utama
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================== KARTU JADWAL RINGKAS ============================== */

function KartuJadwalRingkas({ API_URL, onOpenJadwal }) {
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  async function muat() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/jadwal`);
      setJadwal(resp.ok ? await resp.json() : []);
    } catch {
      setJadwal([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    muat();
    const t = setInterval(muat, 60000); // refresh tiap 1 menit biar tetap "realtime"
    return () => clearInterval(t);
    // eslint-disable-next-line
  }, []);

  function mintaIzinNotifikasi() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => setNotifStatus(p));
  }

  const hariIni = hariIniId();
  const jadwalHariIni = jadwal
    .filter((j) => j.hari === hariIni && j.aktif)
    .sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));

  return (
    <div style={{
      background: COLORS.white, borderRadius: 14, padding: 22, marginBottom: 20,
      border: "2px solid #E4E2D8", boxShadow: "0 8px 20px rgba(27,42,74,0.06)",
      display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "space-between", alignItems: "flex-start",
    }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.marigold, letterSpacing: 0.5, marginBottom: 6 }}>
          🗓️ JADWAL BELAJAR
        </div>
        <JamRealtime size={28} />
      </div>

      <div style={{ flex: "1 1 220px", minWidth: 220 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>
          Sesi hari ini{jadwalHariIni.length > 0 ? ` (${jadwalHariIni.length})` : ""}
        </div>
        {loading && <div style={{ fontSize: 12.5, color: "#6B7280" }}>Memuat...</div>}
        {!loading && jadwalHariIni.length === 0 && (
          <div style={{ fontSize: 12.5, color: "#6B7280" }}>Belum ada jadwal untuk hari ini.</div>
        )}
        {!loading && jadwalHariIni.map((j) => (
          <div key={j.id} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: COLORS.ink, marginBottom: 5 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: COLORS.teal }}>{j.jam_mulai}</span>
            <span>{j.judul}{j.mapel ? ` · ${j.mapel}` : ""}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
        <button style={{ ...btnPrimary, padding: "9px 16px", fontSize: 13 }} onClick={onOpenJadwal}>Kelola Jadwal →</button>
        {notifStatus !== "granted" && notifStatus !== "unsupported" && (
          <button style={{ ...btnGhost, padding: "4px 6px", fontSize: 11.5 }} onClick={mintaIzinNotifikasi}>
            🔔 Aktifkan notifikasi
          </button>
        )}
        {notifStatus === "granted" && (
          <div style={{ fontSize: 11, color: COLORS.teal, fontWeight: 600 }}>🔔 Notifikasi aktif</div>
        )}
      </div>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function PengaturanBelajar({ API_URL, token, jenjang, kelas, learningStyle, tone, setJenjang, setKelas, setTally, setTone, onBack, onSaved }) {
  const [mode, setMode] = useState("menu");
  const [tmpJenjang, setTmpJenjang] = useState(jenjang);
  const [tmpKelas, setTmpKelas] = useState(kelas);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [quizIdx2, setQuizIdx2] = useState(0);
  const [tally2, setTally2] = useState({ visual: 0, auditori: 0, kinestetik: 0, membaca: 0 });

  async function simpanJenjangKelas() {
    if (!tmpJenjang || !tmpKelas) { setMsg("Pilih jenjang dan kelas dulu."); return; }
    setSaving(true); setMsg(null);
    try {
      const resp = await fetch(`${API_URL}/api/auth/onboarding`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jenjang: tmpJenjang, kelas: tmpKelas, learning_style: learningStyle, tone }),
      });
      if (!resp.ok) { const e = await resp.json().catch(()=>({})); throw new Error(e.detail||"Gagal menyimpan"); }
      setJenjang(tmpJenjang); setKelas(tmpKelas);
      const me = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).catch(()=>null);
      if (me) onSaved(me);
      setMsg("Jenjang dan kelas tersimpan.");
      setMode("menu");
    } catch (e) { setMsg(e.message); } finally { setSaving(false); }
  }

  async function selesaiTesGaya() {
    const entries = Object.entries(tally2); entries.sort((a,b)=>b[1]-a[1]);
    const finalStyle = entries[0][1]===0 ? learningStyle : entries[0][0];
    setSaving(true);
    try {
      const resp = await fetch(`${API_URL}/api/auth/onboarding`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jenjang, kelas, learning_style: finalStyle, tone }),
      });
      if (!resp.ok) throw new Error("Gagal menyimpan gaya belajar");
      setTally({ visual: finalStyle==="visual"?3:0, auditori: finalStyle==="auditori"?3:0, kinestetik: finalStyle==="kinestetik"?3:0, membaca: finalStyle==="membaca"?3:0 });
      const me = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).catch(()=>null);
      if (me) onSaved(me);
      setMsg(`Gaya belajar diperbarui: ${STYLE_LABEL[finalStyle]}`);
      setMode("menu");
    } catch (e) { setMsg(e.message); } finally { setSaving(false); }
  }

  if (mode === "tes") {
    const q = STYLE_QUIZ[quizIdx2];
    return (
      <NotebookCard tabLabel="TES GAYA BELAJAR" maxWidth={640}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 18, margin: 0 }}>Ulang Tes Gaya Belajar ({quizIdx2+1}/{STYLE_QUIZ.length})</h2><button style={btnGhost} onClick={()=>setMode("menu")}>Batal</button></div>
        <p style={{ fontSize: 14, color: COLORS.ink, fontWeight: 600, marginTop: 14 }}>{q.q}</p>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.opts.map((opt)=>(
            <button key={opt.text} onClick={()=>{
              const nt={...tally2, [opt.style]:tally2[opt.style]+1}; setTally2(nt);
              if (quizIdx2 < STYLE_QUIZ.length-1) setQuizIdx2(quizIdx2+1);
              else {
                const entries=Object.entries(nt); entries.sort((a,b)=>b[1]-a[1]);
                const fs=entries[0][1]===0?learningStyle:entries[0][0];
                setTally2(nt);
                setSaving(true);
                fetch(`${API_URL}/api/auth/onboarding`,{method:"PUT", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body: JSON.stringify({ jenjang, kelas, learning_style: fs, tone })})
                  .then(async r=>{ if(!r.ok) throw new Error("Gagal"); setTally({ visual:fs==="visual"?3:0, auditori:fs==="auditori"?3:0, kinestetik:fs==="kinestetik"?3:0, membaca:fs==="membaca"?3:0 }); const me=await fetch(`${API_URL}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}).then(x=>x.json()).catch(()=>null); if(me) onSaved(me); setMsg(`Gaya diperbarui: ${STYLE_LABEL[fs]}`); setMode("menu"); })
                  .catch(e=>setMsg(e.message)).finally(()=>setSaving(false));
              }
            }} style={{ textAlign:"left", padding:"13px 16px", borderRadius:10, border:"2px solid #E4E2D8", background:COLORS.white, color:COLORS.ink, fontSize:14, cursor:"pointer" }}>{opt.text}</button>
          ))}
        </div>
      </NotebookCard>
    );
  }

  return (
    <NotebookCard tabLabel="PENGATURAN BELAJAR" maxWidth={640}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}><h2 style={{ fontFamily:"'Poppins', sans-serif", color:COLORS.ink, fontSize:20, margin:0 }}>Pengaturan Belajar</h2><button style={btnGhost} onClick={onBack}>← Dashboard</button></div>
      <p style={{ color:"#6B7280", fontSize:13, marginTop:4 }}>Ubah jenjang/kelas atau ulang tes gaya belajar. Keduanya terpisah, tidak saling mereset.</p>
      {msg && <div style={{ marginTop:12, padding:"10px 12px", borderRadius:10, background: msg.includes("tersimpan")||msg.includes("diperbarui")?"rgba(44,120,115,0.08)":"rgba(214,69,69,0.08)", color: msg.includes("tersimpan")||msg.includes("diperbarui")?COLORS.teal:COLORS.red, fontSize:13 }}>{msg}</div>}
      <div className="stack-phone" style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginTop:18 }}>
        <div style={{ border:"1.5px solid #E4E2D8", borderRadius:12, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:14, color:COLORS.ink, marginBottom:10 }}>Ubah Jenjang & Kelas</div>
          <div style={{ display:"grid", gap:10, marginBottom:12 }}>
            <GlideSelect
              options={JENJANG.map(j=>({ value:j.id, label:j.label }))}
              value={tmpJenjang||""}
              onChange={(v)=>{ setTmpJenjang(v); setTmpKelas(null); }}
              placeholder="Pilih jenjang"
              ariaLabel="Pilih jenjang"
              surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
              size="md" radius={10} menuWidth={180}
            />
            <GlideSelect
              options={tmpJenjang ? JENJANG.find(j=>j.id===tmpJenjang).kelas.map(k=>({ value:String(k), label:`Kelas ${k}` })) : []}
              value={tmpKelas?String(tmpKelas):""}
              onChange={(v)=>setTmpKelas(Number(v))}
              placeholder={tmpJenjang?"Pilih kelas":"Pilih jenjang dulu"}
              ariaLabel="Pilih kelas"
              disabled={!tmpJenjang}
              surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
              size="md" radius={10} menuWidth={180}
            />
          </div>
          <button style={{ ...btnPrimary, background:COLORS.teal, minHeight:44, opacity: saving?0.6:1, width:"100%" }} disabled={saving} onClick={simpanJenjangKelas}>{saving?"Menyimpan...":"Simpan Jenjang/Kelas"}</button>
          <div style={{ fontSize:11.5, color:"#9A978F", marginTop:6 }}>Saat ini: {(JENJANG.find(j=>j.id===jenjang)?.label||jenjang)||"-"} kelas {kelas||"-"}</div>
        </div>
        <div style={{ border:"1.5px solid #E4E2D8", borderRadius:12, padding:16 }}>
          <div style={{ fontWeight:700, fontSize:14, color:COLORS.ink, marginBottom:6 }}>Ulang Tes Gaya Belajar</div>
          <div style={{ fontSize:12.5, color:"#6B7280", marginBottom:12 }}>Jawab 3 pertanyaan singkat untuk perbarui gaya. Tidak mengubah jenjang/kelas.</div>
          <div style={{ fontSize:12, color:COLORS.ink, marginBottom:10 }}>Saat ini: <b>{STYLE_LABEL[learningStyle]}</b></div>
          <button style={{ ...btnPrimary, minHeight:44, width:"100%" }} onClick={()=>{ setTally2({visual:0,auditori:0,kinestetik:0,membaca:0}); setQuizIdx2(0); setMode("tes"); }}>Mulai Tes Ulang →</button>
        </div>
      </div>
      <div style={{ marginTop:14, display:"flex", gap:8, alignItems:"center", flexWrap:"wrap" }}>
        <span style={{ fontSize:12.5, fontWeight:600, color:COLORS.ink }}>Nada bahasa:</span>
        <GlideSelect
          options={TONE_OPTIONS.map(t=>({ value:t.id, label:t.label, tag:t.desc?.split('·')[0]?.trim()||'' }))}
          value={tone}
          onChange={async (v)=>{ setTone(v); try{ await fetch(`${API_URL}/api/auth/onboarding`,{method:"PUT", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({jenjang, kelas, learning_style:learningStyle, tone:v})}); const me=await fetch(`${API_URL}/api/auth/me`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).catch(()=>null); if(me) onSaved(me); }catch{} }}
          ariaLabel="Pilih nada bahasa"
          surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
          size="md" radius={10} menuWidth={200}
        />
      </div>
    </NotebookCard>
  );
}

function Dashboard({
  jenjang, kelas, learningStyle, tone, setTone, API_URL, token, currentUser,
  onOpenMateriSaya, onOpenPilihMapel, onOpenCatatan, onOpenUjian, onOpenUjianTersedia,
  onOpenJadwal, onOpenProfil, onOpenLeaderboard, onOpenPengaturan, onOpenLevel, onKembaliControlPanel,
}) {
  const jenjangLabel = JENJANG.find((j) => j.id === jenjang)?.label || jenjang;

  const cardStyle = {
    background: COLORS.white, borderRadius: 14, padding: 24, cursor: "pointer",
    border: "2px solid #E4E2D8", boxShadow: "0 8px 20px rgba(27,42,74,0.06)",
    transition: "all 0.15s ease", textAlign: "left",
  };

  const STYLE_ICON = { visual: "visibility", auditori: "hearing", kinestetik: "front_hand", membaca: "menu_book" };
  const [hubOpen, setHubOpen] = useState(false);
  const [levelInfo, setLevelInfo] = useState(null);
  useEffect(()=>{
    if(!token) return;
    let cancelled=false;
    fetch(`${API_URL}/api/level/saya`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{ if(!cancelled) setLevelInfo(d); }).catch(()=>{});
    const onRefresh=()=> fetch(`${API_URL}/api/level/saya`,{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>{ if(!cancelled) setLevelInfo(d); }).catch(()=>{});
    window.addEventListener("ba:level-refresh", onRefresh);
    return ()=>{ cancelled=true; window.removeEventListener("ba:level-refresh", onRefresh); };
  }, [API_URL, token]);

  return (
    <div style={{ maxWidth: 980, margin: "0 auto" }}>
      {onKembaliControlPanel && (
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap",
          background: "rgba(242,169,59,0.12)", border: `1.5px solid ${COLORS.marigold}`,
          borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 12.5, color: COLORS.ink,
        }}>
          <span style={{ display:"inline-flex", alignItems:"center", gap:6, minWidth:0 }}><span className="material-symbols-outlined" style={{ fontSize:16, flexShrink:0 }} aria-hidden="true">visibility</span> Kamu sedang melihat tampilan siswa sebagai admin.</span>
          <button style={{ ...btnGhost, fontSize: 12.5, padding: "8px 10px", minHeight: 44, whiteSpace:"nowrap" }} onClick={onKembaliControlPanel}>← Kembali ke Control Panel</button>
        </div>
      )}

      <div style={{ background: COLORS.white, borderRadius: 16, padding: "16px", border: "1.5px solid #E4E2D8", boxShadow: "0 8px 20px rgba(27,42,74,0.06)", marginBottom: 16, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <button onClick={onOpenProfil} style={{ display: "flex", alignItems: "center", gap: 12, background: "transparent", border: "none", cursor: "pointer", padding: 0, textAlign: "left", minWidth: 0, flex: "1 1 200px" }}>
          <AvatarBulat API_URL={API_URL} fotoProfil={currentUser.foto_profil} nama={currentUser.nama} size={44} bingkaiId={currentUser.bingkai_aktif} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{currentUser.nama}</div>
            <div style={{ display: "flex", gap: 6, marginTop: 4, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 700, background: COLORS.ink, color: COLORS.white, padding: "3px 8px", borderRadius: 20 }}>{jenjangLabel} · Kelas {kelas || "-"}</span>
              {levelInfo && <button onClick={(e)=>{e.stopPropagation(); onOpenLevel&&onOpenLevel();}} style={{ fontSize:11, fontWeight:700, background:COLORS.teal, color:COLORS.white, padding:"3px 8px", borderRadius:20, border:"none", cursor:"pointer" }}>Lv {levelInfo.level} · {levelInfo.xp_total} XP</button>}
              {learningStyle ? (
                <span style={{ fontSize: 11, fontWeight: 700, background: "rgba(44,120,115,0.10)", color: COLORS.teal, padding: "3px 8px", borderRadius: 20, border: "1px solid rgba(44,120,115,0.18)", display:"inline-flex", alignItems:"center", gap:4 }}><span className="material-symbols-outlined" style={{ fontSize:14 }} aria-hidden="true">{STYLE_ICON[learningStyle]}</span> {STYLE_LABEL[learningStyle]}</span>
              ) : (
                <span style={{ fontSize: 11, fontWeight: 700, background: "#F3F2EE", color: "#9A978F", padding: "3px 8px", borderRadius: 20 }}>Belum ditentukan</span>
              )}
            </div>
            {levelInfo && <div style={{height:4,background:"#EDEBE2",borderRadius:99,marginTop:6,overflow:"hidden",maxWidth:180}}><div style={{height:"100%",width:`${levelInfo.persen}%`,background:COLORS.teal,transition:"width 400ms ease"}}/></div>}
          </div>
        </button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button style={{ ...btnGhost, fontSize: 12, padding: "10px 12px", minHeight: 44, border: "1.5px solid #E4E2D8", borderRadius: 10 }} onClick={() => setHubOpen(true)}>Gaya & Jenjang</button>
          <button style={{ ...btnGhost, fontSize: 12, padding: "10px 12px", minHeight: 44, border: "1.5px solid #E4E2D8", borderRadius: 10 }} onClick={onOpenPengaturan}>Pengaturan Belajar</button>
          <button style={{ ...btnGhost, fontSize: 12, padding: "10px 12px", minHeight: 44, border: "1.5px solid #E4E2D8", borderRadius: 10 }} onClick={()=>window.dispatchEvent(new CustomEvent("ba:goLanding"))}>Lihat Landing</button>
        </div>
      </div>

      {hubOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }} role="dialog" aria-modal="true" aria-label="Pengaturan gaya belajar">
          <div onClick={()=>setHubOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(27,42,74,0.45)", backdropFilter: "blur(4px)" }} />
          <div style={{ position: "relative", background: COLORS.white, borderRadius: 16, padding: 20, maxWidth: 460, width: "100%", border: "1.5px solid #E4E2D8", boxShadow: "0 20px 50px rgba(27,42,74,0.18)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontWeight: 700, color: COLORS.ink }}>Pengaturan gaya belajar</div>
              <button onClick={()=>setHubOpen(false)} aria-label="Tutup" style={{ width: 32, height: 32, borderRadius: "50%", border: "1px solid #E4E2D8", background: COLORS.white, cursor: "pointer" }}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", lineHeight: 1.5, marginBottom: 14 }}>Semua konten di bawah sudah dipersonalisasi ke <b style={{ color: COLORS.ink }}>{STYLE_LABEL[learningStyle] || "gaya kamu"}</b>. Ubah kapan saja, dashboard tidak hilang.</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button style={{ ...btnPrimary, background: COLORS.teal }} onClick={()=>{ setHubOpen(false); onOpenPengaturan(); }}>Ubah jenjang/kelas</button>
              <button style={{ ...btnPrimary, background: COLORS.ink }} onClick={()=>{ setHubOpen(false); onOpenPengaturan(); }}>Ulang tes gaya belajar</button>
              <button style={btnGhost} onClick={()=>setHubOpen(false)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* 3.1.2 Gamifikasi + 3.1.3 LLM health - satu baris kartu, carousel di mobile */}
      <div className="hub-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <WidgetStreak API_URL={API_URL} token={token} />
        <WidgetXP API_URL={API_URL} token={token} />
        <WidgetAkurasi API_URL={API_URL} token={token} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <LLMHealthBadge />
      </div>

      <div style={{ marginBottom: 20 }}>
        <SmartScheduleStrip API_URL={API_URL} onOpenJadwal={onOpenJadwal} />
      </div>

      <div className="bento-2col" style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginBottom: 12 }}>
        <button onClick={onOpenMateriSaya} style={{ ...bentoCardStyle(false), cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight: 148 }}>
          <BentoHoles /><BentoRedline />
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ width:32, height:32, borderRadius:9, background:COLORS.ink, color:COLORS.white, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span className="material-symbols-outlined" style={{ fontSize:18 }} aria-hidden="true">description</span></span>
              <span style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:15, color:COLORS.ink }}>Materi Saya</span>
              <span style={{ marginLeft:"auto", fontSize:10, fontWeight:700, letterSpacing:0.3, background:COLORS.teal, color:COLORS.white, padding:"3px 8px", borderRadius:20 }}>AI RINGKAS</span>
            </div>
            <div style={{ fontSize:12.5, color:"#6B7280", lineHeight:1.5 }}>Upload PDF atau paste teks, AI ringkas sesuai gaya belajarmu. Simpan ke Catatan atau langsung buat ujian.</div>
          </div>
          <div style={{ display:"flex", gap:8, marginTop:12, flexWrap:"wrap" }}>
            <span style={{ fontSize:11, fontWeight:600, background:"#F6F5F0", border:"1px solid #E4E2D8", padding:"5px 10px", borderRadius:20, display:"inline-flex", alignItems:"center", gap:4 }}><span className="material-symbols-outlined" style={{ fontSize:13 }} aria-hidden="true">upload_file</span> Upload PDF</span>
            <span style={{ fontSize:11, fontWeight:600, background:"#F6F5F0", border:"1px solid #E4E2D8", padding:"5px 10px", borderRadius:20, display:"inline-flex", alignItems:"center", gap:4 }}><span className="material-symbols-outlined" style={{ fontSize:13 }} aria-hidden="true">content_paste</span> Paste teks</span>
          </div>
        </button>
        <button onClick={onOpenCatatan} style={{ ...bentoCardStyle(false), cursor:"pointer", textAlign:"left", display:"flex", flexDirection:"column", justifyContent:"space-between", minHeight:148, borderColor:"rgba(44,120,115,0.18)" }}>
          <BentoHoles /><BentoRedline />
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
              <span style={{ width:32, height:32, borderRadius:9, background:COLORS.teal, color:COLORS.white, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span className="material-symbols-outlined" style={{ fontSize:18 }} aria-hidden="true">edit_note</span></span>
              <span style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:15, color:COLORS.teal }}>Catatan Saya</span>
            </div>
            <div style={{ fontSize:12.5, color:"#6B7280", lineHeight:1.5 }}>Cloud notebook dengan autosave. Tulis bebas, jadi bahan ujian kustom yang relevan.</div>
          </div>
          <div style={{ fontSize:11, color:COLORS.teal, fontWeight:700, marginTop:12, display:"inline-flex", alignItems:"center", gap:4 }}>Tulis catatan pertama <span className="material-symbols-outlined" style={{ fontSize:13 }} aria-hidden="true">arrow_forward</span></div>
        </button>
      </div>

      <div className="bento-3col" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <button className="bento-card" onClick={onOpenPilihMapel} style={{ ...bentoCardStyle(false), cursor:"pointer", textAlign:"left", minHeight: 142 }}>
          <BentoHoles /><BentoRedline />
          <span style={{ width:32, height:32, borderRadius:9, background:"#EDEBE2", color:COLORS.ink, display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 }}><span className="material-symbols-outlined" style={{ fontSize:18 }} aria-hidden="true">auto_stories</span></span>
          <div style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:13, color:COLORS.ink, letterSpacing:-0.2 }}>Materi Tersedia</div>
          <div style={{ fontSize:11.5, color:"#6B7280", marginTop:5, lineHeight:1.45 }}>Buku Kurikulum Merdeka per bab, navigasi Bab 1–12.</div>
          <div style={{ marginTop:10, fontSize:10.5, fontWeight:700, color:COLORS.ink, display:"inline-flex", alignItems:"center", gap:4 }}>Progress baca <span className="material-symbols-outlined" style={{ fontSize:12 }} aria-hidden="true">arrow_forward</span></div>
        </button>
        <button className="bento-card" onClick={onOpenUjian} style={{ ...bentoCardStyle(false), cursor:"pointer", textAlign:"left", borderColor:"rgba(242,169,59,0.28)", minHeight: 142 }}>
          <BentoHoles /><BentoRedline />
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><span style={{ width:26, height:26, borderRadius:8, background:"rgba(242,169,59,0.18)", color:"#7A4E00", display:"flex", alignItems:"center", justifyContent:"center" }}><span className="material-symbols-outlined" style={{ fontSize:14 }} aria-hidden="true">quiz</span></span><span style={{ fontSize:9, fontWeight:700, letterSpacing:0.4, background:"rgba(242,169,59,0.18)", color:"#7A4E00", padding:"2px 7px", borderRadius:20 }}>KUSTOM AI</span></div>
          <div style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:13, color:COLORS.ink, letterSpacing:-0.2 }}>Ujian dari Materi Saya</div>
          <div style={{ fontSize:11.5, color:"#6B7280", marginTop:5, lineHeight:1.45 }}>Generate soal dari materi atau catatan pribadimu.</div>
        </button>
        <button className="bento-card" onClick={onOpenUjianTersedia} style={{ ...bentoCardStyle(false), cursor:"pointer", textAlign:"left", minHeight: 142 }}>
          <BentoHoles /><BentoRedline />
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:8 }}><span style={{ width:26, height:26, borderRadius:8, background:COLORS.ink, color:COLORS.white, display:"flex", alignItems:"center", justifyContent:"center" }}><span className="material-symbols-outlined" style={{ fontSize:14 }} aria-hidden="true">school</span></span><span style={{ fontSize:9, fontWeight:700, letterSpacing:0.4, background:COLORS.ink, color:COLORS.white, padding:"2px 7px", borderRadius:20 }}>RESMI</span></div>
          <div style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:13, color:COLORS.ink, letterSpacing:-0.2 }}>Ujian Bab Resmi</div>
          <div style={{ fontSize:11.5, color:"#6B7280", marginTop:5, lineHeight:1.45 }}>Bank soal standar per bab, nilai terstandar.</div>
        </button>
      </div>

      <button className="bento-card" onClick={onOpenLeaderboard} style={{ ...bentoCardStyle(false), cursor:"pointer", textAlign:"left", marginTop:12, display:"flex", alignItems:"center", gap:12, width:"100%", minHeight: 72 }}>
        <BentoHoles /><BentoRedline />
        <span style={{ width:36, height:36, borderRadius:10, background:COLORS.ink, color:COLORS.white, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span className="material-symbols-outlined" style={{ fontSize:18 }} aria-hidden="true">leaderboard</span></span>
        <div style={{ textAlign:"left", minWidth:0 }}>
          <div style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:13, color:COLORS.ink }}>Leaderboard & Prestasi</div>
          <div style={{ fontSize:11.5, color:"#6B7280", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>Peringkat di-highlight · lencana streak & akurasi</div>
        </div>
        <span style={{ marginLeft:"auto", fontSize:12, color:COLORS.ink, fontWeight:700, whiteSpace:"nowrap", display:"inline-flex", alignItems:"center", gap:4 }}>Lihat peringkat <span className="material-symbols-outlined" style={{ fontSize:14 }} aria-hidden="true">arrow_forward</span></span>
      </button>
    </div>
  );
}

/* ============================== MATERI SAYA ============================== */

function MateriSaya({ API_URL, jenjang, learningStyle, tone, onBack }) {
  // sub-view: 'list' | 'form' | 'detail'
  const [subView, setSubView]       = useState("list");
  const [materiList, setMateriList] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [selected, setSelected]     = useState(null); // materi yang sedang dibuka di detail

  // Form state
  const [judul, setJudul]   = useState("");
  const [mapel, setMapel]   = useState("");
  const [topik, setTopik]   = useState("");
  const [teks, setTeks]     = useState("");
  const [file, setFile]     = useState(null);
  const [mode, setMode]     = useState("ringkas_ketat");
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState(null);

  /* ---------- fetch list ---------- */
  async function fetchList() {
    setListLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/materi/saya`);
      const data = resp.ok ? await resp.json() : [];
      setMateriList(data);
    } catch {
      setMateriList([]);
    } finally {
      setListLoading(false);
    }
  }

  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, []);

  /* ---------- form helpers ---------- */
  function openForm() {
    setJudul(""); setMapel(""); setTopik(""); setTeks(""); setFile(null);
    setMode("ringkas_ketat"); setFormError(null);
    setSubView("form");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!judul.trim()) { setFormError("Judul materi wajib diisi."); return; }
    if (!mapel.trim()) { setFormError("Nama mapel wajib diisi."); return; }
    if (!file && !teks.trim()) { setFormError("Tempel teks atau upload PDF terlebih dahulu."); return; }

    setUploading(true);
    setFormError(null);
    try {
      const fd = new FormData();
      // judul dikirim sebagai topik supaya backend pakai sebagai judul otomatis
      if (file) fd.append("file", file);
      else fd.append("teks", teks);
      fd.append("mapel", mapel.trim());
      fd.append("topik", judul.trim());   // pakai judul sebagai topik → backend buat judul dari topik
      fd.append("jenjang", jenjang || "");
      fd.append("learning_style", learningStyle);
      fd.append("tone", tone);
      fd.append("mode", mode);

      const resp = await fetch(`${API_URL}/api/materi/upload`, { method: "POST", body: fd });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.detail || `Gagal (${resp.status})`);
      }
      await fetchList();
      setSubView("list");
    } catch (err) {
      setFormError(err.message || "Terjadi kesalahan.");
    } finally {
      setUploading(false);
    }
  }

  /* ---------- hapus ---------- */
  async function handleDelete(id, e) {
    e?.stopPropagation();
    if (!window.confirm("Hapus materi ini? Tindakan tidak bisa dibatalkan.")) return;
    try {
      await fetch(`${API_URL}/api/materi/${id}`, { method: "DELETE" });
      await fetchList();
      if (selected?.id === id) setSubView("list");
    } catch {
      // silent
    }
  }

  /* ---------- helpers ---------- */
  function formatTgl(iso) {
    try { return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }); }
    catch { return iso; }
  }

  /* ========================= RENDER LIST ========================= */
  if (subView === "list") {
    return (
      <NotebookCard tabLabel="MATERI SAYA" maxWidth={760}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 4 }}>
          <div>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Materi Saya</h2>
            <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
              Koleksi materi pribadimu - tersimpan permanen, tidak muncul di Materi Tersedia.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...btnPrimary, background: COLORS.teal }} onClick={openForm}>+ Tambah Materi</button>
            <button style={btnGhost} onClick={onBack}>← Dashboard</button>
          </div>
        </div>

        {/* Daftar materi */}
        <div style={{ marginTop: 20 }}>
          {listLoading && (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#6B7280", fontSize: 13 }}>Memuat materi...</div>
          )}
          {!listLoading && materiList.length === 0 && (
            <div style={{
              textAlign: "center", padding: "40px 20px", color: "#9A978F", fontSize: 13,
              border: "2px dashed #D9D7D2", borderRadius: 14,
            }}>
              <span className="material-symbols-outlined" style={{ fontSize:32, color:COLORS.ink, marginBottom:10, display:"block" }} aria-hidden="true">description</span>
              Belum ada materi tersimpan.<br />
              Klik <b>+ Tambah Materi</b> untuk mulai menyimpan!
            </div>
          )}
          {materiList.map((m) => (
            <div
              key={m.id}
              onClick={() => { setSelected(m); setSubView("detail"); }}
              style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                border: "1.5px solid #E4E2D8", borderRadius: 12, padding: "14px 16px",
                marginBottom: 10, cursor: "pointer", background: COLORS.white,
                transition: "all 0.15s ease", gap: 12,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.teal; e.currentTarget.style.boxShadow = "0 4px 14px rgba(44,120,115,0.10)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#E4E2D8"; e.currentTarget.style.boxShadow = "none"; }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Judul */}
                <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 15, color: COLORS.ink, marginBottom: 6 }}>
                  {m.judul}
                </div>
                {/* Badge mapel + topik */}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  {m.mapel && (
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: COLORS.teal,
                      background: "rgba(44,120,115,0.10)", borderRadius: 6, padding: "2px 8px",
                    }}>{m.mapel}</span>
                  )}
                  {m.topik && m.topik !== m.judul && (
                    <span style={{ fontSize: 11.5, color: "#9A978F" }}>{m.topik}</span>
                  )}
                  <span style={{ fontSize: 11, color: "#C0BDB5" }}>{formatTgl(m.created_at)}</span>
                </div>
                {/* Preview ringkasan */}
                {m.ringkasan && (
                  <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 8, lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                    {m.ringkasan}
                  </div>
                )}
              </div>
              {/* Aksi kanan */}
              <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); setSelected(m); setSubView("detail"); }}
                  style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${COLORS.teal}`, background: "rgba(44,120,115,0.07)", cursor: "pointer", color: COLORS.teal, fontWeight: 600 }}
                >
                  Buka →
                </button>
                <button
                  onClick={(e) => handleDelete(m.id, e)}
                  style={{ fontSize: 12, padding: "5px 12px", borderRadius: 7, border: `1.5px solid ${COLORS.red}`, background: "rgba(214,69,69,0.06)", cursor: "pointer", color: COLORS.red, fontWeight: 600 }}
                >
                  🗑 Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      </NotebookCard>
    );
  }

  /* ========================= RENDER FORM ========================= */
  if (subView === "form") {
    return (
      <NotebookCard tabLabel="TAMBAH MATERI" maxWidth={720}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Tambah Materi Baru</h2>
          <button style={btnGhost} onClick={() => setSubView("list")}>← Kembali ke Daftar</button>
        </div>
        <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
          Tempel teks atau upload PDF. AI akan meringkas sesuai gaya belajarmu dan menyimpannya.
        </p>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 14, marginTop: 18 }}>
          {/* Judul + Mapel */}
          <div className="stack-phone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={labelStyle}>
              Judul materi *
              <input value={judul} onChange={(e) => setJudul(e.target.value)}
                placeholder="Contoh: Modul Limit Fungsi" style={inputStyle} autoFocus />
            </label>
            <label style={labelStyle}>
              Nama mapel * <span style={{ fontWeight: 400, color: "#9A978F" }}>(tulis bebas)</span>
              <input value={mapel} onChange={(e) => setMapel(e.target.value)}
                placeholder="Contoh: Matematika, Fisika, IELTS..." style={inputStyle} />
            </label>
          </div>

          {/* Topik */}
          <label style={labelStyle}>
            Topik / sub-judul <span style={{ fontWeight: 400, color: "#9A978F" }}>(opsional)</span>
            <input value={topik} onChange={(e) => setTopik(e.target.value)}
              placeholder="Contoh: Bab 3 - Turunan, Pertemuan ke-5..." style={inputStyle} />
          </label>

          {/* Mode */}
          <div>
            <div style={{ ...labelStyle, marginBottom: 8 }}>Mode ringkasan AI</div>
            <div className="stack-phone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ border: mode === "ringkas_ketat" ? `2px solid ${COLORS.teal}` : "2px solid #E4E2D8", borderRadius: 10, padding: 12, cursor: "pointer", fontSize: 12.5 }}>
                <input type="radio" name="mode" checked={mode === "ringkas_ketat"} onChange={() => setMode("ringkas_ketat")} style={{ marginRight: 6 }} />
                <b>Ringkas ketat</b>
                <div style={{ color: "#6B7280", marginTop: 4 }}>AI hanya meringkas isi materimu, tidak menambah apapun.</div>
              </label>
              <label style={{ border: mode === "lengkapi_otomatis" ? `2px solid ${COLORS.marigold}` : "2px solid #E4E2D8", borderRadius: 10, padding: 12, cursor: "pointer", fontSize: 12.5 }}>
                <input type="radio" name="mode" checked={mode === "lengkapi_otomatis"} onChange={() => setMode("lengkapi_otomatis")} style={{ marginRight: 6 }} />
                <b>Lengkapi otomatis</b>
                <div style={{ color: "#6B7280", marginTop: 4 }}>Materi baru sebagian? AI lanjutkan sampai tuntas (dilabeli jelas).</div>
              </label>
            </div>
          </div>

          {/* Input konten */}
          <label style={labelStyle}>
            Tempel teks materi
            <textarea value={teks} onChange={(e) => { setTeks(e.target.value); if (e.target.value) setFile(null); }}
              rows={7} placeholder="Paste isi materi, catatan kuliah, atau apapun yang ingin kamu simpan..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }} />
          </label>

          <div style={{ textAlign: "center", color: "#9A978F", fontSize: 12 }}>- atau -</div>

          <label style={labelStyle}>
            Upload PDF
            <input type="file" accept=".pdf"
              onChange={(e) => { setFile(e.target.files?.[0] || null); if (e.target.files?.[0]) setTeks(""); }}
              style={inputStyle} />
          </label>

          {file && (
            <div style={{ fontSize: 12.5, color: COLORS.teal, padding: "8px 12px", background: "rgba(44,120,115,0.06)", borderRadius: 8, display:"flex", alignItems:"center", gap:6 }}>
              <span className="material-symbols-outlined" style={{ fontSize:16 }} aria-hidden="true">description</span> {file.name} ({(file.size / 1024).toFixed(0)} KB)
            </div>
          )}

          {formError && <div style={{ color: COLORS.red, fontSize: 13 }}>{formError}</div>}

          {uploading && (
            <div style={{ padding: "12px 16px", background: "rgba(44,120,115,0.06)", borderRadius: 10, fontSize: 13, color: COLORS.teal }}>
              ⏳ AI sedang memproses dan meringkas materimu... Harap tunggu, ini mungkin memakan waktu beberapa menit.
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" style={btnGhost} onClick={() => setSubView("list")} disabled={uploading}>Batal</button>
            <button type="submit"
              style={{ ...btnPrimary, background: COLORS.teal, opacity: uploading ? 0.6 : 1 }}
              disabled={uploading}
            >
              {uploading ? "Memproses..." : mode === "lengkapi_otomatis" ? "Ringkas & Lengkapi" : "Ringkas & Simpan"}
            </button>
          </div>
        </form>
      </NotebookCard>
    );
  }

  /* ========================= RENDER DETAIL ========================= */
  if (subView === "detail" && selected) {
    return (
      <NotebookCard tabLabel={`MATERI - ${(selected.mapel || "").toUpperCase()}`} maxWidth={760}>
        {/* Nav */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <button style={btnGhost} onClick={() => setSubView("list")}>← Kembali ke Daftar</button>
          <button
            onClick={(e) => handleDelete(selected.id, e)}
            style={{ fontSize: 12.5, padding: "6px 14px", borderRadius: 8, border: `1.5px solid ${COLORS.red}`, background: "rgba(214,69,69,0.06)", cursor: "pointer", color: COLORS.red, fontWeight: 600 }}
          >
            🗑 Hapus Materi Ini
          </button>
        </div>

        {/* Header materi */}
        <div style={{ borderBottom: "1px solid #E4E2D8", paddingBottom: 14, marginBottom: 20 }}>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 22, margin: "0 0 10px 0", lineHeight: 1.3 }}>
            {selected.judul}
          </h1>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            {selected.mapel && (
              <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.teal, background: "rgba(44,120,115,0.10)", borderRadius: 6, padding: "3px 10px" }}>
                {selected.mapel}
              </span>
            )}
            {selected.topik && selected.topik !== selected.judul && (
              <span style={{ fontSize: 12.5, color: "#6B7280" }}>{selected.topik}</span>
            )}
            <span style={{ fontSize: 11.5, color: "#B5B2A8" }}>Disimpan {formatTgl(selected.created_at)}</span>
          </div>
        </div>

        {/* Ringkasan */}
        {selected.ringkasan && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, letterSpacing: 1, color: COLORS.teal, marginBottom: 10, textTransform: "uppercase" }}>
              Ringkasan Materi
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.8, color: COLORS.ink, whiteSpace: "pre-wrap", background: COLORS.paper, borderRadius: 10, padding: 16 }}>
              {selected.ringkasan}
            </div>
          </div>
        )}

        {/* Lanjutan AI */}
        {selected.lanjutan_ai && (
          <div>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.marigold, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              ⚠️ Lanjutan buatan AI - mohon diverifikasi ulang
            </div>
            <div style={{ background: "rgba(242,169,59,0.07)", border: "1.5px dashed " + COLORS.marigold, borderRadius: 10, padding: 16, fontSize: 13.5, lineHeight: 1.8, color: COLORS.ink, whiteSpace: "pre-wrap" }}>
              {selected.lanjutan_ai}
            </div>
          </div>
        )}

        {/* Jika belum ada ringkasan */}
        {!selected.ringkasan && !selected.lanjutan_ai && (
          <div style={{ textAlign: "center", padding: "30px 0", color: "#9A978F", fontSize: 13 }}>
            Belum ada ringkasan untuk materi ini.
          </div>
        )}
      </NotebookCard>
    );
  }

  return null;
}

/* ============================== CATATAN SAYA ============================== */

function CatatanSaya({ API_URL, onBack }) {
  const [catatanList, setCatatanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // {id, judul, isi, mapel, topik} atau null
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [mapel, setMapel] = useState("");
  const [topik, setTopik] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  async function fetchCatatan() {
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/catatan`);
      const data = resp.ok ? await resp.json() : [];
      setCatatanList(data);
    } catch {
      setCatatanList([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchCatatan(); /* eslint-disable-next-line */ }, []);

  function openFormBaru() {
    setEditTarget(null);
    setJudul(""); setIsi(""); setMapel(""); setTopik("");
    setError(null);
    setFormOpen(true);
  }

  function openFormEdit(c) {
    setEditTarget(c);
    setJudul(c.judul); setIsi(c.isi); setMapel(c.mapel || ""); setTopik(c.topik || "");
    setError(null);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditTarget(null);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!judul.trim() || !isi.trim()) {
      setError("Judul dan isi catatan wajib diisi.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify({ judul: judul.trim(), isi: isi.trim(), mapel: mapel || null, topik: topik || null });
      const headers = { "Content-Type": "application/json" };
      let resp;
      if (editTarget) {
        resp = await fetch(`${API_URL}/api/catatan/${editTarget.id}`, { method: "PUT", headers, body });
      } else {
        resp = await fetch(`${API_URL}/api/catatan`, { method: "POST", headers, body });
      }
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.detail || `Gagal (${resp.status})`);
      }
      await fetchCatatan();
      closeForm();
    } catch (err) {
      setError(err.message || "Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Hapus catatan ini?")) return;
    try {
      await fetch(`${API_URL}/api/catatan/${id}`, { method: "DELETE" });
      await fetchCatatan();
      if (expandedId === id) setExpandedId(null);
    } catch {
      // silent
    }
  }

  function formatTanggal(iso) {
    try {
      return new Date(iso).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    } catch {
      return iso;
    }
  }

  const mapelOptions = [
    "Matematika", "IPA", "Bahasa Indonesia", "Bahasa Inggris",
    "IPS", "PPKn", "Fisika", "Kimia", "Biologi", "Ekonomi", "Sejarah",
  ];

  return (
    <NotebookCard tabLabel="CATATAN SAYA" maxWidth={720}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Catatan Saya</h2>
        <div style={{ display: "flex", gap: 10 }}>
          {!formOpen && (
            <button style={{ ...btnPrimary, background: COLORS.teal }} onClick={openFormBaru}>
              + Catatan Baru
            </button>
          )}
          <button style={btnGhost} onClick={formOpen ? closeForm : onBack}>
            {formOpen ? "✕ Batal" : "← Dashboard"}
          </button>
        </div>
      </div>
      <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4, marginBottom: 0 }}>
        Catatan kamu tersimpan otomatis di server - tidak akan hilang saat refresh.
      </p>

      {/* Form tambah/edit */}
      {formOpen && (
        <form onSubmit={handleSave} style={{
          marginTop: 18, background: "rgba(44,120,115,0.05)", border: `1.5px solid ${COLORS.teal}`,
          borderRadius: 12, padding: 18, display: "grid", gap: 12,
        }}>
          <div style={{ fontWeight: 700, fontSize: 13.5, color: COLORS.teal }}>
            {editTarget ? "✏️ Edit Catatan" : "📝 Catatan Baru"}
          </div>

          <label style={labelStyle}>
            Judul catatan *
            <input value={judul} onChange={(e) => setJudul(e.target.value)}
              placeholder="Contoh: Rumus Limit - Matematika Kelas 11"
              style={inputStyle} autoFocus />
          </label>

          <div className="stack-phone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <label style={labelStyle}>
              Mapel (opsional)
              <select value={mapel} onChange={(e) => setMapel(e.target.value)} style={inputStyle}>
                <option value="">- Pilih mapel -</option>
                {mapelOptions.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </label>
            <label style={labelStyle}>
              Topik (opsional)
              <input value={topik} onChange={(e) => setTopik(e.target.value)}
                placeholder="Contoh: Turunan fungsi" style={inputStyle} />
            </label>
          </div>

          <label style={labelStyle}>
            Isi catatan *
            <textarea value={isi} onChange={(e) => setIsi(e.target.value)}
              rows={7} placeholder="Tulis catatan atau ringkasan kamu di sini..."
              style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65 }} />
          </label>

          {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button type="button" style={btnGhost} onClick={closeForm}>Batal</button>
            <button type="submit" style={{ ...btnPrimary, background: COLORS.teal, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Simpan Catatan"}
            </button>
          </div>
        </form>
      )}

      {/* Daftar catatan */}
      <div style={{ marginTop: formOpen ? 20 : 18 }}>
        {loading && (
          <div style={{ color: "#6B7280", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Memuat catatan...</div>
        )}
        {!loading && catatanList.length === 0 && (
          <div style={{
            textAlign: "center", padding: "32px 0", color: "#9A978F", fontSize: 13,
            border: "2px dashed #D9D7D2", borderRadius: 12,
          }}>
            Belum ada catatan. Klik <b>+ Catatan Baru</b> untuk mulai!
          </div>
        )}
        {catatanList.map((c) => {
          const expanded = expandedId === c.id;
          return (
            <div key={c.id} style={{
              border: `1.5px solid ${expanded ? COLORS.teal : "#E4E2D8"}`,
              borderRadius: 12, marginBottom: 10, overflow: "hidden",
              transition: "border-color 0.2s ease",
              boxShadow: expanded ? "0 4px 14px rgba(44,120,115,0.10)" : "none",
            }}>
              {/* Header card */}
              <div
                onClick={() => setExpandedId(expanded ? null : c.id)}
                style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "12px 14px", cursor: "pointer",
                  background: expanded ? "rgba(44,120,115,0.06)" : COLORS.white,
                  transition: "background 0.2s ease",
                  gap: 10, flexWrap: "wrap",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 14.5, color: COLORS.ink, marginBottom: 2 }}>
                    {c.judul}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {c.mapel && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: COLORS.teal,
                        background: "rgba(44,120,115,0.10)", borderRadius: 6, padding: "2px 7px",
                      }}>{c.mapel}</span>
                    )}
                    {c.topik && (
                      <span style={{ fontSize: 11, color: "#9A978F" }}>{c.topik}</span>
                    )}
                    <span style={{ fontSize: 11, color: "#B5B2A8" }}>
                      Diperbarui {formatTanggal(c.updated_at)}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(e) => { e.stopPropagation(); openFormEdit(c); }}
                    style={{
                      fontSize: 12, padding: "5px 10px", borderRadius: 7,
                      border: "1.5px solid #D9D7D2", background: COLORS.white,
                      cursor: "pointer", color: COLORS.ink, fontWeight: 600,
                    }}>
                    ✏️ Edit
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}
                    style={{
                      fontSize: 12, padding: "5px 10px", borderRadius: 7,
                      border: `1.5px solid ${COLORS.red}`, background: "rgba(214,69,69,0.06)",
                      cursor: "pointer", color: COLORS.red, fontWeight: 600,
                    }}>
                    🗑 Hapus
                  </button>
                  <span style={{ fontSize: 13, color: "#9A978F", alignSelf: "center" }}>
                    {expanded ? "▲" : "▼"}
                  </span>
                </div>
              </div>

              {/* Isi catatan (collapsible) */}
              {expanded && (
                <div style={{
                  padding: "14px 16px", borderTop: "1px solid #E4E2D8",
                  fontSize: 13.5, lineHeight: 1.7, color: COLORS.ink,
                  whiteSpace: "pre-wrap", background: COLORS.paper,
                }}>
                  {c.isi}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </NotebookCard>
  );
}

const JUMLAH_TES_BAB = ["5", "10", "15", "20"];

function DetailBab({ API_URL, jenjang, kelas, babId, mapel, onBack, onMulaiTes }) {
  const [bab, setBab] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabAktif, setTabAktif] = useState("baca");
  const [jumlahSoal, setJumlahSoal] = useState("10");

  useEffect(() => {
    let cancelled = false;
    async function muat() {
      setLoading(true); setError(null);
      try {
        const resp = await fetch(`${API_URL}/api/materi/${babId}`);
        if (!resp.ok) throw new Error("Bab tidak ditemukan");
        const data = await resp.json();
        if (!cancelled) setBab(data);
      } catch (e) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setLoading(false); }
    }
    muat();
    return () => { cancelled = true; };
  }, [API_URL, babId]);

  if (loading) return (
    <NotebookCard tabLabel="MEMUAT BAB" maxWidth={720}>
      <div style={{ display:"flex", alignItems:"center", gap:10, padding:"24px 0" }}>
        <span style={{ width:22, height:22, borderRadius:"50%", border:`3px solid #EDEBE2`, borderTopColor:COLORS.teal, display:"inline-block", animation:"spin 0.8s linear infinite" }} aria-hidden="true" />
        <span style={{ fontSize:13, color:"#6B7280" }}>Memuat bab...</span>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </NotebookCard>
  );
  if (error) return (
    <NotebookCard tabLabel="GAGAL MEMUAT" maxWidth={720}>
      <div style={{ color:COLORS.red, fontSize:13 }}>{error}</div>
      <button style={{ ...btnGhost, marginTop:12 }} onClick={onBack}>Kembali ke daftar bab</button>
    </NotebookCard>
  );
  const jenjangLabel = JENJANG.find(j=>j.id===jenjang)?.label || jenjang;
  return (
    <NotebookCard tabLabel={`BAB ${bab.bab || ""} - ${mapel}`.toUpperCase()} maxWidth={760}>
      <nav aria-label="Breadcrumb" style={{ fontSize:12, color:"#9A978F", marginBottom:8, display:"flex", gap:6, flexWrap:"wrap", alignItems:"center" }}>
        <button onClick={onBack} style={{ background:"transparent", border:"none", color:COLORS.teal, fontWeight:600, cursor:"pointer", padding:0, fontSize:12 }}>Dashboard</button>
        <span aria-hidden="true">›</span>
        <button onClick={onBack} style={{ background:"transparent", border:"none", color:COLORS.teal, fontWeight:600, cursor:"pointer", padding:0, fontSize:12 }}>{mapel} {jenjangLabel} {kelas}</button>
        <span aria-hidden="true">›</span>
        <span style={{ color:COLORS.ink, fontWeight:600 }}>{bab.judul}</span>
      </nav>
      <h1 style={{ fontFamily:"'Poppins', sans-serif", fontWeight:700, fontSize:22, color:COLORS.ink, margin:"0 0 8px 0", lineHeight:1.3 }}>{bab.judul}</h1>
      <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
        <span style={{ fontSize:11, fontWeight:700, background:"rgba(44,120,115,0.10)", color:COLORS.teal, padding:"3px 8px", borderRadius:20 }}>{mapel}</span>
        <span style={{ fontSize:11, fontWeight:700, background:COLORS.ink, color:COLORS.white, padding:"3px 8px", borderRadius:20 }}>{jenjangLabel} Kelas {kelas}</span>
        <span style={{ fontSize:11, color:"#9A978F" }}>BAB {bab.bab}</span>
      </div>
      <div style={{ display:"flex", gap:8, marginBottom:14 }}>
        <button onClick={()=>setTabAktif("baca")} aria-selected={tabAktif==="baca"} role="tab" style={{ flex:1, padding:"10px 12px", borderRadius:10, border: tabAktif==="baca" ? `2px solid ${COLORS.teal}` : "2px solid #E4E2D8", background: tabAktif==="baca" ? "rgba(44,120,115,0.08)" : COLORS.white, color:COLORS.ink, fontWeight:700, fontSize:13, cursor:"pointer" }}>Baca Materi</button>
        <button onClick={()=>setTabAktif("tes")} aria-selected={tabAktif==="tes"} role="tab" style={{ flex:1, padding:"10px 12px", borderRadius:10, border: tabAktif==="tes" ? `2px solid ${COLORS.teal}` : "2px solid #E4E2D8", background: tabAktif==="tes" ? "rgba(44,120,115,0.08)" : COLORS.white, color:COLORS.ink, fontWeight:700, fontSize:13, cursor:"pointer" }}>Kerjakan Tes Bab Ini</button>
      </div>
      <div role="tabpanel">
        {tabAktif==="baca" && (
          <div>
            <div style={{ fontSize:13.5, color:COLORS.ink, lineHeight:1.75, whiteSpace:"pre-wrap" }}>{bab.ringkasan || bab.konten_asli || "Belum ada isi untuk bab ini."}</div>
            <button style={{ ...btnPrimary, background:COLORS.teal, marginTop:18, width:"100%" }} onClick={()=>setTabAktif("tes")}>Sudah paham, lanjut tes →</button>
          </div>
        )}
        {tabAktif==="tes" && (
          <div>
            <div style={{ fontSize:12.5, fontWeight:700, color:COLORS.ink, marginBottom:8 }}>Jumlah soal</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {JUMLAH_TES_BAB.map(v=>(
                <button key={v} onClick={()=>setJumlahSoal(v)} style={{ minWidth:64, minHeight:44, padding:"8px 14px", borderRadius:10, border: jumlahSoal===v ? `2px solid ${COLORS.teal}` : "2px solid #E4E2D8", background: jumlahSoal===v ? "rgba(44,120,115,0.08)" : COLORS.white, color:COLORS.ink, fontWeight:700, fontSize:13, cursor:"pointer" }}>{v} soal</button>
              ))}
            </div>
            <div style={{ fontSize:11, color:"#6B7280", marginTop:8 }}>Tes hanya dari materi bab ini. Skor masuk akurasi, XP, dan leaderboard.</div>
            <button style={{ ...btnPrimary, background:COLORS.teal, marginTop:14, width:"100%", fontSize:14 }} onClick={()=>onMulaiTes({ sumberId: bab.id, judul: bab.judul, jumlahSoal: parseInt(jumlahSoal,10) })}>Mulai Tes - {jumlahSoal} soal →</button>
            <button style={{ ...btnGhost, width:"100%", marginTop:8 }} onClick={()=>setTabAktif("baca")}>Kembali baca materi</button>
          </div>
        )}
      </div>
    </NotebookCard>
  );
}

function PilihMapel({ API_URL, jenjang, kelas, onBack, onStartQuiz, onOpenBab }) {
  const [mapel, setMapel] = useState(null);
  const [materiList, setMateriList] = useState([]);
  const [loading, setLoading] = useState(false);
  const mapelOptions = MAPEL_BY_JENJANG[jenjang] || [];

  async function pilih(m) {
    setMapel(m);
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/materi?jenjang=${jenjang}&kelas=${kelas}&mapel=${encodeURIComponent(m)}`);
      const rows = resp.ok ? await resp.json() : [];
      setMateriList(rows);
    } catch {
      setMateriList([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <NotebookCard tabLabel="MATERI TERSEDIA" maxWidth={720}>
      <div data-mapel-selected={mapel || ""} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap:"wrap", gap:8 }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Pilih Mata Pelajaran</h2>
        <button style={btnGhost} onClick={onBack}>← Dashboard</button>
      </div>
      <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>
        Materi disusun seperti buku - baca dari Bab 1 sampai akhir, sesuai urutan yang dibuat guru/admin.
      </p>
      <div style={{ marginTop: 16 }}>
        <ChipGrid items={mapelOptions} selected={mapel} onSelect={pilih} columns={2} />
      </div>
      {mapel && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: COLORS.ink }}>Buku - {mapel}</div>
            <button style={{ ...btnGhost, fontSize:12, border:"1.5px solid #E4E2D8", borderRadius:10, padding:"7px 12px" }} onClick={() => onStartQuiz(mapel)}>Latihan Soal Bebas →</button>
          </div>
          {loading && <div style={{ color: "#6B7280", fontSize: 13 }}>Memuat bab...</div>}
          {!loading && materiList.length === 0 && (
            <div style={{ border:"1.5px dashed #E4E2D8", borderRadius:12, padding:16, textAlign:"center" }}>
              <div style={{ fontSize:13, color:"#6B7280" }}>Belum ada bab untuk {mapel} kelas {kelas}.</div>
              <div style={{ fontSize:12.5, color:"#9A978F", marginTop:4 }}>Coba Latihan Soal Bebas atau hubungi admin untuk menambah materi.</div>
              <button style={{ ...btnPrimary, marginTop:12 }} onClick={() => onStartQuiz(mapel)}>Latihan Soal Bebas →</button>
            </div>
          )}
          {!loading && materiList.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, color:"#9A978F", marginBottom:8 }}>{materiList.length} BAB TERSEDIA</div>
              {materiList.map((item, i) => (
                <button key={item.id} onClick={()=>onOpenBab(item.id, mapel)} style={{ width:"100%", textAlign:"left", display:"flex", justifyContent:"space-between", alignItems:"center", gap:12, padding:"14px 16px", borderRadius:12, border:"1.5px solid #E4E2D8", background:COLORS.white, cursor:"pointer", marginBottom:10 }}>
                  <div style={{ minWidth:0, flex:1 }}>
                    <div style={{ fontSize:11, fontWeight:700, color:COLORS.marigold, letterSpacing:0.4 }}>BAB {item.bab ?? i + 1}</div>
                    <div style={{ fontWeight:700, fontSize:14.5, color:COLORS.ink, marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{item.judul}</div>
                    <div style={{ fontSize:12.5, color:"#6B7280", marginTop:2, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{(item.topik || item.judul).slice(0,80)}</div>
                  </div>
                  <span style={{ fontSize:13, color:COLORS.teal, fontWeight:700, flexShrink:0 }}>Buka ›</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== PILIH SUMBER UJIAN ============================== */

const JUMLAH_SOAL_OPTIONS = ["5", "10", "15", "20"];

function PilihSumberUjian({ API_URL, onBack, onStartUjian }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedKey, setSelectedKey] = useState(null);
  const [jumlahSoal, setJumlahSoal] = useState("5");

  async function muatDaftar() {
    setLoading(true);
    setError(null);
    setSelectedKey(null);
    try {
      const [respMateri, respCatatan] = await Promise.all([
        fetch(`${API_URL}/api/materi/saya`),
        fetch(`${API_URL}/api/catatan`),
      ]);
      const listMateri = respMateri.ok ? await respMateri.json() : [];
      const listCatatan = respCatatan.ok ? await respCatatan.json() : [];
      const gabung = [
        ...listMateri.map((it) => ({ ...it, _sumber: "materi" })),
        ...listCatatan.map((it) => ({ ...it, _sumber: "catatan" })),
      ];
      setItems(gabung);
    } catch (e) {
      setError(e.message || "Gagal memuat daftar");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { muatDaftar(); /* eslint-disable-next-line */ }, []);

  const selectedItem = items.find((it) => `${it._sumber}-${it.id}` === selectedKey);

  return (
    <NotebookCard tabLabel="UJIAN" maxWidth={720}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Buat Ujian</h2>
        <button style={btnGhost} onClick={onBack}>← Dashboard</button>
      </div>
      <p style={{ color: "#6B7280", fontSize: 13.5, marginTop: 4 }}>
        Pilih sumber soal - AI akan membuat soal ujian HANYA dari isi catatan yang kamu pilih.
      </p>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Sumber soal:</div>
        <div style={{
          display: "flex", gap: 10, padding: 10, borderRadius: 10,
          border: `2px solid ${COLORS.teal}`, background: "rgba(44,120,115,0.08)",
          fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.ink,
          justifyContent: "center",
        }}>
          Catatan Saya
        </div>
        <div style={{ fontSize: 11.5, color: "#6B7280", marginTop: 6 }}>Materi yang kamu upload otomatis masuk ke Catatan Saya - semua jadi satu tempat.</div>
      </div>

      <div style={{ marginTop: 20 }}>
        {loading && <div style={{ color: "#6B7280", fontSize: 13 }}>Memuat...</div>}
        {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}
        {!loading && !error && items.length === 0 && (
          <div style={{ color: "#6B7280", fontSize: 13, padding: "12px 0" }}>Belum ada catatan. Tambah materi atau tulis catatan dulu di menu Catatan Saya.</div>
        )}
        {!loading && items.map((item) => {
          const key = `${item._sumber}-${item.id}`;
          const isSel = key === selectedKey;
          return (
            <div key={key} onClick={() => setSelectedKey(key)} style={{
              border: isSel ? `2px solid ${COLORS.teal}` : "1px solid #E4E2D8",
              background: isSel ? "rgba(44,120,115,0.07)" : "rgba(246,245,240,0.7)",
              borderRadius: 10, padding: 12, marginBottom: 10, cursor: "pointer",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{item.judul}</div>
                {item.mapel && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.teal, background: "rgba(44,120,115,0.10)", borderRadius: 6, padding: "2px 8px" }}>
                    {item.mapel}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 2 }}>{item.topik || "Topik umum"}</div>
            </div>
          );
        })}
      </div>

      {selectedItem && (
        <div style={{ marginTop: 20, borderTop: "1px solid #E4E2D8", paddingTop: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Jumlah soal:</div>
          <ChipGrid items={JUMLAH_SOAL_OPTIONS} selected={jumlahSoal} onSelect={setJumlahSoal} columns={3} />

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button
              style={btnPrimary}
              onClick={() => onStartUjian({ sumber: selectedItem._sumber, sumberId: selectedItem.id, judul: selectedItem.judul, jumlahSoal: Number(jumlahSoal) })}
            >
              Mulai Ujian →
            </button>
          </div>
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== PILIH SUMBER UJIAN - DARI MATERI TERSEDIA ============================== */

function PilihSumberUjianTersedia({ API_URL, jenjang, kelas, onBack, onStartUjian }) {
  const [mapel, setMapel] = useState(null);
  const [babList, setBabList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [jumlahSoal, setJumlahSoal] = useState("5");
  const mapelOptions = MAPEL_BY_JENJANG[jenjang] || [];

  async function pilihMapel(m) {
    setMapel(m);
    setSelectedId(null);
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/materi?jenjang=${jenjang}&kelas=${kelas}&mapel=${encodeURIComponent(m)}`);
      setBabList(resp.ok ? await resp.json() : []);
    } catch {
      setBabList([]);
    } finally {
      setLoading(false);
    }
  }

  const selectedItem = babList.find((b) => b.id === selectedId);

  return (
    <NotebookCard tabLabel="UJIAN TERSEDIA" maxWidth={720}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Ujian dari Materi Tersedia</h2>
        <button style={btnGhost} onClick={onBack}>← Dashboard</button>
      </div>
      <p style={{ color: "#6B7280", fontSize: 13.5, marginTop: 4 }}>
        Pilih mapel lalu pilih bab dari buku kurikulum - AI akan buat soal khusus dari bab itu.
      </p>

      <div style={{ marginTop: 16 }}>
        <ChipGrid items={mapelOptions} selected={mapel} onSelect={pilihMapel} columns={2} />
      </div>

      {mapel && (
        <div style={{ marginTop: 20 }}>
          {loading && <div style={{ color: "#6B7280", fontSize: 13 }}>Memuat bab...</div>}
          {!loading && babList.length === 0 && (
            <div style={{ color: "#6B7280", fontSize: 13 }}>Belum ada bab materi untuk {mapel} kelas {kelas}.</div>
          )}
          {!loading && babList.map((item, i) => {
            const isSel = item.id === selectedId;
            return (
              <div key={item.id} onClick={() => setSelectedId(item.id)} style={{
                border: isSel ? `2px solid ${COLORS.teal}` : "1px solid #E4E2D8",
                background: isSel ? "rgba(44,120,115,0.07)" : "rgba(246,245,240,0.7)",
                borderRadius: 10, padding: 12, marginBottom: 10, cursor: "pointer",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.marigold }}>BAB {item.bab ?? i + 1}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink, marginTop: 2 }}>{item.judul}</div>
              </div>
            );
          })}
        </div>
      )}

      {selectedItem && (
        <div style={{ marginTop: 20, borderTop: "1px solid #E4E2D8", paddingTop: 18 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginBottom: 8 }}>Jumlah soal:</div>
          <ChipGrid items={JUMLAH_SOAL_OPTIONS} selected={jumlahSoal} onSelect={setJumlahSoal} columns={3} />
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
            <button
              style={btnPrimary}
              onClick={() => onStartUjian({ sumber: "materi_tersedia", sumberId: selectedItem.id, judul: selectedItem.judul, jumlahSoal: Number(jumlahSoal) })}
            >
              Mulai Ujian →
            </button>
          </div>
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== QUIZ VIEW ============================== */

function QuizView({ API_URL, token, jenjang, kelas, mapel, learningStyle, tone, onBack }) {
  const [question, setQuestion] = useState(null);
  const [selectedAns, setSelectedAns] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [gambarUrl, setGambarUrl] = useState(null);
  const [gambarAlt, setGambarAlt] = useState("");
  const [gambarLoading, setGambarLoading] = useState(false);
  const [gambarError, setGambarError] = useState(null);

  async function fetchGambar(image_prompt, image_alt) {
    if (!image_prompt || learningStyle !== "visual" || !token) return;
    setGambarLoading(true); setGambarError(null); setGambarUrl(null);
    try {
      const controller = new AbortController();
      const t = setTimeout(()=>controller.abort(), 25000);
      const resp = await fetch(`${API_URL}/api/gambar/generate`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ image_prompt, image_alt }),
        signal: controller.signal,
      });
      clearTimeout(t);
      if (!resp.ok) {
        const e = await resp.json().catch(()=>({}));
        throw new Error(e.detail||`Gambar gagal ${resp.status}`);
      }
      const data = await resp.json();
      setGambarUrl(`${API_URL}${data.url}`);
      setGambarAlt(data.alt||image_alt||"Diagram");
    } catch (e) {
      if (e.name==="AbortError") setGambarError("Gambar tidak tersedia, lanjut ke soal");
      else setGambarError(e.message||"Gambar tidak tersedia, lanjut ke soal");
    } finally { setGambarLoading(false); }
  }

  async function generateQuestion() {
    setLoading(true);
    setError(null);
    setRevealed(false);
    setSelectedAns(null);
    setGambarUrl(null); setGambarError(null);
    try {
      const resp = await fetch(`${API_URL}/api/generate-question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jenjang, kelas, mapel, learning_style: learningStyle, tone,
          topik_terakhir: question?.topik || null, gunakan_catatan: true,
        }),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.detail || `Backend error: ${resp.status}`);
      }
      const data = await resp.json();
      setQuestion(data);
      if (data.image_prompt) fetchGambar(data.image_prompt, data.image_alt);
    } catch (e) {
      setError(e.message || "Gagal membuat soal.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { generateQuestion(); /* eslint-disable-next-line */ }, []);

  function pickAnswer(letter) {
    if (revealed) return;
    setSelectedAns(letter);
    setRevealed(true);
    const benar = letter === question.kunci;
    setScore((s) => ({ correct: s.correct + (benar ? 1 : 0), total: s.total + 1 }));
    if (token) {
      fetch(`${API_URL}/api/akurasi/tambah`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ benar: benar?1:0, total:1 }),
      }).then(()=>window.dispatchEvent(new CustomEvent("ba:akurasi-refresh"))).catch(()=>{});
    }
    if (benar && token) {
      fetch(`${API_URL}/api/skor/tambah`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ poin: 10, sumber: "quiz" }),
      }).then(()=>window.dispatchEvent(new CustomEvent("ba:level-refresh"))).catch(() => {});
    }
  }

  return (
    <NotebookCard tabLabel={`LATIHAN SOAL - ${mapel}`} maxWidth={640}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <button style={btnGhost} onClick={onBack}>← Ganti mapel</button>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: COLORS.teal,
          background: "rgba(44,120,115,0.08)", padding: "4px 10px", borderRadius: 8,
        }}>
          Skor: {score.correct}/{score.total}
        </div>
      </div>

      {loading && <div style={{ textAlign: "center", padding: "40px 0", color: "#6B7280", fontSize: 14 }}>Menyusun soal buat kamu...</div>}
      {error && (
        <div style={{ color: COLORS.red, fontSize: 14, marginBottom: 12 }}>
          {error} <button style={{ ...btnGhost, padding: "0 4px" }} onClick={generateQuestion}>Coba lagi</button>
        </div>
      )}

      {!loading && question && (
        <div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.marigold, marginBottom: 8, letterSpacing: 0.5 }}>
            TOPIK: {question.topik?.toUpperCase()}
          </div>
          {learningStyle==="visual" && gambarLoading && <div style={{ background:COLORS.paper, borderRadius:12, padding:20, textAlign:"center", color:"#6B7280", fontSize:13, marginBottom:14 }}>Memuat gambar...</div>}
          {learningStyle==="visual" && gambarUrl && <img src={gambarUrl} alt={gambarAlt} style={{ width:"100%", maxWidth:"100%", borderRadius:12, marginBottom:14, border:"1px solid #E4E2D8" }} loading="lazy" onError={()=>setGambarError("Gambar tidak tersedia, lanjut ke soal")} />}
          {learningStyle==="visual" && gambarError && <div style={{ background:"rgba(242,169,59,0.08)", border:"1px solid #EDEBE2", borderRadius:10, padding:10, fontSize:12, color:"#6B7280", marginBottom:14 }}>[Gambar tidak tersedia, lanjut ke soal]</div>}
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, color: COLORS.ink, marginBottom: 18 }}>{question.pertanyaan}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(question.pilihan || {}).map(([letter, text]) => {
              const isCorrect = letter === question.kunci;
              const isPicked = letter === selectedAns;
              let bg = COLORS.white, border = "2px solid #E4E2D8";
              if (revealed && isCorrect) { bg = "rgba(44,120,115,0.10)"; border = `2px solid ${COLORS.teal}`; }
              else if (revealed && isPicked && !isCorrect) { bg = "rgba(214,69,69,0.08)"; border = `2px solid ${COLORS.red}`; }
              return (
                <button key={letter} onClick={() => pickAnswer(letter)} disabled={revealed} style={{
                  textAlign: "left", padding: "12px 16px", borderRadius: 10, border, background: bg,
                  color: COLORS.ink, fontSize: 14, cursor: revealed ? "default" : "pointer",
                }}>
                  <b>{letter}.</b> {text}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: COLORS.paper, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.5 }}>
              <b>{selectedAns === question.kunci ? "Betul! 🎉" : "Belum tepat."}</b> {question.penjelasan}
            </div>
          )}

          {revealed && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button style={btnPrimary} onClick={generateQuestion}>Soal berikutnya →</button>
            </div>
          )}
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== UJIAN VIEW ============================== */

function UjianView({ API_URL, token, sumber, sumberId, judul, jumlahSoal, learningStyle, tone, onBack }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [soalList, setSoalList] = useState([]);
  const [mapel, setMapel] = useState(null);
  const [idx, setIdx] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [selesai, setSelesai] = useState(false);
  const [ujianGambarUrl, setUjianGambarUrl] = useState(null);
  const [ujianGambarAlt, setUjianGambarAlt] = useState("");
  const [ujianGambarLoading, setUjianGambarLoading] = useState(false);
  const [ujianGambarError, setUjianGambarError] = useState(null);

  async function muatUjian() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/ujian/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sumber, sumber_id: sumberId, jumlah_soal: jumlahSoal,
          learning_style: learningStyle, tone,
        }),
      });
      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.detail || `Backend error: ${resp.status}`);
      }
      const data = await resp.json();
      setSoalList(data.soal || []);
      setMapel(data.mapel);
    } catch (e) {
      setError(e.message || "Gagal membuat ujian.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { muatUjian(); /* eslint-disable-next-line */ }, []);

  const soalSekarang = soalList[idx];

  useEffect(() => {
    if (!soalSekarang?.image_prompt || learningStyle !== "visual" || !token) { setUjianGambarUrl(null); setUjianGambarError(null); return; }
    let cancelled=false;
    async function run(){
      setUjianGambarLoading(true); setUjianGambarError(null); setUjianGambarUrl(null);
      try{
        const controller=new AbortController(); const t=setTimeout(()=>controller.abort(),25000);
        const resp=await fetch(`${API_URL}/api/gambar/generate`,{method:"POST", headers:{"Content-Type":"application/json", Authorization:`Bearer ${token}`}, body:JSON.stringify({image_prompt:soalSekarang.image_prompt, image_alt:soalSekarang.image_alt}), signal:controller.signal});
        clearTimeout(t);
        if(!resp.ok){ const e=await resp.json().catch(()=>({})); throw new Error(e.detail||`Gambar gagal ${resp.status}`); }
        const data=await resp.json();
        if(!cancelled){ setUjianGambarUrl(`${API_URL}${data.url}`); setUjianGambarAlt(data.alt||soalSekarang.image_alt||"Diagram"); }
      } catch(e){
        if(!cancelled) setUjianGambarError(e.name==="AbortError"?"Gambar tidak tersedia, lanjut ke soal":(e.message||"Gambar tidak tersedia, lanjut ke soal"));
      } finally{ if(!cancelled) setUjianGambarLoading(false); }
    }
    run();
    return ()=>{ cancelled=true; };
  }, [idx, soalSekarang?.image_prompt]);
  const totalBenar = Object.entries(jawaban).filter(([i, letter]) => soalList[i]?.kunci === letter).length;

  function pilihJawaban(letter) {
    if (revealed) return;
    setJawaban((j) => ({ ...j, [idx]: letter }));
    setRevealed(true);
  }

  function lanjut() {
    if (idx < soalList.length - 1) {
      setIdx(idx + 1);
      setRevealed(false);
    } else {
      setSelesai(true);
      const totalBenarAkhir = Object.entries(jawaban).filter(([i, letter]) => soalList[i]?.kunci === letter).length;
      if (token) {
        fetch(`${API_URL}/api/akurasi/tambah`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ benar: totalBenarAkhir, total: soalList.length }),
        }).then(()=>window.dispatchEvent(new CustomEvent("ba:akurasi-refresh"))).catch(()=>{});
        fetch(`${API_URL}/api/skor/tambah`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ poin: totalBenarAkhir * 10, sumber: "ujian" }),
        }).then(()=>window.dispatchEvent(new CustomEvent("ba:level-refresh"))).catch(() => {});
      }
    }
  }

  if (loading) {
    return (
      <NotebookCard tabLabel="UJIAN" maxWidth={640}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <span style={{ width: 28, height: 28, borderRadius: "50%", border: `3px solid #EDEBE2`, borderTopColor: COLORS.teal, display: "inline-block", animation: "spin 0.8s linear infinite" }} aria-hidden="true" />
          <div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Menyusun {jumlahSoal} soal dari "{judul}"</div>
            <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>AI membaca catatanmu lalu merangkai soal. Tunggu sebentar ya.</div>
          </div>
        </div>
        <div style={{ display: "grid", gap: 10, opacity: 0.7 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 44, borderRadius: 10, background: COLORS.paper, border: "1px solid #E4E2D8", animation: "pulse 1.2s ease-in-out infinite", animationDelay: `${i * 0.12}s` }} />
          ))}
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg) } } @keyframes pulse { 0%,100%{opacity:0.55} 50%{opacity:1} }`}</style>
      </NotebookCard>
    );
  }

  if (error) {
    const isTruncated = /JSON|Unterminated|valid/i.test(error);
    return (
      <NotebookCard tabLabel="UJIAN" maxWidth={640}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", background: "rgba(214,69,69,0.06)", border: `1px solid rgba(214,69,69,0.14)`, borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <span style={{ width: 36, height: 36, borderRadius: 10, background: COLORS.red, color: COLORS.white, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">error</span></span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>Gagal menyusun soal</div>
            <div style={{ fontSize: 12.5, color: "#6B7280", marginTop: 4, lineHeight: 1.5 }}>
              {isTruncated ? `AI kepotong saat membuat ${jumlahSoal} soal. Coba dengan 10 sampai 15 soal dulu, lalu tambah lagi.` : "Koneksi AI lagi padat. Coba sekali lagi, biasanya langsung jadi."}
            </div>
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 11, color: "#9A978F", cursor: "pointer" }}>Lihat detail teknis</summary>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: COLORS.red, marginTop: 6, wordBreak: "break-word", whiteSpace: "pre-wrap" }}>{error}</div>
            </details>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={muatUjian}>Susun ulang soal</button>
          <button style={{ ...btnGhost, border: "1.5px solid #E4E2D8", borderRadius: 10, padding: "10px 14px" }} onClick={onBack}>Kembali pilih sumber</button>
        </div>
      </NotebookCard>
    );
  }

  if (selesai) {
    const total = soalList.length;
    const persen = total > 0 ? Math.round((totalBenar / total) * 100) : 0;
    return (
      <NotebookCard tabLabel="HASIL UJIAN" maxWidth={640}>
        <div style={{ textAlign: "center", padding: "10px 0 24px" }}>
          <div style={{ fontSize: 13, color: "#6B7280" }}>{judul}</div>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 42, color: COLORS.ink, marginTop: 6 }}>
            {totalBenar}<span style={{ fontSize: 22, color: "#6B7280" }}>/{total}</span>
          </div>
          <div style={{ fontSize: 14, color: COLORS.teal, fontWeight: 700, marginTop: 4 }}>{persen}% benar</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {soalList.map((s, i) => {
            const jawabUser = jawaban[i];
            const benar = jawabUser === s.kunci;
            return (
              <div key={i} style={{
                border: `1.5px solid ${benar ? "rgba(44,120,115,0.35)" : "rgba(214,69,69,0.35)"}`,
                background: benar ? "rgba(44,120,115,0.05)" : "rgba(214,69,69,0.05)",
                borderRadius: 10, padding: "10px 14px",
              }}>
                <div style={{ fontSize: 13, color: COLORS.ink, fontWeight: 600 }}>
                  {i + 1}. {s.pertanyaan}
                </div>
                <div style={{ fontSize: 12.5, color: benar ? COLORS.teal : COLORS.red, marginTop: 4 }}>
                  {benar ? "Benar" : `Jawaban kamu: ${jawabUser || "(kosong)"} - Kunci: ${s.kunci}`}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22 }}>
          <button style={btnGhost} onClick={onBack}>← Buat ujian baru</button>
          <button style={btnPrimary} onClick={() => { setIdx(0); setJawaban({}); setRevealed(false); setSelesai(false); muatUjian(); }}>
            Ulangi ujian ini
          </button>
        </div>
      </NotebookCard>
    );
  }

  return (
    <NotebookCard tabLabel={`UJIAN - ${judul}`} maxWidth={640}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 8 }}>
        <button style={btnGhost} onClick={onBack}>← Batalkan</button>
        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, fontWeight: 600, color: COLORS.teal,
          background: "rgba(44,120,115,0.08)", padding: "4px 10px", borderRadius: 8,
        }}>
          Soal {idx + 1}/{soalList.length}
        </div>
      </div>

      {soalSekarang && (
        <div>
          {mapel && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: COLORS.marigold, marginBottom: 8, letterSpacing: 0.5 }}>
              {mapel.toUpperCase()}
            </div>
          )}
          {learningStyle==="visual" && ujianGambarLoading && <div style={{ background:COLORS.paper, borderRadius:12, padding:20, textAlign:"center", color:"#6B7280", fontSize:13, marginBottom:14 }}>Memuat gambar...</div>}
          {learningStyle==="visual" && ujianGambarUrl && <img src={ujianGambarUrl} alt={ujianGambarAlt} style={{ width:"100%", borderRadius:12, marginBottom:14, border:"1px solid #E4E2D8" }} loading="lazy" onError={()=>setUjianGambarError("Gambar tidak tersedia, lanjut ke soal")} />}
          {learningStyle==="visual" && ujianGambarError && <div style={{ background:"rgba(242,169,59,0.08)", border:"1px solid #EDEBE2", borderRadius:10, padding:10, fontSize:12, color:"#6B7280", marginBottom:14 }}>[Gambar tidak tersedia, lanjut ke soal]</div>}
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: 17, color: COLORS.ink, marginBottom: 18 }}>{soalSekarang.pertanyaan}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(soalSekarang.pilihan || {}).map(([letter, text]) => {
              const isCorrect = letter === soalSekarang.kunci;
              const isPicked = letter === jawaban[idx];
              let bg = COLORS.white, border = "2px solid #E4E2D8";
              if (revealed && isCorrect) { bg = "rgba(44,120,115,0.10)"; border = `2px solid ${COLORS.teal}`; }
              else if (revealed && isPicked && !isCorrect) { bg = "rgba(214,69,69,0.08)"; border = `2px solid ${COLORS.red}`; }
              return (
                <button key={letter} onClick={() => pilihJawaban(letter)} disabled={revealed} style={{
                  textAlign: "left", padding: "12px 16px", borderRadius: 10, border, background: bg,
                  color: COLORS.ink, fontSize: 14, cursor: revealed ? "default" : "pointer",
                }}>
                  <b>{letter}.</b> {text}
                </button>
              );
            })}
          </div>

          {revealed && (
            <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: COLORS.paper, fontSize: 13.5, color: COLORS.ink, lineHeight: 1.5 }}>
              <b>{jawaban[idx] === soalSekarang.kunci ? "Betul! 🎉" : "Belum tepat."}</b> {soalSekarang.penjelasan}
            </div>
          )}

          {revealed && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button style={btnPrimary} onClick={lanjut}>
                {idx < soalList.length - 1 ? "Soal berikutnya →" : "Lihat hasil →"}
              </button>
            </div>
          )}
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== JADWAL BELAJAR (KALENDER) ============================== */

function JadwalBelajar({ API_URL, onBack }) {
  const [jadwal, setJadwal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [judul, setJudul] = useState("");
  const [mapel, setMapel] = useState("");
  const [hari, setHari] = useState("senin");
  const [jamMulai, setJamMulai] = useState("19:00");
  const [jamSelesai, setJamSelesai] = useState("20:00");
  const [catatan, setCatatan] = useState("");
  const [saving, setSaving] = useState(false);
  const [notifStatus, setNotifStatus] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  async function muat() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/jadwal`);
      if (!resp.ok) throw new Error("Gagal memuat jadwal");
      setJadwal(await resp.json());
    } catch (e) {
      setError(e.message || "Gagal memuat jadwal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { muat(); /* eslint-disable-next-line */ }, []);

  function resetForm() {
    setEditTarget(null); setJudul(""); setMapel(""); setHari("senin");
    setJamMulai("19:00"); setJamSelesai("20:00"); setCatatan("");
  }
  function openTambah() { resetForm(); setFormOpen(true); }
  function openEdit(item) {
    setEditTarget(item); setJudul(item.judul); setMapel(item.mapel || "");
    setHari(item.hari); setJamMulai(item.jam_mulai); setJamSelesai(item.jam_selesai);
    setCatatan(item.catatan || ""); setFormOpen(true);
  }

  async function simpan(e) {
    e.preventDefault();
    if (!judul.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify({
        judul: judul.trim(), hari, jam_mulai: jamMulai, jam_selesai: jamSelesai,
        mapel: mapel.trim() || null, catatan: catatan.trim() || null,
        aktif: editTarget ? editTarget.aktif : true,
      });
      const headers = { "Content-Type": "application/json" };
      const resp = editTarget
        ? await fetch(`${API_URL}/api/jadwal/${editTarget.id}`, { method: "PUT", headers, body })
        : await fetch(`${API_URL}/api/jadwal`, { method: "POST", headers, body });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal menyimpan jadwal");
      }
      setFormOpen(false);
      resetForm();
      await muat();
    } catch (e) {
      setError(e.message || "Gagal menyimpan jadwal");
    } finally {
      setSaving(false);
    }
  }

  async function toggleAktif(item) {
    try {
      await fetch(`${API_URL}/api/jadwal/${item.id}/toggle`, { method: "PATCH" });
      await muat();
    } catch { /* diamkan, biar user tetap bisa coba lagi manual */ }
  }

  async function hapus(item) {
    if (!confirm(`Hapus jadwal "${item.judul}"?`)) return;
    try {
      await fetch(`${API_URL}/api/jadwal/${item.id}`, { method: "DELETE" });
      await muat();
    } catch { /* diamkan */ }
  }

  function mintaIzinNotifikasi() {
    if (typeof Notification === "undefined") return;
    Notification.requestPermission().then((p) => setNotifStatus(p));
  }

  const hariIni = hariIniId();

  return (
    <NotebookCard tabLabel="JADWAL BELAJAR" maxWidth={880}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Jadwal Belajar Mingguan</h2>
          <div style={{ marginTop: 6 }}><JamRealtime size={20} /></div>
        </div>
        <button style={{ ...btnGhost, minHeight: 44 }} onClick={onBack}>← Dashboard</button>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16, flexWrap: "wrap", gap: 10 }}>
        <button style={{ ...btnPrimary, minHeight: 44 }} onClick={openTambah}>+ Tambah Jadwal</button>
        {notifStatus !== "granted" && notifStatus !== "unsupported" && (
          <button style={btnGhost} onClick={mintaIzinNotifikasi}>🔔 Aktifkan notifikasi pengingat</button>
        )}
        {notifStatus === "granted" && (
          <div style={{ fontSize: 12.5, color: COLORS.teal, fontWeight: 600 }}>
            🔔 Notifikasi aktif - kamu akan diingatkan otomatis saat jadwal mulai
          </div>
        )}
        {notifStatus === "unsupported" && (
          <div style={{ fontSize: 12, color: "#9A978F" }}>Browser ini tidak mendukung notifikasi</div>
        )}
      </div>

      {error && <div style={{ color: COLORS.red, fontSize: 13, marginTop: 12 }}>{error}</div>}

      {formOpen && (
        <form onSubmit={simpan} style={{
          marginTop: 18, background: "rgba(44,120,115,0.05)", border: `1.5px solid ${COLORS.teal}`,
          borderRadius: 12, padding: 18, display: "grid", gap: 12,
        }}>
          <label style={labelStyle}>Judul sesi
            <input style={inputStyle} value={judul} onChange={(e) => setJudul(e.target.value)} placeholder="Misal: Latihan soal Matematika" required />
          </label>
          <div className="stack-phone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>Mapel (opsional)
              <input style={inputStyle} value={mapel} onChange={(e) => setMapel(e.target.value)} placeholder="Misal: Matematika" />
            </label>
            <label style={labelStyle}>Hari
              <GlideSelect
                options={HARI_LIST.map(h=>({ value:h.id, label:h.label }))}
                value={hari}
                onChange={(v)=>setHari(v)}
                ariaLabel="Pilih hari"
                surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
                size="md" radius={10} menuWidth={160}
              />
            </label>
          </div>
          <div className="stack-phone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label style={labelStyle}>Jam mulai
              <input style={inputStyle} type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} required />
            </label>
            <label style={labelStyle}>Jam selesai
              <input style={inputStyle} type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} required />
            </label>
          </div>
          <label style={labelStyle}>Catatan (opsional)
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Misal: fokus bab pecahan" />
          </label>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button type="button" style={{ ...btnGhost, minHeight: 44 }} onClick={() => { setFormOpen(false); resetForm(); }}>Batal</button>
            <button type="submit" style={{ ...btnPrimary, minHeight: 44, opacity: saving ? 0.6 : 1 }} disabled={saving}>
              {saving ? "Menyimpan..." : editTarget ? "Simpan Perubahan" : "Simpan Jadwal"}
            </button>
          </div>
        </form>
      )}

      {loading && <div style={{ marginTop: 20, color: "#6B7280", fontSize: 13 }}>Memuat jadwal...</div>}

      {!loading && (
        <div className="jadwal-scroll" style={{ marginTop: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(110px, 1fr))", gap: 8, minWidth: 780 }}>
          {HARI_LIST.map((h) => {
            const items = jadwal.filter((j) => j.hari === h.id).sort((a, b) => a.jam_mulai.localeCompare(b.jam_mulai));
            const isHariIni = h.id === hariIni;
            return (
              <div key={h.id} style={{
                background: isHariIni ? "rgba(242,169,59,0.08)" : COLORS.paper,
                border: isHariIni ? `2px solid ${COLORS.marigold}` : "1px solid #E4E2D8",
                borderRadius: 10, padding: 10, minHeight: 90,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 700, color: isHariIni ? COLORS.marigold : COLORS.ink,
                  marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.3,
                }}>
                  {h.label}{isHariIni ? " •" : ""}
                </div>
                {items.length === 0 && <div style={{ fontSize: 11, color: "#B4B1A6" }}>-</div>}
                {items.map((item) => (
                  <div key={item.id} onClick={() => openEdit(item)} style={{
                    background: item.aktif ? COLORS.white : "rgba(154,151,143,0.12)",
                    border: "1px solid #E4E2D8", borderRadius: 8, padding: "6px 8px", marginBottom: 6,
                    cursor: "pointer", opacity: item.aktif ? 1 : 0.55,
                  }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, fontWeight: 700, color: COLORS.teal }}>
                      {item.jam_mulai}–{item.jam_selesai}
                    </div>
                    <div style={{ fontSize: 11.5, color: COLORS.ink, fontWeight: 600, marginTop: 2, lineHeight: 1.3 }}>{item.judul}</div>
                    {item.mapel && <div style={{ fontSize: 10.5, color: "#6B7280", marginTop: 1 }}>{item.mapel}</div>}
                    <div style={{ display: "flex", gap: 8, marginTop: 6 }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleAktif(item); }} style={{ fontSize: 9.5, border: "none", background: "transparent", color: "#6B7280", cursor: "pointer", padding: 0 }}>
                        {item.aktif ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); hapus(item); }} style={{ fontSize: 9.5, border: "none", background: "transparent", color: COLORS.red, cursor: "pointer", padding: 0 }}>
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            );
            })}
          </div>
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== PROFIL SAYA ============================== */

function ProfilSaya({ API_URL, token, currentUser, onUpdated, onLogout, onBack }) {
  const [nama, setNama] = useState(currentUser.nama);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [sukses, setSukses] = useState(null);
  const fileInputRef = useRef(null);

  async function simpanNama(e) {
    e.preventDefault();
    if (!nama.trim()) return;
    setSaving(true);
    setError(null);
    setSukses(null);
    try {
      const resp = await fetch(`${API_URL}/api/auth/profil`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nama: nama.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Gagal menyimpan nama");
      onUpdated(data);
      setSukses("Nama berhasil diperbarui");
    } catch (e) {
      setError(e.message || "Gagal menyimpan nama");
    } finally {
      setSaving(false);
    }
  }

  async function unggahFoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    setSukses(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(`${API_URL}/api/auth/profil/foto`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Gagal unggah foto");
      onUpdated(data);
      setSukses("Foto profil berhasil diperbarui");
    } catch (e) {
      setError(e.message || "Gagal unggah foto");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <NotebookCard tabLabel="PROFIL SAYA" maxWidth={520}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0 }}>Profil Saya</h2>
        <button style={btnGhost} onClick={onBack}>← Dashboard</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 20, gap: 10 }}>
        <AvatarBulat API_URL={API_URL} fotoProfil={currentUser.foto_profil} nama={currentUser.nama} size={84} bingkaiId={currentUser.bingkai_aktif} />
        <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={unggahFoto} style={{ display: "none" }} />
        <button type="button" style={{ ...btnGhost, fontSize: 12.5 }} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
          {uploading ? "Mengunggah..." : "📷 Ganti foto profil"}
        </button>
      </div>

      <form onSubmit={simpanNama} style={{ marginTop: 22, display: "grid", gap: 12 }}>
        <label style={labelStyle}>Nama lengkap
          <input style={inputStyle} value={nama} onChange={(e) => setNama(e.target.value)} required />
        </label>
        <label style={labelStyle}>Email
          <input style={{ ...inputStyle, background: COLORS.paper, color: "#9A978F" }} value={currentUser.email} disabled />
        </label>

        {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}
        {sukses && <div style={{ color: COLORS.teal, fontSize: 13 }}>{sukses}</div>}

        <button type="submit" style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} disabled={saving}>
          {saving ? "Menyimpan..." : "Simpan Perubahan"}
        </button>
      </form>

      <div style={{ marginTop: 20, borderTop: "1px solid #E4E2D8", paddingTop: 16 }}>
        <InventoriTab API_URL={API_URL} token={token} onPakai={(id)=>{ const u={...currentUser, bingkai_aktif:id}; onUpdated(u); window.dispatchEvent(new CustomEvent("ba:level-refresh")); }} />
      </div>
      <div style={{ marginTop: 20, borderTop: "1px solid #E4E2D8", paddingTop: 16, textAlign: "center" }}>
        <button style={{ ...btnGhost, color: COLORS.red, fontSize: 13 }} onClick={onLogout}>Keluar dari akun</button>
      </div>
    </NotebookCard>
  );
}

function bentoCardStyle(active) {
  return {
    background: COLORS.white, borderRadius: 14, padding: "16px 16px 14px 32px", border: active ? `1.5px solid ${COLORS.teal}` : "1px solid #E8E6DC",
    boxShadow: active ? "0 8px 20px rgba(44,120,115,0.10)" : "0 6px 18px rgba(27,42,74,0.05)", textAlign: "left", minWidth: 0,
    position: "relative", overflow: "hidden",
  };
}
function BentoHoles() {
  return <div aria-hidden="true" style={{ position:"absolute", left:8, top:10, bottom:10, width:6, display:"flex", flexDirection:"column", justifyContent:"space-between", alignItems:"center", pointerEvents:"none" }}>{Array.from({length:4}).map((_,i)=>(<span key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#EDEBE2", border:"1px solid #DDDAD1", boxShadow:"inset 0 1px 1px rgba(0,0,0,0.06)" }} />))}</div>;
}
function BentoRedline() {
  return <div aria-hidden="true" style={{ position:"absolute", left:24, top:0, bottom:0, width:1, background:"rgba(214,69,69,0.13)", pointerEvents:"none" }} />;
}

function WidgetStreak({ API_URL, token }) {
  const [s, setS] = useState(null);
  useEffect(() => {
    let c=false; async function muat(){ try{ const r=await fetch(`${API_URL}/api/streak/saya`,{headers:{Authorization:`Bearer ${token}`}}); if(r.ok&&!c) setS(await r.json()); }catch{} }
    muat(); const t=setInterval(muat,300000); return()=>{c=true;clearInterval(t);};
  }, [API_URL, token]);
  const hari = s?.streak_sekarang ?? 0;
  const status = hari===0 ? "putus" : hari>=1 && s?.terakhir_aktif===new Date().toISOString().slice(0,10) ? "aktif":"berisiko";
  const bg = status==="aktif"?"rgba(242,169,59,0.14)":status==="berisiko"?"rgba(214,69,69,0.08)":"#F3F2EE";
  const dot = status==="aktif"?COLORS.marigold:status==="berisiko"?COLORS.red:"#9A978F";
  return (
    <div className="bento-card" style={{ ...bentoCardStyle(false), display:"flex", flexDirection:"column", gap:8 }}>
      <div style={{ display:"flex", alignItems:"center", gap:8 }}>
        <span style={{ width:8, height:8, borderRadius:"50%", background:dot, flexShrink:0 }} />
        <span style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, color:COLORS.ink }}>STREAK</span>
        <span style={{ marginLeft:"auto", fontSize:11, color:"#6B7280" }}>{status==="aktif"?"Aktif":status==="berisiko"?"Hari ini belum":status==="putus"?"Mulai lagi":"-"}</span>
      </div>
      <div style={{ display:"flex", alignItems:"baseline", gap:8, flexWrap:"wrap" }}>
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontWeight:700, fontSize:28, color:COLORS.ink, display:"inline-flex", alignItems:"center", gap:6 }}><span className="material-symbols-outlined" style={{ fontSize:22, color:COLORS.marigold }} aria-hidden="true">local_fire_department</span> {hari}</span>
        <span style={{ fontSize:12, color:"#6B7280" }}>hari</span>
      </div>
      {hari===0 ? <div style={{ fontSize:12, color:"#6B7280", lineHeight:1.4 }}>Belum ada data - kerjakan kuis pertamamu untuk mulai streak.</div> : <div style={{ fontSize:11, color:"#6B7280" }}>Beruntun sampai hari ini</div>}
      <div style={{ height:6, borderRadius:999, background:"#EDEBE2", overflow:"hidden" }}><div style={{ height:"100%", width:`${Math.min(100, hari*14)}%`, background: `linear-gradient(90deg, ${COLORS.teal}, ${COLORS.marigold})`, borderRadius:999 }} /></div>
    </div>
  );
}

function WidgetXP({ API_URL, token }) {
  const [lb, setLb]=useState(null);
  useEffect(()=>{ let c=false; async function muat(){ try{ const r=await fetch(`${API_URL}/api/leaderboard`,{headers:{Authorization:`Bearer ${token}`}}); if(r.ok&&!c){ const d=await r.json(); const me=d.find(x=>x.total_poin!==undefined); setLb(me? me.total_poin:0);} }catch{} } muat(); },[API_URL,token]);
  const xp = lb ?? 0;
  const levels=[0,100,300,600,1000,1600,2400];
  let lvl=0; for(let i=0;i<levels.length;i++) if(xp>=levels[i]) lvl=i;
  const cur=levels[lvl]??0; const nxt=levels[lvl+1]??levels[levels.length-1]; const pct=nxt>cur? Math.min(100, ((xp-cur)/(nxt-cur))*100):100;
  const label=["Pemula","Penjelajah","Pembelajar","Pelajar Tekun","Mahir","Ahli"][lvl]||"Legenda";
  return (
    <div className="bento-card" style={bentoCardStyle(false)}>
      <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, color:COLORS.ink, marginBottom:8 }}>XP BELAJAR</div>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
        <span style={{ fontFamily:"'JetBrains Mono', monospace", fontWeight:700, fontSize:18, color:COLORS.ink }}>{xp} XP</span>
        <span style={{ fontSize:11, color:COLORS.teal, fontWeight:700 }}>Level {lvl} · {label}</span>
      </div>
      <div style={{ height:6, borderRadius:999, background:"#EDEBE2", overflow:"hidden", marginTop:8 }}><div style={{ height:"100%", width:`${pct}%`, background:COLORS.teal, borderRadius:999 }} /></div>
      <div style={{ fontSize:11, color:"#6B7280", marginTop:6 }}>{nxt>xp? `${nxt-xp} XP lagi ke level ${lvl+1}`:"Level maksimal!"}</div>
    </div>
  );
}

function WidgetAkurasi({ API_URL, token }) {
  const [data, setData]=useState({ persen:0, benar:0, total:0, ada_data:false });
  const [loading, setLoading]=useState(true);
  useEffect(()=>{
    let c=false;
    async function muat(){ try{ const r=await fetch(`${API_URL}/api/akurasi/saya`,{headers:{Authorization:`Bearer ${token}`}}); if(r.ok&&!c){ const d=await r.json(); setData(d); } }catch{} finally{ if(!c) setLoading(false); } }
    muat();
    const t=setInterval(muat,30000);
    const onRefresh=()=>muat();
    window.addEventListener("ba:akurasi-refresh", onRefresh);
    return()=>{ c=true; clearInterval(t); window.removeEventListener("ba:akurasi-refresh", onRefresh); };
  },[API_URL,token]);
  const persen = data.persen;
  const ada = data.ada_data;
  const color = persen>80?COLORS.teal:persen>=50?COLORS.marigold:COLORS.red;
  const ring = `conic-gradient(${color} ${persen*3.6}deg, #EDEBE2 0deg)`;
  return (
    <div className="bento-card" style={{ ...bentoCardStyle(false), display:"flex", alignItems:"center", gap:14 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", background: ada?ring:"#EDEBE2", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
        <div style={{ width:42, height:42, borderRadius:"50%", background:COLORS.white, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'JetBrains Mono', monospace", fontWeight:700, fontSize:12, color: ada?color:"#9A978F" }}>{ada?`${persen}%`:"-"}</div>
      </div>
      <div style={{ minWidth:0 }}>
        <div style={{ fontSize:11, fontWeight:700, letterSpacing:0.4, color:COLORS.ink }}>AKURASI SOAL</div>
        {loading ? <div style={{ fontSize:12, color:"#9A978F", marginTop:4 }}>Memuat...</div> : ada ? <div style={{ fontSize:12, color:"#6B7280", marginTop:4, lineHeight:1.4 }}>{persen}% benar · {data.benar}/{data.total} soal<span style={{ color:color, fontWeight:700 }}> · realtime</span></div> : <div style={{ fontSize:12, color:"#6B7280", marginTop:4, lineHeight:1.4 }}>Belum ada data - kerjakan kuis pertamamu untuk lihat akurasi.</div>}
      </div>
    </div>
  );
}

function LLMHealthBadge() {
  const [st, setSt]=useState({status:"checking"});
  useEffect(()=>{ let c=false; async function ck(){ try{ const r=await fetch(`${(import.meta.env.VITE_API_URL||"http://localhost:8000")}/api/health`); const d=await r.json(); if(!c) setSt(d);}catch{ if(!c) setSt({status:"error"});} } ck(); const t=setInterval(ck,30000); return()=>{c=true;clearInterval(t);} },[]);
  const dot = st.status==="ok"?COLORS.teal:st.status==="checking"?"#9A978F":COLORS.red;
  const label = st.status==="ok"?`Tersambung · ${st.latency_ms??"-"}ms`:st.status==="checking"?"Memeriksa AI...":"Tidak tersedia";
  const tip = st.status==="ok"?"Server AI utama":"Server AI cadangan";
  return (
    <div title={tip} style={{ display:"inline-flex", alignItems:"center", gap:8, fontSize:11, fontWeight:600, color:COLORS.ink, background:COLORS.white, border:"1px solid #E4E2D8", padding:"6px 10px", borderRadius:20 }}>
      <span style={{ width:7, height:7, borderRadius:"50%", background:dot }} /> LLM {label}
    </div>
  );
}

function SmartScheduleStrip({ API_URL, onOpenJadwal }) {
  const [now, setNow]=useState(()=>new Date());
  useEffect(()=>{ const t=setInterval(()=>setNow(new Date()),60000); return()=>clearInterval(t); },[]);
  const [reco, setReco]=useState(null);
  useEffect(()=>{ setReco({ mapel:"Matematika", alasan:"AI merekomendasikan review untuk menjaga ritme belajarmu", tipe:"review" }); },[]);
  const jam = `${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  const tgl = formatTanggalIndonesia(now);
  return (
    <div className="bento-card" style={{ background:COLORS.white, borderRadius:14, border:"1px solid #E8E6DC", padding:16, display:"flex", flexWrap:"wrap", gap:14, alignItems:"center", justifyContent:"space-between", boxShadow:"0 4px 14px rgba(27,42,74,0.04)" }}>
      <div style={{ display:"flex", gap:12, alignItems:"center", minWidth:0, flex:"1 1 160px" }}>
        <div style={{ width:42, height:42, borderRadius:10, background:COLORS.ink, color:COLORS.white, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span className="material-symbols-outlined" style={{ fontSize:20 }} aria-hidden="true">schedule</span></div>
        <div style={{ minWidth:0 }}>
          <div style={{ fontFamily:"'JetBrains Mono', monospace", fontWeight:700, fontSize:20, color:COLORS.ink, letterSpacing:0.5 }}>{jam}</div>
          <div style={{ fontSize:11, color:"#6B7280" }}>{tgl}</div>
        </div>
      </div>
      <div style={{ display:"flex", gap:10, alignItems:"center", flexWrap:"wrap", justifyContent:"flex-end", flex:"1 1 280px" }}>
        <div style={{ flex:"1 1 200px", minWidth:0, background:"#F6F5F0", border:"1px solid #E4E2D8", borderRadius:12, padding:"10px 12px", display:"flex", gap:10, alignItems:"center" }}>
          <span className="material-symbols-outlined" style={{ fontSize:18, color:COLORS.marigold, flexShrink:0 }} aria-hidden="true">lightbulb</span>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:12, fontWeight:700, color:COLORS.ink, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{reco ? `${reco.mapel} · ${reco.alasan}` : "Mulai dengan memilih mata pelajaran pertamamu"}</div>
            <div style={{ fontSize:11, color:"#6B7280" }}>Rekomendasi hari ini</div>
          </div>
        </div>
        <button style={{ ...btnPrimary, fontSize:12, padding:"10px 14px", minHeight:44, whiteSpace:"nowrap" }} onClick={onOpenJadwal}>Atur pengingat</button>
      </div>
    </div>
  );
}

/* ============================== STREAK BADGE ============================== */

function StreakBadge({ API_URL, token }) {
  const [streak, setStreak] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function muat() {
      try {
        const resp = await fetch(`${API_URL}/api/streak/saya`, { headers: { Authorization: `Bearer ${token}` } });
        if (resp.ok && !cancelled) setStreak(await resp.json());
      } catch { /* diamkan, badge cukup disembunyikan */ }
    }
    muat();
    const t = setInterval(muat, 5 * 60000); // refresh tiap 5 menit, cukup buat badge
    return () => { cancelled = true; clearInterval(t); };
  }, [API_URL, token]);

  if (!streak || streak.streak_sekarang === 0) return null;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12.5, fontWeight: 700,
      color: COLORS.marigold, background: "rgba(242,169,59,0.12)", padding: "5px 12px", borderRadius: 20,
    }}>
      <span className="material-symbols-outlined" style={{ fontSize:16 }} aria-hidden="true">local_fire_department</span> {streak.streak_sekarang} hari beruntun
    </div>
  );
}

/* ============================== LEADERBOARD ============================== */

function Leaderboard({ API_URL, token, currentUserId, onBack }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function muat() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_URL}/api/leaderboard`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error("Gagal memuat leaderboard");
        setData(await resp.json());
      } catch (e) {
        setError(e.message || "Gagal memuat leaderboard");
      } finally {
        setLoading(false);
      }
    }
    muat();
  }, [API_URL, token]);

  const medali = ["🥇", "🥈", "🥉"];

  return (
    <NotebookCard tabLabel="LEADERBOARD" maxWidth={560}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, margin: 0, display:"flex", alignItems:"center", gap:8 }}><span className="material-symbols-outlined" style={{ fontSize:22, color:COLORS.marigold }} aria-hidden="true">leaderboard</span> Leaderboard</h2>
        <button style={btnGhost} onClick={onBack}>← Dashboard</button>
      </div>
      <p style={{ color: "#6B7280", fontSize: 13, marginTop: 4 }}>Ranking siswa berdasarkan total poin dari Latihan Soal & Ujian.</p>

      {loading && <div style={{ color: "#6B7280", fontSize: 13, marginTop: 16 }}>Memuat...</div>}
      {error && <div style={{ color: COLORS.red, fontSize: 13, marginTop: 16 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ marginTop: 16, display: "grid", gap: 8 }}>
          {data.length === 0 && <div style={{ color: "#6B7280", fontSize: 13 }}>Belum ada data - jadilah yang pertama cetak poin!</div>}
          {data.map((entry, i) => {
            const isSaya = entry.id === currentUserId;
            return (
              <div key={entry.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10,
                background: isSaya ? "rgba(44,120,115,0.08)" : COLORS.white,
                border: isSaya ? `1.5px solid ${COLORS.teal}` : "1px solid #E4E2D8",
              }}>
                <div style={{ width: 26, textAlign: "center", fontSize: i < 3 ? 18 : 13, fontWeight: 700, color: COLORS.ink }}>
                  {medali[i] || i + 1}
                </div>
                <AvatarBulat API_URL={API_URL} fotoProfil={entry.foto_profil} nama={entry.nama} size={32} bingkaiId={entry.bingkai_aktif} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: COLORS.ink }}>{entry.nama}{isSaya ? " (kamu)" : ""}</div>
                  {entry.streak_sekarang > 0 && (
                    <div style={{ fontSize: 11, color: COLORS.marigold, fontWeight: 600, display:"inline-flex", alignItems:"center", gap:4 }}><span className="material-symbols-outlined" style={{ fontSize:13 }} aria-hidden="true">local_fire_department</span> {entry.streak_sekarang} hari beruntun</div>
                  )}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: COLORS.teal }}>
                  {entry.total_poin}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </NotebookCard>
  );
}

/* ============================== CONTROL PANEL (ADMIN) ============================== */

function tabBtnStyle(active) {
  return {
    padding: "10px 18px", borderRadius: 10, border: "none", cursor: "pointer",
    background: active ? COLORS.ink : COLORS.white, color: active ? COLORS.white : COLORS.ink,
    fontWeight: 700, fontSize: 13.5, boxShadow: active ? "none" : "0 2px 6px rgba(27,42,74,0.06)",
  };
}

function formatWaktuAdmin(iso) {
  if (!iso) return "Belum pernah login";
  const d = new Date(iso);
  return d.toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function TabPantauSiswa({ API_URL, token }) {
  const [siswa, setSiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function muat() {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetch(`${API_URL}/api/admin/siswa`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error("Gagal memuat data siswa");
        setSiswa(await resp.json());
      } catch (e) {
        setError(e.message || "Gagal memuat data siswa");
      } finally {
        setLoading(false);
      }
    }
    muat();
  }, [API_URL, token]);

  return (
    <div style={{ background: COLORS.white, borderRadius: 14, padding: 22, border: "1px solid #E4E2D8" }}>
      <h3 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, marginTop: 0 }}>Daftar Siswa Terdaftar ({siswa.length})</h3>
      {loading && <div style={{ color: "#6B7280", fontSize: 13 }}>Memuat...</div>}
      {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}
      {!loading && !error && (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 560 }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: `2px solid ${COLORS.paper}` }}>
                <th style={{ padding: "8px 10px" }}>Siswa</th>
                <th style={{ padding: "8px 10px" }}>Email</th>
                <th style={{ padding: "8px 10px" }}>Total Poin</th>
                <th style={{ padding: "8px 10px" }}>Terdaftar</th>
                <th style={{ padding: "8px 10px" }}>Login Terakhir</th>
              </tr>
            </thead>
            <tbody>
              {siswa.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid #F0EFE9" }}>
                  <td style={{ padding: "10px", display: "flex", alignItems: "center", gap: 8 }}>
                    <AvatarBulat API_URL={API_URL} fotoProfil={s.foto_profil} nama={s.nama} size={28} />
                    {s.nama}
                  </td>
                  <td style={{ padding: "10px", color: "#6B7280" }}>{s.email}</td>
                  <td style={{ padding: "10px", fontWeight: 700, color: COLORS.teal }}>{s.total_poin}</td>
                  <td style={{ padding: "10px", color: "#6B7280" }}>{formatWaktuAdmin(s.created_at)}</td>
                  <td style={{ padding: "10px", color: "#6B7280" }}>{formatWaktuAdmin(s.login_terakhir)}</td>
                </tr>
              ))}
              {siswa.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "20px", textAlign: "center", color: "#9A978F" }}>Belum ada siswa yang mendaftar.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* Graph view sederhana: layout grid deterministik (tanpa drag), garis SVG buat
   koneksi. Garis putus-putus tipis = urutan bab implisit (otomatis dari nomor
   bab). Garis teal tebal = koneksi manual admin (klik garis buat putuskan). */
function GraphView({ items, onNodeClick, onEdgeClick, selectedForLink }) {
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" ? window.innerWidth < 640 : false);
  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 640);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const kolom = isNarrow ? 1 : 3;
  const lebarNode = isNarrow ? 260 : 190, tinggiNode = 78, gapX = isNarrow ? 16 : 50, gapY = 40;
  const sortedItems = [...items].sort((a, b) => (a.bab ?? 999) - (b.bab ?? 999) || (a.urutan ?? 999) - (b.urutan ?? 999));
  const posisi = {};
  sortedItems.forEach((item, i) => {
    const col = i % kolom, row = Math.floor(i / kolom);
    posisi[item.id] = { x: col * (lebarNode + gapX) + lebarNode / 2 + 10, y: row * (tinggiNode + gapY) + tinggiNode / 2 + 10 };
  });
  const totalRow = Math.ceil(sortedItems.length / kolom);
  const svgW = kolom * (lebarNode + gapX) + 20;
  const svgH = totalRow * (tinggiNode + gapY) + 20;

  const edgesTersimpan = [];
  const sudahDitambah = new Set();
  items.forEach((item) => {
    (item.terhubung_ke || []).forEach((target) => {
      const key = [item.id, target].sort((a, b) => a - b).join("-");
      if (!sudahDitambah.has(key) && posisi[target]) {
        sudahDitambah.add(key);
        edgesTersimpan.push([item.id, target]);
      }
    });
  });

  const edgesImplisit = [];
  for (let i = 0; i < sortedItems.length - 1; i++) {
    edgesImplisit.push([sortedItems[i].id, sortedItems[i + 1].id]);
  }

  return (
    <div style={{ position: "relative", width: svgW, height: svgH, maxWidth: "100%" }}>
      <svg width={svgW} height={svgH} style={{ position: "absolute", top: 0, left: 0 }}>
        {edgesImplisit.map(([a, b], i) => (
          <line key={`imp-${i}`} x1={posisi[a].x} y1={posisi[a].y} x2={posisi[b].x} y2={posisi[b].y}
            stroke="#D9D7D2" strokeWidth={2} strokeDasharray="5,4" />
        ))}
        {edgesTersimpan.map(([a, b]) => (
          <line key={`e-${a}-${b}`} x1={posisi[a].x} y1={posisi[a].y} x2={posisi[b].x} y2={posisi[b].y}
            stroke={COLORS.teal} strokeWidth={2.5} style={{ cursor: "pointer" }}
            onClick={() => onEdgeClick(a, b)} />
        ))}
      </svg>
      {sortedItems.map((item) => {
        const p = posisi[item.id];
        const isSelected = selectedForLink === item.id;
        return (
          <div key={item.id} onClick={() => onNodeClick(item)} style={{
            position: "absolute", left: p.x - lebarNode / 2, top: p.y - tinggiNode / 2,
            width: lebarNode, height: tinggiNode, background: COLORS.white,
            border: isSelected ? `2.5px solid ${COLORS.marigold}` : "1.5px solid #E4E2D8",
            borderRadius: 10, padding: "8px 10px", cursor: "pointer",
            boxShadow: "0 4px 10px rgba(27,42,74,0.08)", zIndex: 1,
            display: "flex", flexDirection: "column", justifyContent: "center",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.marigold }}>BAB {item.bab ?? "?"}</div>
            <div style={{
              fontSize: 12.5, fontWeight: 700, color: COLORS.ink, marginTop: 2, lineHeight: 1.3,
              overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            }}>
              {item.judul}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function PanelEditBab({ API_URL, token, jenjang, kelas, mapel, item, onClose, onSaved, onDeleted }) {
  const isNew = !item;
  const [judul, setJudul] = useState(item?.judul || "");
  const [topik, setTopik] = useState(item?.topik || "");
  const [bab, setBab] = useState(item?.bab ?? "");
  const [urutan, setUrutan] = useState(item?.urutan ?? 1);
  const [konten, setKonten] = useState(item?.konten_asli || item?.ringkasan || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [topikDraft, setTopikDraft] = useState("");
  const [generating, setGenerating] = useState(false);
  const [rapikanLoading, setRapikanLoading] = useState(false);

  async function generateDraft() {
    if (!topikDraft.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/admin/materi-buku/generate-draft`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ jenjang, kelas, mapel, topik: topikDraft.trim() }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Gagal generate draft");
      setJudul(data.judul_bab);
      setKonten(data.konten_markdown);
      if (!topik) setTopik(topikDraft.trim());
    } catch (e) {
      setError(e.message || "Gagal generate draft");
    } finally {
      setGenerating(false);
    }
  }

  async function rapikanDenganAI() {
    if (!konten.trim()) return;
    setRapikanLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/admin/materi-buku/rapikan`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ konten_markdown: konten }),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Gagal merapikan");
      setKonten(data.konten_rapi);
    } catch (e) {
      setError(e.message || "Gagal merapikan");
    } finally {
      setRapikanLoading(false);
    }
  }

  async function simpan() {
    if (!judul.trim() || !konten.trim()) { setError("Judul & konten wajib diisi"); return; }
    setSaving(true);
    setError(null);
    try {
      const body = JSON.stringify({
        jenjang, kelas, mapel, judul: judul.trim(), konten_asli: konten,
        topik: topik || null, bab: bab ? Number(bab) : null, urutan: urutan ? Number(urutan) : null,
      });
      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
      const resp = isNew
        ? await fetch(`${API_URL}/api/admin/materi-buku`, { method: "POST", headers, body })
        : await fetch(`${API_URL}/api/admin/materi-buku/${item.id}`, { method: "PUT", headers, body });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.detail || "Gagal menyimpan");
      onSaved();
    } catch (e) {
      setError(e.message || "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function hapus() {
    if (!confirm(`Hapus bab "${judul}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    try {
      await fetch(`${API_URL}/api/admin/materi-buku/${item.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      onDeleted();
    } catch { /* diamkan, admin bisa coba lagi manual */ }
  }

  return (
    <div style={{ background: COLORS.white, borderRadius: 14, border: `2px solid ${COLORS.teal}`, padding: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.ink }}>{isNew ? "Tambah Bab Baru" : "Edit Bab"}</div>
        <button style={{ ...btnGhost, padding: "2px 6px" }} onClick={onClose}>✕</button>
      </div>

      {isNew && (
        <div style={{ background: "rgba(242,169,59,0.08)", border: `1px solid ${COLORS.marigold}`, borderRadius: 10, padding: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.marigold, marginBottom: 8 }}>✨ Generate draft dengan AI</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inputStyle, flex: 1 }} placeholder="Topik, misal: Mengenal Angka 1-10" value={topikDraft} onChange={(e) => setTopikDraft(e.target.value)} />
            <button type="button" style={{ ...btnPrimary, background: COLORS.marigold, padding: "10px 14px", fontSize: 12.5 }} onClick={generateDraft} disabled={generating}>
              {generating ? "..." : "Generate"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        <label style={labelStyle}>Judul Bab
          <input style={inputStyle} value={judul} onChange={(e) => setJudul(e.target.value)} />
        </label>
        <div className="stack-phone" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <label style={labelStyle}>Nomor Bab
            <input style={inputStyle} type="number" min={1} value={bab} onChange={(e) => setBab(e.target.value)} />
          </label>
          <label style={labelStyle}>Urutan dalam Bab
            <input style={inputStyle} type="number" min={1} value={urutan} onChange={(e) => setUrutan(e.target.value)} />
          </label>
        </div>
        <label style={labelStyle}>Topik (opsional)
          <input style={inputStyle} value={topik} onChange={(e) => setTopik(e.target.value)} />
        </label>
        <label style={labelStyle}>Konten (markdown)
          <textarea style={{ ...inputStyle, minHeight: 180, resize: "vertical", fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 }}
            value={konten} onChange={(e) => setKonten(e.target.value)} />
        </label>
        <button type="button" style={{ ...btnGhost, fontSize: 12.5, justifySelf: "start" }} onClick={rapikanDenganAI} disabled={rapikanLoading}>
          {rapikanLoading ? "Merapikan..." : "🧹 Rapikan struktur & bahasa dengan AI"}
        </button>

        {error && <div style={{ color: COLORS.red, fontSize: 12.5 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          {!isNew ? (
            <button type="button" style={{ ...btnGhost, color: COLORS.red, fontSize: 12.5 }} onClick={hapus}>Hapus Bab</button>
          ) : <span />}
          <button type="button" style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={simpan} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

function TabKelolaMateri({ API_URL, token }) {
  const [jenjang, setJenjang] = useState("sd");
  const [kelas, setKelas] = useState(1);
  const [mapel, setMapel] = useState(MAPEL_BY_JENJANG.sd[0]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null); // item | "new" | null
  const [linkMode, setLinkMode] = useState(false);
  const [linkFrom, setLinkFrom] = useState(null);

  async function muatGraph() {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${API_URL}/api/admin/materi-graph?jenjang=${jenjang}&kelas=${kelas}&mapel=${encodeURIComponent(mapel)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Gagal memuat materi");
      setItems(await resp.json());
    } catch (e) {
      setError(e.message || "Gagal memuat materi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { muatGraph(); /* eslint-disable-next-line */ }, [jenjang, kelas, mapel]);

  function gantiJenjang(idBaru) {
    const j = JENJANG.find((x) => x.id === idBaru);
    setJenjang(j.id);
    setKelas(j.kelas[0]);
    setMapel(MAPEL_BY_JENJANG[j.id][0]);
  }

  function klikNode(item) {
    if (linkMode) {
      if (!linkFrom) {
        setLinkFrom(item.id);
      } else if (linkFrom !== item.id) {
        hubungkanNode(linkFrom, item.id);
        setLinkFrom(null);
        setLinkMode(false);
      }
      return;
    }
    setSelectedNode(item);
  }

  async function hubungkanNode(idA, idB) {
    try {
      await fetch(`${API_URL}/api/admin/materi-graph/hubungkan`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_a: idA, id_b: idB }),
      });
      await muatGraph();
    } catch { /* diamkan */ }
  }

  async function putuskanEdge(idA, idB) {
    if (!confirm("Putuskan koneksi antar bab ini?")) return;
    try {
      await fetch(`${API_URL}/api/admin/materi-graph/putuskan`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id_a: idA, id_b: idB }),
      });
      await muatGraph();
    } catch { /* diamkan */ }
  }

  return (
    <div>
      <div style={{ background: COLORS.white, borderRadius: 14, padding: 18, border: "1px solid #E4E2D8", marginBottom: 16 }}>
        <div className="kontrol-3col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <label style={labelStyle}>Jenjang
            <GlideSelect
              options={JENJANG.map(j=>({ value:j.id, label:j.label }))}
              value={jenjang}
              onChange={(v)=>gantiJenjang(v)}
              ariaLabel="Pilih jenjang"
              surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
              size="md" radius={10} menuWidth={140}
            />
          </label>
          <label style={labelStyle}>Kelas
            <GlideSelect
              options={JENJANG.find(j=>j.id===jenjang).kelas.map(k=>({ value:String(k), label:`Kelas ${k}` }))}
              value={String(kelas)}
              onChange={(v)=>setKelas(Number(v))}
              ariaLabel="Pilih kelas"
              surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
              size="md" radius={10} menuWidth={140}
            />
          </label>
          <label style={labelStyle}>Mapel
            <GlideSelect
              options={MAPEL_BY_JENJANG[jenjang].map(m=>({ value:m, label:m }))}
              value={mapel}
              onChange={(v)=>setMapel(v)}
              ariaLabel="Pilih mapel"
              surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
              size="md" radius={10} menuWidth={180}
            />
          </label>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div style={{ fontSize: 13, color: "#6B7280" }}>
          {items.length} bab · {jenjang.toUpperCase()} Kelas {kelas} · {mapel}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            style={{ ...btnGhost, background: linkMode ? "rgba(242,169,59,0.15)" : "transparent", color: linkMode ? COLORS.marigold : COLORS.ink }}
            onClick={() => { setLinkMode(!linkMode); setLinkFrom(null); }}
          >
            {linkMode ? (linkFrom ? "Klik bab tujuan..." : "Klik bab pertama...") : "🔗 Mode Hubungkan"}
          </button>
          <button style={btnPrimary} onClick={() => setSelectedNode("new")}>+ Tambah Bab</button>
        </div>
      </div>

      {loading && <div style={{ color: "#6B7280", fontSize: 13 }}>Memuat graph...</div>}
      {error && <div style={{ color: COLORS.red, fontSize: 13 }}>{error}</div>}

      {!loading && !error && (
        <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div className="graph-scroll" style={{ flex: "2 1 500px", minWidth: 0, background: COLORS.white, borderRadius: 14, border: "1px solid #E4E2D8", padding: 16 }}>
            {items.length === 0 ? (
              <div style={{ color: "#9A978F", fontSize: 13, textAlign: "center", padding: "30px 0" }}>
                Belum ada bab untuk kombinasi ini. Klik <b>+ Tambah Bab</b> untuk mulai.
              </div>
            ) : (
              <GraphView items={items} onNodeClick={klikNode} onEdgeClick={putuskanEdge} selectedForLink={linkFrom} />
            )}
          </div>

          <div style={{ flex: "1 1 320px", minWidth: 0 }}>
            {selectedNode && (
              <PanelEditBab
                API_URL={API_URL} token={token} jenjang={jenjang} kelas={kelas} mapel={mapel}
                item={selectedNode === "new" ? null : selectedNode}
                onClose={() => setSelectedNode(null)}
                onSaved={() => { setSelectedNode(null); muatGraph(); }}
                onDeleted={() => { setSelectedNode(null); muatGraph(); }}
              />
            )}
            {!selectedNode && (
              <div style={{ background: COLORS.paper, borderRadius: 14, border: "2px dashed #D9D7D2", padding: 20, textAlign: "center", color: "#9A978F", fontSize: 13 }}>
                Klik salah satu bab di graph untuk edit, atau tambah bab baru.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function KelolaBingkai({ API_URL, token }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [nama, setNama] = useState("");
  const [levelBuka, setLevelBuka] = useState("6");
  const [gaya, setGaya] = useState("preset:daun-muda:#2C7873:#E8F5E9");
  const [urutan, setUrutan] = useState("0");
  const [aktif, setAktif] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  async function muat(){
    setLoading(true); setError(null);
    try{ const r=await fetch(`${API_URL}/api/admin/bingkai`,{headers:{Authorization:`Bearer ${token}`}}); if(!r.ok) throw new Error("Gagal memuat"); setRows(await r.json()); }catch(e){ setError(e.message);} finally{ setLoading(false); }
  }
  useEffect(()=>{ muat(); },[]);
  function openTambah(){ setEditId(null); setNama(""); setLevelBuka("6"); setGaya("preset:daun-muda:#2C7873:#E8F5E9"); setUrutan("0"); setAktif(true); setMsg(null); setFormOpen(true); }
  function openEdit(r){ setEditId(r.id); setNama(r.nama); setLevelBuka(String(r.level_buka)); setGaya(r.gaya); setUrutan(String(r.urutan||0)); setAktif(!!r.aktif); setMsg(null); setFormOpen(true); }
  async function simpan(){
    const lb=parseInt(levelBuka,10);
    if(!nama.trim()){ setMsg("Nama tidak boleh kosong"); return; }
    if(lb<6){ setMsg("Level buka minimal 6"); return; }
    if(!gaya.trim()){ setMsg("Gaya tidak boleh kosong"); return; }
    setSaving(true); setMsg(null);
    try{
      const body=JSON.stringify({ id: editId||undefined, nama:nama.trim(), level_buka:lb, gaya:gaya.trim(), urutan:parseInt(urutan,10)||0, aktif });
      const url=editId?`${API_URL}/api/admin/bingkai/${editId}`:`${API_URL}/api/admin/bingkai`;
      const r=await fetch(url,{method: editId?"PUT":"POST", headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`}, body});
      if(!r.ok){ const e=await r.json().catch(()=>({})); throw new Error(e.detail||"Gagal simpan"); }
      setFormOpen(false); muat();
    }catch(e){ setMsg(e.message);} finally{ setSaving(false); }
  }
  async function hapus(id){
    if(!confirm("Hapus bingkai ini?")) return;
    try{ const r=await fetch(`${API_URL}/api/admin/bingkai/${id}`,{method:"DELETE",headers:{Authorization:`Bearer ${token}`}}); if(!r.ok){const e=await r.json().catch(()=>({})); throw new Error(e.detail||"Gagal hapus");} muat(); }catch(e){ alert(e.message); }
  }
  async function toggleAktif(r){
    try{ const b={ nama:r.nama, level_buka:r.level_buka, gaya:r.gaya, urutan:r.urutan, aktif: !r.aktif }; const resp=await fetch(`${API_URL}/api/admin/bingkai/${r.id}`,{method:"PUT",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify(b)}); if(!resp.ok) throw new Error("Gagal"); muat(); }catch(e){ alert(e.message); }
  }
  const previewStyle = gaya.startsWith("preset:") ? (BINGKAI_PRESET[gaya.split(":")[1]]||{bg:COLORS.paper,border:"2px solid #E4E2D8"}) : {bg:COLORS.paper,border:"2px solid #E4E2D8"};
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <h3 style={{margin:0,fontFamily:"'Poppins', sans-serif",color:COLORS.ink}}>Kelola Bingkai</h3>
        <button style={{...btnPrimary,background:COLORS.teal}} onClick={openTambah}>+ Tambah Bingkai</button>
      </div>
      {loading && <div style={{color:"#6B7280",fontSize:13}}>Memuat...</div>}
      {error && <div style={{color:COLORS.red,fontSize:13}}>{error} <button style={btnGhost} onClick={muat}>Coba lagi</button></div>}
      {!loading && !error && (
        <div style={{display:"grid",gap:8}}>
          {rows.map(r=>(
            <div key={r.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:10,background: r.aktif?COLORS.white:"#F3F2EE",border:"1px solid #E4E2D8",opacity: r.aktif?1:0.7}}>
              <div style={{width:36,height:36,borderRadius:"50%",background: (BINGKAI_PRESET[r.id]?.bg||COLORS.paper),border: BINGKAI_PRESET[r.id]?.border||"2px solid #E4E2D8",flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}><div style={{fontWeight:700,fontSize:13,color:COLORS.ink}}>{r.nama}</div><div style={{fontSize:11,color:"#9A978F"}}>Lv {r.level_buka} - {r.id} - {r.jumlah_pemilik} pemilik{r.aktif?"":" - nonaktif"}</div></div>
              <button style={{...btnGhost,fontSize:12,border:"1px solid #E4E2D8",borderRadius:8,padding:"5px 10px"}} onClick={()=>openEdit(r)}>Ubah</button>
              <button style={{...btnGhost,fontSize:12,border:"1px solid #E4E2D8",borderRadius:8,padding:"5px 10px"}} onClick={()=>toggleAktif(r)}>{r.aktif?"Nonaktifkan":"Aktifkan"}</button>
              <button style={{...btnGhost,fontSize:12,color: r.jumlah_pemilik>0? "#9A978F":COLORS.red,border:"1px solid #E4E2D8",borderRadius:8,padding:"5px 10px"}} disabled={r.jumlah_pemilik>0} title={r.jumlah_pemilik>0?"Sudah dimiliki, nonaktifkan saja":"Hapus"} onClick={()=>hapus(r.id)}>Hapus</button>
            </div>
          ))}
          {rows.length===0 && <div style={{color:"#9A978F",fontSize:13,textAlign:"center",padding:"20px 0"}}>Belum ada bingkai. Tambah yang pertama.</div>}
        </div>
      )}
      {formOpen && (
        <div style={{position:"fixed",inset:0,zIndex:60,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} role="dialog" aria-modal="true">
          <div onClick={()=>setFormOpen(false)} style={{position:"absolute",inset:0,background:"rgba(27,42,74,0.45)",backdropFilter:"blur(4px)"}}/>
          <div style={{position:"relative",background:COLORS.white,borderRadius:16,padding:20,maxWidth:520,width:"100%",border:"1.5px solid #E4E2D8",maxHeight:"90vh",overflow:"auto"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}><div style={{fontWeight:700,color:COLORS.ink}}>{editId?"Ubah Bingkai":"Tambah Bingkai"}</div><button onClick={()=>setFormOpen(false)} style={{width:32,height:32,borderRadius:"50%",border:"1px solid #E4E2D8",background:COLORS.white,cursor:"pointer"}}>X</button></div>
            <div style={{display:"flex",gap:16,flexWrap:"wrap"}}>
              <div style={{flex:"1 1 260px",display:"grid",gap:10}}>
                <label style={labelStyle}>Nama<input style={inputStyle} value={nama} onChange={e=>setNama(e.target.value)} placeholder="Daun Muda"/></label>
                <label style={labelStyle}>Level buka (min 6)<input style={inputStyle} type="number" min={6} value={levelBuka} onChange={e=>setLevelBuka(e.target.value)}/></label>
                <label style={labelStyle}>Gaya (preset atau css)<input style={inputStyle} value={gaya} onChange={e=>setGaya(e.target.value)} placeholder="preset:daun-muda:#2C7873:#E8F5E9"/></label>
                <label style={labelStyle}>Urutan<input style={inputStyle} type="number" value={urutan} onChange={e=>setUrutan(e.target.value)}/></label>
                <label style={{display:"flex",alignItems:"center",gap:8,fontSize:13}}><input type="checkbox" checked={aktif} onChange={e=>setAktif(e.target.checked)}/> Aktif</label>
                {msg && <div style={{color:COLORS.red,fontSize:12}}>{msg}</div>}
                <button style={{...btnPrimary,background:COLORS.teal,opacity:saving?0.6:1}} disabled={saving} onClick={simpan}>{saving?"Menyimpan...":"Simpan"}</button>
              </div>
              <div style={{flex:"0 0 120px",textAlign:"center"}}>
                <div style={{fontSize:11,color:"#9A978F",marginBottom:8}}>Preview</div>
                <div style={{width:96,height:96,borderRadius:"50%",margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"center",background: previewStyle.bg,border: previewStyle.border,fontSize:28}}>O</div>
                <div style={{fontSize:11,color:COLORS.ink,fontWeight:600,marginTop:8}}>{nama||"Nama bingkai"}</div>
                <div style={{fontSize:11,color:"#9A978F"}}>Lv {levelBuka||6}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlPanel({ API_URL, currentUser, token, onLogout, onPreviewSiswa }) {
  const [tab, setTab] = useState("siswa"); // "siswa" | "materi" | "bingkai"
  return (
    <div style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "'Inter', sans-serif", padding: "30px 20px 60px" }}>
      <style>{FONT_IMPORT}</style>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 22, color: COLORS.ink }}>
              Control Panel <span style={{ color: COLORS.marigold }}>BelajarAdaptif</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7280" }}>Masuk sebagai {currentUser.nama} (admin)</div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={btnGhost} onClick={onPreviewSiswa}>👁 Lihat sebagai Siswa</button>
            <button style={{ ...btnGhost, color: COLORS.red }} onClick={onLogout}>Keluar</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <button onClick={() => setTab("siswa")} style={tabBtnStyle(tab === "siswa")}>Pantau Siswa</button>
          <button onClick={() => setTab("materi")} style={tabBtnStyle(tab === "materi")}>Kelola Materi</button>
          <button onClick={() => setTab("bingkai")} style={tabBtnStyle(tab === "bingkai")}>Kelola Bingkai</button>
        </div>

        {tab === "siswa" && <TabPantauSiswa API_URL={API_URL} token={token} />}
        {tab === "materi" && <TabKelolaMateri API_URL={API_URL} token={token} />}
        {tab === "bingkai" && <KelolaBingkai API_URL={API_URL} token={token} />}
      </div>
    </div>
  );
}

/* ============================== ROOT APP ============================== */

export default function BelajarAdaptif() {
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  const [token, setToken] = useState(() => localStorage.getItem("ba_token"));
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sesiError, setSesiError] = useState(null);
  const [previewAsSiswa, setPreviewAsSiswa] = useState(false);
  const [showLanding, setShowLanding] = useState(() => !localStorage.getItem("ba_token"));
  const [authInitialMode, setAuthInitialMode] = useState("login");
  const [view, setView] = useState("loading");
  const [jenjang, setJenjang] = useState(null);
  const [kelas, setKelas] = useState(null);
  const [quizIdx, setQuizIdx] = useState(0);
  const [tally, setTally] = useState({ visual: 0, auditori: 0, kinestetik: 0, membaca: 0 });
  const [tone, setTone] = useState("netral");
  const [selectedMapel, setSelectedMapel] = useState(null);
  const [selectedBabId, setSelectedBabId] = useState(null);
  const [selectedBabMapel, setSelectedBabMapel] = useState(null);
  const [selectedUjian, setSelectedUjian] = useState(null);

  function hydrateFromUser(user) {
    if (!user || !user.onboarding_selesai) return false;
    if (user.jenjang) setJenjang(user.jenjang);
    if (user.kelas) setKelas(user.kelas);
    if (user.tone) setTone(user.tone);
    if (user.learning_style) {
      const ls = user.learning_style;
      setTally({ visual: ls === "visual" ? 3 : 0, auditori: ls === "auditori" ? 3 : 0, kinestetik: ls === "kinestetik" ? 3 : 0, membaca: ls === "membaca" ? 3 : 0 });
    }
    return true;
  }

  useEffect(() => {
    let cancelled = false;
    async function cekSesi() {
      if (!token) { if (!cancelled) { setSesiError(null); setAuthLoading(false); setView("jenjang"); } return; }
      try {
        const resp = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error("Sesi tidak valid");
        const user = await resp.json();
        if (cancelled) return;
        setCurrentUser(user);
        setSesiError(null);
        const sudah = hydrateFromUser(user);
        setView(sudah ? "dashboard" : "jenjang");
      } catch {
        if (cancelled) return;
        if (!navigator.onLine) setSesiError("offline");
        else setSesiError("sesi_gagal");
      } finally {
        if (!cancelled) setAuthLoading(false);
      }
    }
    cekSesi();
    return () => { cancelled = true; };
    // eslint-disable-next-line
  }, []);

  function handleLoggedIn(tok, user) {
    localStorage.setItem("ba_token", tok);
    setToken(tok);
    setCurrentUser(user);
    setPreviewAsSiswa(false);
    setShowLanding(false);
    setSesiError(null);
    const sudah = hydrateFromUser(user);
    setView(sudah ? "dashboard" : "jenjang");
  }

  function handleLogout() {
    if (!window.confirm("Keluar dari sesi? Progres yang belum disimpan mungkin hilang.")) return;
    localStorage.removeItem("ba_token");
    setToken(null);
    setCurrentUser(null);
    setPreviewAsSiswa(false);
    setSesiError(null);
    setJenjang(null); setKelas(null); setQuizIdx(0);
    setTally({ visual: 0, auditori: 0, kinestetik: 0, membaca: 0 });
    setTone("netral");
    setView("jenjang");
    setShowLanding(true);
  }

  useEffect(() => {
    const goLanding = () => {
      if (view === "quiz" || view === "ujian") {
        if (!window.confirm("Progres belum disimpan, tetap keluar ke Landing?")) return;
      }
      setView("landing");
    };
    window.addEventListener("ba:goLanding", goLanding);
    return () => window.removeEventListener("ba:goLanding", goLanding);
  }, [view]);

  const learningStyle = useMemo(() => {
    const entries = Object.entries(tally);
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0][1] === 0 ? "visual" : entries[0][0];
  }, [tally]);

  const [llmStatus, setLlmStatus] = useState({ status: "checking" });
  useEffect(() => {
    let cancelled = false;
    async function checkHealth() {
      try {
        const resp = await fetch(`${API_URL}/api/health`);
        const data = await resp.json();
        if (!cancelled) setLlmStatus(data);
      } catch {
        if (!cancelled) setLlmStatus({ status: "unreachable" });
      }
    }
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [API_URL]);

  const llmBadge = (
    <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11.5,
        fontFamily: "'JetBrains Mono', monospace", padding: "3px 10px", borderRadius: 20,
        background: llmStatus.status === "ok" ? "rgba(44,120,115,0.10)" : llmStatus.status === "checking" ? "rgba(107,114,128,0.10)" : "rgba(214,69,69,0.10)",
        color: llmStatus.status === "ok" ? COLORS.teal : llmStatus.status === "checking" ? "#6B7280" : COLORS.red,
      }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor" }} />
        {llmStatus.status === "ok" && `LLM tersambung (${llmStatus.provider}, ${llmStatus.latency_ms}ms)`}
        {llmStatus.status === "checking" && "Mengecek koneksi LLM..."}
        {llmStatus.status === "error" && `LLM error: ${llmStatus.detail?.slice(0, 60) || "tidak diketahui"}`}
        {llmStatus.status === "unreachable" && "Backend tidak bisa dihubungi"}
      </div>
    </div>
  );

  /* ---------------- Sistem notifikasi jadwal belajar ----------------
     Jalan di level root (bukan cuma saat halaman Jadwal dibuka) supaya
     user tetap diingatkan walau lagi di halaman lain. Dua interval
     terpisah: satu buat refresh daftar jadwal dari server, satu lagi
     (lebih sering) buat mencocokkan waktu sekarang ke jadwal aktif. */
  const [jadwalNotif, setJadwalNotif] = useState([]);
  const [toast, setToast] = useState(null); // { judul, mapel, pesan }
  const sudahDiberitahuRef = useRef(new Set()); // key: "id-YYYY-MM-DD", cegah notifikasi dobel

  useEffect(() => {
    let cancelled = false;
    async function muatJadwalNotif() {
      try {
        const resp = await fetch(`${API_URL}/api/jadwal`);
        if (resp.ok && !cancelled) setJadwalNotif(await resp.json());
      } catch { /* diamkan, coba lagi di interval berikutnya */ }
    }
    muatJadwalNotif();
    const interval = setInterval(muatJadwalNotif, 60000); // sinkron ulang tiap 1 menit
    return () => { cancelled = true; clearInterval(interval); };
  }, [API_URL]);

  useEffect(() => {
    const cek = setInterval(() => {
      const now = new Date();
      const hariNow = hariIniId();
      const jamNow = formatJam(now).slice(0, 5); // "HH:MM"
      const todayKey = now.toISOString().slice(0, 10);

      jadwalNotif.forEach((item) => {
        if (!item.aktif || item.hari !== hariNow || item.jam_mulai !== jamNow) return;
        const key = `${item.id}-${todayKey}`;
        if (sudahDiberitahuRef.current.has(key)) return;
        sudahDiberitahuRef.current.add(key);

        const pesan = MOTIVASI_MULAI[Math.floor(Math.random() * MOTIVASI_MULAI.length)];
        setToast({ judul: item.judul, mapel: item.mapel, pesan });

        if (typeof Notification !== "undefined" && Notification.permission === "granted") {
          new Notification(`${item.judul}`, { body: pesan, tag: key });
        }
      });
    }, 15000); // cek tiap 15 detik biar tidak kelewat menit yang pas
    return () => clearInterval(cek);
  }, [jadwalNotif]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 10000);
    return () => clearTimeout(t);
  }, [toast]);

  if (authLoading) {
    return <Preloader minMs={700} maxMs={1500} />;
  }

  if (sesiError) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.paper, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Inter', sans-serif", padding: 20 }}>
        <style>{FONT_IMPORT}</style>
        <div style={{ background: COLORS.white, borderRadius: 14, padding: 28, maxWidth: 420, textAlign: "center", boxShadow: "0 12px 30px rgba(27,42,74,0.10)" }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: 18, color: COLORS.ink }}>{sesiError==="offline"?"Koneksi terputus":"Sesi bermasalah"}</div>
          <div style={{ fontSize: 13, color: "#6B7280", marginTop: 8, lineHeight: 1.5 }}>{sesiError==="offline"?"Periksa internet kamu, lalu coba lagi.":"Gagal memverifikasi sesi. Coba lagi atau login ulang."}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 18 }}>
            <button style={btnPrimary} onClick={()=>{ setAuthLoading(true); setSesiError(null); setView("loading"); window.location.reload(); }}>Coba lagi</button>
            <button style={btnGhost} onClick={()=>{ localStorage.removeItem("ba_token"); setToken(null); setCurrentUser(null); setSesiError(null); setShowLanding(true); setView("jenjang"); }}>Login ulang</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "loading") {
    return <Preloader minMs={700} maxMs={1500} />;
  }

  if (view === "landing") {
    const isLoggedIn = !!token && !!currentUser;
    return <Landing onMasuk={()=>{ setAuthInitialMode("login"); setShowLanding(false); setView("jenjang"); }} onDaftar={()=>{ setAuthInitialMode("daftar"); setShowLanding(false); setView("jenjang"); }} isLoggedIn={isLoggedIn} onKembaliDashboard={()=>setView(currentUser?.onboarding_selesai?"dashboard":"jenjang")} />;
  }

  if (!token || !currentUser) {
    if (showLanding) {
      return (
        <Landing
          onMasuk={() => { setAuthInitialMode("login"); setShowLanding(false); }}
          onDaftar={() => { setAuthInitialMode("daftar"); setShowLanding(false); }}
        />
      );
    }
    return (
      <AuthScreen
        API_URL={API_URL}
        onLoggedIn={handleLoggedIn}
        onBackToLanding={() => setShowLanding(true)}
        initialMode={authInitialMode}
      />
    );
  }

  if (currentUser.role === "admin" && !previewAsSiswa) {
    return (
      <ControlPanel
        API_URL={API_URL} token={token} currentUser={currentUser}
        onLogout={handleLogout}
        onPreviewSiswa={() => setPreviewAsSiswa(true)}
      />
    );
  }

  return (
    <div className="app-shell" style={{ minHeight: "100vh", background: COLORS.paper, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      {toast && (
        <div style={{
          position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", zIndex: 50,
          background: COLORS.ink, color: COLORS.white, padding: "14px 18px", borderRadius: 12,
          boxShadow: "0 12px 30px rgba(0,0,0,0.25)", display: "flex", alignItems: "flex-start", gap: 12,
          maxWidth: "90vw", width: 380,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize:22, color:COLORS.white }} aria-hidden="true">alarm</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{toast.judul}{toast.mapel ? ` - ${toast.mapel}` : ""}</div>
            <div style={{ fontSize: 12.5, opacity: 0.85, marginTop: 3, lineHeight: 1.4 }}>{toast.pesan}</div>
          </div>
          <button onClick={() => setToast(null)} style={{ background: "transparent", border: "none", color: COLORS.white, fontSize: 16, cursor: "pointer", padding: 0, opacity: 0.7 }}>✕</button>
        </div>
      )}

      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <img src="/logo.png" alt="BelajarAdaptif" style={{ width: 72, height: 72, objectFit: "contain", margin: "0 auto 10px", display: "block" }} />
        <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 24, color: COLORS.ink, letterSpacing: -0.4 }}>
          Belajar<span style={{ color: COLORS.marigold }}>.Adaptif</span>
        </div>
        <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>
          {view === "jenjang" || view === "gaya" ? "Onboarding singkat sebelum mulai" : "Dashboard belajar kamu"}
        </div>
        {llmBadge}
      </div>

      {(view === "jenjang" || view === "gaya") && <StepDots step={view === "jenjang" ? 0 : 1} total={2} />}

      <div style={{ marginTop: 22 }}>
        {view === "jenjang" && (
          <NotebookCard tabLabel="LANGKAH 1 - JENJANG & KELAS">
            <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, marginTop: 0 }}>
              Kamu sekarang kelas berapa?
            </h2>
            <p style={{ color: "#6B7280", fontSize: 14, marginTop: -8 }}>
              Ini nentuin cakupan materi & tingkat kesulitan soal. Mata pelajaran dipilih nanti di Dashboard.
            </p>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }} className="stack-phone">
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:COLORS.ink, marginBottom:8 }}>Jenjang</div>
                <GlideSelect
                  options={JENJANG.map(j=>({ value:j.id, label:j.label }))}
                  value={jenjang || ""}
                  onChange={(v)=>{ setJenjang(v); setKelas(null); }}
                  placeholder="Pilih jenjang"
                  ariaLabel="Pilih jenjang"
                  surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
                  size="lg" radius={12} menuWidth={200}
                />
              </div>
              <div>
                <div style={{ fontSize:12, fontWeight:700, color:COLORS.ink, marginBottom:8 }}>Kelas</div>
                <GlideSelect
                  options={jenjang ? JENJANG.find(j=>j.id===jenjang).kelas.map(k=>({ value:String(k), label:`Kelas ${k}` })) : []}
                  value={kelas ? String(kelas) : ""}
                  onChange={(v)=>setKelas(Number(v))}
                  placeholder={jenjang ? "Pilih kelas" : "Pilih jenjang dulu"}
                  ariaLabel="Pilih kelas"
                  disabled={!jenjang}
                  surfaceColor="#FFFFFF" highlightColor="#F6F5F0" accentColor="#1B2A4A" textColor="#1B2A4A"
                  size="lg" radius={12} menuWidth={200}
                />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 24 }}>
              <button style={{ ...btnPrimary, opacity: jenjang && kelas ? 1 : 0.4 }} disabled={!(jenjang && kelas)} onClick={() => setView("gaya")}>
                Lanjut →
              </button>
            </div>
          </NotebookCard>
        )}

        {view === "gaya" && (
          <NotebookCard tabLabel={`LANGKAH 2 - GAYA BELAJAR (${quizIdx + 1}/${STYLE_QUIZ.length})`}>
            <h2 style={{ fontFamily: "'Poppins', sans-serif", color: COLORS.ink, fontSize: 20, marginTop: 0 }}>
              {STYLE_QUIZ[quizIdx].q}
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {STYLE_QUIZ[quizIdx].opts.map((opt) => (
                <button key={opt.text} onClick={async () => {
                  const nextTally = { ...tally, [opt.style]: tally[opt.style] + 1 };
                  setTally(nextTally);
                  if (quizIdx < STYLE_QUIZ.length - 1) { setQuizIdx(quizIdx + 1); return; }
                  const entries = Object.entries(nextTally); entries.sort((a,b)=>b[1]-a[1]);
                  const finalStyle = entries[0][1]===0?"visual":entries[0][0];
                  try {
                    await fetch(`${API_URL}/api/auth/onboarding`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                      body: JSON.stringify({ jenjang, kelas, learning_style: finalStyle, tone }),
                    });
                    const me = await fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r=>r.json()).catch(()=>null);
                    if (me) setCurrentUser(me);
                  } catch { /* simpan gagal tidak block dashboard */ }
                  setView("dashboard");
                }} style={{
                  textAlign: "left", padding: "13px 16px", borderRadius: 10, border: "2px solid #E4E2D8",
                  background: COLORS.white, color: COLORS.ink, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 14, cursor: "pointer",
                }}>
                  {opt.text}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <button style={btnGhost} onClick={() => (quizIdx === 0 ? setView("jenjang") : setQuizIdx(quizIdx - 1))}>← Kembali</button>
            </div>
          </NotebookCard>
        )}

        {view === "dashboard" && (
          <Dashboard
            jenjang={jenjang} kelas={kelas} learningStyle={learningStyle} tone={tone} setTone={async (v)=>{ setTone(v); try{ await fetch(`${API_URL}/api/auth/onboarding`,{method:"PUT", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}`}, body: JSON.stringify({ jenjang, kelas, learning_style: learningStyle, tone: v })});}catch{} }}
            API_URL={API_URL} token={token} currentUser={currentUser}
            onOpenMateriSaya={() => setView("materi-saya")}
            onOpenPilihMapel={() => setView("pilih-mapel")}
            onOpenCatatan={() => setView("catatan")}
            onOpenUjian={() => setView("pilih-ujian")}
            onOpenUjianTersedia={() => setView("pilih-ujian-tersedia")}
            onOpenJadwal={() => setView("jadwal")}
            onOpenProfil={() => setView("profil")}
            onOpenLeaderboard={() => setView("leaderboard")}
            onOpenPengaturan={() => setView("pengaturan")}
            onOpenLevel={() => setView("level")}
            onKembaliControlPanel={previewAsSiswa ? () => setPreviewAsSiswa(false) : null}
          />
        )}

        {view === "pengaturan" && (
          <PengaturanBelajar
            API_URL={API_URL} token={token}
            jenjang={jenjang} kelas={kelas} learningStyle={learningStyle} tone={tone}
            setJenjang={setJenjang} setKelas={setKelas} setTally={setTally} setTone={setTone}
            onBack={() => setView("dashboard")}
            onSaved={(u)=> u && setCurrentUser(u)}
          />
        )}

        {view === "jadwal" && (
          <JadwalBelajar API_URL={API_URL} onBack={() => setView("dashboard")} />
        )}

        {view === "materi-saya" && (
          <MateriSaya API_URL={API_URL} jenjang={jenjang} learningStyle={learningStyle} tone={tone} onBack={() => setView("dashboard")} />
        )}

        {view === "catatan" && (
          <CatatanSaya API_URL={API_URL} onBack={() => setView("dashboard")} />
        )}

        {view === "profil" && (
          <ProfilSaya API_URL={API_URL} token={token} currentUser={currentUser}
            onUpdated={(u) => setCurrentUser(u)} onLogout={handleLogout} onBack={() => setView("dashboard")} />
        )}

        {view === "leaderboard" && (
          <Leaderboard API_URL={API_URL} token={token} currentUserId={currentUser.id} onBack={() => setView("dashboard")} />
        )}

        {view === "level" && (
          <HalamanLevel API_URL={API_URL} token={token} onBack={() => setView("dashboard")} onPakai={(id)=>{ const u={...currentUser, bingkai_aktif:id}; setCurrentUser(u); window.dispatchEvent(new CustomEvent("ba:level-refresh")); }} />
        )}

        {view === "pilih-mapel" && (
          <PilihMapel API_URL={API_URL} jenjang={jenjang} kelas={kelas} onBack={() => setView("dashboard")}
            onStartQuiz={(m) => { setSelectedMapel(m); setView("quiz"); }}
            onOpenBab={(babId, mapelName) => { setSelectedBabId(babId); setSelectedBabMapel(mapelName); setView("detail-bab"); }} />
        )}

        {view === "detail-bab" && selectedBabId && (
          <DetailBab API_URL={API_URL} jenjang={jenjang} kelas={kelas} babId={selectedBabId} mapel={selectedBabMapel || "Materi"}
            onBack={() => setView("pilih-mapel")}
            onMulaiTes={(payload) => { setSelectedUjian({ sumber: "materi_tersedia", ...payload }); setView("ujian"); }} />
        )}

        {view === "quiz" && (
          <QuizView API_URL={API_URL} token={token} jenjang={jenjang} kelas={kelas} mapel={selectedMapel}
            learningStyle={learningStyle} tone={tone} onBack={() => setView("pilih-mapel")} />
        )}

        {view === "pilih-ujian" && (
          <PilihSumberUjian API_URL={API_URL} onBack={() => setView("dashboard")}
            onStartUjian={(payload) => { setSelectedUjian(payload); setView("ujian"); }} />
        )}

        {view === "pilih-ujian-tersedia" && (
          <PilihSumberUjianTersedia API_URL={API_URL} jenjang={jenjang} kelas={kelas} onBack={() => setView("dashboard")}
            onStartUjian={(payload) => { setSelectedUjian(payload); setView("ujian"); }} />
        )}

        {view === "ujian" && selectedUjian && (
          <UjianView API_URL={API_URL} token={token} sumber={selectedUjian.sumber} sumberId={selectedUjian.sumberId}
            judul={selectedUjian.judul} jumlahSoal={selectedUjian.jumlahSoal}
            learningStyle={learningStyle} tone={tone}
            onBack={() => {
              if (selectedUjian.sumber === "materi_tersedia" && selectedBabId) setView("detail-bab");
              else if (selectedUjian.sumber === "materi_tersedia") setView("pilih-mapel");
              else setView("pilih-ujian");
            }} />
        )}
      </div>
    </div>
  );
}

