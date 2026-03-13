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
// 씬 플랜: 문장 ID → 시각 요소 배열 (여러 개면 시간 균등 분배)
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: 단 3시간 만에 만든 서비스로 매달 1억 원 가까운 현금을 만지는 사람이 있습니다.
  { id: 0,  visuals: [
    { type:"counter",  from:0,  to:3,          suffix:"시간 만에 제작" },
    { type:"counter",  from:0,  to:100000000,  suffix:"원/월 수익" },
  ]},
  // 1: 천재 개발자냐고요? 아니요, 그는 스스로를 '바이브 코더'라고 부릅니다.
  { id: 1,  visuals: [
    { type:"icon",     emoji:"🤔",             label:"천재 개발자?" },
    { type:"keyword",  text:"바이브 코더",     color:"#aaff00" },
  ]},
  // 2: 지금부터 그가 AI를 활용해 돈을 쓸어 담는 5가지 비밀 전략을 공개합니다.
  { id: 2,  visuals: [
    { type:"infotip",  title:"5가지 비밀 전략", items:["① 속도전","② 과정을 팔아라","③ 망가뜨리며 전진","④ 레버리지","⑤ 서비스 너머의 가치"] },
  ]},
  // 3: 복잡한 기술은 필요 없습니다. 아이디어를 돈으로 바꾸는 속도만 있으면 됩니다.
  { id: 3,  visuals: [
    { type:"keyword",  text:"아이디어 → 돈",   color:"#facc15" },
    { type:"icon",     emoji:"⚡",             label:"속도가 전부" },
  ]},
  // 4: 첫 번째 비밀은 '완성'보다 '생존'에 집중하는 속도전입니다.
  { id: 4,  visuals: [
    { type:"keyword",  text:"① 속도전",        color:"#f87171" },
    { type:"infotip",  title:"완성 vs 생존",   items:["완성 ❌","생존 ✅","속도가 최우선"] },
  ]},
  // 5: 그는 완벽한 앱을 만들려 하지 않습니다. 단 몇 시간 만에 돌아가는 프로토타입을 던지죠.
  { id: 5,  visuals: [
    { type:"icon",     emoji:"🗑️",            label:"완벽주의 버려라" },
    { type:"icon",     emoji:"🚀",             label:"프로토타입 출시" },
  ]},
  // 6: 시장의 반응이 없으면 바로 버리고, 반응이 오면 그때부터 다듬기 시작합니다.
  { id: 6,  visuals: [
    { type:"infotip",  title:"시장 반응 공식", items:["반응 없음 → 버려라","반응 있음 → 다듬어라"] },
  ]},
  // 7: 실행이 정보를 만든다는 원칙을 철저히 따르는 셈입니다.
  { id: 7,  visuals: [
    { type:"keyword",  text:"실행 = 정보",     color:"#7bb4ff" },
  ]},
  // 8: 실제로 그가 시도한 프로젝트 중 95%는 실패했습니다.
  { id: 8,  visuals: [
    { type:"counter",  from:0,  to:95,         suffix:"% 실패" },
    { type:"icon",     emoji:"💀",             label:"95% 실패" },
  ]},
  // 9: 하지만 남은 5%가 매달 수천만 원의 수익을 가져다주고 있죠.
  { id: 9,  visuals: [
    { type:"counter",  from:0,  to:5,          suffix:"% 성공" },
    { type:"counter",  from:0,  to:30000000,   suffix:"원/월" },
  ]},
  // 10: 여러분도 완벽주의를 버리세요. 지금 바로 시장에 당신의 아이디어를 던져야 합니다.
  { id: 10, visuals: [
    { type:"keyword",  text:"지금 당장 던져라", color:"#aaff00" },
  ]},
  // 11: 두 번째 전략은 '만드는 과정을 팔아라'입니다.
  { id: 11, visuals: [
    { type:"keyword",  text:"② 과정을 팔아라", color:"#fb923c" },
  ]},
  // 12: 그는 코드를 한 줄 짤 때마다 SNS에 공유하며 팬덤을 만듭니다.
  { id: 12, visuals: [
    { type:"icon",     emoji:"📱",             label:"SNS 공유" },
    { type:"icon",     emoji:"🔥",             label:"팬덤 형성" },
  ]},
  // 13: 사람들은 완벽한 기성품보다 누군가의 고군분투가 담긴 성장 스토리에 열광하죠.
  { id: 13, visuals: [
    { type:"infotip",  title:"팬이 원하는 것", items:["완벽한 기성품 ❌","고군분투 성장 스토리 ✅"] },
  ]},
  // 14: 기술이 흔해진 시대에 가장 강력한 무기는 바로 '진정성 있는 소통'입니다.
  { id: 14, visuals: [
    { type:"keyword",  text:"진정성 있는 소통", color:"#f472b6" },
    { type:"techbadge",label:"최강 무기",       tags:["진정성","소통","스토리"] },
  ]},
  // 15: 로봇이 만든 결과물이라도, 그것을 지휘하는 인간의 이야기가 있으면 사람들은 지갑을 엽니다.
  { id: 15, visuals: [
    { type:"icon",     emoji:"🤖",             label:"AI 결과물" },
    { type:"icon",     emoji:"💳",             label:"지갑을 연다" },
  ]},
  // 16: 당신의 실패와 성공을 실시간으로 중계하며 유저를 동료로 만드세요.
  { id: 16, visuals: [
    { type:"infotip",  title:"유저를 동료로",  items:["실패도 공유","성공도 공유","실시간 중계"] },
  ]},
  // 17: 구독과 좋아요를 눌러주시면 이런 실전 전략을 가장 먼저 받아보실 수 있습니다.
  { id: 17, visuals: [
    { type:"icon",     emoji:"👍",             label:"구독 & 좋아요" },
  ]},
  // 18: 세 번째 핵심은 '망가뜨리면서 전진하라'는 철학입니다.
  { id: 18, visuals: [
    { type:"keyword",  text:"③ 망가뜨리며 전진", color:"#34d399" },
  ]},
  // 19: 출시했을 때 오류가 날까 봐 걱정되시나요? 아무도 당신의 작은 실수에 관심 없습니다.
  { id: 19, visuals: [
    { type:"icon",     emoji:"😱",             label:"오류 걱정?" },
    { type:"keyword",  text:"아무도 관심 없다", color:"#4ade80" },
  ]},
  // 20: 문제가 생기면 그제야 고치면 됩니다. 오히려 빠른 피드백을 받을 기회죠.
  { id: 20, visuals: [
    { type:"infotip",  title:"문제 = 기회",    items:["생기면 고쳐라","빠른 피드백 수집","오히려 유리"] },
  ]},
  // 21: 제프 베이조스가 말한 '되돌릴 수 있는 문'의 개념을 기억하세요.
  { id: 21, visuals: [
    { type:"icon",     emoji:"🚪",             label:"되돌릴 수 있는 문" },
    { type:"keyword",  text:"베이조스의 원칙",  color:"#7bb4ff" },
  ]},
  // 22: 대부분의 결정은 나중에 수정할 수 있습니다. 고민하느라 시간을 버리지 마세요.
  { id: 22, visuals: [
    { type:"keyword",  text:"고민 = 시간 낭비", color:"#f87171" },
    { type:"icon",     emoji:"⏱️",             label:"지금 바로 실행" },
  ]},
  // 23: 네 번째는 '레버리지'를 극대화하는 선택과 집중입니다.
  { id: 23, visuals: [
    { type:"keyword",  text:"④ 레버리지",      color:"#a78bfa" },
    { type:"infotip",  title:"레버리지란",      items:["노력 대비 보상 최대화","선택과 집중","에너지 한 곳에"] },
  ]},
  // 24: 노력 대비 보상이 가장 큰 기능 하나에 모든 에너지를 쏟으세요.
  { id: 24, visuals: [
    { type:"icon",     emoji:"🎯",             label:"핵심 기능 하나" },
  ]},
  // 25: 예쁜 디자인보다 사용자가 원하는 결과에 도달하는 시간을 단축하는 게 핵심입니다.
  { id: 25, visuals: [
    { type:"infotip",  title:"진짜 핵심",      items:["예쁜 디자인 ❌","결과 도달 시간 단축 ✅"] },
  ]},
  // 26: 그는 로그인조차 생략하고 바로 서비스를 이용하게 만들어 전환율을 높였습니다.
  { id: 26, visuals: [
    { type:"icon",     emoji:"🔑",             label:"로그인 생략" },
    { type:"counter",  from:0,  to:300,        suffix:"% 전환율 상승" },
  ]},
  // 27: 사용자의 귀찮음을 해결해 주는 것, 그것이 가장 가치 있는 기술입니다.
  { id: 27, visuals: [
    { type:"keyword",  text:"귀찮음 해결 = 돈", color:"#facc15" },
  ]},
  // 28: 마지막 다섯 번째 비밀은 '서비스 너머의 가치'를 설계하는 것입니다.
  { id: 28, visuals: [
    { type:"keyword",  text:"⑤ 서비스 너머",   color:"#f472b6" },
  ]},
  // 29: 그는 단순히 앱 안에서의 수익만 생각하지 않습니다.
  { id: 29, visuals: [
    { type:"icon",     emoji:"💡",             label:"앱 너머를 본다" },
  ]},
  // 30: 광고주에게 자신의 영향력을 덤으로 얹어주며 압도적인 제안을 던지죠.
  { id: 30, visuals: [
    { type:"infotip",  title:"압도적인 제안",  items:["앱 수익 + 영향력","패키지로 묶어서","광고주에게 던진다"] },
  ]},
  // 31: 여러분도 본인이 가진 작은 자원들을 조합해 대체 불가능한 혜택을 만드세요.
  { id: 31, visuals: [
    { type:"keyword",  text:"대체 불가능한 혜택", color:"#aaff00" },
  ]},
  // 32: 장비 지원이나 무료 컨설팅 같은 사소한 덤이 고객의 마음을 움직입니다.
  { id: 32, visuals: [
    { type:"icon",     emoji:"🎁",             label:"사소한 덤" },
    { type:"icon",     emoji:"💝",             label:"고객 마음을 열다" },
  ]},
  // 33: 지금 AI라는 도구는 모두에게 평등하게 주어졌습니다.
  { id: 33, visuals: [
    { type:"techbadge",label:"평등한 도구",    tags:["AI","Claude","ChatGPT","Cursor"] },
  ]},
  // 34: 차이를 만드는 건 결국 그 도구를 쥐고 얼마나 빨리 움직이느냐의 문제입니다.
  { id: 34, visuals: [
    { type:"keyword",  text:"속도가 전부",     color:"#f87171" },
    { type:"icon",     emoji:"⚡",             label:"얼마나 빨리?" },
  ]},
  // 35: 남들이 고민만 할 때 당신은 결과물을 시장에 내놓으세요.
  { id: 35, visuals: [
    { type:"infotip",  title:"남들 vs 당신",  items:["남들: 고민 중...","당신: 이미 출시 ✅"] },
  ]},
  // 36: 오늘 말씀드린 전략들을 하나씩 적용해 보시길 바랍니다.
  { id: 36, visuals: [
    { type:"icon",     emoji:"📋",             label:"전략 적용" },
  ]},
  // 37: 당신도 충분히 할 수 있습니다. 지금 바로 시작하세요.
  { id: 37, visuals: [
    { type:"keyword",  text:"지금 바로 시작",  color:"#aaff00" },
    { type:"icon",     emoji:"🚀",             label:"당신도 할 수 있다" },
  ]},
];

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
