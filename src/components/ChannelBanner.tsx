import React from "react";

export const ChannelBanner: React.FC = () => {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "#080f08",
      position: "relative", overflow: "hidden",
      fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
    }}>
      {/* 배경 글로우 */}
      <div style={{
        position: "absolute", left: "30%", top: "50%",
        transform: "translate(-50%, -50%)",
        width: 1200, height: 1200, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(170,255,0,0.06) 0%, transparent 60%)",
        filter: "blur(30px)",
      }} />

      {/* 안전 영역 중앙 콘텐츠 */}
      <div style={{
        position: "absolute",
        left: "50%", top: "50%",
        transform: "translate(-50%, -50%)",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: 24,
        textAlign: "center",
      }}>
        {/* 채널명 */}
        <div style={{
          fontSize: 52, fontWeight: 800,
          color: "#aaff00", letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          VIBE BUILDER
        </div>

        {/* 메인 카피 */}
        <div style={{
          fontSize: 88, fontWeight: 900, lineHeight: 1.1,
          letterSpacing: "-0.04em", color: "#ffffff",
        }}>
          아이디어만 있으면<br />
          <span style={{ color: "#aaff00" }}>3일이면 됩니다</span>
        </div>

        {/* 서브 */}
        <div style={{
          fontSize: 34, fontWeight: 500,
          color: "rgba(255,255,255,0.4)",
          letterSpacing: "0.02em",
        }}>
          바이브코딩 · AI 자동화 · 1인 서비스 개발
        </div>
      </div>

      {/* 하단 형광 바 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 8,
        background: "#aaff00",
        opacity: 0.7,
      }} />
    </div>
  );
};
