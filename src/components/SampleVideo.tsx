import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from "remotion";

// ─────────────────────────────────────────────────────────────
// Design Tokens
// ─────────────────────────────────────────────────────────────
const BG      = "#0D1117";
const SURFACE = "#161B22";
const TEXT    = "#F3F4F6";
const MUTED   = "#9CA3AF";
const CYAN    = "#61DAFB";
const PURPLE  = "#A855F7";
const RED     = "#EF4444";
const GREEN   = "#10B981";
const YELLOW  = "#F59E0B";
const BORDER  = "rgba(255,255,255,0.08)";
const FONT    = "'Pretendard','Noto Sans KR',sans-serif";
const MONO    = "'Fira Code','JetBrains Mono','SF Mono',monospace";

// ─────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────
const Background: React.FC = () => (
  <div style={{
    position: "absolute", inset: 0,
    background: "linear-gradient(135deg, #0D1117 0%, #141B2D 55%, #1A1F2E 100%)",
    overflow: "hidden",
  }}>
    <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.09 }}>
      <defs>
        <pattern id="g" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
          <path d="M 80 0 L 0 0 0 80" fill="none" stroke={CYAN} strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)" />
    </svg>
    <div style={{
      position: "absolute", inset: 0,
      background: "radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.75) 100%)",
    }} />
    <div style={{
      position: "absolute", width: 700, height: 700, left: -280, top: -280,
      background: `radial-gradient(circle, rgba(97,218,251,0.07) 0%, transparent 70%)`,
      borderRadius: "50%",
    }} />
    <div style={{
      position: "absolute", width: 800, height: 800, right: -320, bottom: -320,
      background: `radial-gradient(circle, rgba(168,85,247,0.06) 0%, transparent 70%)`,
      borderRadius: "50%",
    }} />
  </div>
);

// ─────────────────────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────────────────────
function useEntrance(delay = 0, dur = 90) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(
    f, [0, 10, Math.max(11, dur - 12), dur], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 180 } });
  const y = interpolate(sp, [0, 1], [40, 0]);
  return { opacity, y };
}

const MacDots: React.FC = () => (
  <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
    {[RED, YELLOW, GREEN].map((c, i) => (
      <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: c, opacity: 0.85 }} />
    ))}
  </div>
);

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.06)" }}>
      <div style={{
        width: `${(frame / total) * 100}%`, height: "100%",
        background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
        boxShadow: `0 0 10px ${CYAN}66`,
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// S1 — Hero Title  (0–130)
// ─────────────────────────────────────────────────────────────
const Scene1: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { opacity: o1, y: y1 } = useEntrance(0, dur);
  const { opacity: o2, y: y2 } = useEntrance(14, dur);
  const { opacity: o3, y: y3 } = useEntrance(28, dur);

  const cursor = Math.floor(frame / 18) % 2 === 0;
  const lineW = interpolate(frame, [22, 60], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36,
    }}>
      <div style={{
        opacity: o1, transform: `translateY(${y1}px)`,
        display: "flex", alignItems: "center", gap: 10,
        padding: "8px 22px", borderRadius: 100,
        border: `1px solid ${CYAN}40`, background: `${CYAN}0C`,
      }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: GREEN, boxShadow: `0 0 10px ${GREEN}` }} />
        <span style={{ fontSize: 17, color: CYAN, fontFamily: MONO, letterSpacing: "0.12em" }}>
          IDE Design System · 2026
        </span>
      </div>

      <div style={{ opacity: o2, transform: `translateY(${y2}px)`, textAlign: "center" }}>
        <div style={{ fontSize: 112, fontWeight: 900, color: TEXT, fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1.05 }}>
          개발자를 위한
        </div>
        <div style={{
          fontSize: 112, fontWeight: 900, fontFamily: FONT, letterSpacing: "-0.04em", lineHeight: 1.05,
          background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          영상 디자인{cursor ? "_" : "\u00A0"}
        </div>
        <div style={{
          height: 4, borderRadius: 2, marginTop: 22, marginInline: "auto",
          background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
          width: `${lineW}%`, boxShadow: `0 0 24px ${CYAN}55`,
        }} />
      </div>

      <div style={{
        opacity: o3, transform: `translateY(${y3}px)`,
        fontSize: 24, color: "#6A9955", fontFamily: MONO, fontStyle: "italic",
      }}>
        {'// Remotion · Spring Physics · IDE Aesthetic'}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// S2 — CodeBlock  (133–273)  ← IDE 적재적소 사용
// ─────────────────────────────────────────────────────────────
type LineKind = "normal" | "highlight" | "comment" | "empty";
const CODE_LINES: Array<{ code: string; kind: LineKind }> = [
  { code: "import { Qwen3TTS } from '@qwen/tts';",        kind: "normal"    },
  { code: "",                                              kind: "empty"     },
  { code: "const tts = new Qwen3TTS({",                   kind: "highlight" },
  { code: "  refAudio: 'ref_voice.wav',  // 목소리 클로닝", kind: "highlight" },
  { code: "  language: 'auto',          // 다국어 자동",    kind: "normal"    },
  { code: "  speed:    1.0,",                             kind: "normal"    },
  { code: "});",                                          kind: "normal"    },
  { code: "",                                              kind: "empty"     },
  { code: "// 텍스트 → 음성 변환",                          kind: "comment"   },
  { code: "const audio = await tts.generate(",            kind: "normal"    },
  { code: "  '안녕, 글로벌 세계여!'",                        kind: "highlight" },
  { code: ");",                                           kind: "normal"    },
];

function syntaxColor(code: string, kind: LineKind): React.ReactNode {
  if (kind === "comment") return <span style={{ color: "#6A9955", fontStyle: "italic" }}>{code}</span>;
  const parts = code.split(/(\bimport\b|\bconst\b|\bawait\b|\bnew\b|\bfrom\b|'[^']*'|\/\/[^\n]*)/g);
  return parts.filter(Boolean).map((p, i) => {
    if (/^(import|const|await|new|from)$/.test(p)) return <span key={i} style={{ color: PURPLE }}>{p}</span>;
    if (/^'/.test(p)) return <span key={i} style={{ color: "#CE9178" }}>{p}</span>;
    if (/^\/\//.test(p)) return <span key={i} style={{ color: "#6A9955", fontStyle: "italic" }}>{p}</span>;
    return <span key={i} style={{ color: TEXT }}>{p}</span>;
  });
}

const Scene2: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity: panelOp, y: panelY } = useEntrance(0, dur);
  const panelSp = spring({ fps, frame, config: { damping: 14, stiffness: 160 } });
  const panelScale = interpolate(panelSp, [0, 1], [0.94, 1]);

  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        opacity: panelOp, transform: `translateY(${panelY}px) scale(${panelScale})`,
        background: BG, border: `1px solid ${BORDER}`,
        borderRadius: 16, width: 940, overflow: "hidden",
        boxShadow: `0 40px 100px rgba(0,0,0,0.75), 0 0 0 1px ${BORDER}`,
      }}>
        {/* Title bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: "13px 20px",
          borderBottom: `1px solid ${BORDER}`, background: SURFACE,
        }}>
          <MacDots />
          <span style={{ marginLeft: 14, fontSize: 13, color: MUTED, fontFamily: MONO }}>generate_audio.py</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {["Python 3.11", "UTF-8"].map((t, i) => (
              <span key={i} style={{
                fontSize: 11, color: MUTED, padding: "2px 8px",
                border: `1px solid ${BORDER}`, borderRadius: 4, fontFamily: MONO,
              }}>{t}</span>
            ))}
          </div>
        </div>
        {/* Code */}
        <div style={{ padding: "18px 0" }}>
          {CODE_LINES.map((line, i) => {
            const f = Math.max(0, frame - i * 7);
            const lineOp = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 200 } });
            const lineX = interpolate(sp, [0, 1], [-16, 0]);
            const hl = line.kind === "highlight";
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", minHeight: 32,
                opacity: lineOp, transform: `translateX(${lineX}px)`,
                background: hl ? "rgba(97,218,251,0.07)" : "transparent",
                borderLeft: hl ? `3px solid ${CYAN}` : "3px solid transparent",
              }}>
                <span style={{ width: 52, textAlign: "right", paddingRight: 18, flexShrink: 0, fontSize: 13, color: "#3C4048", fontFamily: MONO }}>
                  {i + 1}
                </span>
                <span style={{ fontSize: 16, fontFamily: MONO }}>
                  {line.kind === "empty" ? "\u00A0" : syntaxColor(line.code, line.kind)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// S3 — Pipeline Flow  (276–406)  ← IDE 없음, 시각화
// ─────────────────────────────────────────────────────────────
const PIPELINE = [
  { icon: "🎙️", label: "목소리 샘플",    sub: "3초 녹음",      color: CYAN   },
  { icon: "🤖", label: "Qwen3-TTS",     sub: "로컬 추론",      color: PURPLE },
  { icon: "🌍", label: "글로벌 콘텐츠",  sub: "100+ 언어",     color: GREEN  },
];

const STATS = [
  { value: "0.1", unit: "초", label: "응답 속도",    color: CYAN   },
  { value: "3",   unit: "초", label: "목소리 클로닝", color: PURPLE },
  { value: "100", unit: "+",  label: "지원 언어",     color: GREEN  },
];

const Scene3: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity: titleOp, y: titleY } = useEntrance(0, dur);

  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 56,
    }}>
      {/* Title */}
      <div style={{ opacity: titleOp, transform: `translateY(${titleY}px)`, textAlign: "center" }}>
        <div style={{ fontSize: 22, color: MUTED, fontFamily: MONO, letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 12 }}>
          파이프라인
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, color: TEXT, fontFamily: FONT, letterSpacing: "-0.03em" }}>
          3초 만에{" "}
          <span style={{
            background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            목소리가 복제된다
          </span>
        </div>
      </div>

      {/* Flow nodes + arrows */}
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        {PIPELINE.map((node, i) => {
          const delay = i * 12;
          const f = Math.max(0, frame - delay);
          const nodeOp = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 180 } });
          const nodeY = interpolate(sp, [0, 1], [48, 0]);
          const nodeScale = interpolate(sp, [0, 1], [0.88, 1]);

          // Arrow progress (draws from node i to i+1)
          const arrowDelay = delay + 14;
          const arrowProgress = interpolate(
            Math.max(0, frame - arrowDelay), [0, 18], [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          return (
            <React.Fragment key={i}>
              {/* Node card */}
              <div style={{
                opacity: nodeOp, transform: `translateY(${nodeY}px) scale(${nodeScale})`,
                width: 280, padding: "36px 32px",
                background: `${node.color}0D`,
                border: `1px solid ${node.color}44`,
                borderRadius: 24, textAlign: "center",
                boxShadow: `0 0 40px ${node.color}18`,
              }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>{node.icon}</div>
                <div style={{ fontSize: 32, fontWeight: 800, color: TEXT, fontFamily: FONT, marginBottom: 8 }}>
                  {node.label}
                </div>
                <div style={{
                  display: "inline-block", padding: "4px 16px", borderRadius: 100,
                  background: `${node.color}22`, fontSize: 16, color: node.color, fontFamily: MONO,
                }}>
                  {node.sub}
                </div>
              </div>

              {/* Arrow */}
              {i < PIPELINE.length - 1 && (
                <svg width={100} height={60} viewBox="0 0 100 60" style={{ flexShrink: 0 }}>
                  <line
                    x1={8} y1={30} x2={78} y2={30}
                    stroke={MUTED} strokeWidth={2} strokeLinecap="round"
                    strokeDasharray={70} strokeDashoffset={70 * (1 - arrowProgress)}
                    style={{ filter: `drop-shadow(0 0 4px ${CYAN}88)` }}
                  />
                  <polygon
                    points="78,22 96,30 78,38"
                    fill={MUTED}
                    opacity={interpolate(arrowProgress, [0.75, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })}
                  />
                </svg>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Stat badges */}
      <div style={{ display: "flex", gap: 28 }}>
        {STATS.map((s, i) => {
          const delay = 40 + i * 8;
          const f = Math.max(0, frame - delay);
          const statOp = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sp = spring({ fps, frame: f, config: { damping: 14, stiffness: 180 } });
          const statY = interpolate(sp, [0, 1], [20, 0]);

          return (
            <div key={i} style={{
              opacity: statOp, transform: `translateY(${statY}px)`,
              display: "flex", flexDirection: "column", alignItems: "center",
              padding: "20px 44px",
              background: `${s.color}0A`,
              border: `1px solid ${s.color}33`,
              borderRadius: 18,
            }}>
              <div style={{ fontFamily: MONO, color: s.color, lineHeight: 1 }}>
                <span style={{ fontSize: 56, fontWeight: 900 }}>{s.value}</span>
                <span style={{ fontSize: 30, fontWeight: 700 }}>{s.unit}</span>
              </div>
              <div style={{ fontSize: 18, color: MUTED, fontFamily: FONT, marginTop: 8 }}>{s.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// S4 — Terminal  (409–539)  ← IDE 적재적소 사용
// ─────────────────────────────────────────────────────────────
const TERM_LINES: Array<{ prompt: string; text: string; type: "cmd" | "success" | "info" | "error" }> = [
  { prompt: "$ ", text: "conda activate qwen3-tts",                          type: "cmd"     },
  { prompt: "",   text: "(qwen3-tts) 환경 활성화 완료 ✓",                      type: "success" },
  { prompt: "$ ", text: "python scripts/generate_audio.py --channel vibe",    type: "cmd"     },
  { prompt: "",   text: "🎙️  Qwen3-TTS 모델 초기화 중...",                     type: "info"    },
  { prompt: "",   text: "✓  ref_voice.wav 로드 완료 (3.2s)",                  type: "success" },
  { prompt: "",   text: "⚡  음성 생성 중... [==========>] 100%",              type: "info"    },
  { prompt: "",   text: "✓  output/vibe/audio.mp3 저장 완료",                 type: "success" },
  { prompt: "",   text: "ERROR: rm -rf /  — 접근이 차단되었습니다",             type: "error"   },
];
const TERM_COLOR = { cmd: TEXT, success: GREEN, info: CYAN, error: RED } as const;

const Scene4: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const LINE_GAP = 17;
  const CHARS_PER_FRAME = 2.2;
  const errorStart = 7 * LINE_GAP;
  const hasError = frame > errorStart + 8;
  const pulseF = Math.max(0, frame - errorStart - 8);
  const pulse = hasError ? 0.5 + 0.5 * Math.sin((pulseF / fps) * Math.PI * 3.5) : 0;

  const { opacity, y } = useEntrance(0, dur);
  const sp = spring({ fps, frame, config: { damping: 14, stiffness: 150 } });
  const scale = interpolate(sp, [0, 1], [0.94, 1]);

  return (
    <div style={{
      position: "absolute", inset: 0, display: "flex",
      flexDirection: "column", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        opacity, transform: `translateY(${y}px) scale(${scale})`,
        width: 980, borderRadius: 16, overflow: "hidden",
        border: hasError
          ? `1px solid rgba(239,68,68,${(0.3 + pulse * 0.5).toFixed(2)})`
          : `1px solid ${BORDER}`,
        boxShadow: hasError
          ? `0 0 ${24 + pulse * 60}px rgba(239,68,68,${(0.15 + pulse * 0.35).toFixed(2)}), 0 40px 100px rgba(0,0,0,0.75)`
          : "0 40px 100px rgba(0,0,0,0.75)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10, padding: "13px 18px",
          borderBottom: `1px solid ${BORDER}`, background: SURFACE,
        }}>
          <MacDots />
          <span style={{ marginLeft: 10, fontSize: 13, color: MUTED, fontFamily: MONO }}>zsh — auto-yt</span>
          {hasError && (
            <span style={{
              marginLeft: "auto", fontSize: 12, color: RED,
              fontFamily: MONO, opacity: 0.7 + pulse * 0.3,
            }}>● 오류 감지됨</span>
          )}
        </div>
        <div style={{ background: "#0A0A0A", padding: "24px 28px", minHeight: 320 }}>
          {TERM_LINES.map((line, i) => {
            const f = Math.max(0, frame - i * LINE_GAP);
            const full = line.prompt + line.text;
            const shown = Math.min(full.length, Math.floor(f * CHARS_PER_FRAME));
            if (shown === 0) return null;
            const typing = shown < full.length;
            const color = TERM_COLOR[line.type];
            return (
              <div key={i} style={{
                fontSize: 17, fontFamily: MONO, color, lineHeight: 1.88, display: "flex", alignItems: "center",
              }}>
                <span>{full.slice(0, shown)}</span>
                {typing && (
                  <span style={{
                    display: "inline-block", width: 9, height: 18, background: color, marginLeft: 2,
                    opacity: Math.floor(frame / 14) % 2 === 0 ? 1 : 0,
                  }} />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// S5 — Keyword Pop  (542–642)  ← IDE 없음, 타이포 집중
// ─────────────────────────────────────────────────────────────
const TAGS = [
  { label: "무료",          color: CYAN   },
  { label: "로컬 실행",     color: GREEN  },
  { label: "오프라인",      color: PURPLE },
  { label: "목소리 클로닝",  color: RED    },
];

const Scene5: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const kwSp = spring({ fps, frame: Math.max(0, frame - 6), config: { damping: 12, stiffness: 200 } });
  const kwScale = interpolate(kwSp, [0, 1], [0.55, 1]);
  const kwOp = interpolate(frame, [0, 6, Math.max(7, dur - 12), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const blur = interpolate(kwOp, [0, 1], [0, 5]);

  const { opacity: tagOp, y: tagY } = useEntrance(28, dur);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* dim + blur overlay */}
      <div style={{
        position: "absolute", inset: 0,
        backdropFilter: `blur(${blur}px)`,
        background: `rgba(13,17,23,${kwOp * 0.5})`,
      }} />

      <div style={{
        position: "absolute", inset: 0, display: "flex",
        flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 48,
      }}>
        {/* Giant keyword */}
        <div style={{ opacity: kwOp, transform: `scale(${kwScale})`, textAlign: "center" }}>
          <div style={{
            fontSize: 172, fontWeight: 900, fontFamily: FONT, letterSpacing: "-0.05em", lineHeight: 1,
            background: `linear-gradient(135deg, ${CYAN} 0%, ${PURPLE} 100%)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            filter: `drop-shadow(0 0 80px ${CYAN}40)`,
          }}>
            오픈소스
          </div>
          <div style={{ fontSize: 66, fontWeight: 900, color: TEXT, fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1.2, marginTop: 8 }}>
            혁명
          </div>
        </div>

        {/* Tag row */}
        <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)`, display: "flex", gap: 18 }}>
          {TAGS.map((tag, i) => (
            <div key={i} style={{
              padding: "12px 28px", borderRadius: 100,
              border: `1px solid ${tag.color}55`,
              background: `${tag.color}0E`,
              fontSize: 22, fontWeight: 700, fontFamily: FONT, color: tag.color,
            }}>{tag.label}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// S6 — Closing  (645–720)
// ─────────────────────────────────────────────────────────────
const CORNERS: React.CSSProperties[] = [
  { top: 22, left: 22, borderTop: `2px solid ${CYAN}`, borderLeft: `2px solid ${CYAN}` },
  { top: 22, right: 22, borderTop: `2px solid ${CYAN}`, borderRight: `2px solid ${CYAN}` },
  { bottom: 22, left: 22, borderBottom: `2px solid ${CYAN}`, borderLeft: `2px solid ${CYAN}` },
  { bottom: 22, right: 22, borderBottom: `2px solid ${CYAN}`, borderRight: `2px solid ${CYAN}` },
];

const Scene6: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, y } = useEntrance(0, dur);
  const { opacity: subOp, y: subY } = useEntrance(18, dur);
  const sp = spring({ fps, frame, config: { damping: 12, stiffness: 180 } });
  const scale = interpolate(sp, [0, 1], [0.91, 1]);
  const glow = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2.2);

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        opacity, transform: `translateY(${y}px) scale(${scale})`,
        padding: "72px 96px",
        background: `rgba(97,218,251,0.04)`,
        border: `2px solid rgba(97,218,251,${(0.18 + glow * 0.32).toFixed(2)})`,
        borderRadius: 36, textAlign: "center", maxWidth: 1140,
        boxShadow: `0 0 ${40 + glow * 70}px rgba(97,218,251,0.08), 0 48px 120px rgba(0,0,0,0.75)`,
        position: "relative",
      }}>
        {CORNERS.map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 40, height: 40, ...s }} />
        ))}
        <div style={{ fontSize: 92, fontWeight: 900, fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1.15, color: TEXT }}>
          코드 한 줄이{" "}
          <span style={{
            background: `linear-gradient(90deg, ${CYAN}, ${PURPLE})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>세상을 바꾼다</span>
        </div>
        <div style={{
          opacity: subOp, transform: `translateY(${subY}px)`,
          fontSize: 24, color: "#6A9955", fontFamily: MONO, marginTop: 32, lineHeight: 1.7, fontStyle: "italic",
        }}>
          {'// Qwen3-TTS · Remotion · IDE Design System · 2026'}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SampleVideo — 24s / 720f / 씬 겹침 없음
//
//  S1  0–130     Hero
//  S2  133–273   CodeBlock   (IDE ✓)
//  S3  276–406   Pipeline    (비주얼)
//  S4  409–539   Terminal    (IDE ✓)
//  S5  542–642   Keyword Pop
//  S6  645–720   Closing
// ─────────────────────────────────────────────────────────────
const TOTAL = 720;

export const SampleVideo: React.FC = () => (
  <div style={{ width: 1920, height: 1080, position: "relative", overflow: "hidden" }}>
    <Background />

    <Sequence from={0}   durationInFrames={130}><Scene1 dur={130} /></Sequence>
    <Sequence from={133} durationInFrames={140}><Scene2 dur={140} /></Sequence>
    <Sequence from={276} durationInFrames={130}><Scene3 dur={130} /></Sequence>
    <Sequence from={409} durationInFrames={130}><Scene4 dur={130} /></Sequence>
    <Sequence from={542} durationInFrames={100}><Scene5 dur={100} /></Sequence>
    <Sequence from={645} durationInFrames={75}> <Scene6 dur={75}  /></Sequence>

    <ProgressBar total={TOTAL} />
  </div>
);
