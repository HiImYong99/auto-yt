import React from "react";
import {
  Audio, Sequence, useVideoConfig, useCurrentFrame,
  interpolate, spring, staticFile,
} from "remotion";
import { SyncData } from "../types";
import { Visuals } from "./Visuals";
import { Subtitle } from "./Subtitle";
import syncDataRaw from "../data/sync_data.json";

const syncData = syncDataRaw as SyncData;

// ─────────────────────────────────────────────────────────────
// Design Tokens — IDE Dark Theme
// ─────────────────────────────────────────────────────────────
const TEXT    = "#F3F4F6";
const MUTED   = "#9CA3AF";
const ACCENT  = "#61DAFB";   // Cyan — 메인 강조
const ACCENT2 = "#A855F7";   // Purple — 서브 강조
const GREEN   = "#10B981";
const RED     = "#EF4444";
const SURFACE = "#161B22";
const BORDER  = "rgba(255,255,255,0.08)";
const FONT    = "'Pretendard','Noto Sans KR',sans-serif";
const MONO    = "'Fira Code','JetBrains Mono','SF Mono',monospace";

// ─────────────────────────────────────────────────────────────
// 시각 요소 타입 (color 필드는 하위 호환용, 렌더링에서 무시)
// ─────────────────────────────────────────────────────────────
type VisualNone        = { type: "none" };
type VisualIcon        = { type: "icon";        emoji: string; label?: string };
type VisualKeyword     = { type: "keyword";      text: string;  color?: string };
type VisualCounter     = { type: "counter";      from: number;  to: number; suffix: string };
type VisualInfoTip     = { type: "infotip";      title: string; items: string[] };
type VisualTechBadge   = { type: "techbadge";    label?: string; tags: string[] };
type VisualDonut       = { type: "donut";        value: number; label: string; sublabel?: string; color?: string };
type VisualBarChart    = { type: "barchart";     title?: string; bars: { label: string; value: number; color?: string }[]; maxValue?: number };
type VisualLineChart   = { type: "linechart";    title?: string; points: { label: string; value: number }[]; color?: string; unit?: string };
type VisualCallout     = { type: "callout";      text: string; sub?: string; color?: string };
type VisualSplit       = { type: "split";        emoji: string; title: string; items: string[]; color?: string };
type VisualFeatureCard = { type: "featurecard";  icon: string; title: string; sub?: string };
type VisualMockup      = { type: "mockup";       device: "phone" | "monitor"; lines?: string[] };
type VisualArrow       = { type: "arrow";        label?: string };

type SceneVisual =
  | VisualNone | VisualIcon | VisualKeyword | VisualCounter
  | VisualInfoTip | VisualTechBadge
  | VisualDonut | VisualBarChart | VisualLineChart
  | VisualCallout | VisualSplit
  | VisualFeatureCard | VisualMockup | VisualArrow;

import scenePlanRaw from "../data/scene_plan.json";

const SCENE_PLAN = scenePlanRaw as Array<{ id: number; visuals: SceneVisual[] }>;

// ─────────────────────────────────────────────────────────────
// 타임라인 빌더
// ─────────────────────────────────────────────────────────────
interface TimelineItem { from_ms: number; to_ms: number; visual: SceneVisual }

function buildTimeline(): TimelineItem[] {
  const planMap = new Map(SCENE_PLAN.map((p) => [p.id, p.visuals]));
  const timeline: TimelineItem[] = [];
  for (const sentence of syncData.sentences) {
    const visuals = planMap.get(sentence.id) ?? [{ type: "none" as const }];
    const seg = (sentence.end_ms - sentence.start_ms) / visuals.length;
    visuals.forEach((visual, i) => {
      if (visual.type === "none") return;
      timeline.push({
        from_ms: sentence.start_ms + i * seg,
        to_ms:   sentence.start_ms + (i + 1) * seg,
        visual,
      });
    });
  }

  // 씬 사이 갭(최대 2500ms)을 채워 비주얼이 자연스럽게 유지되게 함
  for (let i = 0; i < timeline.length - 1; i++) {
    const gap = timeline[i + 1].from_ms - timeline[i].to_ms;
    if (gap > 0 && gap <= 2500) {
      timeline[i].to_ms = timeline[i + 1].from_ms;
    }
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
  if (abs >= 100000000) return `${s}${Math.round(abs / 100000000)}억`;
  if (abs >= 10000)     return `${s}${Math.round(abs / 10000)}만`;
  return `${s}${Math.round(abs).toLocaleString()}`;
}

// ─────────────────────────────────────────────────────────────
// useSlideUp — 핵심 모션 훅 (slide-up + fade + spring)
// ─────────────────────────────────────────────────────────────
function useSlideUp(delay = 0, totalDur = 90) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const safeDur = Math.max(totalDur, 25);
  // 짧은 씬(≤45f)은 fade-in만 (깜빡임 방지), 긴 씬은 fade-out 포함
  const opacity = safeDur <= 45
    ? interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    : interpolate(f, [0, 8, safeDur - 12, safeDur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const sp = spring({ fps, frame: f, config: { damping: 18, stiffness: 160 } });
  const translateY = interpolate(sp, [0, 1], [22, 0]);
  return { opacity, translateY };
}

// 중앙 위치 (top 38%)
const WRAP: React.CSSProperties = {
  position: "absolute", left: "50%", top: "38%",
  textAlign: "center",
};

// ─────────────────────────────────────────────────────────────
// SceneIcon
// ─────────────────────────────────────────────────────────────
const SceneIcon: React.FC<{ v: VisualIcon; dur: number }> = ({ v, dur }) => {
  const { opacity, translateY } = useSlideUp(0, dur);
  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <div style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 200, height: 200, borderRadius: "50%",
          background: SURFACE, border: `1px solid ${ACCENT}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 96,
          boxShadow: `0 0 48px ${ACCENT}18, 0 24px 60px rgba(0,0,0,0.5)`,
        }}>
          {v.emoji}
        </div>
        {v.label && (
          <div style={{ fontSize: 28, fontWeight: 600, color: MUTED, fontFamily: FONT, letterSpacing: "0.04em" }}>
            {v.label}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneKeyword
// ─────────────────────────────────────────────────────────────
const SceneKeyword: React.FC<{ v: VisualKeyword; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const lineW = interpolate(frame, [8, 30], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, whiteSpace: "nowrap" }}>
      <div style={{
        fontSize: 96, fontWeight: 900, color: TEXT,
        fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1.12,
      }}>
        {v.text}
      </div>
      <div style={{
        height: 4, borderRadius: 2, marginTop: 18, marginLeft: "auto", marginRight: "auto",
        background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
        width: `${lineW}%`,
        boxShadow: `0 0 22px ${ACCENT}66`,
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneCounter
// ─────────────────────────────────────────────────────────────
const SceneCounter: React.FC<{ v: VisualCounter; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(52, dur - 10);
  const eased = 1 - Math.pow(1 - interpolate(frame, [0, RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);
  const value = v.from + (v.to - v.from) * eased;

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "center" }}>
        <span style={{
          fontSize: 160, fontWeight: 900, color: TEXT,
          fontFamily: FONT, letterSpacing: "-0.05em", lineHeight: 1,
        }}>
          {fmt(value)}
        </span>
        <span style={{
          fontSize: 48, fontWeight: 700, color: ACCENT,
          fontFamily: FONT,
          textShadow: `0 0 40px ${ACCENT}66`,
        }}>
          {v.suffix}
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneInfoTip
// ─────────────────────────────────────────────────────────────
const SceneInfoTip: React.FC<{ v: VisualInfoTip; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity: opCard, translateY: tyCard } = useSlideUp(0, dur);

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${tyCard}px))`, opacity: opCard, width: 780 }}>
      <div style={{
        padding: "40px 52px", borderRadius: 24,
        background: SURFACE, border: `1px solid ${BORDER}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        textAlign: "left",
      }}>
        <div style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "0.16em",
          color: MUTED, textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 20,
        }}>{v.title}</div>
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
        {v.items.map((item, i) => {
          const delay = i * 7;
          const f = Math.max(0, frame - delay);
          const itemOp = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 180 } });
          const ty = interpolate(sp, [0, 1], [22, 0]);
          const accentCol = i % 2 === 0 ? ACCENT : ACCENT2;
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 18,
              marginBottom: i < v.items.length - 1 ? 22 : 0,
              opacity: itemOp, transform: `translateY(${ty}px)`,
            }}>
              <div style={{
                width: 4, height: 34, borderRadius: 2, flexShrink: 0,
                background: accentCol, boxShadow: `0 0 10px ${accentCol}66`,
              }} />
              <span style={{ fontSize: 32, fontWeight: 500, color: TEXT, fontFamily: FONT }}>{item}</span>
            </div>
          );
        })}
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
  const { opacity, translateY } = useSlideUp(0, dur);

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, width: 900 }}>
      {v.label && (
        <div style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "0.18em",
          color: MUTED, textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 22,
        }}>{v.label}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {v.tags.map((tag, i) => {
          const delay = i * 6;
          const f = Math.max(0, frame - delay);
          const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 180 } });
          const ty = interpolate(sp, [0, 1], [24, 0]);
          const tagOp = interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const tagCol = [ACCENT, ACCENT2, GREEN, RED][i % 4];
          return (
            <div key={i} style={{
              opacity: tagOp, transform: `translateY(${ty}px)`,
              padding: "12px 30px", borderRadius: 100,
              background: `${tagCol}10`,
              border: `1px solid ${tagCol}44`,
              fontSize: 26, fontWeight: 700, color: tagCol,
              fontFamily: MONO,
              letterSpacing: "0.02em",
            }}>{tag}</div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneDonut
// ─────────────────────────────────────────────────────────────
const SceneDonut: React.FC<{ v: VisualDonut; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(60, dur - 10);
  const eased = 1 - Math.pow(1 - interpolate(frame, [0, RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);

  const size = 380, cx = 190, cy = 190, radius = 148, strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (v.value / 100) * eased;

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={SURFACE} strokeWidth={strokeWidth} />
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={ACCENT} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference - filled}
            style={{ filter: `drop-shadow(0 0 12px ${ACCENT}88)` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 96, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
            {Math.round(v.value * eased)}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: TEXT, fontFamily: FONT, marginTop: 8 }}>{v.label}</div>
      {v.sublabel && (
        <div style={{ fontSize: 22, color: MUTED, fontFamily: FONT, marginTop: 6 }}>{v.sublabel}</div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneBarChart
// ─────────────────────────────────────────────────────────────
const SceneBarChart: React.FC<{ v: VisualBarChart; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(55, dur - 10);
  const maxVal = v.maxValue ?? Math.max(...v.bars.map((b) => b.value));
  const BAR_H = 56;

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, width: 860 }}>
      {v.title && (
        <div style={{
          fontSize: 22, fontWeight: 700, letterSpacing: "0.14em",
          color: MUTED, textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 28,
        }}>{v.title}</div>
      )}
      <div style={{
        background: SURFACE, borderRadius: 24,
        border: `1px solid ${BORDER}`,
        padding: "32px 40px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
      }}>
        {v.bars.map((bar, i) => {
          const isLast = i === v.bars.length - 1;
          const delay = i * 7;
          const barEased = 1 - Math.pow(1 - interpolate(frame, [delay, delay + RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);
          const barW = (bar.value / maxVal) * 560 * barEased;
          const barColor = isLast ? ACCENT : "rgba(255,255,255,0.18)";

          return (
            <div key={i} style={{ marginBottom: isLast ? 0 : 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 500, color: TEXT, fontFamily: FONT }}>{bar.label}</span>
                <span style={{
                  fontSize: 30, fontWeight: 900,
                  color: isLast ? ACCENT : MUTED,
                  fontFamily: FONT, opacity: barEased,
                  textShadow: isLast ? `0 0 20px ${ACCENT}77` : "none",
                }}>{bar.value}</span>
              </div>
              <div style={{ width: "100%", height: BAR_H, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{
                  width: barW, height: "100%", borderRadius: 10,
                  background: barColor,
                  boxShadow: isLast ? `0 0 24px ${ACCENT}55` : "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneLineChart
// ─────────────────────────────────────────────────────────────
const SceneLineChart: React.FC<{ v: VisualLineChart; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(60, dur - 10);
  const eased = 1 - Math.pow(1 - interpolate(frame, [0, RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);

  const W = 840, H = 280;
  const PAD = { top: 28, right: 48, bottom: 60, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...v.points.map((p) => p.value));
  const pts = v.points.map((p, i) => ({
    x: PAD.left + (i / (v.points.length - 1)) * innerW,
    y: PAD.top + (1 - p.value / maxVal) * innerH,
    value: p.value, label: p.label,
  }));
  const totalLength = pts.slice(1).reduce((acc, pt, i) => {
    const prev = pts[i];
    return acc + Math.sqrt(Math.pow(pt.x - prev.x, 2) + Math.pow(pt.y - prev.y, 2));
  }, 0);
  const dashOffset = totalLength * (1 - eased);
  const visiblePts = pts.filter((_, i) => i / (pts.length - 1) <= eased + 0.001);

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, width: W }}>
      {v.title && (
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", fontFamily: FONT, marginBottom: 20 }}>{v.title}</div>
      )}
      <div style={{ background: SURFACE, borderRadius: 24, border: `1px solid ${BORDER}`, padding: "24px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <svg width={W - 56} height={H} style={{ overflow: "visible" }}>
          {[0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1={PAD.left} y1={PAD.top + (1 - t) * innerH} x2={PAD.left + innerW} y2={PAD.top + (1 - t) * innerH}
              stroke={BORDER} strokeWidth={1} />
          ))}
          <clipPath id="lineClip">
            <rect x={0} y={0} width={(PAD.left + innerW * eased) + 10} height={H} />
          </clipPath>
          <defs>
            <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.18} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d={[`M ${pts[0].x} ${PAD.top + innerH}`, ...pts.map((p) => `L ${p.x} ${p.y}`), `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`, "Z"].join(" ")}
            fill="url(#areaGrad2)" clipPath="url(#lineClip)"
          />
          <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={ACCENT} strokeWidth={3.5}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={totalLength} strokeDashoffset={dashOffset}
          />
          {visiblePts.map((pt, i) => {
            const isLast = i === visiblePts.length - 1;
            return (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={isLast ? 10 : 5}
                  fill={isLast ? ACCENT : SURFACE} stroke={ACCENT} strokeWidth={isLast ? 0 : 2.5}
                  style={{ filter: isLast ? `drop-shadow(0 0 10px ${ACCENT})` : "none" }}
                />
                <text x={pt.x} y={H - 6} textAnchor="middle" fontSize={18} fill={MUTED} fontFamily={FONT}>{pt.label}</text>
                {isLast && (
                  <text x={pt.x + 16} y={pt.y + 5} textAnchor="start" fontSize={28} fontWeight={900} fill={ACCENT} fontFamily={FONT}>
                    {pt.value}{v.unit ?? ""}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneCallout — 핵심 임팩트 카드
// ─────────────────────────────────────────────────────────────
const SceneCallout: React.FC<{ v: VisualCallout; dur: number }> = ({ v, dur }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const sp = spring({ fps, frame, config: { damping: 14, stiffness: 180 } });
  const scale = interpolate(sp, [0, 1], [0.92, 1]);
  const glow = 0.4 + 0.4 * Math.sin((frame / fps) * Math.PI * 2);
  // 텍스트 길이에 따라 폰트 자동 축소 (긴 문장이 자연스럽게 보이도록)
  const textLen = v.text.length;
  const fontSize = textLen <= 8 ? 86 : textLen <= 14 ? 68 : textLen <= 20 ? 56 : 46;

  return (
    <div style={{
      ...WRAP,
      transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
      opacity, width: 1020,
    }}>
      <div style={{
        padding: "56px 68px", borderRadius: 28,
        background: SURFACE,
        border: `1px solid rgba(97,218,251,${(0.15 + glow * 0.2).toFixed(2)})`,
        boxShadow: `0 0 ${24 + glow * 32}px rgba(97,218,251,0.07), 0 40px 90px rgba(0,0,0,0.6)`,
        position: "relative", textAlign: "center",
      }}>
        {/* Gradient left bar */}
        <div style={{
          position: "absolute", left: 0, top: "15%", bottom: "15%",
          width: 4, borderRadius: "0 4px 4px 0",
          background: `linear-gradient(180deg, ${ACCENT}, ${ACCENT2})`,
          boxShadow: `0 0 20px ${ACCENT}55`,
        }} />

        <div style={{
          fontSize, fontWeight: 900, color: TEXT,
          fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1.25,
          wordBreak: "keep-all",
        }}>
          {v.text}
        </div>
        {v.sub && (
          <div style={{
            fontSize: 28, color: MUTED,
            fontFamily: FONT, marginTop: 22, letterSpacing: "0.02em",
          }}>
            {v.sub}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneSplit — 좌우 분할 패널
// ─────────────────────────────────────────────────────────────
const SceneSplit: React.FC<{ v: VisualSplit; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, translateY } = useSlideUp(0, dur);

  return (
    <div style={{
      position: "absolute", left: "50%", top: "38%",
      transform: `translate(-50%, calc(-50% + ${translateY}px))`,
      opacity, width: 1000,
    }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        background: SURFACE, borderRadius: 24,
        border: `1px solid ${BORDER}`,
        overflow: "hidden",
        boxShadow: "0 28px 72px rgba(0,0,0,0.5)",
      }}>
        {/* Left */}
        <div style={{
          width: 240, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "44px 28px",
          borderRight: `1px solid ${BORDER}`,
        }}>
          <div style={{ fontSize: 88 }}>{v.emoji}</div>
          <div style={{
            fontSize: 18, fontWeight: 700, letterSpacing: "0.1em",
            color: MUTED, textTransform: "uppercase",
            fontFamily: FONT, marginTop: 16, textAlign: "center", lineHeight: 1.5,
          }}>{v.title}</div>
        </div>
        {/* Right */}
        <div style={{ flex: 1, padding: "36px 44px 36px 40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          {v.items.map((item, i) => {
            const delay = i * 9;
            const f = Math.max(0, frame - delay);
            const iOp = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 180 } });
            const tx = interpolate(sp, [0, 1], [-28, 0]);
            const dotCol = i % 2 === 0 ? ACCENT : ACCENT2;
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 18,
                opacity: iOp, transform: `translateX(${tx}px)`,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: dotCol, boxShadow: `0 0 8px ${dotCol}`,
                }} />
                <span style={{ fontSize: 28, fontWeight: 500, color: TEXT, fontFamily: FONT }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneFeatureCard — 신규: 아이콘 + 제목 카드 (standalone)
// ─────────────────────────────────────────────────────────────
const SceneFeatureCard: React.FC<{ v: VisualFeatureCard; dur: number }> = ({ v, dur }) => {
  const { opacity, translateY } = useSlideUp(0, dur);
  return (
    <div style={{
      ...WRAP,
      transform: `translate(-50%, calc(-50% + ${translateY}px))`,
      opacity, width: 640,
    }}>
      <div style={{
        padding: "52px 60px", borderRadius: 28,
        background: SURFACE, border: `1px solid ${BORDER}`,
        boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20,
        textAlign: "left",
      }}>
        <div style={{ fontSize: 72 }}>{v.icon}</div>
        <div style={{ fontSize: 52, fontWeight: 800, color: TEXT, fontFamily: FONT, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{v.title}</div>
        {v.sub && (
          <div style={{ fontSize: 26, color: MUTED, fontFamily: FONT, lineHeight: 1.6 }}>{v.sub}</div>
        )}
        <div style={{
          height: 4, width: 56, borderRadius: 2,
          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
          boxShadow: `0 0 16px ${ACCENT}66`,
        }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneMockup — 신규: 미니멀 기기 목업 (phone | monitor)
// ─────────────────────────────────────────────────────────────
const SceneMockup: React.FC<{ v: VisualMockup; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, translateY } = useSlideUp(0, dur);

  if (v.device === "phone") {
    const W = 240, H = 440;
    const lines = v.lines ?? ["안녕하세요.", "무엇을 도와드릴까요?", "지금 바로 답변드립니다."];
    return (
      <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Shell */}
          <rect x={2} y={2} width={W - 4} height={H - 4} rx={32} ry={32}
            fill="#1A1A1A" stroke={BORDER} strokeWidth={1.5} />
          {/* Notch */}
          <rect x={W / 2 - 30} y={10} width={60} height={14} rx={7} fill="#2A2A2A" />
          {/* Screen area */}
          <rect x={14} y={38} width={W - 28} height={H - 80} rx={8} fill="#151515" />
          {/* Chat lines */}
          {lines.map((line, i) => {
            const delay = i * 10;
            const f = Math.max(0, frame - delay);
            const lineOp = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sp2 = spring({ fps, frame: f, config: { damping: 18, stiffness: 140 } });
            const ty2 = interpolate(sp2, [0, 1], [12, 0]);
            const isUser = i % 2 === 0;
            const bubbleW = Math.min(140, line.length * 7 + 20);
            const bx = isUser ? W - 14 - 14 - bubbleW : 14 + 14;
            const by = 54 + i * 76;
            return (
              <g key={i} style={{ opacity: lineOp, transform: `translateY(${ty2}px)` }}>
                <rect x={bx} y={by} width={bubbleW} height={54} rx={14}
                  fill={isUser ? ACCENT : "#2C2C2C"} />
                <foreignObject x={bx + 8} y={by + 8} width={bubbleW - 16} height={38}>
                  <div style={{
                    fontSize: 13, color: isUser ? "#fff" : MUTED,
                    fontFamily: FONT, lineHeight: "18px",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    {line}
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {/* Home bar */}
          <rect x={W / 2 - 40} y={H - 20} width={80} height={5} rx={3} fill="#333" />
        </svg>
      </div>
    );
  }

  // Monitor
  const W = 720, H = 440, BEZ = 16;
  const lines = v.lines ?? ["처리 중...", "오디오 생성 완료 ✓", "스트리밍 시작 →"];
  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <svg width={W} height={H + 60} viewBox={`0 0 ${W} ${H + 60}`}>
        {/* Monitor shell */}
        <rect x={2} y={2} width={W - 4} height={H - 4} rx={BEZ} fill="#1A1A1A" stroke={BORDER} strokeWidth={1.5} />
        {/* Screen */}
        <rect x={18} y={18} width={W - 36} height={H - 36} rx={8} fill="#111" />
        {/* Stand */}
        <rect x={W / 2 - 40} y={H - 2} width={80} height={40} rx={4} fill="#1A1A1A" stroke={BORDER} strokeWidth={1} />
        <rect x={W / 2 - 90} y={H + 36} width={180} height={12} rx={6} fill="#1A1A1A" stroke={BORDER} strokeWidth={1} />
        {/* Terminal lines */}
        {lines.map((line, i) => {
          const delay = i * 12;
          const f = Math.max(0, frame - delay);
          const lineOp = interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <text key={i} x={42} y={70 + i * 44} opacity={lineOp}
              fontSize={20} fontFamily="'SF Mono','Fira Code',monospace"
              fill={i === lines.length - 1 ? ACCENT : MUTED}
            >
              <tspan fill={ACCENT}>❯ </tspan>{line}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneArrow — 신규: 점진적으로 그려지는 선 애니메이션
// ─────────────────────────────────────────────────────────────
const SceneArrow: React.FC<{ v: VisualArrow; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const progress = interpolate(frame, [8, Math.min(50, dur - 10)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const W = 640, H = 80;
  const lineLen = 540;
  const dashOffset = lineLen * (1 - progress);
  const arrowOp = interpolate(progress, [0.85, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <line x1={50} y1={H / 2} x2={590} y2={H / 2}
          stroke={ACCENT} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={lineLen} strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${ACCENT}99)` }}
        />
        {/* Arrowhead */}
        <polygon points="590,30 620,40 590,50" fill={ACCENT} opacity={arrowOp}
          style={{ filter: `drop-shadow(0 0 8px ${ACCENT}99)` }}
        />
        {v.label && (
          <text x={W / 2} y={H / 2 - 18} textAnchor="middle"
            fontSize={20} fontFamily={FONT} fill={MUTED} opacity={arrowOp}
          >{v.label}</text>
        )}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneRenderer
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
            {v.type === "icon"        && <SceneIcon        v={v} dur={dur} />}
            {v.type === "keyword"     && <SceneKeyword     v={v} dur={dur} />}
            {v.type === "counter"     && <SceneCounter     v={v} dur={dur} />}
            {v.type === "infotip"     && <SceneInfoTip     v={v} dur={dur} />}
            {v.type === "techbadge"   && <SceneTechBadge   v={v} dur={dur} />}
            {v.type === "donut"       && <SceneDonut       v={v} dur={dur} />}
            {v.type === "barchart"    && <SceneBarChart    v={v} dur={dur} />}
            {v.type === "linechart"   && <SceneLineChart   v={v} dur={dur} />}
            {v.type === "callout"     && <SceneCallout     v={v} dur={dur} />}
            {v.type === "split"       && <SceneSplit       v={v} dur={dur} />}
            {v.type === "featurecard" && <SceneFeatureCard v={v} dur={dur} />}
            {v.type === "mockup"      && <SceneMockup      v={v} dur={dur} />}
            {v.type === "arrow"       && <SceneArrow       v={v} dur={dur} />}
          </Sequence>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// IntroOverlay
// ─────────────────────────────────────────────────────────────
const IntroOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.5, fps * 1.5, fps * 2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sp = spring({ fps, frame, config: { damping: 22, stiffness: 85 } });
  const translateY = interpolate(sp, [0, 1], [30, 0]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity,
    }}>
      <div style={{ transform: `translateY(${translateY}px)`, textAlign: "center" }}>
        <div style={{
          fontSize: 24, fontWeight: 700, color: MUTED,
          letterSpacing: "0.3em", fontFamily: MONO, marginBottom: 20,
          textTransform: "uppercase",
        }}>
          바이브빌더
        </div>
        <div style={{
          width: 56, height: 3, margin: "0 auto", borderRadius: 2,
          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
          boxShadow: `0 0 12px ${ACCENT}66`,
        }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// OutroOverlay
// ─────────────────────────────────────────────────────────────
const OutroOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const dur = fps * 3;
  const opacity = interpolate(frame, [0, fps * 0.8, dur - fps * 0.3, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sp = spring({ fps, frame, config: { damping: 22, stiffness: 85 } });
  const translateY = interpolate(sp, [0, 1], [20, 0]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: `linear-gradient(180deg, transparent 0%, rgba(13,17,23,0.85) 100%)`,
      opacity,
    }}>
      <div style={{ transform: `translateY(${translateY}px)`, textAlign: "center" }}>
        <div style={{
          fontSize: 20, fontWeight: 600, color: MUTED,
          letterSpacing: "0.2em", fontFamily: MONO, marginBottom: 16,
          textTransform: "uppercase",
        }}>
          감사합니다
        </div>
        <div style={{
          width: 40, height: 3, margin: "0 auto", borderRadius: 2,
          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
          boxShadow: `0 0 12px ${ACCENT}66`,
          marginBottom: 20,
        }} />
        <div style={{
          fontSize: 16, fontWeight: 500, color: `${MUTED}99`,
          fontFamily: FONT, letterSpacing: "0.1em",
        }}>
          구독 · 좋아요 · 알림 설정
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MainVideo
// ─────────────────────────────────────────────────────────────
export const MainVideo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Visuals progress={progress} />
      <Audio src={staticFile("audio.mp3")} volume={11.3} />

      <Sequence from={0} durationInFrames={fps * 2}>
        <IntroOverlay />
      </Sequence>

      <SceneRenderer />
      <Subtitle sentences={syncData.sentences} />

      {/* 아웃트로 — 마지막 3초 */}
      <Sequence from={durationInFrames - fps * 3} durationInFrames={fps * 3}>
        <OutroOverlay />
      </Sequence>

      {/* 하단 프로그레스 바 — Cyan→Purple 그라데이션 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0, height: 3,
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          width: `${progress * 100}%`, height: "100%",
          background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})`,
          boxShadow: `0 0 10px ${ACCENT}66`,
        }} />
      </div>
    </div>
  );
};
