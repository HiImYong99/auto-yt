import React from "react";
import { useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SentenceData } from "../types";

interface SubtitleProps {
  sentences: SentenceData[];
}

const MAX_WORDS = 5;
const FADE_FRAMES = 4;

interface WordGroup {
  text: string;
  start_ms: number;
  end_ms: number;
}

function buildWordGroups(sentences: SentenceData[]): WordGroup[] {
  const groups: WordGroup[] = [];
  for (const sentence of sentences) {
    const words = sentence.words;
    if (words.length === 0) continue;
    for (let i = 0; i < words.length; i += MAX_WORDS) {
      const chunk = words.slice(i, i + MAX_WORDS);
      const isLast = i + MAX_WORDS >= words.length;
      groups.push({
        text: chunk.map((w) => w.word).join(" "),
        start_ms: chunk[0].start_ms,
        // 마지막 청크는 문장 끝까지 유지
        end_ms: isLast ? sentence.end_ms : chunk[chunk.length - 1].end_ms,
      });
    }
  }
  return groups;
}

const WORD_GROUPS_CACHE: { groups: WordGroup[] | null } = { groups: null };

export const Subtitle: React.FC<SubtitleProps> = ({ sentences }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!WORD_GROUPS_CACHE.groups) {
    WORD_GROUPS_CACHE.groups = buildWordGroups(sentences);
  }
  const groups = WORD_GROUPS_CACHE.groups;

  const currentMs = (frame / fps) * 1000;
  const activeIdx = groups.findIndex(
    (g) => currentMs >= g.start_ms && currentMs <= g.end_ms
  );

  if (activeIdx === -1) return null;

  const group = groups[activeIdx];
  const groupStartFrame = (group.start_ms / 1000) * fps;
  const groupEndFrame = (group.end_ms / 1000) * fps;
  const elapsed = frame - groupStartFrame;
  const duration = groupEndFrame - groupStartFrame;

  const opacity = interpolate(
    elapsed,
    [0, FADE_FRAMES, duration - FADE_FRAMES, duration],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const translateY = interpolate(elapsed, [0, FADE_FRAMES], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 72,
        left: "8%",
        right: "8%",
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
          background: "rgba(0,0,0,0.58)",
          backdropFilter: "blur(14px)",
          border: "1px solid rgba(255,255,255,0.07)",
          maxWidth: "100%",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontSize: 40,
            fontWeight: 500,
            color: "rgba(255,255,255,0.92)",
            fontFamily: "'Apple SD Gothic Neo','Noto Sans KR',sans-serif",
            letterSpacing: "-0.01em",
            textShadow: "0 1px 4px rgba(0,0,0,0.5)",
          }}
        >
          {group.text}
        </span>
      </div>
    </div>
  );
};
