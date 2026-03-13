import React from "react";

export const ChannelProfile: React.FC = () => {
  return (
    <div style={{
      width: "100%", height: "100%",
      background: "#080f08",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative", overflow: "hidden",
    }}>
      {/* 배경 글로우 */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at 50% 48%, rgba(170,255,0,0.14) 0%, transparent 60%)",
      }} />

      {/* 메인 아이콘: 터미널 커서 ">" — 바이브코딩 = 실행, 빌드 */}
      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", gap: 0,
      }}>
        {/* > 기호 */}
        <svg width="520" height="520" viewBox="0 0 520 520" fill="none">
          {/* 셰브론 왼쪽 팔 */}
          <path
            d="M140 100 L360 260 L140 420"
            stroke="#aaff00"
            strokeWidth="72"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            style={{ filter: "drop-shadow(0 0 24px rgba(170,255,0,0.5))" }}
          />
          {/* 커서 블록 */}
          <rect
            x="370" y="222"
            width="56" height="76"
            rx="10"
            fill="#aaff00"
            opacity="0.9"
            style={{ filter: "drop-shadow(0 0 16px rgba(170,255,0,0.6))" }}
          />
        </svg>
      </div>
    </div>
  );
};
