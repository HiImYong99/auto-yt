import React from "react";

// IDE 다크 배경 — 그라데이션 + 그리드 + 앰비언트 글로우
export const Visuals: React.FC<{ progress: number }> = () => (
  <div style={{
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, #0D1117 0%, #141B2D 55%, #1A1F2E 100%)",
    overflow: "hidden",
  }}>
    {/* IDE grid lines — Cyan 10% */}
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.09 }}>
      <defs>
        <pattern id="idegrid" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#61DAFB" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#idegrid)" />
    </svg>

    {/* Vignette */}
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.75) 100%)",
    }} />

    {/* Cyan ambient glow — top-left */}
    <div style={{
      position: "absolute", width: 800, height: 800, left: -300, top: -300,
      background: "radial-gradient(circle, rgba(97,218,251,0.07) 0%, transparent 70%)",
      borderRadius: "50%",
    }} />

    {/* Purple ambient glow — bottom-right */}
    <div style={{
      position: "absolute", width: 900, height: 900, right: -350, bottom: -350,
      background: "radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)",
      borderRadius: "50%",
    }} />
  </div>
);
