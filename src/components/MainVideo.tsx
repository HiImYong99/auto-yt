import React from "react";
import {
  Audio, Sequence, useVideoConfig, useCurrentFrame,
  interpolate, spring, staticFile,
} from "remotion";
import { SyncData } from "../types";
import { Visuals } from "./Visuals";
import { Subtitle } from "./Subtitle";
import syncDataRaw from "../data/sync_data.json";
import scenePlanRaw from "../data/scene_plan.json";

const syncData = syncDataRaw as SyncData;

// ─────────────────────────────────────────────────────────────
// 시각 요소 타입
// ─────────────────────────────────────────────────────────────
type VisualNone     = { type: "none" };
type VisualIcon     = { type: "icon";     emoji: string; label?: string };
type VisualKeyword  = { type: "keyword";  text: string;  color?: string };
type VisualCounter  = { type: "counter";  from: number;  to: number; suffix: string };
type VisualInfoTip  = { type: "infotip";  title: string; items: string[] };
type VisualTechBadge= { type: "techbadge";label?: string;tags: string[] };
type SceneVisual    = VisualNone | VisualIcon | VisualKeyword | VisualCounter | VisualInfoTip | VisualTechBadge;

// ─────────────────────────────────────────────────────────────
// 씬 플랜: scene_plan.json에서 동적으로 로드
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN = scenePlanRaw as Array<{ id: number; visuals: SceneVisual[] }>;

// ─────────────────────────────────────────────────────────────
// 타임라인 빌더: 문장 시간을 visuals 수만큼 균등 분배
// ─────────────────────────────────────────────────────────────
interface TimelineItem {
  from_ms: number;
  to_ms: number;
  visual: SceneVisual;
}

function buildTimeline(): TimelineItem[] {
  const planMap = new Map(SCENE_PLAN.map((p) => [p.id, p.visuals]));
  const timeline: TimelineItem[] = [];

  for (const sentence of syncData.sentences) {
    const visuals = planMap.get(sentence.id) ?? [{ type: "none" as const }];
    const duration = sentence.end_ms - sentence.start_ms;
    const seg = duration / visuals.length;

    visuals.forEach((visual, i) => {
      if (visual.type === "none") return;
      timeline.push({
        from_ms: sentence.start_ms + i * seg,
        to_ms:   sentence.start_ms + (i + 1) * seg,
        visual,
      });
    });
  }
  return timeline;
}

const TIMELINE = buildTimeline();

// ─────────────────────────────────────────────────────────────
// 숫자 포매터
// ─────────────────────────────────────────────────────────────
function fmt(value: number): string {
  const abs = Math.abs(value);
  const s = value < 0 ? "-" : "";
  if (abs >= 100000000000) return `${s}${Math.round(abs / 100000000000) * 1000}억`;
  if (abs >= 100000000)    return `${s}${Math.round(abs / 100000000)}억`;
  if (abs >= 10000)        return `${s}${Math.round(abs / 10000)}만`;
  return `${s}${Math.round(abs).toLocaleString()}`;
}

// ─────────────────────────────────────────────────────────────
// 공통 팝인 훅
// ─────────────────────────────────────────────────────────────
function usePopIn(durationInFrames: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame, config: { damping: 14, stiffness: 130 } });
  const opacity = interpolate(
    frame,
    [0, 6, durationInFrames - 8, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return { scale, opacity };
}

const CENTER: React.CSSProperties = {
  position: "absolute", left: "50%", top: "38%",
  transform: "translate(-50%, -50%)",
  textAlign: "center",
};

// ─────────────────────────────────────────────────────────────
// SceneIcon
// ─────────────────────────────────────────────────────────────
const SceneIcon: React.FC<{ v: VisualIcon; dur: number }> = ({ v, dur }) => {
  const { scale, opacity } = usePopIn(dur);
  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div style={{ fontSize: 130 }}>{v.emoji}</div>
      {v.label && (
        <div style={{
          fontSize: 28, fontWeight: 600, marginTop: 10,
          color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em",
          fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
        }}>{v.label}</div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneKeyword
// ─────────────────────────────────────────────────────────────
const SceneKeyword: React.FC<{ v: VisualKeyword; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame, config: { damping: 12, stiffness: 180 } });
  const opacity = interpolate(frame, [0, 5, dur - 8, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const color = v.color ?? "#7bb4ff";
  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})`, whiteSpace: "nowrap" }}>
      <span style={{
        fontSize: 96, fontWeight: 900, color,
        fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
        letterSpacing: "-0.03em",
        textShadow: `0 0 80px ${color}55, 0 4px 16px rgba(0,0,0,0.5)`,
      }}>{v.text}</span>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneCounter
// ─────────────────────────────────────────────────────────────
const SceneCounter: React.FC<{ v: VisualCounter; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const RAMP = Math.min(50, dur - 10);
  const progress = interpolate(frame, [0, RAMP], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 6, dur - 8, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - progress, 3);
  const value = v.from + (v.to - v.from) * eased;

  return (
    <div style={{ ...CENTER, opacity }}>
      <div style={{
        fontSize: 120, fontWeight: 900, lineHeight: 1,
        fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
        background: "linear-gradient(135deg, #fff 20%, #7bb4ff 80%)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        letterSpacing: "-0.04em",
      }}>
        {fmt(value)}
        <span style={{ fontSize: 44, marginLeft: 8 }}>{v.suffix}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneInfoTip
// ─────────────────────────────────────────────────────────────
const SceneInfoTip: React.FC<{ v: VisualInfoTip; dur: number }> = ({ v, dur }) => {
  const { scale, opacity } = usePopIn(dur);
  return (
    <div style={{
      ...CENTER, opacity,
      transform: `translate(-50%, -50%) scale(${scale})`,
      width: 580,
    }}>
      <div style={{
        padding: "28px 36px", borderRadius: 20,
        background: "rgba(10,10,20,0.72)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
      }}>
        {/* 타이틀 */}
        <div style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.5)", textTransform: "uppercase",
          fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
          marginBottom: 14,
        }}>{v.title}</div>
        {/* 구분선 */}
        <div style={{
          height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 18,
        }} />
        {/* 아이템 */}
        {v.items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 12,
            marginBottom: i < v.items.length - 1 ? 12 : 0,
          }}>
            <div style={{
              width: 4, height: 28, borderRadius: 2, flexShrink: 0,
              background: "linear-gradient(180deg, #7bb4ff, #a855f7)",
            }} />
            <span style={{
              fontSize: 26, fontWeight: 500, color: "rgba(255,255,255,0.88)",
              fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
            }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneTechBadge
// ─────────────────────────────────────────────────────────────
const SceneTechBadge: React.FC<{ v: VisualTechBadge; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...CENTER, opacity, width: 800 }}>
      {v.label && (
        <div style={{
          fontSize: 22, fontWeight: 600, letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
          fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
          marginBottom: 20,
        }}>{v.label}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {v.tags.map((tag, i) => {
          const delay = i * 4;
          const tagScale = spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 14, stiffness: 150 } });
          return (
            <div key={i} style={{
              transform: `scale(${tagScale})`,
              padding: "10px 28px", borderRadius: 100,
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              backdropFilter: "blur(8px)",
              fontSize: 26, fontWeight: 600, color: "rgba(255,255,255,0.9)",
              fontFamily: "'SF Mono','Courier New',monospace",
              letterSpacing: "-0.01em",
            }}>{tag}</div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneRenderer: TIMELINE을 Sequence로 변환
// ─────────────────────────────────────────────────────────────
const SceneRenderer: React.FC = () => {
  const { fps } = useVideoConfig();
  return (
    <>
      {TIMELINE.map((item, i) => {
        const fromFrame = Math.floor((item.from_ms / 1000) * fps);
        const dur = Math.max(10, Math.floor(((item.to_ms - item.from_ms) / 1000) * fps));
        const v = item.visual;
        return (
          <Sequence key={i} from={fromFrame} durationInFrames={dur}>
            {v.type === "icon"      && <SceneIcon      v={v} dur={dur} />}
            {v.type === "keyword"   && <SceneKeyword   v={v} dur={dur} />}
            {v.type === "counter"   && <SceneCounter   v={v} dur={dur} />}
            {v.type === "infotip"   && <SceneInfoTip   v={v} dur={dur} />}
            {v.type === "techbadge" && <SceneTechBadge v={v} dur={dur} />}
          </Sequence>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// 인트로
// ─────────────────────────────────────────────────────────────
const IntroOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame, config: { damping: 20, stiffness: 80 } });
  const opacity = interpolate(frame, [0, fps * 0.4, fps * 1.6, fps * 2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center", opacity,
    }}>
      <div style={{ transform: `scale(${scale})`, textAlign: "center" }}>
        <div style={{
          fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.55)",
          letterSpacing: "0.3em",
          fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
          marginBottom: 16,
        }}>바이브 코더</div>
        <div style={{
          width: 60, height: 2, margin: "0 auto",
          background: "linear-gradient(90deg,transparent,#7bb4ff,transparent)",
        }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────────────────────
export const MainVideo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Visuals progress={progress} />
      <Audio src={staticFile("audio.mp3")} />

      <Sequence from={0} durationInFrames={fps * 2}>
        <IntroOverlay />
      </Sequence>

      <SceneRenderer />
      <Subtitle sentences={syncData.sentences} />

      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 3,
        width: `${progress * 100}%`,
        background: "linear-gradient(90deg,#4a9eff,#a855f7)",
        opacity: 0.6,
      }} />
    </div>
  );
};
