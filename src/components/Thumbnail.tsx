import React from "react";

// Maker Evan 스타일: 다크 배경 + 형광그린 강조 + 텍스트 크게
export const Thumbnail: React.FC = () => {
  return (
    <div style={{
      width: "100%", height: "100%",
      position: "relative", overflow: "hidden",
      background: "#080f08",
      fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
    }}>
      {/* 배경 그린 글로우 */}
      <div style={{
        position: "absolute", left: -200, top: "50%",
        transform: "translateY(-50%)",
        width: 900, height: 900, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(170,255,0,0.08) 0%, transparent 65%)",
        filter: "blur(20px)",
      }} />

      {/* 메인 텍스트 */}
      <div style={{
        position: "absolute",
        left: 72, top: 0, bottom: 0,
        display: "flex", flexDirection: "column",
        justifyContent: "center",
        width: 860,
      }}>
        {/* 라인 1 */}
        <div style={{
          fontSize: 104, fontWeight: 900, lineHeight: 1.05,
          color: "#ffffff", letterSpacing: "-0.04em",
        }}>
          3시간 만에
        </div>

        {/* 라인 2 — 형광 강조 */}
        <div style={{
          fontSize: 118, fontWeight: 900, lineHeight: 1,
          color: "#aaff00", letterSpacing: "-0.05em",
          textShadow: "0 0 60px rgba(170,255,0,0.35)",
        }}>
          월 1억 버는 법
        </div>

        {/* 라인 3 */}
        <div style={{
          fontSize: 38, fontWeight: 600, marginTop: 20,
          color: "rgba(255,255,255,0.4)", letterSpacing: "-0.01em",
        }}>
          바이브 코더의 5가지 비밀 전략
        </div>
      </div>

      {/* 우측 이모지 */}
      <div style={{
        position: "absolute", right: 70, top: "50%",
        transform: "translateY(-50%)",
        fontSize: 200, lineHeight: 1,
        filter: "drop-shadow(0 0 30px rgba(170,255,0,0.3))",
      }}>💰</div>

      {/* 우상단 배지 (Maker Evan의 "Claude Code" 배지 스타일) */}
      <div style={{
        position: "absolute", top: 36, right: 36,
        padding: "8px 20px", borderRadius: 8,
        background: "#aaff00",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          fontSize: 22, fontWeight: 800, color: "#0a1a00",
          letterSpacing: "0.02em",
        }}>바이브코더</span>
      </div>

      {/* 하단 바 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 6,
        background: "#aaff00",
        opacity: 0.6,
      }} />
    </div>
  );
};
