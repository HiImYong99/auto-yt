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
// 씬 플랜
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: 평생직장의 신화는 이미 산산조각 났습니다.
  { id: 0, visuals: [{ type: "callout", text: "평생직장 신화 붕괴", sub: "이미 산산조각 났다", color: "#f87171" }] },
  // 1: 우리가 그토록 굳게 믿어왔던 '노동의 가치'가 인공지능 앞에서 허무하게 무너지고 있죠.
  { id: 1, visuals: [
    { type: "keyword", text: "노동의 가치", color: "#f87171" },
    { type: "keyword", text: "AI 앞에 무너진다", color: "#f97316" },
  ]},
  // 2: 불과 몇 년 전만 해도 코딩만 배우면 평생 먹고산다고 떠들지 않았나요?
  { id: 2, visuals: [
    { type: "icon", emoji: "💻", label: "코딩 = 평생 직업?" },
    { type: "keyword", text: "이미 깨진 신화", color: "#f87171" },
  ]},
  // 3: 가장 먼저 AI에게 목이 날아가는 직군이 바로 개발자와 엘리트 화이트칼라.
  { id: 3, visuals: [
    { type: "keyword", text: "가장 먼저 날아간다", color: "#f87171" },
    { type: "techbadge", label: "AI 대체 1순위", tags: ["개발자", "엘리트직군", "화이트칼라"] },
    { type: "icon", emoji: "✂️", label: "일자리 잘려나가는 중" },
  ]},
  // 4: 단순히 사람과 대화만 나누던 낭만적인 AI 시대는 이미 끝났습니다.
  { id: 4, visuals: [
    { type: "keyword", text: "낭만의 AI 시대", color: "#94a3b8" },
    { type: "keyword", text: "이미 끝났다", color: "#f87171" },
  ]},
  // 5: 이제는 스스로 계획을 세우고 알아서 업무를 끝내버리는 '행동대장 AI'가 현장에 투입되고 있습니다.
  { id: 5, visuals: [
    { type: "callout", text: "행동대장 AI 등장", sub: "스스로 계획하고 업무를 끝낸다", color: "#f97316" },
    { type: "icon", emoji: "🤖", label: "자율 행동 AI 투입" },
  ]},
  // 6: 클릭 한 번이면 비행기 표 예매부터 복잡한 법률 검토까지 AI가 혼자 다 해버리는 세상이죠.
  { id: 6, visuals: [
    { type: "icon", emoji: "⚡", label: "클릭 한 번이면 전부" },
    { type: "techbadge", label: "AI 혼자 처리", tags: ["비행기 예매", "법률 검토", "업무 완결"] },
    { type: "keyword", text: "AI가 혼자 다 한다", color: "#7bb4ff" },
  ]},
  // 7: 중간에서 수수료를 떼어먹던 수많은 비즈니스, 정보의 격차를 이용해 돈을 벌던 직업들은 증발합니다.
  { id: 7, visuals: [
    { type: "icon", emoji: "💸", label: "정보 격차 비즈니스" },
    { type: "keyword", text: "수수료 모델 증발", color: "#f87171" },
    { type: "icon", emoji: "🌫️", label: "직업이 사라진다" },
  ]},
  // 8: 이게 뜻하는 바는 너무나 명확하고 또 끔찍합니다.
  { id: 8, visuals: [{ type: "callout", text: "너무나 명확하고 끔찍하다", color: "#f87171" }] },
  // 9: 여러분을 대신해 24시간 일할 똑똑한 노벨상 수상자 백만 명이 컴퓨터 안에 살게 되었다는 겁니다.
  { id: 9, visuals: [
    { type: "counter", from: 0, to: 1000000, suffix: "명" },
    { type: "infotip", title: "컴퓨터 속 노동자", items: ["24시간 쉬지 않는다", "노벨상급 지능", "여러분의 비서"] },
    { type: "keyword", text: "컴퓨터 속에 살게 됐다", color: "#7bb4ff" },
  ]},
  // 10: 경제가 돌아가려면 사람들이 돈을 벌고 소비를 해야 합니다. 그런데 일자리가 증발하면 어떻게 될까요.
  { id: 10, visuals: [
    { type: "icon", emoji: "💰", label: "소비 경제의 딜레마" },
    { type: "keyword", text: "일자리 증발 = ?", color: "#f87171" },
  ]},
  // 11: 그래서 우리는 이제 '일해서 돈 버는 것'과 '소득을 얻는 것'을 철저히 분리해서 생각해야 합니다.
  { id: 11, visuals: [
    { type: "keyword", text: "노동 ≠ 소득", color: "#facc15" },
    { type: "split", emoji: "⚖️", title: "완전 분리", items: ["💪 일해서 버는 것", "💰 소득을 얻는 것"], color: "#facc15" },
    { type: "keyword", text: "철저히 분리하라", color: "#4ade80" },
  ]},
  // 12: 과거의 성실한 월급쟁이 마인드로는 절대 다가올 거대한 쓰나미를 버틸 수 없어요.
  { id: 12, visuals: [
    { type: "icon", emoji: "🌊", label: "다가오는 거대한 쓰나미" },
    { type: "keyword", text: "월급쟁이 마인드 OUT", color: "#f87171" },
  ]},
  // 13: 국가에서 푼돈 쥐여주는 단순한 기본소득만 바라보고 있다가는 바닥으로 추락할 수밖에 없습니다.
  { id: 13, visuals: [
    { type: "icon", emoji: "📉", label: "기본소득만 바라보면" },
    { type: "keyword", text: "바닥으로 추락", color: "#f87171" },
  ]},
  // 14: 잠깐 채널 고정하시고, 구독과 좋아요 한 번씩 부탁드립니다.
  { id: 14, visuals: [
    { type: "icon", emoji: "👍", label: "구독 & 좋아요!" },
    { type: "icon", emoji: "🔔", label: "채널 고정하고 계속 보기" },
  ]},
  // 15: 이제 내 땀방울로 버는 노동 소득의 비중은 갈수록 쪼그라들 수밖에 없습니다.
  { id: 15, visuals: [
    { type: "linechart", title: "노동 소득 비중", points: [
      { label: "2020", value: 90 }, { label: "2024", value: 70 },
      { label: "2026", value: 50 }, { label: "2030", value: 20 },
    ], color: "#f87171", unit: "%" },
    { type: "keyword", text: "노동 소득 쪼그라든다", color: "#f87171" },
  ]},
  // 16: 대신 자본이 알아서 자본을 낳는 '투자 소득'이 생존을 위한 유일한 동아줄이 되겠죠.
  { id: 16, visuals: [
    { type: "callout", text: "투자 소득", sub: "생존을 위한 유일한 동아줄", color: "#4ade80" },
    { type: "icon", emoji: "💰", label: "자본이 자본을 낳는다" },
  ]},
  // 17: 그럼 도대체 어디에 내 피 같은 돈을 묻어야 다가올 미래에 살아남을 수 있을까요?
  { id: 17, visuals: [
    { type: "icon", emoji: "🎯", label: "어디에 투자해야 하나?" },
    { type: "keyword", text: "살아남는 투자처는?", color: "#facc15" },
  ]},
  // 18: 막연하게 AI 관련 주식 아무거나 사면 부자가 될 거라는 순진한 환상은 당장 버리셔야 합니다.
  { id: 18, visuals: [
    { type: "keyword", text: "AI 주식 아무거나?", color: "#f87171" },
    { type: "icon", emoji: "🚫", label: "순진한 환상을 버려라" },
  ]},
  // 19: 진짜 돈의 거대한 흐름은 '학습'을 넘어 '추론'의 영역으로 급격히 이동하고 있거든요.
  { id: 19, visuals: [
    { type: "keyword", text: "학습 → 추론", color: "#7bb4ff" },
    { type: "icon", emoji: "🧠", label: "추론의 시대로 이동 중" },
  ]},
  // 20: AI가 방대한 지식을 쑤셔 넣는 공부의 시간은 이미 끝을 향해 달려가고 있습니다.
  { id: 20, visuals: [
    { type: "keyword", text: "학습 시대 종료", color: "#94a3b8" },
    { type: "icon", emoji: "📚", label: "공부의 시간은 끝나간다" },
  ]},
  // 21: 이제는 배운 것을 써먹는 실전의 시간, 끊임없이 정답을 뱉어내야 하는 추론의 시대가 열렸습니다.
  { id: 21, visuals: [
    { type: "callout", text: "추론의 시대 개막", sub: "배운 것을 써먹는 실전의 시간", color: "#7bb4ff" },
    { type: "keyword", text: "끊임없이 정답을 뱉는다", color: "#a78bfa" },
    { type: "icon", emoji: "⚡", label: "추론 = 지금의 전쟁터" },
  ]},
  // 22: 여기서 상상을 초월하는 엄청난 전력과 거대한 데이터 센터가 쉴 새 없이 갈려 나가고 있어요.
  { id: 22, visuals: [
    { type: "icon", emoji: "🏭", label: "데이터 센터 24시간 풀가동" },
    { type: "counter", from: 0, to: 10, suffix: "GW" },
    { type: "keyword", text: "전력 무한 소비", color: "#facc15" },
  ]},
  // 23: 과거 닷컴 버블 때, 광케이블 깔던 회사들이 돈을 갈퀴로 쓸어 담았던 것처럼.
  { id: 23, visuals: [
    { type: "icon", emoji: "🔌", label: "닷컴 버블 - 광케이블" },
    { type: "keyword", text: "인프라가 돈을 긁어간다", color: "#facc15" },
  ]},
  // 24: 지금 미친 듯이 지어지고 있는 데이터 센터와 차세대 반도체가 바로 그 주인공입니다.
  { id: 24, visuals: [
    { type: "icon", emoji: "🏗️", label: "미친 듯이 짓는 데이터 센터" },
    { type: "techbadge", label: "지금의 주인공", tags: ["데이터센터", "차세대 반도체", "AI 인프라"] },
    { type: "keyword", text: "핵심 인프라에 집중하라", color: "#7bb4ff" },
  ]},
  // 25: 기존의 연산 칩이 덤프트럭이라면, 이제는 날렵한 세단형 신형 칩이 필요해졌습니다.
  { id: 25, visuals: [
    { type: "barchart", title: "칩 성능 진화", bars: [
      { label: "기존 연산 칩", value: 40, color: "#94a3b8" },
      { label: "차세대 추론 칩", value: 100, color: "#7bb4ff" },
    ], maxValue: 100 },
    { type: "keyword", text: "덤프트럭 → 세단형 칩", color: "#7bb4ff" },
    { type: "icon", emoji: "🚀", label: "차세대 반도체 혁명" },
  ]},
  // 26: 방대한 기억을 밀리초 단위로 끄집어내는 새로운 규격의 반도체를 독식할 숨은 승자.
  { id: 26, visuals: [
    { type: "keyword", text: "숨은 승자를 찾아라", color: "#facc15" },
    { type: "techbadge", label: "새로운 규격", tags: ["고대역폭 메모리", "AI 가속기", "추론 반도체"] },
    { type: "icon", emoji: "🏆", label: "반도체 독식자" },
  ]},
  // 27: 그 핵심 인프라를 지배하는 자가 앞으로 10년, 전 세계의 부를 독점하게 될 겁니다.
  { id: 27, visuals: [
    { type: "callout", text: "인프라 지배자", sub: "앞으로 10년, 전 세계 부를 독점한다", color: "#facc15" },
    { type: "counter", from: 0, to: 10, suffix: "년" },
  ]},
  // 28: 하지만 여기서 절대 방심하면 안 됩니다. 시장에 돈이 쏠리면 반드시 거품이 끓어오릅니다.
  { id: 28, visuals: [
    { type: "icon", emoji: "⚠️", label: "절대 방심 금지" },
    { type: "keyword", text: "거품이 끓어오른다", color: "#f97316" },
  ]},
  // 29: 모두가 장밋빛 미래를 환호하며 돈을 던질 때, 폭탄 돌리기가 시작됐다는 걸 직시해야 합니다.
  { id: 29, visuals: [
    { type: "icon", emoji: "💣", label: "폭탄 돌리기 시작" },
    { type: "keyword", text: "모두가 환호할 때 조심", color: "#f87171" },
    { type: "icon", emoji: "👁️", label: "냉정하게 직시하라" },
  ]},
  // 30: 결국 거품이 터지고 난 뒤, 극소수의 기업들이 시장을 통째로 집어삼킵니다.
  { id: 30, visuals: [
    { type: "donut", value: 5, label: "살아남는 기업", sublabel: "시장 전체를 집어삼킨다", color: "#4ade80" },
    { type: "keyword", text: "극소수만 살아남는다", color: "#4ade80" },
  ]},
  // 31: 우리는 거품이 터지기 직전에 눈치껏 치고 빠지거나, 진짜배기에 투자해야 합니다.
  { id: 31, visuals: [
    { type: "split", emoji: "🎯", title: "생존 전략 2가지", items: ["💨 거품 직전 치고 빠지기", "💎 잿더미 속 진짜배기 투자"], color: "#4ade80" },
    { type: "keyword", text: "눈치껏 행동하라", color: "#4ade80" },
    { type: "icon", emoji: "♟️", label: "판을 읽는 자가 이긴다" },
  ]},
  // 32: 그렇다고 AI라는 화려한 신기술 자체에만 매몰될 필요는 전혀 없어요.
  { id: 32, visuals: [
    { type: "keyword", text: "AI 신기술만?", color: "#94a3b8" },
    { type: "icon", emoji: "🙅", label: "그것만이 전부가 아니다" },
  ]},
  // 33: 오히려 낡고 고루한 전통 기업들이 AI라는 무기를 장착했을 때 엄청난 파괴력이 터져 나옵니다.
  { id: 33, visuals: [
    { type: "keyword", text: "전통 기업 + AI", color: "#facc15" },
    { type: "icon", emoji: "💥", label: "엄청난 파괴력 폭발" },
  ]},
  // 34: 투박한 마트가 AI를 도입해 재고 관리 비용을 미친 듯이 줄여버리는 걸 보세요.
  { id: 34, visuals: [
    { type: "icon", emoji: "🏪", label: "마트 + AI = 비용 절감" },
    { type: "barchart", title: "AI 도입 비용 절감", bars: [
      { label: "기존", value: 100, color: "#f87171" },
      { label: "AI 도입 후", value: 30, color: "#4ade80" },
    ], maxValue: 100 },
  ]},
  // 35: 구경제와 신경제가 충돌하는 폭발적인 교차점에 황금 보물들이 널려 있습니다.
  { id: 35, visuals: [
    { type: "keyword", text: "구경제 × 신경제", color: "#facc15" },
    { type: "icon", emoji: "💎", label: "교차점에 황금 보물이 있다" },
  ]},
  // 36: 물론 이 미친 변동성 속에서 내 소중한 자산을 지키는 건 피 말리는 멘탈 싸움입니다.
  { id: 36, visuals: [
    { type: "icon", emoji: "🎢", label: "미친 변동성" },
    { type: "keyword", text: "피 말리는 멘탈 싸움", color: "#f87171" },
  ]},
  // 37: 오늘 천만 원 수익이 났다고 해서, 내일도 그 돈을 번다는 보장이 없는 냉혹한 투자 판.
  { id: 37, visuals: [
    { type: "counter", from: 10000000, to: 0, suffix: "원" },
    { type: "keyword", text: "보장 없는 수익", color: "#f87171" },
  ]},
  // 38: 매달 꼬박꼬박 꽂히는 월급처럼, 절대로 흔들리지 않는 현금 흐름을 세팅하는 게 생존의 기본.
  { id: 38, visuals: [
    { type: "keyword", text: "흔들리지 않는 현금 흐름", color: "#4ade80" },
    { type: "infotip", title: "현금 흐름 세팅", items: ["매달 꼬박꼬박", "흔들리지 않는 수익", "생존의 기본"] },
    { type: "icon", emoji: "💳", label: "현금 흐름 구조 만들기" },
  ]},
  // 39: 대박을 노리고 몰빵하는 대신, 다양한 바구니에 영리하게 분산해서 수익 구조를 만들어야.
  { id: 39, visuals: [
    { type: "icon", emoji: "🧺", label: "다양한 바구니에 분산" },
    { type: "keyword", text: "몰빵 NO 분산 YES", color: "#4ade80" },
    { type: "infotip", title: "분산 투자", items: ["여러 바구니에 나눠 담기", "영리한 포트폴리오", "끄떡없는 수익 구조"] },
  ]},
  // 40: 국가 간 패권 다툼, 금리의 오르내림 같은 거대한 파도는 계속 우리 숨통을 조여옵니다.
  { id: 40, visuals: [
    { type: "icon", emoji: "🌏", label: "패권 다툼 & 금리 파도" },
    { type: "keyword", text: "거대한 파도가 조여온다", color: "#f87171" },
  ]},
  // 41: 이럴 때일수록 전 세계 다양한 자산에 씨앗을 흩뿌려두는 유연함만이 유일한 해법.
  { id: 41, visuals: [
    { type: "keyword", text: "전 세계에 씨앗을 뿌려라", color: "#4ade80" },
    { type: "techbadge", label: "글로벌 분산", tags: ["미국", "한국", "ETF", "실물자산"] },
    { type: "icon", emoji: "🌱", label: "유연함이 유일한 해법" },
  ]},
  // 42: 영상 보시면서 공감되는 부분이 있다면 댓글로 여러분의 생각도 남겨주세요.
  { id: 42, visuals: [
    { type: "icon", emoji: "💬", label: "댓글로 생각 남겨주세요" },
    { type: "icon", emoji: "🙏", label: "계속해서 달려볼게요" },
  ]},
  // 43: 자, 그럼 가장 현실적인 고민으로. 우리 아이들은 어떻게 키워야 할까요.
  { id: 43, visuals: [
    { type: "icon", emoji: "👶", label: "우리 아이들을 어떻게?" },
    { type: "keyword", text: "AI 시대 육아법", color: "#a78bfa" },
  ]},
  // 44: 국영수 학원, 예체능 학원에 목매는 건 기계와 스펙 경쟁하는 겁니다.
  { id: 44, visuals: [
    { type: "icon", emoji: "🏫", label: "스펙 경쟁은 이제 무의미" },
    { type: "keyword", text: "기계와 스펙 경쟁?", color: "#f87171" },
    { type: "icon", emoji: "❌", label: "AI 앞에 학벌 무용지물" },
  ]},
  // 45: 기계가 절대 가질 수 없는, 인간만의 날카로운 '안목'을 벼려줘야 해요.
  { id: 45, visuals: [
    { type: "keyword", text: "인간만의 안목", color: "#facc15" },
    { type: "icon", emoji: "👁️", label: "기계가 절대 가질 수 없는 것" },
  ]},
  // 46: AI가 수만 개의 시안을 쏟아낼 때, 진짜 돈이 될 단 하나의 정답을 핀셋처럼 골라낼 능력.
  { id: 46, visuals: [
    { type: "counter", from: 0, to: 10000, suffix: "개" },
    { type: "keyword", text: "단 하나의 정답", color: "#facc15" },
    { type: "icon", emoji: "🔬", label: "핀셋처럼 골라낸다" },
  ]},
  // 47: 만약 아이가 특정 장난감이나 게임에 미쳐 있다면, 그걸 억누르지 마세요.
  { id: 47, visuals: [
    { type: "icon", emoji: "🎮", label: "게임에 미쳐있다면?" },
    { type: "keyword", text: "억누르지 마라", color: "#4ade80" },
  ]},
  // 48: 그 좁고 깊은 오타쿠 같은 집요한 몰입이 AI 시대에는 가장 강력한 무기가 됩니다.
  { id: 48, visuals: [
    { type: "callout", text: "오타쿠 몰입", sub: "AI 시대 가장 강력한 무기", color: "#a78bfa" },
    { type: "keyword", text: "깊이가 곧 경쟁력", color: "#a78bfa" },
  ]},
  // 49: 단돈 몇 푼 없이도 방구석에서 전 세계를 상대로 비즈니스를 벌일 수 있는 미친 시대.
  { id: 49, visuals: [
    { type: "icon", emoji: "🌍", label: "방구석 → 전 세계 비즈니스" },
    { type: "keyword", text: "자본 없이 창업 가능", color: "#4ade80" },
    { type: "icon", emoji: "🚀", label: "미친 기회의 시대" },
  ]},
  // 50: 아이디어 하나만 던져주면 코딩, 디자인, 마케팅까지 AI가 알아서 다 찍어내는 마법 같은 세상.
  { id: 50, visuals: [
    { type: "techbadge", label: "AI가 다 해준다", tags: ["코딩", "디자인", "마케팅"] },
    { type: "keyword", text: "아이디어만 있으면", color: "#7bb4ff" },
    { type: "icon", emoji: "✨", label: "마법 같은 세상" },
  ]},
  // 51: 망해도 타격이 없는 가벼운 창업을 무한히 반복하게 만들면서, 회복 탄력성을 키워줘야 합니다.
  { id: 51, visuals: [
    { type: "infotip", title: "AI 시대 창업 교육", items: ["가벼운 창업 무한 반복", "실패해도 OK", "회복 탄력성을 키운다"] },
    { type: "keyword", text: "실패를 두려워하지 마라", color: "#4ade80" },
    { type: "icon", emoji: "🔄", label: "무한 반복 도전" },
  ]},
  // 52: 이 거대한 문명의 전환기 앞에서 가만히 숨만 쉬고 있는 건, 세상에서 가장 멍청한 선택.
  { id: 52, visuals: [
    { type: "callout", text: "가만히 있으면 끝", sub: "가장 멍청한 선택", color: "#f87171" },
    { type: "keyword", text: "문명 전환기에 행동하라", color: "#facc15" },
    { type: "icon", emoji: "⏰", label: "지금 당장 움직여라" },
  ]},
  // 53: 귀찮더라도 매일 경제 뉴스를 챙겨보고, 세상의 미세한 흐름을 읽어내는 생존 루틴을 만들어야 합니다.
  { id: 53, visuals: [
    { type: "icon", emoji: "📰", label: "매일 경제 뉴스 챙기기" },
    { type: "keyword", text: "나만의 생존 루틴", color: "#4ade80" },
    { type: "infotip", title: "생존 루틴", items: ["매일 경제 뉴스", "미세한 흐름 포착", "습관이 생존이다"] },
  ]},
  // 54: 정보 쓰레기 더미 속에서, 진짜 돈 냄새를 맡는 짐승 같은 감각은 오직 반복에서 나옵니다.
  { id: 54, visuals: [
    { type: "icon", emoji: "🐺", label: "짐승 같은 감각" },
    { type: "keyword", text: "돈 냄새를 맡아라", color: "#facc15" },
    { type: "callout", text: "반복이 감각을 만든다", color: "#facc15" },
  ]},
  // 55: 영상이 끝나면 지금 당장 AI 도구들을 켜서 이것저것 미친 듯이 써봐야 합니다.
  { id: 55, visuals: [
    { type: "keyword", text: "당장 AI 도구를 켜라", color: "#7bb4ff" },
    { type: "icon", emoji: "💻", label: "직접 써봐야 안다" },
    { type: "techbadge", label: "지금 바로", tags: ["ChatGPT", "Claude", "Gemini", "Cursor"] },
  ]},
  // 56: 자전거 타는 법을 글로 배울 수 없듯, AI 역시 직접 부딪히고 깨져봐야 온전히 내 것이 됩니다.
  { id: 56, visuals: [
    { type: "icon", emoji: "🚲", label: "자전거 = 직접 타야 배운다" },
    { type: "keyword", text: "직접 부딪혀야 한다", color: "#7bb4ff" },
  ]},
  // 57: 지금 당장 AI를 거칠게 부려먹는 사람과, AI가 일하는 걸 구경만 하는 사람.
  { id: 57, visuals: [
    { type: "split", emoji: "⚡", title: "두 종류의 인간", items: ["🔥 AI를 거칠게 부려먹는 사람", "👀 AI를 구경만 하는 사람"], color: "#7bb4ff" },
    { type: "keyword", text: "당신은 어느 쪽?", color: "#facc15" },
    { type: "icon", emoji: "🔱", label: "부려먹는 자 vs 구경꾼" },
  ]},
  // 58: 불과 10년 뒤, 이 두 사람의 통장 잔고와 인생의 격차는 우주와 먼지 수준으로 아득해질 겁니다.
  { id: 58, visuals: [
    { type: "barchart", title: "10년 후 격차", bars: [
      { label: "AI 활용자", value: 100, color: "#4ade80" },
      { label: "구경꾼", value: 1, color: "#f87171" },
    ], maxValue: 100 },
    { type: "keyword", text: "우주와 먼지의 격차", color: "#facc15" },
  ]},
  // 59: 평생 구경꾼으로만 남을 것인가, 아니면 새로운 부의 폭주 기관차에 올라탈 것인가.
  { id: 59, visuals: [
    { type: "icon", emoji: "🚂", label: "부의 폭주 기관차" },
    { type: "keyword", text: "올라탈 것인가 아닌가", color: "#facc15" },
  ]},
  // 60: 거대한 부의 이동은 이미 시작됐습니다. 선택은 오직 여러분의 몫입니다.
  { id: 60, visuals: [{ type: "callout", text: "부의 이동은 시작됐다", sub: "선택은 오직 여러분의 몫", color: "#4ade80" }] },
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
    frame, [0, 6, durationInFrames - 8, durationInFrames], [0, 1, 1, 0],
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
  const opacity = interpolate(frame, [0, 5, dur - 8, dur], [0, 1, 1, 0], {
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
  const opacity = interpolate(frame, [0, 6, dur - 8, dur], [0, 1, 1, 0], {
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
  const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
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
  const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
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
  const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
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
  const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], {
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
  const opacity = interpolate(frame, [0, 6, dur - 8, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
  const opacity = interpolate(frame, [0, 8, dur - 10, dur], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
