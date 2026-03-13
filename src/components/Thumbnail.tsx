import React from "react";

export const Thumbnail: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        background: "linear-gradient(135deg, #0a0a1a 0%, #0d0820 50%, #06091a 100%)",
        fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
      }}
    >
      {/* 배경 글로우 블롭 */}
      <div style={{
        position: "absolute", left: -100, top: -100,
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", right: -80, bottom: -80,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(236,72,153,0.14) 0%, transparent 70%)",
        filter: "blur(40px)",
      }} />
      <div style={{
        position: "absolute", right: 200, top: 80,
        width: 400, height: 400, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        filter: "blur(30px)",
      }} />

      {/* 왼쪽 콘텐츠 영역 */}
      <div style={{
        position: "absolute",
        left: 80, top: 0, bottom: 0,
        width: 740,
        display: "flex", flexDirection: "column", justifyContent: "center",
        gap: 0,
      }}>
        {/* 상단 배지 */}
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 10,
          padding: "8px 22px", borderRadius: 100,
          background: "rgba(99,102,241,0.2)",
          border: "1px solid rgba(99,102,241,0.4)",
          width: "fit-content", marginBottom: 28,
        }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#a5b4fc", letterSpacing: "0.08em" }}>
            AI 시대 생존 전략
          </span>
        </div>

        {/* 메인 타이틀 라인 1 */}
        <div style={{
          fontSize: 84, fontWeight: 900, lineHeight: 1.05,
          color: "#ffffff", letterSpacing: "-0.03em",
          marginBottom: 4,
        }}>
          타자 못 쳐도
        </div>

        {/* 메인 타이틀 라인 2 - 강조 */}
        <div style={{
          fontSize: 100, fontWeight: 900, lineHeight: 1.05,
          letterSpacing: "-0.04em", marginBottom: 28,
          background: "linear-gradient(90deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}>
          돈 버는 시대
        </div>

        {/* 서브 타이틀 */}
        <div style={{
          fontSize: 34, fontWeight: 600, lineHeight: 1.5,
          color: "rgba(255,255,255,0.65)", letterSpacing: "-0.01em",
          marginBottom: 36,
        }}>
          아이디어만으로 1인 IT 제국 세우는 법
        </div>

        {/* 하단 태그 리스트 */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          {["감각적 빌딩", "노코드", "AI 자동화", "1인 창업"].map((tag) => (
            <span key={tag} style={{
              padding: "7px 18px", borderRadius: 100,
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              fontSize: 22, fontWeight: 600,
              color: "rgba(255,255,255,0.7)",
            }}>{tag}</span>
          ))}
        </div>
      </div>

      {/* 오른쪽 비주얼 영역 */}
      <div style={{
        position: "absolute",
        right: 60, top: 0, bottom: 0, width: 400,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 20,
      }}>
        {/* 중앙 큰 이모지 */}
        <div style={{
          fontSize: 180, lineHeight: 1,
          filter: "drop-shadow(0 0 40px rgba(99,102,241,0.5))",
          marginBottom: 8,
        }}>
          💡
        </div>

        {/* 인포 카드 */}
        <div style={{
          padding: "18px 28px", borderRadius: 16,
          background: "rgba(10,10,30,0.7)",
          border: "1px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          width: 320, textAlign: "center",
        }}>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: 8 }}>
            개발자 없이 가능한 것들
          </div>
          {[
            { icon: "🌐", text: "웹 서비스 구축" },
            { icon: "🤖", text: "AI API 연동" },
            { icon: "💰", text: "글로벌 수익화" },
          ].map(({ icon, text }) => (
            <div key={text} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "6px 0",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ fontSize: 22, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 구분선 장식 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 4,
        background: "linear-gradient(90deg, #6366f1, #a855f7, #ec4899)",
      }} />
    </div>
  );
};
