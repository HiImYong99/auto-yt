import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  staticFile,
} from "remotion";
import { Visuals } from "./Visuals";

// ── 1. 아이콘/픽토그램 ──────────────────────────────────────────
const ICONS = [
  { emoji: "💡", label: "아이디어" },
  { emoji: "🤖", label: "AI" },
  { emoji: "💰", label: "수익" },
  { emoji: "🚀", label: "런칭" },
  { emoji: "🌍", label: "글로벌" },
];

const FloatingIcon: React.FC<{ emoji: string; label: string; startFrame: number }> = ({
  emoji,
  label,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - startFrame;

  const scale = spring({ fps, frame: elapsed, config: { damping: 14, stiffness: 120 } });
  const opacity = interpolate(elapsed, [0, 8, 50, 60], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (elapsed < 0 || elapsed > 65) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "38%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 120 }}>{emoji}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 600,
          color: "rgba(255,255,255,0.7)",
          letterSpacing: "0.15em",
          fontFamily: "'Apple SD Gothic Neo', sans-serif",
          marginTop: 8,
        }}
      >
        {label}
      </div>
    </div>
  );
};

// ── 2. 키워드 강조 텍스트 ─────────────────────────────────────────
const KeywordPop: React.FC<{ text: string; startFrame: number; color?: string }> = ({
  text,
  startFrame,
  color = "#7bb4ff",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - startFrame;

  const scale = spring({ fps, frame: elapsed, config: { damping: 12, stiffness: 180 } });
  const opacity = interpolate(elapsed, [0, 5, 45, 55], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (elapsed < 0 || elapsed > 60) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "42%",
        transform: `translate(-50%, -50%) scale(${scale})`,
        opacity,
        textAlign: "center",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontSize: 96,
          fontWeight: 900,
          color,
          fontFamily: "'Apple SD Gothic Neo', sans-serif",
          letterSpacing: "-0.03em",
          textShadow: `0 0 60px ${color}88, 0 4px 12px rgba(0,0,0,0.6)`,
        }}
      >
        {text}
      </span>
    </div>
  );
};

// ── 3. 숫자 카운터 애니메이션 ─────────────────────────────────────
const Counter: React.FC<{ from: number; to: number; suffix: string; startFrame: number }> = ({
  from,
  to,
  suffix,
  startFrame,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - startFrame;
  const DURATION = 60;

  const progress = interpolate(elapsed, [0, DURATION], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(elapsed, [0, 8, DURATION + 10, DURATION + 20], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // easeOut
  const eased = 1 - Math.pow(1 - progress, 3);
  const value = Math.round(from + (to - from) * eased);

  if (elapsed < 0 || elapsed > DURATION + 25) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: "40%",
        transform: "translate(-50%, -50%)",
        opacity,
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontSize: 128,
          fontWeight: 900,
          fontVariantNumeric: "tabular-nums",
          fontFamily: "'Apple SD Gothic Neo', sans-serif",
          background: "linear-gradient(135deg, #fff 30%, #7bb4ff)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {value.toLocaleString()}
        <span style={{ fontSize: 56 }}>{suffix}</span>
      </div>
    </div>
  );
};

// ── 샘플 자막 ─────────────────────────────────────────────────────
const SampleSubtitle: React.FC<{ text: string; startFrame: number; durationFrames: number }> = ({
  text,
  startFrame,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const elapsed = frame - startFrame;

  const opacity = interpolate(elapsed, [0, 6, durationFrames - 6, durationFrames], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(elapsed, [0, 6], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  if (elapsed < 0 || elapsed > durationFrames) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: 80,
        left: "10%",
        right: "10%",
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "14px 36px",
          borderRadius: 14,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: "rgba(255,255,255,0.9)",
            fontFamily: "'Apple SD Gothic Neo', sans-serif",
            textShadow: "0 1px 3px rgba(0,0,0,0.5)",
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};

// ── 메인 샘플 컴포지션 ────────────────────────────────────────────
// 5개 씬, 각 90프레임(3초)씩 = 총 450프레임(15초)
const SCENES = [
  {
    from: 0,
    type: "icon",
    props: { emoji: "💡", label: "아이디어" },
    subtitle: "방구석에서 혼자 모든 걸 뚝딱 만들어낼 수 있죠.",
  },
  {
    from: 90,
    type: "keyword",
    props: { text: "감각적 빌딩", color: "#7bb4ff" },
    subtitle: "직관과 아이디어만으로 1인 제국을 세우는 혁명.",
  },
  {
    from: 180,
    type: "counter",
    props: { from: 0, to: 100000000, suffix: "원" },
    subtitle: "수십 명의 엘리트 개발자가 밤을 새워야 겨우 돌아가던 시스템.",
  },
  {
    from: 270,
    type: "icon",
    props: { emoji: "🤖", label: "AI" },
    subtitle: "똑똑한 인공지능이 전부 통역해 줍니다.",
  },
  {
    from: 360,
    type: "keyword",
    props: { text: "1인 제국", color: "#f472b6" },
    subtitle: "오직 의지 하나로 전 세계의 지갑을 여는 과정.",
  },
];

export const Sample: React.FC = () => {
  const { durationInFrames } = useVideoConfig();
  const progress = useCurrentFrame() / durationInFrames;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Visuals progress={progress} />

      {SCENES.map((scene, i) => (
        <React.Fragment key={i}>
          {scene.type === "icon" && (
            <FloatingIcon startFrame={scene.from} {...(scene.props as any)} />
          )}
          {scene.type === "keyword" && (
            <KeywordPop startFrame={scene.from} {...(scene.props as any)} />
          )}
          {scene.type === "counter" && (
            <Counter startFrame={scene.from} {...(scene.props as any)} />
          )}
          <SampleSubtitle
            text={scene.subtitle}
            startFrame={scene.from}
            durationFrames={85}
          />
        </React.Fragment>
      ))}

      {/* 하단 진행 바 */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 3,
          width: `${progress * 100}%`,
          background: "linear-gradient(90deg, #4a9eff, #a855f7)",
          opacity: 0.6,
        }}
      />
    </div>
  );
};
