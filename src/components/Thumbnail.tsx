import React from "react";
import thumbnailData from "../data/thumbnail_data.json";

const { line1, line2, emoji } = thumbnailData as { line1: string; line2: string; emoji: string };

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
        width: 900,
      }}>
        {/* 라인 1 — 훅 */}
        <div style={{
          fontSize: 88, fontWeight: 900, lineHeight: 1.1,
          color: "#aaff00", letterSpacing: "-0.04em",
          textShadow: "0 0 60px rgba(170,255,0,0.35)",
        }}>
          {line1}
        </div>

        {/* 라인 2 — 부제목 */}
        <div style={{
          fontSize: 52, fontWeight: 700, lineHeight: 1.25,
          color: "#ffffff", letterSpacing: "-0.02em",
          marginTop: 16,
        }}>
          {line2}
        </div>
      </div>

      {/* 우측 이모지 */}
      <div style={{
        position: "absolute", right: 60, top: "50%",
        transform: "translateY(-50%)",
        fontSize: 180, lineHeight: 1,
        filter: "drop-shadow(0 0 30px rgba(170,255,0,0.3))",
      }}>{emoji}</div>

      {/* 우상단 배지 */}
      <div style={{
        position: "absolute", top: 36, right: 36,
        padding: "8px 20px", borderRadius: 8,
        background: "#aaff00",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          fontSize: 22, fontWeight: 800, color: "#0a1a00",
          letterSpacing: "0.02em",
        }}>바이브빌더</span>
      </div>

      {/* 하단 바 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 6,
        background: "#aaff00", opacity: 0.6,
      }} />
    </div>
  );
};
