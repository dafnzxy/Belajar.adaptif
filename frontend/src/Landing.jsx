import React, { useEffect, useRef, useState } from "react";
import Preloader from "./Preloader.jsx";

export default function Landing({ onMasuk, onDaftar, isLoggedIn, onKembaliDashboard }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const [toast, setToast] = useState(null);
  const [activeFase, setActiveFase] = useState("Semua Fase");
  const revealRefs = useRef([]);

  const pop = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape" && mobileOpen) setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [mobileOpen]);

  useEffect(() => {
    const obs = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(e.isIntersecting) e.target.classList.add("in");
      });
    }, { threshold: 0.12 });
    revealRefs.current.forEach(el=> el && obs.observe(el));
    return ()=> obs.disconnect();
  }, []);

  const addReveal = (el) => { if(el && !revealRefs.current.includes(el)) revealRefs.current.push(el); };

  const smoothScroll = (id) => (e) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(id);
    if(el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-surface font-body-md text-on-surface antialiased notebook-dots selection:bg-secondary-fixed selection:text-primary overflow-x-hidden">
      <Preloader minMs={900} maxMs={1800} />
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-primary-container text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-semibold" style={{animation:"toastIn .3s ease"}}>
          <img src="/logo.png" alt="" className="w-6 h-6 rounded-full bg-white p-0.5" />
          <span>{toast}</span>
        </div>
      )}

      {showDemo && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-primary/60 backdrop-blur-sm" onClick={()=>setShowDemo(false)} />
          <div className="relative bg-surface-container-lowest rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="logo" className="w-10 h-10 object-contain" />
                <div>
                  <div className="font-bold text-primary">Demo Interaktif</div>
                  <div className="text-xs text-on-surface-variant">Lihat cara AI buatin soal dari materimu</div>
                </div>
              </div>
              <button onClick={()=>setShowDemo(false)} className="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center hover:bg-surface-dim transition-colors">✕</button>
            </div>
            <div className="bg-surface rounded-xl p-4 border border-outline-variant mb-4">
              <div className="text-xs font-bold text-on-tertiary-container mb-2">CONTOH MATERI: Pecahan — Kelas 4</div>
              <div className="text-sm leading-relaxed">Ibu memotong kue menjadi 8 bagian sama besar. Arka makan 3 bagian, Nadine makan 2 bagian. Berapa bagian yang tersisa?</div>
              <div className="grid grid-cols-2 gap-2 mt-4">
                {["A. 2/8","B. 3/8","C. 5/8","D. 6/8"].map((o,i)=>(
                  <button key={o} onClick={()=>pop(i===1?"Benar! 3/8 🎉":"Belum tepat, coba lagi")} className={`p-3 rounded-xl border text-sm font-semibold text-left transition-all ${i===1?"bg-tertiary-fixed/30 border-on-tertiary-container":"bg-white border-outline-variant hover:border-primary-container"}`}>{o}</button>
                ))}
              </div>
            </div>
            <button onClick={()=>{setShowDemo(false); onDaftar&&onDaftar()}} className="w-full py-3 rounded-full bg-primary-container text-on-primary font-bold hover:bg-primary transition-colors">Lanjut daftar & coba materimu →</button>
          </div>
        </div>
      )}

<header className="sticky top-0 z-50 w-full bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant shadow-sm">
<div className="flex justify-between items-center w-full max-w-7xl mx-auto px-4 lg:px-8 py-3">
<a className="flex items-center gap-2.5 text-title-lg font-title-lg font-bold text-primary tracking-tight group" href="#" onClick={(e)=>{e.preventDefault(); window.scrollTo({top:0, behavior:"smooth"})}}>
<img src="/logo.png" alt="BelajarAdaptif" className="w-10 h-10 lg:w-12 lg:h-12 object-contain logo-spin" />
<span className="text-primary font-extrabold tracking-tight text-[15px] lg:text-[16px]">Belajar<span className="text-[#F2A93B]">.Adaptif</span></span>
</a>
<nav className="hidden md:flex items-center gap-7">
<a className="text-primary font-semibold border-b-2 border-primary pb-1 font-label-lg text-label-lg transition-colors" href="#program" onClick={smoothScroll("#program")}>Program</a>
<a className="text-on-surface-variant hover:text-primary font-medium font-label-lg text-label-lg transition-colors" href="#fitur" onClick={smoothScroll("#fitur")}>Fitur Unggulan</a>
<a className="text-on-surface-variant hover:text-primary font-medium font-label-lg text-label-lg transition-colors" href="#metode" onClick={smoothScroll("#metode")}>Metode Adaptif</a>
<a className="text-on-surface-variant hover:text-primary font-medium font-label-lg text-label-lg transition-colors" href="#testimoni" onClick={smoothScroll("#testimoni")}>Testimoni</a>
<a className="text-on-surface-variant hover:text-primary font-medium font-label-lg text-label-lg transition-colors" href="#biaya" onClick={smoothScroll("#biaya")}>Biaya</a>
</nav>
<div className="flex items-center gap-2 lg:gap-3">
{isLoggedIn ? (
<a className="inline-flex items-center justify-center gap-2 px-5 lg:px-6 py-2.5 rounded-full font-label-lg text-label-lg bg-primary-container text-on-primary hover:bg-primary transition-all duration-200 shadow-sm active:scale-95" href="#" onClick={(e)=>{e.preventDefault(); onKembaliDashboard && onKembaliDashboard()}}>
<span>Kembali ke Dashboard</span>
<span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
</a>
) : (
<>
<a className="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-full font-label-lg text-label-lg text-primary hover:bg-surface-container transition-colors duration-200" href="#" onClick={(e)=>{e.preventDefault(); onMasuk && onMasuk()}}>
          Masuk
        </a>
<a className="inline-flex items-center justify-center gap-2 px-5 lg:px-6 py-2.5 rounded-full font-label-lg text-label-lg bg-primary-container text-on-primary hover:bg-primary transition-all duration-200 shadow-sm active:scale-95 shimmer" href="#" onClick={(e)=>{e.preventDefault(); onDaftar && onDaftar()}}>
<span className="hidden sm:inline">Coba Gratis 14 Hari</span>
<span className="sm:hidden">Coba Gratis</span>
<span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
</a>
</>
)}
<button className="md:hidden w-11 h-11 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center" onClick={()=>setMobileOpen(v=>!v)} aria-label={mobileOpen ? "Tutup menu" : "Buka menu"} aria-expanded={mobileOpen}>
<span className="material-symbols-outlined text-[20px]" data-icon={mobileOpen?"close":"menu"}>{mobileOpen?"close":"menu"}</span>
</button>
</div>
</div>
{mobileOpen && (
  <>
    <div className="md:hidden fixed inset-0 top-[65px] bg-black/20 backdrop-blur-sm z-40" onClick={()=>setMobileOpen(false)} aria-hidden="true" />
    <div className="md:hidden border-t border-outline-variant bg-surface-container-lowest px-4 py-4 space-y-1 relative z-50" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      <a href="#program" onClick={smoothScroll("#program")} className="block py-3 px-2 rounded-lg hover:bg-surface-container font-medium min-h-[44px] flex items-center">Program</a>
      <a href="#fitur" onClick={smoothScroll("#fitur")} className="block py-3 px-2 rounded-lg hover:bg-surface-container font-medium min-h-[44px] flex items-center">Fitur Unggulan</a>
      <a href="#metode" onClick={smoothScroll("#metode")} className="block py-3 px-2 rounded-lg hover:bg-surface-container font-medium min-h-[44px] flex items-center">Metode Adaptif</a>
      <a href="#testimoni" onClick={smoothScroll("#testimoni")} className="block py-3 px-2 rounded-lg hover:bg-surface-container font-medium min-h-[44px] flex items-center">Testimoni</a>
      <a href="#biaya" onClick={smoothScroll("#biaya")} className="block py-3 px-2 rounded-lg hover:bg-surface-container font-medium min-h-[44px] flex items-center">Biaya</a>
      <button onClick={()=>{setMobileOpen(false); onMasuk&&onMasuk()}} className="w-full py-3 rounded-full border border-primary-container font-semibold min-h-[44px] mt-2">Masuk</button>
    </div>
  </>
)}
</header>
<section className="relative overflow-hidden pt-8 pb-12 lg:pt-16 lg:pb-28">
<div className="absolute inset-0 bg-gradient-to-b from-primary-fixed/40 via-surface/80 to-surface pointer-events-none -z-10"></div>
<div className="absolute top-12 left-1/2 -translate-x-1/2 w-[min(90vw,700px)] h-[340px] bg-secondary-fixed/30 rounded-full blur-3xl pointer-events-none -z-10"></div>
<div className="absolute top-36 right-10 w-96 h-96 bg-tertiary-fixed/35 rounded-full blur-3xl pointer-events-none -z-10 hidden sm:block"></div>
<div className="max-w-7xl mx-auto px-4 lg:px-8">
<div className="relative flex flex-col items-center text-center max-w-4xl mx-auto">
<div ref={addReveal} className="reveal hidden lg:block absolute -left-28 top-8" style={{"--rot":"-6deg"}}>
<div className="floating-pill bg-surface-container-lowest text-primary-container border border-surface-variant rounded-full px-5 py-2.5 flex items-center gap-2 font-label-lg text-label-lg">
<span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container"></span>
<span>#MatematikaEksploratif</span>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 hidden lg:block absolute -left-16 bottom-10" style={{"--rot":"3deg"}}>
<div className="floating-pill bg-surface-container-lowest text-primary-container border border-surface-variant rounded-full px-5 py-2.5 flex items-center gap-2 font-label-lg text-label-lg">
<span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
<span>#KreativitasAnak</span>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-2 hidden lg:block absolute -right-24 top-10" style={{"--rot":"6deg"}}>
<div className="floating-pill bg-surface-container-lowest text-primary-container border border-surface-variant rounded-full px-5 py-2.5 flex items-center gap-2 font-label-lg text-label-lg">
<span className="w-2.5 h-2.5 rounded-full bg-on-tertiary-container"></span>
<span>#LogikaAlgoritma</span>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-3 hidden lg:block absolute -right-12 bottom-14" style={{"--rot":"-3deg"}}>
<div className="floating-pill bg-surface-container-lowest text-primary-container border border-surface-variant rounded-full px-5 py-2.5 flex items-center gap-2 font-label-lg text-label-lg">
<span className="w-2.5 h-2.5 rounded-full bg-secondary-container"></span>
<span>#SainsTerapan</span>
</div>
</div>
<div ref={addReveal} className="reveal inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container-lowest border border-surface-variant shadow-sm mb-6">
<span className="text-secondary-container text-sm">⭐</span>
<span className="font-label-md text-label-md text-primary-container font-semibold">Platform Bimbingan Belajar Adaptif No. 1 di Indonesia</span>
</div>
<h1 ref={addReveal} className="reveal font-display-lg text-display-lg-mobile lg:text-display-lg text-primary tracking-tight mb-6">
          Belajar Lebih Cerdas &amp; Adaptif Sesuai <span className="underline decoration-secondary-container decoration-wavy decoration-2 underline-offset-8">Ritme Unik</span> Setiap Anak
        </h1>
<p ref={addReveal} className="reveal reveal-delay-1 font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto mb-8">
          Ekosistem bimbingan personal yang menggabungkan kecerdasan kurikulum adaptif dengan pendampingan mentor ahli. Meningkatkan pemahaman 3x lebih cepat tanpa rasa tertekan.
        </p>
<div ref={addReveal} className="reveal reveal-delay-2 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
<a className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full font-label-lg text-label-lg bg-secondary-container text-primary-container hover:bg-secondary-fixed-dim transition-all shadow-md active:scale-95 font-bold cta-pulse" href="#" onClick={(e)=>{e.preventDefault(); onDaftar && onDaftar()}}>
<span className="material-symbols-outlined text-[20px]" data-icon="bolt">bolt</span>
<span>Mulai Uji Coba Gratis 14 Hari</span>
<span className="text-xs opacity-75 font-normal hidden sm:inline">(Tanpa Kartu Kredit)</span>
</a>
<a className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full font-label-lg text-label-lg bg-surface-container-lowest text-primary-container border border-surface-variant hover:bg-surface-container-low transition-all active:scale-95 shadow-sm" href="#" onClick={(e)=>{e.preventDefault(); setShowDemo(true)}}>
<span className="material-symbols-outlined text-on-tertiary-container" data-icon="play_circle" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>play_circle</span>
<span>Lihat Demo Interaktif</span>
</a>
</div>
<p ref={addReveal} className="reveal reveal-delay-3 font-label-sm text-label-sm text-outline mt-3 flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container" data-icon="verified_user">verified_user</span>
<span>Kurikulum Terintegrasi Merdeka Belajar &amp; Standar Cambridge Foundation</span>
</p>
</div>
<div ref={addReveal} className="reveal mt-14 pt-8 border-t border-surface-variant/80">
<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
<div className="flex flex-col items-center">
<div className="flex items-center gap-1 text-secondary-container font-bold text-headline-sm font-headline-sm">
<span>4.9</span>
<span className="material-symbols-outlined text-[22px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
</div>
<p className="font-label-md text-label-md text-on-surface-variant mt-1">Google Reviews (3.400+ Ulasan)</p>
</div>
<div className="flex flex-col items-center">
<div className="text-primary font-headline-sm font-headline-sm">
              120.000+
            </div>
<p className="font-label-md text-label-md text-on-surface-variant mt-1">Latihan Terpecahkan Tiap Bulan</p>
</div>
<div className="flex flex-col items-center">
<div className="text-on-tertiary-container font-headline-sm font-headline-sm">
              98.4%
            </div>
<p className="font-label-md text-label-md text-on-surface-variant mt-1">Kenaikan Nilai &amp; Percaya Diri Siswa</p>
</div>
<div className="flex flex-col items-center">
<div className="flex items-center gap-2 text-primary font-headline-sm font-headline-sm">
<span className="material-symbols-outlined text-[24px]" data-icon="newspaper">newspaper</span>
<span>18+</span>
</div>
<p className="font-label-md text-label-md text-on-surface-variant mt-1">Liputan Media Edukasi Nasional</p>
</div>
</div>
</div>
</div>
</section>
<section className="py-16 lg:py-20 bg-surface-container-low/60 border-y border-surface-variant/70" id="metode">
<div className="max-w-7xl mx-auto px-4 lg:px-8">
<div ref={addReveal} className="reveal text-center max-w-2xl mx-auto mb-14">
<div className="inline-block px-3.5 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed font-label-sm text-label-sm mb-3">
          Pendekatan Personalisasi Masa Depan
        </div>
<h2 className="font-headline-lg text-headline-lg text-primary tracking-tight">
          Mengapa Memilih Belajar.Adaptif?
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-3">
          Tiga pilar fundamental yang menjamin anak belajar tanpa rasa jenuh, cemas, atau tertinggal dari teman sekelas.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
<div ref={addReveal} className="reveal card-academic bg-surface-container-lowest rounded-DEFAULT p-8 border border-surface-variant flex flex-col justify-between">
<div>
<div className="w-14 h-14 rounded-full bg-primary-fixed flex items-center justify-center text-primary mb-6">
<span className="material-symbols-outlined text-[30px]" data-icon="tune">tune</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-3">
              Kurikulum Adaptif AI
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Algoritma cerdas yang mendeteksi titik kesulitan anak dalam hitungan detik. Modul otomatis menurunkan atau menaikkan tingkat kerumitan agar pemahaman konsep terbentuk kokoh.
            </p>
</div>
<div className="mt-8 pt-6 border-t border-surface-variant/60 flex items-center gap-2 text-on-tertiary-container font-label-lg text-label-lg">
<span>Sesuai Kecepatan Belajar Anak</span>
<span className="material-symbols-outlined text-[18px]" data-icon="check_circle">check_circle</span>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 card-academic bg-surface-container-lowest rounded-DEFAULT p-8 border border-surface-variant flex flex-col justify-between relative overflow-hidden">
<div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-24 h-24 bg-secondary-fixed/40 rounded-full blur-xl pointer-events-none"></div>
<div>
<div className="w-14 h-14 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-container mb-6">
<span className="material-symbols-outlined text-[30px]" data-icon="cognition">cognition</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-3">
              Pendampingan Holistik
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Bukan sekadar hafalan rumus. Kami mengasah pola pikir berkembang (growth mindset), logika komputasi, dan kemampuan komunikasi verbal melalui eksplorasi studi kasus nyata.
            </p>
</div>
<div className="mt-8 pt-6 border-t border-surface-variant/60 flex items-center gap-2 text-secondary-container font-label-lg text-label-lg">
<span>Membangun Karakter Pantang Menyerah</span>
<span className="material-symbols-outlined text-[18px]" data-icon="emoji_events">emoji_events</span>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-2 card-academic bg-surface-container-lowest rounded-DEFAULT p-8 border border-surface-variant flex flex-col justify-between">
<div>
<div className="w-14 h-14 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container mb-6">
<span className="material-symbols-outlined text-[30px]" data-icon="diversity_3">diversity_3</span>
</div>
<h3 className="font-headline-sm text-headline-sm text-primary mb-3">
              Kolaborasi Mentor &amp; AI
            </h3>
<p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Tutor bersertifikasi mengawasi data analisis AI, siap memberikan asistensi langsung saat anak menemui jalan buntu, serta menyajikan insight kemajuan berkala bagi orang tua.
            </p>
</div>
<div className="mt-8 pt-6 border-t border-surface-variant/60 flex items-center gap-2 text-on-tertiary-container font-label-lg text-label-lg">
<span>Sesi Pendampingan 1-on-1 Berkala</span>
<span className="material-symbols-outlined text-[18px]" data-icon="handshake">handshake</span>
</div>
</div>
</div>
</div>
</section>
<section className="py-16 lg:py-20" id="program">
<div className="max-w-7xl mx-auto px-4 lg:px-8">
<div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
<div ref={addReveal} className="reveal">
<span className="font-label-md text-label-md text-on-tertiary-container font-semibold tracking-wide uppercase">Kurikulum Terpadu</span>
<h2 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
            Jelajahi Modul Belajar Unggulan
          </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-2 max-w-xl">
            Dari pembentukan konsep dasar hingga persiapan kompetisi sains dan olimpiade, modul dirancang modular dan menyenangkan.
          </p>
</div>
<div className="w-full md:w-auto overflow-x-auto scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
<div className="inline-flex p-1 bg-surface-container rounded-full border border-surface-variant gap-1 flex-nowrap">
{["Semua Fase","Fase Fondasi (SD)","Fase Menengah (SMP/SMA)"].map((label)=>(
  <button key={label} onClick={()=>{setActiveFase(label); pop(`Filter: ${label}`)}} className={`px-4 py-2.5 rounded-full font-label-lg text-label-lg transition-all whitespace-nowrap flex-shrink-0 min-h-[44px] ${activeFase===label?"bg-surface-container-lowest text-primary shadow-sm font-semibold":"text-on-surface-variant hover:text-primary"}`}>
    {label}
  </button>
))}
</div>
</div>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
<div ref={addReveal} className="reveal card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-6 flex flex-col justify-between">
<div>
<div className="h-44 rounded-DEFAULT bg-surface-container-low overflow-hidden relative mb-5 flex items-center justify-center border border-surface-variant/50">
<img className="w-full h-full object-cover" data-alt="A modern, clean educational illustration depicting colorful geometric fraction shapes like pies and bar graphs against a warm ivory paper background with soft ambient lighting and subtle teal accents." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAF4k2TiU7hVE385Da85XgXGpoRs2ZWCtU-7yAB5l22KINj9hdWLLsxy34vODjnCognCfG0rgO9--oCAIkoFY6a8qZdnGKgUcoD43OaPt3eoTmVf407_1xE0Mx5tHzfw59oZTpkzPpi7anj5aXdsBlHDquYe9qzZvd1_927xUNeWACqVhQvxqTi78BzL92XG9xLyjLowRlUqg0fDjYT29CpL0yNWGNas043aKkXUBHmmHWWs_MGO2JpWA"/>
<span className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-primary font-label-sm text-label-sm border border-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary-container" data-icon="schedule">schedule</span> 12 Sesi Interaktif
              </span>
</div>
<div className="flex items-center gap-2 mb-2">
<span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed font-label-sm text-label-sm">Matematika Dasar</span>
<span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Kelas 3 - 5 SD</span>
</div>
<h4 className="font-title-lg text-title-lg text-primary mb-2">
              Petualangan Pecahan &amp; Penalaran Visual
            </h4>
<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Memahami logika pecahan, desimal, dan persentase dengan manipulasi blok visual interaktif tanpa hafalan rumus kaku.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-surface-variant/60">
<div className="flex justify-between items-center mb-2 text-label-sm font-label-sm">
<span className="text-on-surface-variant">Tingkat Retensi Pemahaman</span>
<span className="text-on-tertiary-container font-semibold">96% Efektif</span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-5">
<div className="w-[96%] h-full bg-on-tertiary-container rounded-full"></div>
</div>
<button onClick={()=>onDaftar&&onDaftar()} className="w-full py-2.5 rounded-full border border-primary-container text-primary hover:bg-primary-container hover:text-on-primary transition-all font-label-lg text-label-lg flex items-center justify-center gap-2">
<span>Coba Modul Ini</span>
<span className="material-symbols-outlined text-[16px]" data-icon="arrow_outward">arrow_outward</span>
</button>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-6 flex flex-col justify-between">
<div>
<div className="h-44 rounded-DEFAULT bg-surface-container-low overflow-hidden relative mb-5 flex items-center justify-center border border-surface-variant/50">
<img className="w-full h-full object-cover" data-alt="A clean, stylish educational graphic showing logic puzzle blocks, algorithm flowchart wires, and playful robot icons in deep navy ink and soft teal on paper stationery background." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-YbmC99lYpIYiMQxTR6MVRO8Nzg5J_QgjFH_j9JL2ASeJ__3I7tDLrB7UkBF-P8LoK_otHKiK2IfzmqpyafnDUoaklYzwfVgUqsbk1zZyJRressrKxp3fTg9qwi-T-Tbk99e9oyyFvVoX-7cJeP_6gGd9crEQseZMH-iPT-t7ab94aA9B5tiSnfKVVcDa4A4-IuAoYdgCwwC8gcGOVKdQdiqFEbqnFxxgnw09oXu9eHgDp8Z_Yr1DkQ"/>
<span className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-primary font-label-sm text-label-sm border border-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary-container" data-icon="schedule">schedule</span> 16 Sesi Terpandu
              </span>
</div>
<div className="flex items-center gap-2 mb-2">
<span className="px-2.5 py-1 rounded-full bg-secondary-fixed/50 text-on-secondary-container font-label-sm text-label-sm">Logika &amp; Coding</span>
<span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Kelas 5 - 8 SMP</span>
</div>
<h4 className="font-title-lg text-title-lg text-primary mb-2">
              Logika Komputasional &amp; Algoritma Dasar
            </h4>
<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Membangun fondasi logika berpikir terstruktur, pemecahan teka-teki, dan dekonstruksi masalah kompleks langkah-demi-langkah.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-surface-variant/60">
<div className="flex justify-between items-center mb-2 text-label-sm font-label-sm">
<span className="text-on-surface-variant">Tingkat Retensi Pemahaman</span>
<span className="text-secondary-container font-semibold">94% Efektif</span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-5">
<div className="w-[94%] h-full bg-secondary-container rounded-full"></div>
</div>
<button onClick={()=>onDaftar&&onDaftar()} className="w-full py-2.5 rounded-full border border-primary-container text-primary hover:bg-primary-container hover:text-on-primary transition-all font-label-lg text-label-lg flex items-center justify-center gap-2">
<span>Coba Modul Ini</span>
<span className="material-symbols-outlined text-[16px]" data-icon="arrow_outward">arrow_outward</span>
</button>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-2 card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-6 flex flex-col justify-between">
<div>
<div className="h-44 rounded-DEFAULT bg-surface-container-low overflow-hidden relative mb-5 flex items-center justify-center border border-surface-variant/50">
<img className="w-full h-full object-cover" data-alt="A bright high-key flat-lay educational illustration of magnifying glasses, planet diagrams, chemical beakers, and plant cells rendered in minimalist editorial aesthetic with crisp clean lines." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDazRTeD4r9MDOQ1gYLwLORIHHYT2B0yzeglWz2d2VzY33l_Hf7rR34iBVQW-ICDhW8HSYdQZhz8XHDVe--1iklDK6ycfBg60nUxOlnLnsnehgRNOJ949qR0b0alZ5i-xkuwViK1dS0nu_GXU9IW1aPMW3M84CTV6FkuMKIHZtsOJidVslHChyTfbWVE_SZqNJtPY2To77eZG_9jVZedCJbj0T0Z3bbigcbY_3NNio11rDX8cybylfs0w"/>
<span className="absolute top-3 right-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-1 rounded-full text-primary font-label-sm text-label-sm border border-surface-variant flex items-center gap-1">
<span className="material-symbols-outlined text-[14px] text-secondary-container" data-icon="schedule">schedule</span> 14 Sesi Proyek
              </span>
</div>
<div className="flex items-center gap-2 mb-2">
<span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/30 text-on-tertiary-fixed font-label-sm text-label-sm">Sains Fenomenal</span>
<span className="px-2.5 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">Kelas 6 SD - 9 SMP</span>
</div>
<h4 className="font-title-lg text-title-lg text-primary mb-2">
              Eksplorasi Sains Alam &amp; Fenomena Sehari-Hari
            </h4>
<p className="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">
              Mempelajari konsep energi, ekosistem, dan gaya gerak melalui simulasi fisika virtual yang dapat dimanipulasi mandiri.
            </p>
</div>
<div className="mt-6 pt-4 border-t border-surface-variant/60">
<div className="flex justify-between items-center mb-2 text-label-sm font-label-sm">
<span className="text-on-surface-variant">Tingkat Retensi Pemahaman</span>
<span className="text-on-tertiary-container font-semibold">97% Efektif</span>
</div>
<div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-5">
<div className="w-[97%] h-full bg-on-tertiary-container rounded-full"></div>
</div>
<button onClick={()=>onDaftar&&onDaftar()} className="w-full py-2.5 rounded-full border border-primary-container text-primary hover:bg-primary-container hover:text-on-primary transition-all font-label-lg text-label-lg flex items-center justify-center gap-2">
<span>Coba Modul Ini</span>
<span className="material-symbols-outlined text-[16px]" data-icon="arrow_outward">arrow_outward</span>
</button>
</div>
</div>
</div>
</div>
</section>
<section className="py-16 lg:py-20 bg-surface-container-low/50" id="fitur">
<div className="max-w-7xl mx-auto px-4 lg:px-8 space-y-16 lg:space-y-20">
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
<div ref={addReveal} className="reveal lg:col-span-6 space-y-5">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-surface-variant font-label-sm text-label-sm text-primary">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container" data-icon="mark_chat_unread">mark_chat_unread</span>
<span>Transparansi Penuh untuk Orang Tua</span>
</div>
<h3 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Pantau Kemajuan Anak Langsung dari WhatsApp Anda
          </h3>
<p className="font-body-lg text-body-lg text-on-surface-variant">
            Tidak perlu login aplikasi rumit setiap hari. Setiap akhir pekan, ringkasan capaian, konsep yang telah dikuasai, dan rekomendasi aktivitas bersama dikirimkan via WhatsApp resmi.
          </p>
<ul className="space-y-3 font-body-md text-body-md text-on-surface">
<li className="flex items-center gap-3">
<span className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container text-sm">✓</span>
<span>Laporan analitik ringkas tanpa istilah teknis yang membingungkan</span>
</li>
<li className="flex items-center gap-3">
<span className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container text-sm">✓</span>
<span>Deteksi dini topik yang membutuhkan afirmasi atau bantuan tambahan</span>
</li>
<li className="flex items-center gap-3">
<span className="w-6 h-6 rounded-full bg-tertiary-fixed flex items-center justify-center text-on-tertiary-container text-sm">✓</span>
<span>Jadwal sesi konsultasi 1-on-1 dengan wali belajar/mentor</span>
</li>
</ul>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 lg:col-span-6">
<div className="card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-6 shadow-md relative">
<div className="flex items-center justify-between pb-4 border-b border-surface-variant mb-5">
<div className="flex items-center gap-3">
<img src="/logo.png" alt="BA" className="w-9 h-9 object-contain" />
<div>
<h5 className="font-title-md text-title-md text-primary">Belajar.Adaptif Weekly Digest</h5>
<p className="font-label-sm text-label-sm text-outline">Pembaruan Minggu Ini • Siswa: Arka (Kelas 4)</p>
</div>
</div>
<span className="px-2.5 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed font-label-sm text-label-sm">Terkirim</span>
</div>
<div className="bg-surface-container-low rounded-DEFAULT p-4 mb-4 space-y-3">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-primary">Status Penguasaan Topik</span>
<span className="font-label-md text-label-md text-on-tertiary-container font-bold">+18% dari Pekan Lalu</span>
</div>
<div className="space-y-2">
<div className="flex justify-between text-label-sm font-label-sm">
<span>Pecahan Campuran</span>
<span className="font-semibold text-primary">Paham Sempurna (Mastered)</span>
</div>
<div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
<div className="w-full h-full bg-on-tertiary-container"></div>
</div>
</div>
<div className="space-y-2">
<div className="flex justify-between text-label-sm font-label-sm">
<span>Geometri Bangun Ruang</span>
<span className="font-semibold text-secondary-container">Perlu 2 Latihan Tambahan</span>
</div>
<div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
<div className="w-[65%] h-full bg-secondary-container"></div>
</div>
</div>
</div>
<div className="p-3 bg-secondary-fixed/30 rounded-DEFAULT border border-secondary-fixed flex items-center gap-3">
<span className="material-symbols-outlined text-secondary" data-icon="lightbulb">lightbulb</span>
<p className="font-body-sm text-body-sm text-primary">
<strong>Tips Mentor:</strong> Ajak Arka mengukur kotak sereal di dapur untuk mempraktikkan konsep volume secara nyata!
              </p>
</div>
</div>
</div>
</div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
<div ref={addReveal} className="reveal lg:col-span-6 order-2 lg:order-1">
<div className="card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-6 shadow-md">
<div className="flex items-center justify-between mb-6">
<div>
<span className="font-label-md text-label-md text-outline">Tantangan Ekspedisi Pekan Ini</span>
<h5 className="font-headline-sm text-headline-sm text-primary">Petualang Pulau Logika</h5>
</div>
<div className="w-12 h-12 rounded-full bg-secondary-container text-primary-container flex items-center justify-center font-bold text-lg">
<span className="material-symbols-outlined" data-icon="explore">explore</span>
</div>
</div>
<div className="space-y-3">
<div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-DEFAULT">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-on-tertiary-container" data-icon="check_circle" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>check_circle</span>
<span className="font-label-lg text-label-lg text-primary">Selesaikan 3 Tantangan Teka-teki Pola</span>
</div>
<span className="font-label-sm text-label-sm text-on-tertiary-container font-semibold">+50 Poin Kebaikan</span>
</div>
<div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-DEFAULT">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-secondary-container" data-icon="radio_button_checked">radio_button_checked</span>
<span className="font-label-lg text-label-lg text-primary">Refleksi Belajar Mandiri: Catat 1 Pertanyaan</span>
</div>
<span className="font-label-sm text-label-sm text-secondary font-semibold">Sedang Berjalan</span>
</div>
<div className="flex items-center justify-between p-3.5 bg-surface-container-low rounded-DEFAULT opacity-60">
<div className="flex items-center gap-3">
<span className="material-symbols-outlined text-outline" data-icon="lock">lock</span>
<span className="font-label-lg text-label-lg text-on-surface-variant">Eksperimen Gravitasi Bersama Mentor</span>
</div>
<span className="font-label-sm text-label-sm text-outline">Terkunci</span>
</div>
</div>
<div className="mt-6 flex items-center justify-between text-body-sm text-body-sm text-outline">
<span>🌟 Berfokus pada kemajuan diri sendiri, bukan bersaing ranking.</span>
</div>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 lg:col-span-6 order-1 lg:order-2 space-y-5">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-surface-variant font-label-sm text-label-sm text-primary">
<span className="material-symbols-outlined text-[16px] text-secondary-container" data-icon="sports_esports">sports_esports</span>
<span>Motivasi Intrinsik yang Sehat</span>
</div>
<h3 className="font-headline-lg text-headline-lg text-primary tracking-tight">
            Gamifikasi Edukatif Tanpa Intimidasi Peringkat
          </h3>
<p className="font-body-lg text-body-lg text-on-surface-variant">
            Kami menghapus papan peringkat (*leaderboard*) publik yang sering membuat anak cemas dan merasa rendah diri. Sebagai gantinya, anak diajak berpetualang mencapai tonggak personal dengan reward berupa lencana eksplorasi.
          </p>
<ul className="space-y-3 font-body-md text-body-md text-on-surface">
<li className="flex items-center gap-3">
<span className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-container text-sm">✓</span>
<span>Merayakan setiap usaha kecil dan proses eksplorasi berpikir</span>
</li>
<li className="flex items-center gap-3">
<span className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-container text-sm">✓</span>
<span>Anak tidak takut salah karena setiap kesalahan dijelaskan secara visual</span>
</li>
<li className="flex items-center gap-3">
<span className="w-6 h-6 rounded-full bg-secondary-fixed flex items-center justify-center text-on-secondary-container text-sm">✓</span>
<span>Menumbuhkan kecintaan belajar seumur hidup (*lifelong curiosity*)</span>
</li>
</ul>
</div>
</div>
</div>
</section>
<section className="py-16 lg:py-20" id="testimoni">
<div className="max-w-7xl mx-auto px-4 lg:px-8">
<div ref={addReveal} className="reveal text-center max-w-2xl mx-auto mb-14">
<span className="font-label-md text-label-md text-secondary-container font-semibold tracking-wide uppercase">Kisah Nyata</span>
<h2 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
          Dipercaya Lebih dari 15.000 Keluarga di Seluruh Nusantara
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Dengarkan bagaimana metode adaptif mengubah ketakutan anak terhadap mata pelajaran sulit menjadi rasa ingin tahu yang membara.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
<div ref={addReveal} className="reveal card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-8 flex flex-col justify-between">
<div>
<div className="flex items-center gap-1 text-secondary-container mb-4">
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant italic mb-6">
              "Sebelumnya anak saya selalu menangis tiap ada tugas matematika. Sejak pakai Belajar.Adaptif selama 2 bulan, dia justru minta buka latihan sendiri sebelum tidur karena animasinya seru dan tidak menyalahkan kalau salah hitung."
            </p>
</div>
<div className="flex items-center gap-4 pt-4 border-t border-surface-variant/60">
<div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant">
<img className="w-full h-full object-cover" data-alt="A warm candid portrait of an Indonesian mother in her late 30s smiling gently in a bright modern home library setting, high quality daylight photograph." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBbOLipbiohCfDaz8o0Wd8XCIZNtCvDxl-4ayVAGXJKDUZVbaDO9rZCoES0qmt4SZVx4eQB0Z7M-mAahgpCPqfb6C75tSJqacIHcHkAF4LCdN7xTFOlMp2xOQRn6vUU_omeBLmP-4IcQVa7AY_DrssFFs-zZPpUh7daskbG3okhIKcDApHU0RGA_Iycy6WmU2-NrvPULBRSv1HwxDtgoFsFO0GFSafIf8UFugF_MyVxqlfGk9M_XxCPPA"/>
</div>
<div>
<h5 className="font-title-md text-title-md text-primary">Ibu Ratna Dewi</h5>
<p className="font-label-sm text-label-sm text-outline">Orang Tua Nadine (Kelas 4 SD, Bandung)</p>
</div>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-8 flex flex-col justify-between">
<div>
<div className="flex items-center gap-1 text-secondary-container mb-4">
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant italic mb-6">
              "Laporan WhatsApp tiap Sabtu sangat membantu saya yang sibuk kerja. Saya tahu persis di modul apa Rayhan butuh dorongan. Yang paling saya apresiasi adalah mentornya sangat suportif dan sabar mengarahkan."
            </p>
</div>
<div className="flex items-center gap-4 pt-4 border-t border-surface-variant/60">
<div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant">
<img className="w-full h-full object-cover" data-alt="A confident smiling portrait of an Indonesian father in a neat shirt sitting near an architectural desk, warm natural lighting and clean academic ambiance." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBiTBPXqZtziFZztUGL5H3bTGrm_bVea-eAcZ7p34NfmoM8zH-NuRWHL374J7clJtptpLvGacjplFyu8GICA95iEoRZOLQAqJJV0lUIAIpgKGEe6E_B6iey0CytpK_yT0LnBOGURSL0wH9BYlmu1clpR9xDNSO3hddrFFx_mE_c22rPhjIN0Bl9WwGuQ7_1Z3w4xrb1225WCj8SwhjCrAbAwwQ6lgfj3HutbdON2Sxm4regSJQ7PbWQ"/>
</div>
<div>
<h5 className="font-title-md text-title-md text-primary">Bapak Hendra Kusuma</h5>
<p className="font-label-sm text-label-sm text-outline">Orang Tua Rayhan (Kelas 7 SMP, Surabaya)</p>
</div>
</div>
</div>
<div ref={addReveal} className="reveal reveal-delay-2 card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-8 flex flex-col justify-between">
<div>
<div className="flex items-center gap-1 text-secondary-container mb-4">
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
<span className="material-symbols-outlined text-[20px]" data-icon="star" data-weight="fill" style={{fontVariationSettings: "'FILL' 1"}}>star</span>
</div>
<p className="font-body-md text-body-md text-on-surface-variant italic mb-6">
              "Modul Algoritma &amp; Coding beneran bikin aku paham urutan logika. Bukan cuma disuruh menghafal kodingan, tapi diajarin mikir kenapa langkah itu diambil. Lolos seleksi olimpiade berkat bimbingan ini!"
            </p>
</div>
<div className="flex items-center gap-4 pt-4 border-t border-surface-variant/60">
<div className="w-12 h-12 rounded-full overflow-hidden bg-surface-variant">
<img className="w-full h-full object-cover" data-alt="A cheerful portrait of an Indonesian teenage student wearing a casual jacket holding a study binder, bright outdoor campus garden backdrop." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD8NuVU-J3dJVkxP1XFdYNWGQLXn0q4AmLPgQaEzzWD-Rpo5Z31HVxV1i9I1STQiD4oGYvgm2U6Konxie5YIPwki4opKbz98LQgwxP0noj3iSji6KDm6RgpLlwpilqXlF91VValCiZoZAtEm2VJVLjV-lWZMkCe5cuiQv05HRkraP_gE9ocmfKHX9_SgXyCoUcgwzyQ1KJJm41wGtNb2z-w5C5Uun1PNf-ZnPOF4HTAsO0_QLGj3l9kbw"/>
</div>
<div>
<h5 className="font-title-md text-title-md text-primary">Dimas Satria</h5>
<p className="font-label-sm text-label-sm text-outline">Siswa Kelas 9 SMP, Jakarta Selatan</p>
</div>
</div>
</div>
</div>
</div>
</section>
<section className="py-16 lg:py-20 bg-surface-container-low/60 border-t border-surface-variant/70" id="biaya">
<div className="max-w-7xl mx-auto px-4 lg:px-8">
<div ref={addReveal} className="reveal text-center max-w-2xl mx-auto mb-14">
<span className="font-label-md text-label-md text-on-tertiary-container font-semibold tracking-wide uppercase">Investasi Masa Depan</span>
<h2 className="font-headline-lg text-headline-lg text-primary tracking-tight mt-1">
          Paket Belajar Transparan Tanpa Biaya Tersembunyi
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
          Pilih paket yang paling sesuai dengan kebutuhan eksplorasi buah hati Anda. Dapat dibatalkan sewaktu-waktu.
        </p>
</div>
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
<div ref={addReveal} className="reveal card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-8 flex flex-col justify-between">
<div>
<span className="font-label-lg text-label-lg text-outline">Fleksibel</span>
<h4 className="font-headline-sm text-headline-sm text-primary mt-1">Paket Bulanan</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Cocok untuk mencoba adaptasi belajar ritme baru anak.</p>
<div className="my-6">
<span className="text-primary font-bold text-headline-lg font-headline-lg">Rp 189.000</span>
<span className="text-on-surface-variant font-label-md text-label-md">/bulan</span>
</div>
<ul className="space-y-3 font-body-sm text-body-sm text-on-surface border-t border-surface-variant/60 pt-6">
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Akses semua mata pelajaran (SD/SMP)
              </li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Modul Kurikulum Adaptif AI
              </li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Laporan Mingguan via WhatsApp
              </li>
<li className="flex items-center gap-2 text-outline">
<span className="material-symbols-outlined text-[18px]" data-icon="close">close</span>
                Sesi Konsultasi Khusus Mentor 1-on-1
              </li>
</ul>
</div>
<a className="mt-8 w-full py-3 rounded-full border border-primary text-primary hover:bg-surface-container font-label-lg text-label-lg text-center font-semibold transition-all cursor-pointer" href="#" onClick={(e)=>{e.preventDefault(); onDaftar && onDaftar()}}>
            Pilih Paket Bulanan
          </a>
</div>
<div ref={addReveal} className="reveal reveal-delay-1 card-academic bg-surface-container-lowest border-2 border-secondary-container rounded-DEFAULT p-8 flex flex-col justify-between relative shadow-lg transform lg:-translate-y-2">
<div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-secondary-container text-primary-container px-4 py-1 rounded-full font-label-sm text-label-sm font-bold shadow-sm">
            PALING POPULER • HEMAT 30%
          </div>
<div>
<span className="font-label-lg text-label-lg text-secondary-container font-bold">Rekomendasi Utama</span>
<h4 className="font-headline-sm text-headline-sm text-primary mt-1">Paket 1 Semester (6 Bulan)</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Dukungan penuh untuk kenaikan kelas &amp; penguasaan konsep.</p>
<div className="my-6">
<span className="text-primary font-bold text-headline-lg font-headline-lg">Rp 129.000</span>
<span className="text-on-surface-variant font-label-md text-label-md">/bulan (dibayar semesteran)</span>
</div>
<ul className="space-y-3 font-body-sm text-body-sm text-on-surface border-t border-surface-variant/60 pt-6">
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Semua fitur Paket Bulanan
              </li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
<strong>2x Sesi Konsultasi 1-on-1 dengan Mentor Ahli</strong>
</li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Modul Eksplorasi Coding &amp; Logika
              </li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Jaminan Peningkatan Nilai atau Garansi Uang Kembali*
              </li>
</ul>
</div>
<a className="mt-8 w-full py-3.5 rounded-full bg-secondary-container text-primary-container hover:bg-secondary-fixed-dim font-label-lg text-label-lg text-center font-bold transition-all shadow-md active:scale-95 cursor-pointer cta-pulse" href="#" onClick={(e)=>{e.preventDefault(); onDaftar && onDaftar()}}>
            Coba Gratis 14 Hari Dulu
          </a>
</div>
<div ref={addReveal} className="reveal reveal-delay-2 card-academic bg-surface-container-lowest border border-surface-variant rounded-DEFAULT p-8 flex flex-col justify-between">
<div>
<span className="font-label-lg text-label-lg text-outline">Jangka Panjang</span>
<h4 className="font-headline-sm text-headline-sm text-primary mt-1">Paket Tahunan (12 Bulan)</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-2">Solusi komprehensif pendampingan akademik setahun penuh.</p>
<div className="my-6">
<span className="text-primary font-bold text-headline-lg font-headline-lg">Rp 99.000</span>
<span className="text-on-surface-variant font-label-md text-label-md">/bulan (hemat 50%)</span>
</div>
<ul className="space-y-3 font-body-sm text-body-sm text-on-surface border-t border-surface-variant/60 pt-6">
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Semua fitur Paket Semester
              </li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
<strong>6x Sesi Konsultasi Privat 1-on-1</strong>
</li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Akses Eksklusif Bootcamp Olimpiade &amp; Sains
              </li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[18px] text-on-tertiary-container" data-icon="check">check</span>
                Dedicated Personal Education Advisor
              </li>
</ul>
</div>
<a className="mt-8 w-full py-3 rounded-full border border-primary text-primary hover:bg-surface-container font-label-lg text-label-lg text-center font-semibold transition-all cursor-pointer" href="#" onClick={(e)=>{e.preventDefault(); onDaftar && onDaftar()}}>
            Pilih Paket Tahunan
          </a>
</div>
</div>
</div>
</section>
<section className="py-16 lg:py-20" id="daftar-trial">
<div className="max-w-7xl mx-auto px-4 lg:px-8">
<div ref={addReveal} className="reveal bg-primary-container text-surface-container-lowest rounded-DEFAULT p-6 sm:p-8 lg:p-16 relative overflow-hidden shadow-2xl">
<div className="absolute -right-20 -bottom-20 w-96 h-96 bg-on-tertiary-container/30 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute -left-20 -top-20 w-80 h-80 bg-secondary-container/20 rounded-full blur-3xl pointer-events-none"></div>
<div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start lg:items-center">
<div className="lg:col-span-7 space-y-5">
<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest/10 backdrop-blur-sm border border-surface-container-lowest/20 font-label-sm text-label-sm text-secondary-container">
<span>🎁 Promo Awal Semester</span>
<span>• Kuota Uji Coba Terbatas</span>
</div>
<h2 className="font-display-lg text-display-lg-mobile lg:text-display-lg font-bold text-surface-container-lowest leading-tight">
              Beri Hadiah Belajar yang Menyenangkan untuk Buah Hati Anda Hari Ini
            </h2>
<p className="font-body-lg text-body-lg text-primary-fixed leading-relaxed">
              Mulai 14 hari masa percobaan gratis tanpa dipungut biaya sepeser pun. Dapatkan tes pemetaan potensi belajar awal secara cuma-cuma senilai Rp 250.000.
            </p>
<div className="flex flex-wrap items-center gap-6 pt-2 text-surface-container-lowest text-label-md font-label-md">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary-container" data-icon="credit_card_off">credit_card_off</span>
<span>Tanpa Kartu Kredit</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary-container" data-icon="cancel">cancel</span>
<span>Batal Kapan Saja</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-secondary-container" data-icon="support_agent">support_agent</span>
<span>Panduan Setup Didampingi Admin</span>
</div>
</div>
</div>
<div className="lg:col-span-5">
<div className="bg-surface-container-lowest text-on-surface rounded-DEFAULT p-5 sm:p-8 shadow-xl border border-surface-variant">
<h4 className="font-headline-sm text-headline-sm text-primary mb-2">Daftar Coba Gratis 14 Hari</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant mb-6">Lengkapi data untuk mengaktifkan akun belajar anak:</p>
<form className="space-y-4" onSubmit={(e)=>{e.preventDefault(); const fd=new FormData(e.target); const nama=fd.get('nama'); pop(`Siap, ${nama||'Kak'}! Lanjut buat akun ya →`); setTimeout(()=>onDaftar&&onDaftar(), 700);}}>
<div>
<label className="block font-label-md text-label-md text-primary mb-1.5">Nama Lengkap Orang Tua</label>
<input name="nama" className="w-full px-4 py-3 rounded-DEFAULT border border-surface-variant focus:border-on-tertiary-container focus:ring-2 focus:ring-on-tertiary-container/20 outline-none text-body-md font-body-md" placeholder="Contoh: Budi Santoso" required type="text"/>
</div>
<div>
<label className="block font-label-md text-label-md text-primary mb-1.5">Nomor WhatsApp Aktif</label>
<input name="wa" className="w-full px-4 py-3 rounded-DEFAULT border border-surface-variant focus:border-on-tertiary-container focus:ring-2 focus:ring-on-tertiary-container/20 outline-none text-body-md font-body-md" placeholder="Contoh: 08123456789" required type="tel"/>
</div>
<div>
<label className="block font-label-md text-label-md text-primary mb-1.5">Jenjang Kelas Siswa</label>
<select name="jenjang" className="w-full px-4 py-3 rounded-DEFAULT border border-surface-variant focus:border-on-tertiary-container focus:ring-2 focus:ring-on-tertiary-container/20 outline-none text-body-md font-body-md bg-surface-container-lowest">
<option>Kelas 1 - 3 SD (Fase Fondasi Awal)</option>
<option selected>Kelas 4 - 6 SD (Fase Pengembangan)</option>
<option>Kelas 7 - 9 SMP (Fase Menengah)</option>
<option>Kelas 10 - 12 SMA (Fase Lanjutan)</option>
</select>
</div>
<button className="w-full py-4 rounded-full bg-secondary-container text-primary-container font-label-lg text-label-lg font-bold hover:bg-secondary-fixed-dim transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 mt-4" type="submit">
<span>Aktifkan Akses Belajar Sekarang</span>
<span className="material-symbols-outlined text-[18px]" data-icon="arrow_forward">arrow_forward</span>
</button>
<p className="font-label-sm text-label-sm text-outline text-center mt-3">
                  Dengan mendaftar, Anda menyetujui Kebijakan Privasi data anak aman 100%.
                </p>
</form>
</div>
</div>
</div>
</div>
</div>
</section>
<footer className="w-full bg-surface-container-high border-t border-outline-variant">
<div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-10 lg:py-12">
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-10">
<div className="lg:col-span-2 space-y-4">
<div className="flex items-center gap-2 text-title-lg font-title-lg font-bold text-primary tracking-tight">
<img src="/logo.png" alt="logo" className="w-9 h-9 object-contain" />
<span style={{color:"#1B2A4A"}}>Belajar<span style={{color:"#F2A93B"}}>.Adaptif</span></span>
</div>
<p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm">
            Platform edtech bimbingan belajar adaptif berbasis kecerdasan buatan yang dikembangkan oleh Daffa Abdul Jalal untuk siswa di Indonesia. Saya Daffa Abdul Jalal membangun Belajar.Adaptif untuk menghadirkan belajar yang personal, inklusif, dan menumbuhkan rasa ingin tahu alami setiap anak.
          </p>
<div className="pt-2 flex items-center gap-3 flex-wrap">
<span className="px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-primary border border-surface-variant">ISO 27001 Certified Security</span>
<span className="px-3 py-1 bg-surface-container rounded-full text-label-sm font-label-sm text-primary border border-surface-variant">Kurikulum Merdeka</span>
</div>
</div>
<div>
<h5 className="font-title-md text-title-md text-primary font-bold mb-4">Program &amp; Fitur</h5>
<ul className="space-y-2.5 font-body-sm text-body-sm">
<li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#program" onClick={smoothScroll("#program")}>Program Belajar</a></li>
<li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#fitur" onClick={smoothScroll("#fitur")}>Fitur Unggulan</a></li>
<li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#metode" onClick={smoothScroll("#metode")}>Metode Adaptif AI</a></li>
<li><a className="text-on-surface-variant hover:text-primary transition-colors" href="#biaya" onClick={smoothScroll("#biaya")}>Biaya &amp; Langganan</a></li>
</ul>
</div>
<div>
<h5 className="font-title-md text-title-md text-primary font-bold mb-4">Lembaga &amp; Legal</h5>
<ul className="space-y-2.5 font-body-sm text-body-sm">
<li><a onClick={()=>pop("Segera hadir")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Akreditasi &amp; Mitra</a></li>
<li><a onClick={()=>pop("Segera hadir")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Kebijakan Privasi</a></li>
<li><a onClick={()=>pop("Segera hadir")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Syarat &amp; Ketentuan</a></li>
<li><a onClick={()=>pop("Segera hadir")} className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer">Pusat Bantuan</a></li>
</ul>
</div>
<div>
<h5 className="font-title-md text-title-md text-primary font-bold mb-4">Kontak Layanan</h5>
<ul className="space-y-2.5 font-body-sm text-body-sm text-on-surface-variant">
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container" data-icon="mail">mail</span>
<span>halo@belajaradaptif.id</span>
</li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container" data-icon="call">call</span>
<span>(021) 8062-7788</span>
</li>
<li className="flex items-center gap-2">
<span className="material-symbols-outlined text-[16px] text-on-tertiary-container" data-icon="chat">chat</span>
<span>WhatsApp CS: 0811-9900-2211</span>
</li>
<li className="text-label-sm font-label-sm text-outline pt-2">
              Senin - Minggu (08:00 - 20:00 WIB)
            </li>
</ul>
</div>
</div>
<div className="pt-8 border-t border-surface-variant/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
<p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2024 Belajar.Adaptif oleh Daffa Abdul Jalal. Dikembangkan oleh Daffa Abdul Jalal. Seluruh hak cipta dilindungi undang-undang.
        </p>
<div className="flex items-center gap-6 font-label-md text-label-md text-on-surface-variant">
<a onClick={()=>pop("Segera hadir: Instagram")} className="hover:text-primary transition-colors cursor-pointer">Instagram</a>
<a onClick={()=>pop("Segera hadir: YouTube")} className="hover:text-primary transition-colors cursor-pointer">YouTube</a>
<a onClick={()=>pop("Segera hadir: LinkedIn")} className="hover:text-primary transition-colors cursor-pointer">LinkedIn</a>
</div>
</div>
</div>
</footer>
    </div>
  );
}
