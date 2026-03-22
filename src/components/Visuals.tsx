import React from "react";

// 미니멀 다크 배경 — 빛 번짐/파티클 완전 제거
export const Visuals: React.FC<{ progress: number }> = () => (
  <div style={{ position: "absolute", inset: 0, background: "#121212", overflow: "hidden" }}>
    {/* Subtle dot grid */}
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}
    >
      <defs>
        <pattern id="dotgrid" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotgrid)" />
    </svg>

    {/* Vignette */}
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.52) 100%)",
      }}
    />
  </div>
);
