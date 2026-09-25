import { useEffect, useState } from "react";

export default function Preloader({ minMs = 900, maxMs = 1800 }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const t0 = Date.now();
    let maxTimer = null;
    let exitTimer = null;
    let hideTimer = null;

    const triggerExit = () => {
      setExiting(true);
      hideTimer = setTimeout(() => setVisible(false), 420);
    };

    const finish = () => {
      if (maxTimer) clearTimeout(maxTimer);
      const elapsed = Date.now() - t0;
      const delay = Math.max(0, minMs - elapsed);
      exitTimer = setTimeout(triggerExit, delay);
    };

    maxTimer = setTimeout(triggerExit, maxMs);

    if (document.readyState === "complete") {
      finish();
    } else {
      const onLoad = () => finish();
      window.addEventListener("load", onLoad, { once: true });
      return () => {
        window.removeEventListener("load", onLoad);
        clearTimeout(maxTimer);
        clearTimeout(exitTimer);
        clearTimeout(hideTimer);
      };
    }

    return () => {
      clearTimeout(maxTimer);
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, [minMs, maxMs]);

  if (!visible) return null;

  return (
    <div
      className={exiting ? "pre-exit" : "pre-enter"}
      role="status"
      aria-live="polite"
      aria-label="Memuat"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 90,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#F6F5F0",
        overflow: "hidden",
      }}
    >
      <style>{`
        .pre-enter { animation: preFadeIn .25s ease-out both; }
        .pre-exit { animation: preFadeOut .42s ease-in both; }
        @keyframes preFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes preFadeOut { from { opacity:1; transform: scale(1)} to { opacity:0; transform: scale(1.02)} }
        .pre-logo { animation: preLogo .58s cubic-bezier(.16,1,.3,1) both; }
        @keyframes preLogo { from { opacity:0; transform: scale(.92) translateY(6px)} to { opacity:1; transform: scale(1) translateY(0)} }
        .pre-logo-box { position: relative; width: 64px; height: 64px; }
        .pre-logo-img { width: 64px; height: 64px; object-fit: contain; display: block; }
        @media (min-width: 1024px) { .pre-logo-box { width: 80px; height: 80px; } .pre-logo-img { width: 80px; height: 80px; } }
        .pre-arrow {
          stroke-dasharray: 120;
          stroke-dashoffset: 120;
          animation: preDraw .82s cubic-bezier(.4,0,.2,1) .18s both;
        }
        .pre-arrow-head {
          stroke-dasharray: 48;
          stroke-dashoffset: 48;
          animation: preDraw .42s ease-out .62s both;
        }
        @keyframes preDraw { to { stroke-dashoffset: 0 } }
        .pre-text-a { animation: preText .5s cubic-bezier(.16,1,.3,1) .34s both; }
        .pre-text-b { animation: preText .5s cubic-bezier(.16,1,.3,1) .46s both; }
        @keyframes preText { from { opacity:0; transform: translateY(8px)} to { opacity:1; transform: translateY(0)} }
        .pre-tagline { animation: preTagIn .42s ease .62s both; }
        @keyframes preTagIn { from { opacity:0 } to { opacity:1 } }
        .pre-bar { transform-origin: left; animation: preBar 1.5s linear both; }
        @keyframes preBar { from { transform: scaleX(0)} to { transform: scaleX(1)} }
        @media (prefers-reduced-motion: reduce) {
          .pre-enter,.pre-exit,.pre-logo,.pre-text-a,.pre-text-b,.pre-bar,.pre-tagline { animation-duration: .2s !important; animation-delay: 0s !important; }
          .pre-arrow, .pre-arrow-head { animation: none; stroke-dashoffset: 0; }
        }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div className="pre-logo pre-logo-box">
          <img
            src="/logo.png"
            alt="BelajarAdaptif"
            width={80}
            height={80}
            className="pre-logo-img"
          />
          <svg
            viewBox="0 0 72 72"
            fill="none"
            aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
          >
            <path className="pre-arrow" d="M14 54 L56 14" stroke="#F2A93B" strokeWidth="3.4" strokeLinecap="round" />
            <path className="pre-arrow-head" d="M40 10 L58 12 L56 30" stroke="#1B2A4A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div style={{ marginTop: 18, display: "flex", alignItems: "baseline", gap: 0, lineHeight: 1 }}>
          <span className="pre-text-a" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: "#1B2A4A", letterSpacing: -0.4 }}>Belajar</span>
          <span className="pre-text-b" style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 800, fontSize: 20, color: "#F2A93B", letterSpacing: -0.4 }}>.Adaptif</span>
        </div>

        <div className="pre-tagline" style={{ marginTop: 8, fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: 11, color: "#6B7280", letterSpacing: 0.4, textAlign: "center", padding: "0 16px" }}>
          Platform Bimbingan Adaptif No. 1 di Indonesia
        </div>

      </div>

      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: "#EDEBE2",
          overflow: "hidden",
        }}
      >
        <div className="pre-bar" style={{ height: "100%", width: "100%", background: "linear-gradient(90deg, #2C7873 0%, #F2A93B 100%)", animationDuration: "1.6s" }} />
      </div>
    </div>
  );
}
