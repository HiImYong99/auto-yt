import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

// 배경 파티클 (간단한 원형 요소들)
const Particle: React.FC<{
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}> = ({ x, y, size, delay, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    Math.sin(((frame + delay) / fps) * 0.8),
    [-1, 1],
    [0.05, 0.25]
  );

  const offsetY = interpolate(
    Math.sin(((frame + delay) / fps) * 0.5),
    [-1, 1],
    [-20, 20]
  );

  return (
    <div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        opacity,
        transform: `translateY(${offsetY}px) translateX(-50%)`,
        filter: `blur(${size * 0.3}px)`,
      }}
    />
  );
};

// 배경 그라데이션 + 파티클 비주얼
export const Visuals: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // 배경 색상: 시간 흐름에 따라 천천히 변화
  const hue1 = interpolate(progress, [0, 1], [220, 280]);
  const hue2 = interpolate(progress, [0, 1], [260, 180]);

  const particles = [
    { x: 10, y: 20, size: 200, delay: 0, color: `hsl(${hue1}, 70%, 60%)` },
    { x: 80, y: 15, size: 300, delay: 30, color: `hsl(${hue2}, 60%, 55%)` },
    { x: 50, y: 70, size: 250, delay: 60, color: `hsl(${hue1 + 30}, 65%, 50%)` },
    { x: 20, y: 80, size: 180, delay: 90, color: `hsl(${hue2 - 20}, 75%, 65%)` },
    { x: 90, y: 60, size: 220, delay: 45, color: `hsl(${hue1 + 60}, 55%, 45%)` },
    { x: 65, y: 35, size: 160, delay: 15, color: `hsl(${hue2 + 40}, 70%, 60%)` },
  ];

  // 중앙 글로우 효과
  const glowScale = spring({
    fps,
    frame,
    config: { damping: 200, stiffness: 0.5 },
  });

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: `linear-gradient(135deg, hsl(${hue1}, 80%, 8%) 0%, hsl(${hue2}, 70%, 12%) 50%, hsl(${hue1 + 40}, 75%, 6%) 100%)`,
        overflow: "hidden",
      }}
    >
      {/* 배경 파티클 */}
      {particles.map((p, i) => (
        <Particle key={i} {...p} />
      ))}

      {/* 중앙 글로우 */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "45%",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: `radial-gradient(circle, hsl(${hue1 + 20}, 80%, 40%) 0%, transparent 70%)`,
          transform: `translate(-50%, -50%) scale(${glowScale * 0.3 + 0.7})`,
          opacity: 0.12,
          filter: "blur(40px)",
        }}
      />

      {/* 수평선 장식 */}
      {[0.2, 0.4, 0.6, 0.8].map((pos, i) => {
        const lineOpacity = interpolate(
          Math.sin(((frame + i * 40) / fps) * 0.6),
          [-1, 1],
          [0.02, 0.06]
        );
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${pos * 100}%`,
              height: 1,
              background: `linear-gradient(90deg, transparent, hsl(${hue1}, 70%, 60%), transparent)`,
              opacity: lineOpacity,
            }}
          />
        );
      })}
    </div>
  );
};
