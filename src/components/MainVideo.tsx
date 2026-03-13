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
  { id: 0,  visuals: [{ type:"keyword", text:"프로그래밍의 종말", color:"#f87171" }] },
  { id: 1,  visuals: [
    { type:"infotip",  title:"패러다임 전환", items:["타자 속도 ❌","문법 암기 ❌","기발한 상상 ✅"] },
    { type:"keyword",  text:"상상력 = 성공",  color:"#facc15" },
    { type:"icon",     emoji:"💡",             label:"기발한 아이디어" },
  ]},
  { id: 2,  visuals: [
    { type:"counter",  from:0,  to:30,         suffix:"명의 엘리트 개발자" },
    { type:"icon",     emoji:"🌙",             label:"밤샘 개발" },
  ]},
  { id: 3,  visuals: [
    { type:"counter",  from:30, to:1,          suffix:"인 개발자" },
    { type:"icon",     emoji:"🏠",             label:"방구석 개발" },
  ]},
  { id: 4,  visuals: [
    { type:"keyword",  text:"감각적 빌딩",     color:"#7bb4ff" },
    { type:"infotip",  title:"감각적 빌딩이란", items:["직관 + 아이디어","코드 없이 시작","1인 제국 건설"] },
    { type:"keyword",  text:"1인 제국",        color:"#a78bfa" },
  ]},
  { id: 5,  visuals: [
    { type:"infotip",  title:"필요 없는 것들",  items:["C언어 ❌","Java ❌","복잡한 문법 ❌"] },
    { type:"techbadge",label:"대신 이걸로",     tags:["Claude","ChatGPT","Cursor"] },
  ]},
  { id: 6,  visuals: [
    { type:"keyword",  text:"의지",            color:"#facc15" },
    { type:"infotip",  title:"유일한 무기",     items:["코드 실력 ❌","학벌 ❌","의지 ✅"] },
  ]},
  { id: 7,  visuals: [
    { type:"icon",     emoji:"🖱️",            label:"마우스 클릭" },
    { type:"icon",     emoji:"🌍",             label:"전 세계 시장" },
    { type:"icon",     emoji:"💰",             label:"지갑을 열다" },
  ]},
  { id: 8,  visuals: [
    { type:"icon",     emoji:"👍",             label:"구독 & 좋아요" },
  ]},
  { id: 9,  visuals: [
    { type:"keyword",  text:"① 프론트엔드",   color:"#a78bfa" },
    { type:"infotip",  title:"프론트엔드 = 겉모습", items:["뼈대 (HTML)","인테리어 (CSS)","움직임 (JS)"] },
  ]},
  { id: 10, visuals: [
    { type:"icon",     emoji:"🏗️",            label:"집 짓기 = 웹 개발" },
  ]},
  { id: 11, visuals: [
    { type:"counter",  from:300, to:1,         suffix:"줄의 코드" },
    { type:"infotip",  title:"코딩의 변화",    items:["예전: 수백 줄 코드","지금: 한글 한 마디"] },
    { type:"keyword",  text:"한글로 끝",       color:"#4ade80" },
  ]},
  { id: 12, visuals: [
    { type:"infotip",  title:"실제 명령어 예시", items:['"빨간 구매 버튼 가운데에"','"마우스 올리면 커지게"'] },
  ]},
  { id: 13, visuals: [
    { type:"counter",  from:0,  to:3,          suffix:"초 만에 완성" },
    { type:"icon",     emoji:"✨",             label:"완벽한 화면" },
  ]},
  { id: 14, visuals: [
    { type:"techbadge",label:"내 AI 개발팀",   tags:["Claude","Cursor","v0.dev"] },
    { type:"keyword",  text:"개인 비서",       color:"#7bb4ff" },
  ]},
  { id: 15, visuals: [
    { type:"keyword",  text:"② 배포 & 호스팅", color:"#fb923c" },
    { type:"icon",     emoji:"🌐",             label:"전 세계 접속" },
    { type:"icon",     emoji:"🛣️",            label:"고속도로 = 서버" },
  ]},
  { id: 16, visuals: [
    { type:"infotip",  title:"필요 없는 것",   items:["서버 컴퓨터 구매 ❌","창고 임대 ❌","초기 비용 ❌"] },
    { type:"keyword",  text:"서버 비용 $0",    color:"#4ade80" },
  ]},
  { id: 17, visuals: [
    { type:"techbadge",label:"무료 호스팅",    tags:["Vercel","Netlify","Railway"] },
    { type:"icon",     emoji:"🆓",             label:"무료 서버" },
  ]},
  { id: 18, visuals: [
    { type:"counter",  from:0,  to:1,          suffix:"초 만에 접속" },
    { type:"icon",     emoji:"🌍",             label:"뉴욕 · 파리 · 서울" },
  ]},
  { id: 19, visuals: [
    { type:"icon",     emoji:"😴",             label:"유저 이탈" },
    { type:"infotip",  title:"겉만 번지르르하면", items:["기능 없음","유저 이탈","수익 없음"] },
  ]},
  { id: 20, visuals: [
    { type:"keyword",  text:"③ AI API 연동",  color:"#34d399" },
    { type:"icon",     emoji:"🧠",             label:"AI 두뇌 임대" },
  ]},
  { id: 21, visuals: [
    { type:"counter",  from:0,  to:100000000000, suffix:"원 학습 비용" },
    { type:"infotip",  title:"비용 비교",      items:["학습 비용: 1,000억+","우리 비용: 10원/회"] },
    { type:"counter",  from:100000000000, to:10, suffix:"원" },
  ]},
  { id: 22, visuals: [
    { type:"keyword",  text:"API = 마법",      color:"#34d399" },
    { type:"infotip",  title:"API란?",         items:["초지능의 뇌파를","내 서비스에 복사","실시간 연결"] },
  ]},
  { id: 23, visuals: [
    { type:"icon",     emoji:"📸",             label:"사진 → AI 분석" },
    { type:"counter",  from:0,  to:2,          suffix:"일이면 완성" },
    { type:"icon",     emoji:"👗",             label:"패션 추천 서비스" },
  ]},
  { id: 24, visuals: [
    { type:"icon",     emoji:"🧠",             label:"고객 기억" },
  ]},
  { id: 25, visuals: [
    { type:"infotip",  title:"데이터 = 돈",    items:["방문자 파악","장바구니 분석","맞춤 추천"] },
  ]},
  { id: 26, visuals: [
    { type:"keyword",  text:"④ 데이터베이스", color:"#60a5fa" },
    { type:"icon",     emoji:"🗄️",            label:"디지털 창고" },
  ]},
  { id: 27, visuals: [
    { type:"techbadge",label:"클라우드 DB",    tags:["Supabase","Firebase","PlanetScale"] },
    { type:"icon",     emoji:"🖱️",            label:"딸깍 연결" },
  ]},
  { id: 28, visuals: [
    { type:"icon",     emoji:"📰",             label:"보안 사고" },
    { type:"infotip",  title:"보안 방치 시",   items:["개인정보 유출","서비스 폐쇄","뉴스 1면 장식"] },
  ]},
  { id: 29, visuals: [
    { type:"icon",     emoji:"🔒",             label:"클라우드 보안" },
    { type:"techbadge",label:"보안 솔루션",    tags:["AWS","Supabase Auth","Clerk"] },
  ]},
  { id: 30, visuals: [
    { type:"infotip",  title:"1인 서비스 완성", items:["외관 ✅  프론트엔드","두뇌 ✅  AI API","기억 ✅  데이터베이스"] },
    { type:"keyword",  text:"1인 서비스 탄생", color:"#f472b6" },
  ]},
  { id: 31, visuals: [
    { type:"keyword",  text:"⑤ 수익화",       color:"#4ade80" },
    { type:"icon",     emoji:"💰",             label:"현금 파이프라인" },
  ]},
  { id: 32, visuals: [
    { type:"infotip",  title:"수익화 ① 광고",  items:["구글 애드센스","클릭마다 달러","초기 설정 10분"] },
  ]},
  { id: 33, visuals: [
    { type:"icon",     emoji:"💵",             label:"광고 수익" },
    { type:"counter",  from:0,  to:1000,       suffix:"원/클릭" },
  ]},
  { id: 34, visuals: [
    { type:"keyword",  text:"수익화 ② 구독",  color:"#fb923c" },
    { type:"icon",     emoji:"🔄",             label:"반복 수익" },
  ]},
  { id: 35, visuals: [
    { type:"infotip",  title:"구독 모델",      items:["매달 자동 결제","자는 동안 수익","이탈률이 낮음"] },
    { type:"keyword",  text:"자는 동안 수익",  color:"#4ade80" },
  ]},
  { id: 36, visuals: [
    { type:"keyword",  text:"한국 → 세계",    color:"#7bb4ff" },
  ]},
  { id: 37, visuals: [
    { type:"techbadge",label:"글로벌 결제",    tags:["Stripe","PayPal","Paddle"] },
    { type:"infotip",  title:"글로벌 결제 혜택", items:["달러 · 유로 자동 환전","세금 처리 대행","170+ 국가 지원"] },
  ]},
  { id: 38, visuals: [
    { type:"icon",     emoji:"🤔",             label:"어떤 아이템?" },
  ]},
  { id: 39, visuals: [
    { type:"icon",     emoji:"🎯",             label:"검증된 시장" },
  ]},
  { id: 40, visuals: [
    { type:"counter",  from:0,  to:500000,     suffix:"원짜리 컨설팅" },
    { type:"icon",     emoji:"👔",             label:"비싼 전문가" },
  ]},
  { id: 41, visuals: [
    { type:"counter",  from:500000, to:10,     suffix:"원으로 자동화" },
    { type:"keyword",  text:"시장 파괴",       color:"#f87171" },
  ]},
  { id: 42, visuals: [
    { type:"infotip",  title:"기회 공식",      items:["남의 비효율","= 내 마진","= 내 기회"] },
  ]},
  { id: 43, visuals: [
    { type:"icon",     emoji:"🗑️",            label:"완벽주의 버려라" },
    { type:"infotip",  title:"흔한 실수",      items:["완벽한 기획 ❌","1년 개발 ❌","한 번에 출시 ❌"] },
  ]},
  { id: 44, visuals: [
    { type:"keyword",  text:"MVP 먼저",        color:"#facc15" },
    { type:"infotip",  title:"MVP 전략",       items:["엉성해도 출시","반응 먼저 확인","개선은 그 다음"] },
  ]},
  { id: 45, visuals: [
    { type:"infotip",  title:"성장 3단계",     items:["① 출시 (엉성 OK)","② 개선 (손잡이)","③ 스케일 (엔진)"] },
    { type:"icon",     emoji:"🚀",             label:"스케일업" },
  ]},
  { id: 46, visuals: [
    { type:"icon",     emoji:"📊",             label:"사용자 분석" },
    { type:"techbadge",label:"분석 툴",        tags:["Hotjar","GA4","Mixpanel"] },
  ]},
  { id: 47, visuals: [
    { type:"infotip",  title:"데이터 기반 개선", items:["스크롤 깊이 분석","클릭 히트맵","A/B 테스트"] },
    { type:"icon",     emoji:"🔧",             label:"실시간 개선" },
  ]},
  { id: 48, visuals: [
    { type:"keyword",  text:"폭발점",          color:"#f87171" },
    { type:"icon",     emoji:"💥",             label:"결제 폭발" },
  ]},
  { id: 49, visuals: [
    { type:"keyword",  text:"⑥ 모바일 앱",    color:"#a78bfa" },
    { type:"icon",     emoji:"📱",             label:"앱 확장" },
  ]},
  { id: 50, visuals: [
    { type:"infotip",  title:"앱 개발 방법",   items:["① PWA (웹 래핑)","② React Native","③ Flutter"] },
    { type:"icon",     emoji:"🔄",             label:"웹 → 앱 변환" },
  ]},
  { id: 51, visuals: [
    { type:"techbadge",label:"크로스플랫폼",   tags:["iOS","Android"] },
    { type:"icon",     emoji:"🤖",             label:"AI가 대신 개발" },
  ]},
  { id: 52, visuals: [
    { type:"icon",     emoji:"⚠️",             label:"앱 심사 주의" },
  ]},
  { id: 53, visuals: [
    { type:"infotip",  title:"앱 거절 사유",   items:["기능 없는 껍데기","복제앱","콘텐츠 부족"] },
    { type:"icon",     emoji:"🍎",             label:"앱스토어 심사" },
  ]},
  { id: 54, visuals: [
    { type:"infotip",  title:"필수 네이티브 기능", items:["푸시 알림 🔔","카메라 📸","GPS 📍"] },
    { type:"icon",     emoji:"📱",             label:"네이티브 경험" },
  ]},
  { id: 55, visuals: [
    { type:"keyword",  text:"1인 = 중소기업", color:"#4ade80" },
    { type:"icon",     emoji:"🏭",             label:"현금 창출 기계" },
  ]},
  { id: 56, visuals: [
    { type:"icon",     emoji:"🛤️",            label:"인생의 갈림길" },
  ]},
  { id: 57, visuals: [
    { type:"counter",  from:0, to:30000000,   suffix:"원/월" },
    { type:"icon",     emoji:"🏝️",            label:"디지털 노마드" },
  ]},
  { id: 58, visuals: [
    { type:"counter",  from:0, to:30000000000, suffix:"원 엑싯" },
    { type:"icon",     emoji:"🤝",             label:"인수합병" },
  ]},
  { id: 59, visuals: [
    { type:"icon",     emoji:"🇺🇸",            label:"미국 법인" },
    { type:"infotip",  title:"VC 투자 유치",   items:["시드: 수억 원","시리즈A: 수십억","시리즈B: 수백억"] },
  ]},
  { id: 60, visuals: [
    { type:"keyword",  text:"NASDAQ 🔔",       color:"#facc15" },
    { type:"icon",     emoji:"📈",             label:"글로벌 상장" },
  ]},
  { id: 61, visuals: [
    { type:"keyword",  text:"내일 당장 시작",  color:"#7bb4ff" },
    { type:"infotip",  title:"필요한 것",      items:["아이디어 ✅","노트북 ✅","의지 ✅","코딩 실력 ❌"] },
  ]},
  { id: 62, visuals: [
    { type:"icon",     emoji:"💡",             label:"잠든 아이디어" },
    { type:"keyword",  text:"세상을 바꿀 아이디어", color:"#facc15" },
  ]},
  { id: 63, visuals: [
    { type:"icon",     emoji:"💬",             label:"AI에게 명령" },
    { type:"keyword",  text:"지금 바로 시작",  color:"#4ade80" },
  ]},
  { id: 64, visuals: [
    { type:"icon",     emoji:"🔥",             label:"열정에 불을" },
  ]},
  { id: 65, visuals: [
    { type:"icon",     emoji:"💥",             label:"시너지 폭발" },
  ]},
  { id: 66, visuals: [
    { type:"none" },
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
        }}>감각적 빌딩</div>
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
