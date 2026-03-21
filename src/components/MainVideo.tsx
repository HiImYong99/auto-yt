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
type VisualNone      = { type: "none" };
type VisualIcon      = { type: "icon";      emoji: string; label?: string };
type VisualKeyword   = { type: "keyword";   text: string;  color?: string };
type VisualCounter   = { type: "counter";   from: number;  to: number; suffix: string };
type VisualInfoTip   = { type: "infotip";   title: string; items: string[] };
type VisualTechBadge = { type: "techbadge"; label?: string; tags: string[] };
type VisualDonut     = { type: "donut";     value: number; label: string; sublabel?: string; color?: string };
type VisualBarChart  = { type: "barchart";  title?: string; bars: { label: string; value: number; color?: string }[]; maxValue?: number };
type VisualLineChart = { type: "linechart"; title?: string; points: { label: string; value: number }[]; color?: string; unit?: string };
type VisualCallout   = { type: "callout";   text: string; sub?: string; color?: string };
type VisualSplit     = { type: "split";     emoji: string; title: string; items: string[]; color?: string };

type SceneVisual =
  | VisualNone | VisualIcon | VisualKeyword | VisualCounter
  | VisualInfoTip | VisualTechBadge
  | VisualDonut | VisualBarChart | VisualLineChart
  | VisualCallout | VisualSplit;

// ─────────────────────────────────────────────────────────────
// 씬 플랜 — AI 번아웃 (2026-03-19)
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: 지금 우리 조직의 에이스가 갑자기 무너지고 있다면 어떨까요?
  { id: 0, visuals: [{ type: "callout", text: "조직의 에이스가 무너진다", sub: "갑자기, 그리고 예고 없이", color: "#f87171" }] },
  // 1: 성과가 100이었던 팀원이 하루아침에 0이 되는 상황입니다.
  { id: 1, visuals: [
    { type: "barchart", title: "팀원 성과 붕괴", bars: [
      { label: "어제", value: 100, color: "#4ade80" },
      { label: "오늘", value: 5, color: "#f87171" },
    ], maxValue: 100 },
  ]},
  // 2: 이건 단순한 피로가 아니라 아주 위험한 신호탄입니다.
  { id: 2, visuals: [
    { type: "icon", emoji: "⚠️", label: "위험한 신호탄" },
    { type: "keyword", text: "단순 피로가 아니다", color: "#f97316" },
  ]},
  // 3: 특히 AI를 가장 잘 활용하는 리더와 팀원들에게서 나타나고 있죠.
  { id: 3, visuals: [
    { type: "techbadge", label: "AI 최고 활용자에서 먼저", tags: ["리더", "에이스 팀원", "혁신 선두"] },
  ]},
  // 4: 오늘 우리는 'AI 번아웃'이라는 낯선 괴물에 대해 이야기하려 합니다.
  { id: 4, visuals: [{ type: "callout", text: "AI 번아웃", sub: "낯선 괴물의 등장", color: "#f87171" }] },
  // 5: 분명 도구는 편해졌는데 왜 머리는 더 터질 것 같을까요?
  { id: 5, visuals: [
    { type: "split", emoji: "🤔", title: "도구 vs 뇌", items: ["✅ AI 도구는 더 편해졌다", "💥 뇌는 더 터질 것 같다"], color: "#f97316" },
  ]},
  // 6: 도입한 지 불과 몇 달 만에 조직 곳곳에서 경고음이 들립니다.
  { id: 6, visuals: [
    { type: "icon", emoji: "🚨", label: "조직 곳곳 경고음" },
    { type: "keyword", text: "불과 몇 달 만에", color: "#f87171" },
  ]},
  // 7: 이 문제를 방치하면 조직의 핵심 인재부터 사라지게 될 겁니다.
  { id: 7, visuals: [{ type: "keyword", text: "핵심 인재 이탈", color: "#f87171" }] },
  // 8: 현장에서 목격한 생생한 사례와 솔루션을 지금부터 공개합니다.
  { id: 8, visuals: [{ type: "icon", emoji: "🔍", label: "생생한 현장 사례 공개" }] },
  // 9: 가장 먼저 짚어볼 문제는 바로 '멀티태스킹의 함정'입니다.
  { id: 9, visuals: [{ type: "callout", text: "멀티태스킹의 함정", sub: "첫 번째 핵심 문제", color: "#f97316" }] },
  // 10: AI 시대에 다중 업무 능력은 필수 덕목처럼 여겨지죠.
  { id: 10, visuals: [{ type: "keyword", text: "멀티태스킹 = 필수?", color: "#94a3b8" }] },
  // 11: 하지만 현실은 여러 개의 AI 창을 띄워놓고 뇌를 혹사하는 중입니다.
  { id: 11, visuals: [
    { type: "icon", emoji: "🖥️", label: "AI 창 여러 개 동시 가동" },
    { type: "keyword", text: "뇌를 혹사하는 현실", color: "#f87171" },
  ]},
  // 12: 마치 24시간 쉬지 않는 초능력 외계인과 함께 일하는 기분일 겁니다.
  { id: 12, visuals: [
    { type: "icon", emoji: "👾", label: "쉬지 않는 초능력 외계인" },
    { type: "keyword", text: "24시간 옆에 있다", color: "#a78bfa" },
  ]},
  // 13: 욕심이 나니까 계속 일을 시키고, 그 결과물을 검토하느라 뇌가 타버리죠.
  { id: 13, visuals: [
    { type: "icon", emoji: "🔥", label: "결과물 검토하다 뇌가 타버린다" },
    { type: "keyword", text: "욕심이 뇌를 태운다", color: "#f97316" },
  ]},
  // 14: 하버드 비즈니스 리뷰는 이를 'Brain Fry'라고 부릅니다.
  { id: 14, visuals: [{ type: "callout", text: "Brain Fry", sub: "하버드 비즈니스 리뷰 공식 명칭", color: "#f97316" }] },
  // 15: 말 그대로 뇌가 튀겨지는 듯한 극심한 정신적 과부하 상태입니다.
  { id: 15, visuals: [{ type: "keyword", text: "극심한 정신적 과부하", color: "#f87171" }] },
  // 16: 동시에 4가지 이상의 일을 처리할 때 인간의 생산성은 바닥을 칩니다.
  { id: 16, visuals: [
    { type: "barchart", title: "동시 작업 수 vs 생산성", bars: [
      { label: "1가지", value: 100, color: "#4ade80" },
      { label: "2가지", value: 75, color: "#facc15" },
      { label: "4가지+", value: 20, color: "#f87171" },
    ], maxValue: 100 },
  ]},
  // 17: 그런데 우리는 매분 매초를 이 한계치에서 버티고 있습니다.
  { id: 17, visuals: [
    { type: "keyword", text: "매분 매초 한계치", color: "#f87171" },
    { type: "icon", emoji: "⏱️", label: "한계치에서 버티는 중" },
  ]},
  // 18: 단순히 '딸깍' 한 번으로 일이 끝나는 게 아니기 때문입니다.
  { id: 18, visuals: [{ type: "icon", emoji: "🖱️", label: "딸깍 한 번으로 끝나는 일이 아니다" }] },
  // 19: 결국 사람이 병목 구간이 되어 전체 시스템이 멈춰버리는 거죠.
  { id: 19, visuals: [{ type: "callout", text: "사람이 병목", sub: "전체 시스템이 멈춰버린다", color: "#f87171" }] },
  // 20: 이걸 개인의 의지력 문제로 치부해서는 절대 안 됩니다.
  { id: 20, visuals: [{ type: "keyword", text: "의지력 문제가 아니다", color: "#facc15" }] },
  // 21: 이제는 업무 설계 방식 자체를 완전히 재구성해야 할 때입니다.
  { id: 21, visuals: [{ type: "keyword", text: "업무 설계 완전 재구성", color: "#4ade80" }] },
  // 22: 현장의 요구는 무한하고 대응해야 할 변수는 끝이 없으니까요.
  { id: 22, visuals: [
    { type: "infotip", title: "멀티태스킹 함정 요약", items: ["현장 요구는 끝이 없다", "사람이 병목이 된다", "업무 설계 재구성 필요"] },
  ]},
  // 23: 여러분의 뇌가 타버리기 전에 스스로를 보호할 안전장치가 있나요?
  { id: 23, visuals: [{ type: "icon", emoji: "🛡️", label: "스스로를 보호할 안전장치" }] },
  // 24: 리더들이 명심해야 할 두 번째 핵심은 '동기 부여의 상실'입니다.
  { id: 24, visuals: [{ type: "callout", text: "동기 부여의 상실", sub: "두 번째 핵심 문제", color: "#a78bfa" }] },
  // 25: 조직 내에서 AI 혁신을 이끄는 에반젤리스트들이 있습니다.
  { id: 25, visuals: [
    { type: "techbadge", label: "AI 에반젤리스트", tags: ["AI 리더", "혁신 선구자", "조직의 엔진"] },
  ]},
  // 26: 누구보다 앞서서 기술을 익히고 조직의 생산성을 높이려 애쓰는 분들이죠.
  { id: 26, visuals: [{ type: "keyword", text: "조직의 생산성을 높인다", color: "#4ade80" }] },
  // 27: 그런데 정작 이들이 조직 안에서 고립되고 있다는 사실을 아시나요?
  { id: 27, visuals: [
    { type: "icon", emoji: "🏝️", label: "조직 안에서 고립" },
    { type: "keyword", text: "에이스가 고립된다", color: "#f87171" },
  ]},
  // 28: "열심히 해도 알아주는 사람이 없다"는 박탈감이 이들을 갉아먹습니다.
  { id: 28, visuals: [{ type: "callout", text: "알아주는 사람이 없다", sub: "박탈감이 에이스를 갉아먹는다", color: "#f87171" }] },
  // 29: 기존의 낡은 조직 구조와 AI의 속도가 충돌하며 생기는 균열입니다.
  { id: 29, visuals: [
    { type: "split", emoji: "⚡", title: "속도 충돌", items: ["🐌 낡은 조직 구조", "🚀 AI의 속도"], color: "#f97316" },
  ]},
  // 30: 사람 중심의 느린 프로세스 안에서 100배 빠른 인재는 괴짜 취급을 받기 쉽죠.
  { id: 30, visuals: [
    { type: "counter", from: 1, to: 100, suffix: "배 빠른 인재" },
    { type: "keyword", text: "괴짜 취급", color: "#f87171" },
  ]},
  // 31: AX는 단순한 기술 도입이 아니라 조직 문화의 전면 개조입니다.
  { id: 31, visuals: [{ type: "callout", text: "AX = 조직 문화 전면 개조", sub: "단순 기술 도입이 아니다", color: "#7bb4ff" }] },
  // 32: 과거의 협업 방식에 AI라는 엔진을 억지로 끼워 넣으면 엔진은 터집니다.
  { id: 32, visuals: [
    { type: "icon", emoji: "💥", label: "억지로 끼우면 엔진이 터진다" },
    { type: "keyword", text: "억지로 끼우면 터진다", color: "#f87171" },
  ]},
  // 33: 리더가 직접 AI 빌더가 되어 현장의 속도를 체감해야 하는 이유입니다.
  { id: 33, visuals: [
    { type: "keyword", text: "리더가 직접 AI 빌더", color: "#4ade80" },
    { type: "icon", emoji: "🛠️", label: "현장에서 직접 만든다" },
  ]},
  // 34: 실무를 모르는 리더가 내리는 지시가 팀원의 동기를 꺾고 있진 않나요?
  { id: 34, visuals: [
    { type: "icon", emoji: "🎯", label: "실무를 모르는 리더" },
    { type: "keyword", text: "팀원의 동기를 꺾는 지시", color: "#f87171" },
  ]},
  // 35: 혁신적인 팀원일수록 관계의 피로보다 업무의 본질에 집중하고 싶어 합니다.
  { id: 35, visuals: [{ type: "keyword", text: "업무의 본질에 집중", color: "#7bb4ff" }] },
  // 36: "사람이랑 힘들게 회의하느니 AI랑 일하는 게 편하다"는 말이 왜 나올까요?
  { id: 36, visuals: [{ type: "callout", text: "AI랑 일하는 게 편하다", sub: "회의 문화의 위기 신호", color: "#f97316" }] },
  // 37: 이건 소통 능력의 부재가 아니라 비효율에 대한 소리 없는 비명입니다.
  { id: 37, visuals: [{ type: "keyword", text: "비효율에 대한 소리 없는 비명", color: "#f87171" }] },
  // 38: 조직의 보고 체계와 회의 문화가 그대로라면 생산성 향상은 꿈같은 얘기입니다.
  { id: 38, visuals: [
    { type: "split", emoji: "📊", title: "바꾸지 않으면", items: ["📋 낡은 보고 체계 유지", "💤 생산성 향상은 꿈"], color: "#f87171" },
  ]},
  // 39: 오히려 밤새 공부하며 자신을 갈아 넣던 인재들이 먼저 퇴사표를 던질 겁니다.
  { id: 39, visuals: [
    { type: "icon", emoji: "🚪", label: "에이스가 먼저 퇴사" },
    { type: "keyword", text: "에이스가 먼저 나간다", color: "#f87171" },
  ]},
  // 40: 컴퓨터도 없던 시절의 규칙으로 슈퍼컴퓨터를 돌리라고 강요하지 마세요.
  { id: 40, visuals: [{ type: "callout", text: "과거 규칙으로 AI를 강요?", sub: "슈퍼컴퓨터에 낡은 규칙 적용 불가", color: "#f97316" }] },
  // 41: 리더가 먼저 도구를 잡고 비전을 제시해야 조직 전체가 움직입니다.
  { id: 41, visuals: [{ type: "keyword", text: "리더가 먼저 도구를 잡아라", color: "#4ade80" }] },
  // 42: 실리콘밸리의 거물들이 다시 실무로 복귀하는 흐름을 주목해야 합니다.
  { id: 42, visuals: [
    { type: "techbadge", label: "빅테크 실무 복귀 흐름", tags: ["CEO 직접 빌딩", "실무 리더십", "실리콘밸리 트렌드"] },
  ]},
  // 43: 현장을 모르는 리더는 AI 네이티브 팀을 절대 만들 수 없습니다.
  { id: 43, visuals: [
    { type: "keyword", text: "AI 네이티브 팀", color: "#7bb4ff" },
    { type: "icon", emoji: "❌", label: "현장 모르는 리더는 불가" },
  ]},
  // 44: 단순히 공모전이나 열고 영웅 한두 명을 뽑는 방식은 이제 끝났습니다.
  { id: 44, visuals: [{ type: "keyword", text: "공모전 방식 종료", color: "#f87171" }] },
  // 45: 구조 자체를 AI 최적화 상태로 재설계하는 결단이 필요합니다.
  { id: 45, visuals: [{ type: "callout", text: "구조를 AI 최적화로", sub: "전면 재설계 결단이 필요", color: "#4ade80" }] },
  // 46: 지금 고생하는 팀원들의 신호를 좌시하지 마십시오.
  { id: 46, visuals: [
    { type: "icon", emoji: "📡", label: "팀원의 신호를 포착하라" },
    { type: "keyword", text: "신호를 좌시 말라", color: "#facc15" },
  ]},
  // 47: 그들의 열정이 번아웃으로 타버리기 전에 탑다운의 변화를 보여줘야 합니다.
  { id: 47, visuals: [
    { type: "icon", emoji: "🔥", label: "열정이 번아웃으로 타버린다" },
    { type: "keyword", text: "탑다운의 변화", color: "#f97316" },
  ]},
  // 48: 우리가 AI를 부리는 기계가 아니라, AI가 우리를 돕는 구조를 만드세요.
  { id: 48, visuals: [
    { type: "split", emoji: "🤝", title: "AI와의 관계", items: ["❌ 우리가 AI를 혹사", "✅ AI가 우리를 돕는 구조"], color: "#4ade80" },
  ]},
  // 49: 가끔은 모든 연결을 끊고 숨을 고르는 시간도 반드시 필요합니다.
  { id: 49, visuals: [
    { type: "icon", emoji: "🌿", label: "디지털 디톡스" },
    { type: "keyword", text: "연결을 끊는 시간", color: "#4ade80" },
  ]},
  // 50: 복잡한 멀티태스킹에서 벗어나 오직 나 자신에게 집중하는 쉼표 말이죠.
  { id: 50, visuals: [{ type: "keyword", text: "오직 나에게 집중하는 쉼표", color: "#a78bfa" }] },
  // 51: 아무도 시키지 않았지만 미래를 위해 달리는 여러분을 진심으로 응원합니다.
  { id: 51, visuals: [
    { type: "icon", emoji: "🏃", label: "미래를 위해 달리는 중" },
    { type: "keyword", text: "진심으로 응원합니다", color: "#4ade80" },
  ]},
  // 52: 오늘 대본이 여러분의 조직을 살리는 작은 불씨가 되길 바랍니다.
  { id: 52, visuals: [{ type: "icon", emoji: "🕯️", label: "조직을 살리는 작은 불씨" }] },
  // 53: 도움이 되셨다면 구독과 알림 설정으로 다음 인사이트도 놓치지 마세요.
  { id: 53, visuals: [
    { type: "icon", emoji: "🔔", label: "구독 & 알림 설정" },
    { type: "icon", emoji: "👍", label: "좋아요 눌러주세요" },
  ]},
  // 54: 더 건강하고 강력한 조직을 만드는 길, 함께 고민하겠습니다.
  { id: 54, visuals: [{ type: "keyword", text: "더 건강하고 강력한 조직", color: "#4ade80" }] },
  // 55: 감사합니다.
  { id: 55, visuals: [{ type: "icon", emoji: "🙏", label: "감사합니다" }] },
];

// ─────────────────────────────────────────────────────────────
// 타임라인 빌더
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
  if (abs >= 100000000) return `${s}${Math.round(abs / 100000000)}억`;
  if (abs >= 10000)     return `${s}${Math.round(abs / 10000)}만`;
  return `${s}${Math.round(abs).toLocaleString()}`;
}

// ─────────────────────────────────────────────────────────────
// 공통 훅
// ─────────────────────────────────────────────────────────────
function usePopIn(durationInFrames: number) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ fps, frame, config: { damping: 14, stiffness: 130 } });
  const opacity = interpolate(
    frame, [0, 6, Math.max(7, durationInFrames - 8), durationInFrames], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  return { scale, opacity };
}

const CENTER: React.CSSProperties = {
  position: "absolute", left: "50%", top: "38%",
  transform: "translate(-50%, -50%)",
  textAlign: "center",
};

const FONT = "'Apple SD Gothic Neo','Noto Sans KR',sans-serif";

// ─────────────────────────────────────────────────────────────
// SceneIcon
// ─────────────────────────────────────────────────────────────
const SceneIcon: React.FC<{ v: VisualIcon; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scale, opacity } = usePopIn(dur);
  const pulseS = 1 + 0.18 * Math.sin((frame / fps) * Math.PI * 2.2);
  const pulseO = 0.22 - 0.12 * Math.sin((frame / fps) * Math.PI * 2.2);
  const pulse2S = 1 + 0.28 * Math.sin((frame / fps) * Math.PI * 1.8 + 1);
  const pulse2O = 0.12 - 0.08 * Math.sin((frame / fps) * Math.PI * 1.8 + 1);
  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})`, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", border: "2px solid rgba(123,180,255,0.55)", transform: `scale(${pulse2S})`, opacity: pulse2O }} />
        <div style={{ position: "absolute", width: 185, height: 185, borderRadius: "50%", border: "1.5px solid rgba(123,180,255,0.45)", transform: `scale(${pulseS})`, opacity: pulseO }} />
        <div style={{ position: "absolute", width: 155, height: 155, borderRadius: "50%", background: "radial-gradient(circle, rgba(123,180,255,0.15) 0%, transparent 70%)" }} />
        <div style={{ fontSize: 130, position: "relative", zIndex: 1 }}>{v.emoji}</div>
      </div>
      {v.label && (
        <div style={{ fontSize: 28, fontWeight: 600, marginTop: 14, color: "rgba(255,255,255,0.65)", letterSpacing: "0.12em", fontFamily: FONT, textAlign: "center" }}>{v.label}</div>
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
  const opacity = interpolate(frame, [0, 5, Math.max(6, dur - 8), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const color = v.color ?? "#7bb4ff";
  const underlineW = interpolate(frame, [8, 24], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})`, whiteSpace: "nowrap", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <span style={{ fontSize: 96, fontWeight: 900, color, fontFamily: FONT, letterSpacing: "-0.03em", textShadow: `0 0 80px ${color}55, 0 4px 16px rgba(0,0,0,0.5)` }}>{v.text}</span>
      <div style={{ height: 4, borderRadius: 2, marginTop: 10, alignSelf: "flex-start", background: `linear-gradient(90deg, ${color}, ${color}44)`, width: `${underlineW}%`, boxShadow: `0 0 20px ${color}88` }} />
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
  const opacity = interpolate(frame, [0, 6, Math.max(7, dur - 8), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - progress, 3);
  const value = v.from + (v.to - v.from) * eased;

  return (
    <div style={{ ...CENTER, opacity }}>
      <div style={{
        fontSize: 120, fontWeight: 900, lineHeight: 1,
        fontFamily: FONT,
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
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { scale, opacity } = usePopIn(dur);
  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})`, width: 800 }}>
      <div style={{
        padding: "40px 52px", borderRadius: 24,
        background: "rgba(8,8,20,0.78)", backdropFilter: "blur(20px)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 64px rgba(0,0,0,0.55)",
      }}>
        <div style={{
          fontSize: 26, fontWeight: 700, letterSpacing: "0.12em",
          color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 18,
        }}>{v.title}</div>
        <div style={{ height: 1, background: "rgba(255,255,255,0.1)", marginBottom: 24 }} />
        {v.items.map((item, i) => {
          const delay = i * 8;
          const itemOpacity = interpolate(frame, [delay + 4, delay + 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const itemX = spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 18, stiffness: 140 } });
          const tx = interpolate(itemX, [0, 1], [-22, 0]);
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: i < v.items.length - 1 ? 18 : 0, opacity: itemOpacity, transform: `translateX(${tx}px)` }}>
              <div style={{ width: 5, height: 36, borderRadius: 3, flexShrink: 0, background: "linear-gradient(180deg, #7bb4ff, #a855f7)" }} />
              <span style={{ fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontFamily: FONT }}>{item}</span>
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
  const opacity = interpolate(frame, [0, 8, Math.max(9, dur - 8), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <div style={{ ...CENTER, opacity, width: 800 }}>
      {v.label && (
        <div style={{
          fontSize: 22, fontWeight: 600, letterSpacing: "0.15em",
          color: "rgba(255,255,255,0.45)", textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 20,
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
// SceneDonut - SVG 도넛 차트 (크게)
// ─────────────────────────────────────────────────────────────
const SceneDonut: React.FC<{ v: VisualDonut; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const RAMP = Math.min(60, dur - 10);
  const progress = interpolate(frame, [0, RAMP], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 8, Math.max(9, dur - 8), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - progress, 3);

  const color = v.color ?? "#7bb4ff";
  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 155;
  const strokeWidth = 30;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (v.value / 100) * eased;
  const displayValue = Math.round(v.value * eased);

  return (
    <div style={{ ...CENTER, opacity, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke="rgba(255,255,255,0.07)" strokeWidth={strokeWidth} />
          {/* 글로우 */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth + 8} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference - filled}
            opacity={0.2} style={{ filter: "blur(6px)" }} />
          {/* 메인 */}
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference - filled} />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{
            fontSize: 100, fontWeight: 900, lineHeight: 1,
            fontFamily: FONT, color,
            textShadow: `0 0 60px ${color}77`,
          }}>{displayValue}%</span>
        </div>
      </div>
      <div style={{
        fontSize: 38, fontWeight: 700, color: "rgba(255,255,255,0.9)",
        fontFamily: FONT, marginTop: 8, letterSpacing: "0.04em",
      }}>{v.label}</div>
      {v.sublabel && (
        <div style={{
          fontSize: 24, color: "rgba(255,255,255,0.4)",
          fontFamily: FONT, marginTop: 8,
        }}>{v.sublabel}</div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneBarChart - 가로 바차트 (크게, 가독성 최우선)
// ─────────────────────────────────────────────────────────────
const SceneBarChart: React.FC<{ v: VisualBarChart; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const RAMP = Math.min(55, dur - 10);
  const opacity = interpolate(frame, [0, 8, Math.max(9, dur - 8), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const maxVal = v.maxValue ?? Math.max(...v.bars.map((b) => b.value));
  const BAR_MAX_W = 560;
  const BAR_H = 58;
  const GAP = 22;

  return (
    <div style={{ ...CENTER, opacity, width: 900 }}>
      {/* 타이틀 */}
      {v.title && (
        <div style={{
          fontSize: 26, fontWeight: 700, letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.45)", fontFamily: FONT,
          marginBottom: 30, textTransform: "uppercase",
        }}>{v.title}</div>
      )}

      {/* 카드 */}
      <div style={{
        background: "rgba(8,8,20,0.7)", borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        padding: "32px 40px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        {v.bars.map((bar, i) => {
          const color = bar.color ?? "#7bb4ff";
          const delay = i * 7;
          const barProgress = interpolate(frame, [delay, delay + RAMP], [0, 1], {
            extrapolateLeft: "clamp", extrapolateRight: "clamp",
          });
          const barEased = 1 - Math.pow(1 - barProgress, 3);
          const barW = (bar.value / maxVal) * BAR_MAX_W * barEased;
          const isLast = i === v.bars.length - 1;

          return (
            <div key={i} style={{ marginBottom: isLast ? 0 : GAP }}>
              {/* 라벨 + 수치 한 줄 */}
              <div style={{
                display: "flex", justifyContent: "space-between",
                alignItems: "baseline", marginBottom: 10,
              }}>
                <span style={{
                  fontSize: 28, fontWeight: 600,
                  color: "rgba(255,255,255,0.85)", fontFamily: FONT,
                }}>{bar.label}</span>
                <span style={{
                  fontSize: 32, fontWeight: 900, color,
                  fontFamily: FONT,
                  opacity: barProgress,
                  textShadow: `0 0 24px ${color}88`,
                }}>{bar.value}</span>
              </div>
              {/* 바 트랙 */}
              <div style={{
                width: "100%", height: BAR_H,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12, overflow: "hidden",
              }}>
                <div style={{
                  width: barW, height: "100%",
                  borderRadius: 12,
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  boxShadow: `0 0 30px ${color}55`,
                  position: "relative",
                }}>
                  {/* 반짝이 하이라이트 */}
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0,
                    height: "40%", borderRadius: "12px 12px 0 0",
                    background: "rgba(255,255,255,0.12)",
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneLineChart - SVG 라인차트
// ─────────────────────────────────────────────────────────────
const SceneLineChart: React.FC<{ v: VisualLineChart; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const RAMP = Math.min(60, dur - 10);
  const progress = interpolate(frame, [0, RAMP], [0, 1], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const opacity = interpolate(frame, [0, 8, Math.max(9, dur - 8), dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const eased = 1 - Math.pow(1 - progress, 3);

  const color = v.color ?? "#7bb4ff";
  const W = 860;
  const H = 300;
  const PAD = { top: 30, right: 50, bottom: 64, left: 50 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const maxVal = Math.max(...v.points.map((p) => p.value));
  const pts = v.points.map((p, i) => ({
    x: PAD.left + (i / (v.points.length - 1)) * innerW,
    y: PAD.top + (1 - p.value / maxVal) * innerH,
    value: p.value,
    label: p.label,
  }));

  const totalLength = pts.slice(1).reduce((acc, pt, i) => {
    const prev = pts[i];
    return acc + Math.sqrt(Math.pow(pt.x - prev.x, 2) + Math.pow(pt.y - prev.y, 2));
  }, 0);
  const dashOffset = totalLength * (1 - eased);
  const visiblePts = pts.filter((_, i) => i / (pts.length - 1) <= eased + 0.001);

  // 영역 채우기용 path
  const areaPath = [
    `M ${pts[0].x} ${PAD.top + innerH}`,
    ...pts.map((p) => `L ${p.x} ${p.y}`),
    `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`,
    "Z",
  ].join(" ");

  return (
    <div style={{ ...CENTER, opacity, width: W }}>
      {v.title && (
        <div style={{
          fontSize: 26, fontWeight: 700, letterSpacing: "0.1em",
          color: "rgba(255,255,255,0.45)", fontFamily: FONT,
          marginBottom: 20, textTransform: "uppercase",
        }}>{v.title}</div>
      )}

      <div style={{
        background: "rgba(8,8,20,0.7)", borderRadius: 24,
        border: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        padding: "28px 32px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
      }}>
        <svg width={W - 64} height={H} style={{ overflow: "visible" }}>
          {/* 그리드 */}
          {[0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i}
              x1={PAD.left} y1={PAD.top + (1 - t) * innerH}
              x2={PAD.left + innerW} y2={PAD.top + (1 - t) * innerH}
              stroke="rgba(255,255,255,0.06)" strokeWidth={1}
            />
          ))}

          {/* 영역 채우기 */}
          <clipPath id="lineClip">
            <rect x={0} y={0} width={(PAD.left + innerW * eased) + 10} height={H} />
          </clipPath>
          <path d={areaPath}
            fill={`url(#areaGrad)`} opacity={0.18}
            clipPath="url(#lineClip)"
          />
          <defs>
            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={1} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {/* 글로우 라인 */}
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={color} strokeWidth={10} strokeOpacity={0.15}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={totalLength} strokeDashoffset={dashOffset}
            style={{ filter: "blur(10px)" }}
          />
          {/* 메인 라인 */}
          <polyline
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={color} strokeWidth={4}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={totalLength} strokeDashoffset={dashOffset}
          />

          {/* 포인트 & 라벨 */}
          {visiblePts.map((pt, i) => {
            const isLast = i === visiblePts.length - 1;
            return (
              <g key={i}>
                {/* 포인트 */}
                <circle cx={pt.x} cy={pt.y} r={isLast ? 12 : 7}
                  fill={isLast ? color : "rgba(8,8,20,0.9)"}
                  stroke={color} strokeWidth={isLast ? 0 : 3}
                  style={{ filter: isLast ? `drop-shadow(0 0 14px ${color})` : "none" }}
                />
                {/* X축 라벨 */}
                <text x={pt.x} y={H - 4} textAnchor="middle"
                  fontSize={20} fill="rgba(255,255,255,0.5)" fontFamily={FONT}
                >{pt.label}</text>
                {/* 값 (위, 마지막만) */}
                {isLast && (
                  <text x={pt.x + 18} y={pt.y + 6} textAnchor="start"
                    fontSize={34} fontWeight={900} fill={color} fontFamily={FONT}
                    style={{ filter: `drop-shadow(0 0 12px ${color}99)` }}
                  >{pt.value}{v.unit ?? ""}</text>
                )}
                {/* 중간 포인트 값 */}
                {!isLast && i > 0 && (
                  <text x={pt.x} y={pt.y - 16} textAnchor="middle"
                    fontSize={18} fontWeight={700} fill={color} fontFamily={FONT}
                    opacity={0.7}
                  >{pt.value}{v.unit ?? ""}</text>
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
// SceneCallout - 임팩트 텍스트 박스 (글로우 보더 + 코너 액센트)
// ─────────────────────────────────────────────────────────────
const SceneCallout: React.FC<{ v: VisualCallout; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = v.color ?? "#7bb4ff";
  const scale = spring({ fps, frame, config: { damping: 16, stiffness: 140 } });
  const opacity = interpolate(frame, [0, 6, Math.max(7, dur - 8), dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const glow = 0.5 + 0.5 * Math.sin((frame / fps) * Math.PI * 2.4);
  const borderAlpha = Math.round(40 + glow * 50).toString(16).padStart(2, "0");
  const shadowBlur = 38 + glow * 32;

  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})`, width: 1000, textAlign: "center" }}>
      <div style={{
        padding: "52px 64px", borderRadius: 32,
        background: "rgba(8,8,20,0.88)", backdropFilter: "blur(28px)",
        border: `2px solid ${color}${borderAlpha}`,
        boxShadow: `0 0 ${shadowBlur}px ${color}30, 0 28px 80px rgba(0,0,0,0.65)`,
        position: "relative",
      }}>
        {/* Corner accents */}
        {[
          { top: 14, left: 14, borderTop: `2px solid ${color}`, borderLeft: `2px solid ${color}` } as React.CSSProperties,
          { top: 14, right: 14, borderTop: `2px solid ${color}`, borderRight: `2px solid ${color}` } as React.CSSProperties,
          { bottom: 14, left: 14, borderBottom: `2px solid ${color}`, borderLeft: `2px solid ${color}` } as React.CSSProperties,
          { bottom: 14, right: 14, borderBottom: `2px solid ${color}`, borderRight: `2px solid ${color}` } as React.CSSProperties,
        ].map((s, i) => <div key={i} style={{ position: "absolute", width: 28, height: 28, ...s }} />)}

        <div style={{ fontSize: 88, fontWeight: 900, color, fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1.15, textShadow: `0 0 60px ${color}66` }}>{v.text}</div>
        {v.sub && (
          <div style={{ fontSize: 30, color: "rgba(255,255,255,0.5)", fontFamily: FONT, marginTop: 18, letterSpacing: "0.05em" }}>{v.sub}</div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneSplit - 좌우 분할 패널 (이모지 + 스태거 리스트)
// ─────────────────────────────────────────────────────────────
const SceneSplit: React.FC<{ v: VisualSplit; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const color = v.color ?? "#7bb4ff";
  const opacity = interpolate(frame, [0, 8, Math.max(9, dur - 10), dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const slideY = spring({ fps, frame, config: { damping: 18, stiffness: 115 } });
  const ty = interpolate(slideY, [0, 1], [70, 0]);

  return (
    <div style={{ position: "absolute", left: "50%", top: "38%", transform: `translate(-50%, calc(-50% + ${ty}px))`, opacity, width: 1020 }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        background: "rgba(8,8,20,0.84)", borderRadius: 28,
        border: `1px solid ${color}33`, backdropFilter: "blur(26px)",
        boxShadow: `0 28px 80px rgba(0,0,0,0.65), 0 0 60px ${color}12`,
        overflow: "hidden",
      }}>
        {/* Left panel */}
        <div style={{
          width: 250, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "44px 28px",
          background: `linear-gradient(160deg, ${color}1e, ${color}08)`,
          borderRight: `1px solid ${color}28`,
        }}>
          <div style={{ fontSize: 96 }}>{v.emoji}</div>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: "0.14em", color, textTransform: "uppercase", marginTop: 18, fontFamily: FONT, textAlign: "center", lineHeight: 1.45 }}>{v.title}</div>
        </div>
        {/* Right panel */}
        <div style={{ flex: 1, padding: "38px 48px 38px 44px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          {v.items.map((item, i) => {
            const delay = i * 9;
            const iOp = interpolate(frame, [delay + 6, delay + 16], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const iSpring = spring({ fps, frame: Math.max(0, frame - delay), config: { damping: 18, stiffness: 140 } });
            const tx = interpolate(iSpring, [0, 1], [-28, 0]);
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 20, opacity: iOp, transform: `translateX(${tx}px)` }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", flexShrink: 0, background: color, boxShadow: `0 0 10px ${color}` }} />
                <span style={{ fontSize: 30, fontWeight: 600, color: "rgba(255,255,255,0.88)", fontFamily: FONT, lineHeight: 1.3 }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
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
            {v.type === "icon"      && <SceneIcon      v={v} dur={dur} />}
            {v.type === "keyword"   && <SceneKeyword   v={v} dur={dur} />}
            {v.type === "counter"   && <SceneCounter   v={v} dur={dur} />}
            {v.type === "infotip"   && <SceneInfoTip   v={v} dur={dur} />}
            {v.type === "techbadge" && <SceneTechBadge v={v} dur={dur} />}
            {v.type === "donut"     && <SceneDonut     v={v} dur={dur} />}
            {v.type === "barchart"  && <SceneBarChart  v={v} dur={dur} />}
            {v.type === "linechart" && <SceneLineChart v={v} dur={dur} />}
            {v.type === "callout"   && <SceneCallout   v={v} dur={dur} />}
            {v.type === "split"     && <SceneSplit     v={v} dur={dur} />}
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
          letterSpacing: "0.3em", fontFamily: FONT, marginBottom: 16,
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

      {/* 하단 프로그레스 바 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 3,
        width: `${progress * 100}%`,
        background: "linear-gradient(90deg,#4a9eff,#a855f7)",
        opacity: 0.6,
      }} />
    </div>
  );
};
