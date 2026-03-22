import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// ─────────────────────────────────────────────────────────────
// Design Tokens (공유)
// ─────────────────────────────────────────────────────────────
const TEXT    = "#FFFFFF";
const MUTED   = "#A1A1AA";
const ACCENT  = "#FF6B6B";
const SURFACE = "#1E1E1E";
const BORDER  = "rgba(255,255,255,0.08)";
const FONT    = "'Apple SD Gothic Neo','Noto Sans KR',sans-serif";
const MONO    = "'SF Mono','Fira Code',monospace";

// ─────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <div style={{ position: "absolute", inset: 0, background: "#121212", overflow: "hidden" }}>
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05 }}>
      <defs>
        <pattern id="sdots" x="0" y="0" width="64" height="64" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#ffffff" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#sdots)" />
    </svg>
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at center, transparent 42%, rgba(0,0,0,0.52) 100%)",
    }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
// useSlideUp hook
// ─────────────────────────────────────────────────────────────
function useSlideUp(delay = 0, totalDur = 90) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(
    f, [0, 10, Math.max(11, totalDur - 14), totalDur], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const sp = spring({ fps, frame: f, config: { damping: 18, stiffness: 115 } });
  const translateY = interpolate(sp, [0, 1], [38, 0]);
  return { opacity, translateY };
}

// ─────────────────────────────────────────────────────────────
// Progress Bar
// ─────────────────────────────────────────────────────────────
const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.07)" }}>
      <div style={{ width: `${(frame / total) * 100}%`, height: "100%", background: ACCENT }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Scene 1 — Hero Title (0–130, 4.3s)
// ─────────────────────────────────────────────────────────────
const Scene1: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { opacity: op1, translateY: ty1 } = useSlideUp(0, dur);
  const { opacity: op2, translateY: ty2 } = useSlideUp(10, dur);
  const { opacity: op3, translateY: ty3 } = useSlideUp(20, dur);
  const lineW = interpolate(frame, [14, 46], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
      <div style={{ opacity: op1, transform: `translateY(${ty1}px)`, fontSize: 22, fontWeight: 700, letterSpacing: "0.22em", color: ACCENT, fontFamily: FONT, textTransform: "uppercase" }}>
        Design System · 2026
      </div>

      <div style={{ opacity: op2, transform: `translateY(${ty2}px)`, textAlign: "center" }}>
        <div style={{ fontSize: 128, fontWeight: 900, color: TEXT, fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1.08 }}>
          음성 AI의
        </div>
        <div style={{ fontSize: 128, fontWeight: 900, color: ACCENT, fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1.08, textShadow: `0 0 80px ${ACCENT}44` }}>
          혁명
        </div>
        <div style={{ height: 5, borderRadius: 3, marginTop: 20, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT}55)`, width: `${lineW}%`, boxShadow: `0 0 22px ${ACCENT}88` }} />
      </div>

      <div style={{ opacity: op3, transform: `translateY(${ty3}px)`, fontSize: 30, color: MUTED, fontFamily: FONT, letterSpacing: "0.03em" }}>
        알리바바 Qwen3-TTS — 오픈소스 완전 공개
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Scene 2 — FeatureCard × 3 Stagger (115–265, 5s)
// ─────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: "⚡", title: "0.1초 반응", sub: "눈 깜빡임보다 빠른\n즉각적인 음성 출력" },
  { icon: "✍️", title: "텍스트로 설계", sub: "원하는 목소리를\n한 줄 문장으로 묘사" },
  { icon: "🌍", title: "3초 클로닝", sub: "짧은 녹음으로\n다국어까지 즉시 지원" },
];

const FeatureCard: React.FC<{ icon: string; title: string; sub: string; delay: number; dur: number }> = ({ icon, title, sub, delay, dur }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(f, [0, 10, Math.max(11, dur - 14), dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sp = spring({ fps, frame: f, config: { damping: 16, stiffness: 110, mass: 1.1 } });
  const translateY = interpolate(sp, [0, 1], [52, 0]);
  const scale = interpolate(sp, [0, 1], [0.92, 1]);

  return (
    <div style={{ opacity, transform: `translateY(${translateY}px) scale(${scale})`, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 28, padding: "44px 52px", display: "flex", flexDirection: "column", gap: 18, width: 468 }}>
      <div style={{ fontSize: 68 }}>{icon}</div>
      <div style={{ fontSize: 44, fontWeight: 800, color: TEXT, fontFamily: FONT, letterSpacing: "-0.02em" }}>{title}</div>
      <div style={{ fontSize: 26, color: MUTED, fontFamily: FONT, lineHeight: 1.6, whiteSpace: "pre-line" }}>{sub}</div>
      <div style={{ height: 3, width: 48, borderRadius: 2, background: ACCENT, boxShadow: `0 0 14px ${ACCENT}77`, marginTop: 6 }} />
    </div>
  );
};

const Scene2: React.FC<{ dur: number }> = ({ dur }) => (
  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 32, padding: "0 90px" }}>
    {FEATURES.map((f, i) => <FeatureCard key={i} {...f} delay={i * 9} dur={dur} />)}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Scene 3 — MockupDevice: phone (255–395, 4.7s)
// ─────────────────────────────────────────────────────────────
const Scene3: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, translateY } = useSlideUp(0, dur);
  const { opacity: opLabel, translateY: tyLabel } = useSlideUp(0, dur);

  const chats = [
    { text: "목소리 클로닝 해줘", user: true },
    { text: "3초 녹음 파일을...", user: false },
    { text: "완료! 다국어 지원됩니다", user: false },
  ];
  const PW = 260, PH = 480;

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 100 }}>
      {/* Label */}
      <div style={{ opacity: opLabel, transform: `translateY(${tyLabel}px)`, maxWidth: 440, textAlign: "right" }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.16em", color: MUTED, textTransform: "uppercase", fontFamily: FONT, marginBottom: 16 }}>
          MockupDevice
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, color: TEXT, fontFamily: FONT, letterSpacing: "-0.02em", lineHeight: 1.2 }}>
          AI 상담원,<br />눈앞의 사람처럼
        </div>
        <div style={{ fontSize: 24, color: MUTED, fontFamily: FONT, marginTop: 16, lineHeight: 1.6 }}>
          0.1초 반응 속도로 지연 시간이라는<br />벽이 완전히 사라진다
        </div>
      </div>

      {/* Phone SVG */}
      <div style={{ opacity, transform: `translateY(${translateY}px)` }}>
        <svg width={PW} height={PH} viewBox={`0 0 ${PW} ${PH}`}>
          {/* Shell */}
          <rect x={2} y={2} width={PW - 4} height={PH - 4} rx={36} ry={36} fill="#1A1A1A" stroke="rgba(255,255,255,0.1)" strokeWidth={1.5} />
          {/* Notch */}
          <rect x={PW / 2 - 34} y={12} width={68} height={16} rx={8} fill="#2A2A2A" />
          {/* Screen */}
          <rect x={16} y={44} width={PW - 32} height={PH - 88} rx={10} fill="#111" />
          {/* Status bar */}
          <text x={28} y={72} fontSize={13} fill={MUTED} fontFamily={FONT}>9:41</text>
          <text x={PW - 28} y={72} fontSize={13} fill={MUTED} fontFamily={FONT} textAnchor="end">●●●</text>
          {/* Divider */}
          <line x1={16} y1={82} x2={PW - 16} y2={82} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />

          {chats.map((chat, i) => {
            const delay = i * 14;
            const f2 = Math.max(0, frame - delay);
            const chatOp = interpolate(f2, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sp2 = spring({ fps, frame: f2, config: { damping: 20, stiffness: 140 } });
            const chatTy = interpolate(sp2, [0, 1], [14, 0]);
            const bw = Math.min(170, chat.text.length * 8.5 + 28);
            const bx = chat.user ? PW - 16 - 14 - bw : 16 + 14;
            const by = 100 + i * 88;

            return (
              <g key={i} style={{ opacity: chatOp, transform: `translateY(${chatTy}px)` }}>
                <rect x={bx} y={by} width={bw} height={58} rx={16}
                  fill={chat.user ? ACCENT : "#2C2C2C"}
                />
                <foreignObject x={bx + 10} y={by + 10} width={bw - 20} height={38}>
                  <div style={{ fontSize: 13.5, color: chat.user ? "#fff" : MUTED, fontFamily: FONT, lineHeight: "18px" }}>
                    {chat.text}
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {/* Home bar */}
          <rect x={PW / 2 - 44} y={PH - 22} width={88} height={5} rx={3} fill="#2A2A2A" />
        </svg>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Scene 4 — AnimatedArrow + 비교 흐름 (380–520, 4.7s)
// ─────────────────────────────────────────────────────────────
const Scene4: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, translateY } = useSlideUp(0, dur);

  const nodes = [
    { label: "3초 녹음", icon: "🎙️" },
    { label: "Qwen3-TTS", icon: "🤖" },
    { label: "글로벌 콘텐츠", icon: "🌍" },
  ];

  const NODE_W = 220, ARROW_W = 160, TOTAL_W = NODE_W * 3 + ARROW_W * 2;
  const SVG_H = 200;

  const arrowProgress1 = interpolate(frame, [18, 48], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const arrowProgress2 = interpolate(frame, [36, 66], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const ArrowSvg: React.FC<{ progress: number }> = ({ progress }) => {
    const len = 130;
    const arrowOp = interpolate(progress, [0.8, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
    return (
      <svg width={ARROW_W} height={SVG_H} viewBox={`0 0 ${ARROW_W} ${SVG_H}`} style={{ flexShrink: 0 }}>
        <line x1={10} y1={SVG_H / 2} x2={len + 10} y2={SVG_H / 2}
          stroke={ACCENT} strokeWidth={2.5} strokeLinecap="round"
          strokeDasharray={len} strokeDashoffset={len * (1 - progress)}
          style={{ filter: `drop-shadow(0 0 6px ${ACCENT}99)` }}
        />
        <polygon points={`${len + 10},${SVG_H / 2 - 8} ${len + 28},${SVG_H / 2} ${len + 10},${SVG_H / 2 + 8}`}
          fill={ACCENT} opacity={arrowOp}
          style={{ filter: `drop-shadow(0 0 6px ${ACCENT}99)` }}
        />
      </svg>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 40 }}>
      <div style={{ opacity, transform: `translateY(${translateY}px)`, fontSize: 22, fontWeight: 700, letterSpacing: "0.18em", color: MUTED, fontFamily: FONT, textTransform: "uppercase" }}>
        AnimatedArrow — 흐름 시각화
      </div>

      <div style={{ opacity, transform: `translateY(${translateY}px)`, display: "flex", alignItems: "center" }}>
        {nodes.map((node, i) => {
          const delay = i * 10;
          const f3 = Math.max(0, frame - delay);
          const nodeOp = interpolate(f3, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sp3 = spring({ fps, frame: f3, config: { damping: 18, stiffness: 120 } });
          const nodeTy = interpolate(sp3, [0, 1], [30, 0]);

          return (
            <React.Fragment key={i}>
              <div style={{
                opacity: nodeOp, transform: `translateY(${nodeTy}px)`,
                width: NODE_W, background: SURFACE, border: `1px solid ${BORDER}`,
                borderRadius: 20, padding: "28px 20px", textAlign: "center",
              }}>
                <div style={{ fontSize: 52, marginBottom: 12 }}>{node.icon}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: TEXT, fontFamily: FONT }}>{node.label}</div>
              </div>
              {i < nodes.length - 1 && (
                <ArrowSvg progress={i === 0 ? arrowProgress1 : arrowProgress2} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ opacity, transform: `translateY(${translateY}px)`, fontSize: 28, color: MUTED, fontFamily: FONT }}>
        수천만 원의 현지화 비용이 3초로 줄어든다
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Scene 5 — Closing Callout (505–600, 3.2s)
// ─────────────────────────────────────────────────────────────
const Scene5: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity: op, translateY: ty } = useSlideUp(0, dur);
  const { opacity: opSub, translateY: tySub } = useSlideUp(16, dur);
  const sp = spring({ fps, frame, config: { damping: 18, stiffness: 105, mass: 1.2 } });
  const scale = interpolate(sp, [0, 1], [0.91, 1]);
  const glow = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 1.8);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        opacity: op, transform: `translateY(${ty}px) scale(${scale})`,
        padding: "62px 84px",
        background: "rgba(255,107,107,0.05)",
        border: `2px solid rgba(255,107,107,${(0.28 + glow * 0.28).toFixed(2)})`,
        borderRadius: 36, textAlign: "center", maxWidth: 1060,
        boxShadow: `0 0 ${44 + glow * 44}px rgba(255,107,107,0.12), 0 36px 88px rgba(0,0,0,0.6)`,
        position: "relative",
      }}>
        {/* Corner accents */}
        {[
          { top: 18, left: 18, borderTop: `2px solid ${ACCENT}`, borderLeft: `2px solid ${ACCENT}` } as React.CSSProperties,
          { top: 18, right: 18, borderTop: `2px solid ${ACCENT}`, borderRight: `2px solid ${ACCENT}` } as React.CSSProperties,
          { bottom: 18, left: 18, borderBottom: `2px solid ${ACCENT}`, borderLeft: `2px solid ${ACCENT}` } as React.CSSProperties,
          { bottom: 18, right: 18, borderBottom: `2px solid ${ACCENT}`, borderRight: `2px solid ${ACCENT}` } as React.CSSProperties,
        ].map((s, i) => <div key={i} style={{ position: "absolute", width: 32, height: 32, ...s }} />)}

        <div style={{ fontSize: 96, fontWeight: 900, fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1.15, color: TEXT }}>
          진입 장벽이{" "}
          <span style={{ color: ACCENT, textShadow: `0 0 80px ${ACCENT}55` }}>완전히 붕괴됐다</span>
        </div>
        <div style={{ opacity: opSub, transform: `translateY(${tySub}px)`, fontSize: 30, color: MUTED, fontFamily: FONT, marginTop: 32, lineHeight: 1.65 }}>
          상상력만 있으면 글로벌 무대에서 놀 수 있는 판이 깔렸다
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SampleVideo (20s, 600 frames @ 30fps)
// ─────────────────────────────────────────────────────────────
const TOTAL = 600;

export const SampleVideo: React.FC = () => (
  <div style={{ width: 1920, height: 1080, position: "relative", overflow: "hidden" }}>
    <Background />

    {/* Scene 1: Hero Title */}
    <Sequence from={0} durationInFrames={130}>
      <Scene1 dur={130} />
    </Sequence>

    {/* Scene 2: FeatureCard × 3 Stagger */}
    <Sequence from={115} durationInFrames={150}>
      <Scene2 dur={150} />
    </Sequence>

    {/* Scene 3: MockupDevice — Phone */}
    <Sequence from={255} durationInFrames={140}>
      <Scene3 dur={140} />
    </Sequence>

    {/* Scene 4: AnimatedArrow 흐름 */}
    <Sequence from={380} durationInFrames={145}>
      <Scene4 dur={145} />
    </Sequence>

    {/* Scene 5: Closing Callout */}
    <Sequence from={505} durationInFrames={95}>
      <Scene5 dur={95} />
    </Sequence>

    <ProgressBar total={TOTAL} />
  </div>
);
