import React from "react";
import {
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";

const Particle: React.FC<{
  x: number; y: number; size: number; delay: number; color: string; speed: number;
}> = ({ x, y, size, delay, color, speed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = interpolate(
    Math.sin(((frame + delay) / fps) * speed * 0.8),
    [-1, 1], [0.04, 0.22]
  );
  const offsetY = interpolate(
    Math.sin(((frame + delay) / fps) * speed * 0.5),
    [-1, 1], [-25, 25]
  );
  const offsetX = interpolate(
    Math.cos(((frame + delay * 0.7) / fps) * speed * 0.3),
    [-1, 1], [-15, 15]
  );

  return (
    <div style={{
      position: "absolute", left: `${x}%`, top: `${y}%`,
      width: size, height: size, borderRadius: "50%",
      background: color, opacity,
      transform: `translate(-50%, ${offsetY}px) translateX(${offsetX}px)`,
      filter: `blur(${size * 0.32}px)`,
    }} />
  );
};

export const Visuals: React.FC<{ progress: number }> = ({ progress }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const hue1 = interpolate(progress, [0, 1], [220, 280]);
  const hue2 = interpolate(progress, [0, 1], [260, 180]);

  const particles = [
    { x: 8,  y: 18, size: 240, delay: 0,   speed: 0.7, color: `hsl(${hue1}, 70%, 60%)` },
    { x: 80, y: 12, size: 340, delay: 30,  speed: 0.5, color: `hsl(${hue2}, 60%, 55%)` },
    { x: 50, y: 70, size: 270, delay: 60,  speed: 0.9, color: `hsl(${hue1+30}, 65%, 50%)` },
    { x: 20, y: 80, size: 200, delay: 90,  speed: 0.6, color: `hsl(${hue2-20}, 75%, 65%)` },
    { x: 90, y: 60, size: 250, delay: 45,  speed: 0.8, color: `hsl(${hue1+60}, 55%, 45%)` },
    { x: 65, y: 35, size: 175, delay: 15,  speed: 1.1, color: `hsl(${hue2+40}, 70%, 60%)` },
    { x: 35, y: 48, size: 150, delay: 72,  speed: 1.3, color: `hsl(${hue1+15}, 65%, 55%)` },
    { x: 55, y: 88, size: 190, delay: 24,  speed: 0.6, color: `hsl(${hue2+60}, 60%, 50%)` },
    { x: 15, y: 50, size: 120, delay: 50,  speed: 1.5, color: `hsl(${hue1-20}, 60%, 65%)` },
    { x: 72, y: 78, size: 160, delay: 38,  speed: 0.9, color: `hsl(${hue2-40}, 70%, 55%)` },
  ];

  const auroraX = 50 + 12 * Math.sin((frame / fps) * 0.15);
  const auroraY = 42 + 8  * Math.cos((frame / fps) * 0.12);
  const auroraScale = 0.85 + 0.15 * Math.sin((frame / fps) * 0.2);
  const scanPos = ((frame * 0.3) % fps) / fps * 100;

  return (
    <div style={{
      position: "absolute", inset: 0,
      background: `linear-gradient(135deg, hsl(${hue1}, 80%, 7%) 0%, hsl(${hue2}, 70%, 11%) 50%, hsl(${hue1+40}, 75%, 5%) 100%)`,
      overflow: "hidden",
    }}>
      {particles.map((p, i) => <Particle key={i} {...p} />)}

      {/* Aurora blob */}
      <div style={{
        position: "absolute",
        left: `${auroraX}%`, top: `${auroraY}%`,
        width: 700, height: 500, borderRadius: "50%",
        background: `radial-gradient(ellipse, hsl(${hue1+20}, 80%, 35%) 0%, transparent 70%)`,
        transform: `translate(-50%, -50%) scale(${auroraScale})`,
        opacity: 0.10, filter: "blur(60px)",
      }} />

      {/* Center glow */}
      <div style={{
        position: "absolute", left: "50%", top: "45%",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, hsl(${hue1+20}, 80%, 45%) 0%, transparent 70%)`,
        transform: "translate(-50%, -50%)",
        opacity: 0.09, filter: "blur(50px)",
      }} />

      {/* Horizontal lines */}
      {[0.2, 0.4, 0.6, 0.8].map((pos, i) => {
        const lo = interpolate(Math.sin(((frame + i * 40) / fps) * 0.6), [-1, 1], [0.015, 0.055]);
        return (
          <div key={i} style={{
            position: "absolute", left: 0, right: 0, top: `${pos * 100}%`, height: 1,
            background: `linear-gradient(90deg, transparent, hsl(${hue1}, 70%, 60%), transparent)`,
            opacity: lo,
          }} />
        );
      })}

      {/* Vertical lines */}
      {[0.15, 0.3, 0.45, 0.6, 0.75, 0.9].map((pos, i) => {
        const lo = interpolate(Math.sin(((frame + i * 25) / fps) * 0.4), [-1, 1], [0.01, 0.035]);
        return (
          <div key={`v${i}`} style={{
            position: "absolute", top: 0, bottom: 0, left: `${pos * 100}%`, width: 1,
            background: `linear-gradient(180deg, transparent, hsl(${hue2}, 60%, 60%), transparent)`,
            opacity: lo,
          }} />
        );
      })}

      {/* Scan line */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: `${scanPos}%`, height: 2,
        background: `linear-gradient(90deg, transparent 0%, hsl(${hue1},80%,70%) 40%, hsl(${hue2},70%,65%) 60%, transparent 100%)`,
        opacity: 0.04,
      }} />

      {/* Corner accents */}
      {[
        { top: 30, left: 30 }, { top: 30, right: 30 },
        { bottom: 30, left: 30 }, { bottom: 30, right: 30 },
      ].map((style, i) => (
        <div key={`corner${i}`} style={{ position: "absolute", ...style, width: 40, height: 40, opacity: 0.16 }}>
          <svg width={40} height={40} viewBox="0 0 40 40" fill="none">
            <path
              d={i===0?"M0 20 L0 0 L20 0":i===1?"M40 20 L40 0 L20 0":i===2?"M0 20 L0 40 L20 40":"M40 20 L40 40 L20 40"}
              stroke={`hsl(${hue1}, 70%, 65%)`} strokeWidth={1.5}
            />
          </svg>
        </div>
      ))}
    </div>
  );
};
