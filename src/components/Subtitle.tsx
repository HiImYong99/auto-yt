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
    // 원본 문장 텍스트를 5단어씩 분할 (whisper 인식 단어 대신)
    const words = sentence.text.trim().split(/\s+/).filter(Boolean);
    const numGroups = Math.ceil(words.length / MAX_WORDS);
    const sentDur = sentence.end_ms - sentence.start_ms;

    for (let i = 0; i < words.length; i += MAX_WORDS) {
      const chunk = words.slice(i, i + MAX_WORDS);
      const groupIdx = Math.floor(i / MAX_WORDS);
      const isLast = groupIdx === numGroups - 1;
      // 문장 시간을 그룹 수로 균등 분배
      const groupStart = sentence.start_ms + Math.round(sentDur * groupIdx / numGroups);
      const groupEnd = isLast
        ? sentence.end_ms
        : sentence.start_ms + Math.round(sentDur * (groupIdx + 1) / numGroups);
      groups.push({
        text: chunk.join(" "),
        start_ms: groupStart,
        end_ms: Math.max(groupEnd, groupStart + 1),
      });
    }
  }
  return groups;
}

export const Subtitle: React.FC<SubtitleProps> = ({ sentences }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const groups = React.useMemo(() => buildWordGroups(sentences), [sentences]);

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

  const fadeIn = Math.min(FADE_FRAMES, duration / 2);
  const fadeOut = Math.max(duration - fadeIn, fadeIn + 0.01);
  const opacity = interpolate(
    elapsed,
    [0, fadeIn, fadeOut, duration],
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
