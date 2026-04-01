import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SentenceData } from "../types";

interface SubtitleProps {
  sentences: SentenceData[];
}

const FADE_FRAMES = 4;

interface SubtitleEntry {
  text: string;
  start_ms: number;
  end_ms: number;
}

function buildEntries(sentences: SentenceData[]): SubtitleEntry[] {
  const entries: SubtitleEntry[] = sentences
    .filter((s) => s.text.trim().length > 0)
    .map((s) => ({
      text: s.text.trim(),
      start_ms: s.start_ms,
      end_ms: s.end_ms,
    }));

  // 문장 사이 갭을 자막이 채우도록 end_ms 연장 (최대 2500ms)
  for (let i = 0; i < entries.length - 1; i++) {
    const gap = entries[i + 1].start_ms - entries[i].end_ms;
    if (gap > 0 && gap <= 2500) {
      entries[i].end_ms = entries[i + 1].start_ms;
    }
  }

  return entries;
}

// 문장 길이에 따라 폰트 크기 자동 조정
function getFontSize(text: string): number {
  const len = text.length;
  if (len <= 10) return 46;
  if (len <= 18) return 42;
  if (len <= 28) return 38;
  return 34;
}

export const Subtitle: React.FC<SubtitleProps> = ({ sentences }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entries = React.useMemo(() => buildEntries(sentences), [sentences]);

  const currentMs = (frame / fps) * 1000;
  const activeIdx = entries.findIndex(
    (e) => currentMs >= e.start_ms && currentMs < e.end_ms
  );

  if (activeIdx === -1) return null;

  const entry = entries[activeIdx];
  const entryStartFrame = (entry.start_ms / 1000) * fps;
  const entryEndFrame = (entry.end_ms / 1000) * fps;
  const elapsed = frame - entryStartFrame;
  const duration = entryEndFrame - entryStartFrame;

  const fadeIn = Math.min(FADE_FRAMES, duration / 3);
  const fadeOut = Math.max(duration - fadeIn, fadeIn + 0.01);
  const opacity = interpolate(
    elapsed,
    [0, fadeIn, fadeOut, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const translateY = interpolate(elapsed, [0, FADE_FRAMES], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const fontSize = getFontSize(entry.text);

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: "6%",
        right: "6%",
        textAlign: "center",
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          padding: "14px 44px",
          borderRadius: 14,
          background: "rgba(13,17,23,0.75)",
          backdropFilter: "blur(16px)",
          border: "1px solid rgba(97,218,251,0.14)",
          maxWidth: "90%",
        }}
      >
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: "#F3F4F6",
            fontFamily: "'Pretendard','Noto Sans KR',sans-serif",
            letterSpacing: "-0.01em",
            textShadow: "0 1px 6px rgba(0,0,0,0.7)",
            wordBreak: "keep-all",
            lineHeight: 1.5,
          }}
        >
          {entry.text}
        </span>
      </div>
    </div>
  );
};
