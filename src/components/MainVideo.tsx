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
// Design Tokens
// ─────────────────────────────────────────────────────────────
const TEXT    = "#FFFFFF";
const MUTED   = "#A1A1AA";
const ACCENT  = "#FF6B6B";
const SURFACE = "#1E1E1E";
const BORDER  = "rgba(255,255,255,0.08)";
const FONT    = "'Apple SD Gothic Neo','Noto Sans KR',sans-serif";

// ─────────────────────────────────────────────────────────────
// 시각 요소 타입 (color 필드는 하위 호환용, 렌더링에서 무시)
// ─────────────────────────────────────────────────────────────
type VisualNone        = { type: "none" };
type VisualIcon        = { type: "icon";        emoji: string; label?: string };
type VisualKeyword     = { type: "keyword";      text: string;  color?: string };
type VisualCounter     = { type: "counter";      from: number;  to: number; suffix: string };
type VisualInfoTip     = { type: "infotip";      title: string; items: string[] };
type VisualTechBadge   = { type: "techbadge";    label?: string; tags: string[] };
type VisualDonut       = { type: "donut";        value: number; label: string; sublabel?: string; color?: string };
type VisualBarChart    = { type: "barchart";     title?: string; bars: { label: string; value: number; color?: string }[]; maxValue?: number };
type VisualLineChart   = { type: "linechart";    title?: string; points: { label: string; value: number }[]; color?: string; unit?: string };
type VisualCallout     = { type: "callout";      text: string; sub?: string; color?: string };
type VisualSplit       = { type: "split";        emoji: string; title: string; items: string[]; color?: string };
type VisualFeatureCard = { type: "featurecard";  icon: string; title: string; sub?: string };
type VisualMockup      = { type: "mockup";       device: "phone" | "monitor"; lines?: string[] };
type VisualArrow       = { type: "arrow";        label?: string };

type SceneVisual =
  | VisualNone | VisualIcon | VisualKeyword | VisualCounter
  | VisualInfoTip | VisualTechBadge
  | VisualDonut | VisualBarChart | VisualLineChart
  | VisualCallout | VisualSplit
  | VisualFeatureCard | VisualMockup | VisualArrow;

// ─────────────────────────────────────────────────────────────
// 씬 플랜 — 클로드 에이전트 팀 완전 분석 (2026-03-22)
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: AI 코딩을 아직도 1대1 대화형으로만 쓰고 계신가요?
  { id: 0, visuals: [{ type: "callout", text: "AI 코딩, 아직도 1대1로?", sub: "잠재력의 10%도 못 쓰는 중" }] },
  // 1: 그렇다면 당신은 최신 AI가 가진 잠재력의 10%도 채 쓰지 못하고 있는 겁니다.
  { id: 1, visuals: [{ type: "counter", from: 0, to: 10, suffix: "% 잠재력만 쓰는 중" }] },
  // 2: 이제는 단일 AI에게 모든 걸 맡기는 시대가 끝났습니다.
  { id: 2, visuals: [{ type: "keyword", text: "단일 AI의 시대 끝났다" }] },
  // 3: 목적에 맞게 훈련된 AI들을 하나의 '팀'으로 묶어서 굴려야 하는 시대죠.
  { id: 3, visuals: [{ type: "icon", emoji: "👥", label: "AI를 팀으로 묶어 굴려라" }] },
  // 4: 클로드 코드의 최신 기술인 '에이전트 팀'이 바로 그 혁신의 중심에 있습니다.
  { id: 4, visuals: [{ type: "callout", text: "에이전트 팀", sub: "클로드 코드 혁신의 중심" }] },
  // 5: 이건 단순히 여러 개의 채팅창을 띄워놓고 복사 붙여넣기를 하는 수준이 아닙니다.
  { id: 5, visuals: [{ type: "keyword", text: "채팅창 복붙이 아니다" }] },
  // 6: 하나의 완벽한 오케스트라처럼, 지휘자와 연주자들이 각자의 역할을 수행하는 구조입니다.
  { id: 6, visuals: [{ type: "icon", emoji: "🎼", label: "지휘자 + 연주자 오케스트라 구조" }] },
  // 7: 메인 에이전트가 프로젝트 매니저가 되어 전체 큰 그림을 그립니다.
  { id: 7, visuals: [{ type: "featurecard", icon: "🎯", title: "메인 에이전트 = PM", sub: "전체 큰 그림 설계·지휘" }] },
  // 8: 그리고 그 밑에 프론트엔드, 백엔드, 아키텍처를 담당하는 팀원들을 직접 생성하죠.
  { id: 8, visuals: [{ type: "techbadge", label: "자동 생성되는 팀원들", tags: ["프론트엔드", "백엔드", "아키텍처"] }] },
  // 9: 여기서 기존의 단순한 '서브 에이전트' 기능과 본질적인 차이가 발생합니다.
  { id: 9, visuals: [{ type: "callout", text: "서브 에이전트와 본질적 차이", sub: "기존과 완전히 다르다" }] },
  // 10: 과거의 서브 에이전트들은 철저히 고립되어 있었습니다.
  { id: 10, visuals: [{ type: "icon", emoji: "🏝️", label: "기존: 완전한 고립 구조" }] },
  // 11: 자기가 무슨 일을 하는지 메인 AI와만 소통할 뿐, 옆자리 동료가 뭘 하는진 전혀 몰랐죠.
  { id: 11, visuals: [{ type: "split", emoji: "🚫", title: "기존 고립 구조", items: ["메인 AI와만 소통", "옆 동료가 뭘 하는지 몰라"] }] },
  // 12: 하지만 에이전트 팀은 다릅니다. 이들은 서로 다이렉트 메시지를 주고받으며 맥락을 공유합니다.
  { id: 12, visuals: [{ type: "callout", text: "에이전트 팀은 DM으로 소통", sub: "맥락을 실시간 공유" }] },
  // 13: 백엔드 에이전트가 API 구조를 짜면, 그걸 즉각적으로 프론트엔드 에이전트에게 전달합니다.
  { id: 13, visuals: [{ type: "arrow", label: "백엔드 API 구조 → 프론트엔드 즉각 전달" }] },
  // 14: "내가 이렇게 데이터를 넘길 테니, 너는 이렇게 UI를 그려"라고 스스로 조율하는 겁니다.
  { id: 14, visuals: [{ type: "callout", text: "스스로 조율하는 AI들", sub: "\"내가 API 줄게, 너는 UI 그려\"" }] },
  // 15: 인간 개발팀이 슬랙에서 대화하며 작업하는 것과 완벽히 똑같은 프로세스입니다.
  { id: 15, visuals: [{ type: "icon", emoji: "💬", label: "슬랙 개발팀과 동일한 프로세스" }] },
  // 16: 이 모든 과정이 당신이 커피 한 모금을 마시는 그 찰나의 순간에 병렬로 처리됩니다.
  { id: 16, visuals: [{ type: "callout", text: "커피 한 모금 = 전체 완료", sub: "병렬 처리의 위력" }] },
  // 17: 하지만 무턱대고 AI 팀원을 마구잡이로 고용하면 치명적인 문제가 생깁니다.
  { id: 17, visuals: [{ type: "callout", text: "마구잡이 고용의 함정", sub: "치명적인 문제 발생" }] },
  // 18: 바로 비용입니다. 에이전트가 켜질 때마다 API 토큰 비용은 선형적으로 폭발하게 되니까요.
  { id: 18, visuals: [{ type: "keyword", text: "API 토큰 비용이 폭발한다" }] },
  // 19: 그래서 실전에서는 이 팀을 아주 영악하게 세팅해야 합니다.
  { id: 19, visuals: [{ type: "icon", emoji: "🧠", label: "영악하게 세팅해야 한다" }] },
  // 20: 모델별 성능과 가격 차이를 철저하게 이용하는 게 핵심 인사이트입니다.
  { id: 20, visuals: [{ type: "infotip", title: "핵심 인사이트", items: ["모델별 성능 차이 이용", "가격 차이를 전략적으로", "역할별 모델 최적화"] }] },
  // 21: 복잡한 비즈니스 로직이나 아키텍처 설계는 가장 똑똑한 최고 성능의 모델에게 맡기세요.
  { id: 21, visuals: [{ type: "featurecard", icon: "🧠", title: "시니어 모델 배정", sub: "복잡한 로직·아키텍처 전담" }] },
  // 22: 하지만 단순한 UI 컴포넌트 제작이나 오탈자 검수 같은 반복 작업은 어떨까요?
  { id: 22, visuals: [{ type: "keyword", text: "단순 반복 작업은 따로 있다" }] },
  // 23: 여기에 무거운 모델을 쓰는 건 돈 낭비입니다. 가볍고 빠른 모델을 배정하는 겁니다.
  { id: 23, visuals: [{ type: "featurecard", icon: "💨", title: "주니어 모델 배정", sub: "단순 작업에 경량 모델" }] },
  // 24: "지휘관과 핵심 브레인은 시니어급으로, 단순 실무진은 주니어급으로" 명확히 급을 나누세요.
  { id: 24, visuals: [{ type: "split", emoji: "⚖️", title: "모델 급 나누기", items: ["🧠 시니어급 → 복잡 작업", "💨 주니어급 → 단순 작업"] }] },
  // 25: 이게 바로 비용은 절반으로 줄이면서 퍼포먼스는 두 배로 뽑아내는 실무진의 비밀입니다.
  { id: 25, visuals: [{ type: "barchart", title: "최적 배분 효과", bars: [{ label: "비용", value: 50 }, { label: "퍼포먼스", value: 100 }], maxValue: 100 }] },
  // 26: 에이전트 팀이 주는 또 다른 압도적인 강점은 바로 '편향성 제거'에 있습니다.
  { id: 26, visuals: [{ type: "callout", text: "편향성 제거", sub: "두 번째 압도적 강점" }] },
  // 27: 우리가 코드를 짜다 막히면 AI에게 에러 로그를 던져주고 원인을 묻곤 하죠.
  { id: 27, visuals: [{ type: "icon", emoji: "🐛", label: "에러 로그를 AI에 던진다" }] },
  // 28: 하지만 AI도 한 번 특정 원인에 꽂히면 '확증 편향'에 빠지기 쉽습니다.
  { id: 28, visuals: [{ type: "callout", text: "AI의 확증 편향", sub: "처음 내린 결론에 집착" }] },
  // 29: 다른 가능성은 무시한 채, 자기가 처음 내린 결론에만 집착하게 되는 겁니다.
  { id: 29, visuals: [{ type: "keyword", text: "첫 결론에만 집착한다" }] },
  // 30: 이럴 때 에이전트 팀을 활용해 '가설 검증반'을 꾸려보세요.
  { id: 30, visuals: [{ type: "callout", text: "가설 검증반을 꾸려라", sub: "에이전트 팀 최강 활용법" }] },
  // 31: 원인을 알 수 없는 버그가 터졌다면, 메인 에이전트에게 5개의 서로 다른 가설을 세우게 합니다.
  { id: 31, visuals: [{ type: "counter", from: 0, to: 5, suffix: "개의 독립 가설" }] },
  // 32: 그리고 5명의 에이전트에게 각각 하나의 가설만을 파고들도록 지시하는 겁니다.
  { id: 32, visuals: [{ type: "techbadge", label: "5인 전담 팀", tags: ["가설 1", "가설 2", "가설 3", "가설 4", "가설 5"] }] },
  // 33: 이들은 서로의 기존 맥락을 모른 채, 오직 자신이 맡은 가설 하나만 맹렬하게 파헤칩니다.
  { id: 33, visuals: [{ type: "keyword", text: "독립적 맹렬 조사" }] },
  // 34: 편견 없는 독립적인 조사가 끝난 후, 메인 에이전트가 이들의 리포트를 종합합니다.
  { id: 34, visuals: [{ type: "icon", emoji: "📊", label: "리포트 종합 → 최적 결론" }] },
  // 35: 어떤 가설이 진짜 원인인지 가장 객관적이고 정확한 결론을 도출해 내는 거죠.
  { id: 35, visuals: [{ type: "callout", text: "가장 객관적인 결론 도출", sub: "편향 없는 5각도 분석" }] },
  // 36: 단일 AI와 스물고개를 하는 것보다 훨씬 빠르고 날카로운 디버깅 방식입니다.
  { id: 36, visuals: [{ type: "split", emoji: "⚡", title: "디버깅 방식 비교", items: ["❌ 단일 AI: 스물고개", "✅ 팀: 5각도 병렬 조사"] }] },
  // 37: 이 다각도 접근법은 '코드 리뷰'를 할 때도 미친듯한 효율을 보여줍니다.
  { id: 37, visuals: [{ type: "callout", text: "코드 리뷰에서도 미친 효율", sub: "다각도 접근법" }] },
  // 38: 한 명은 해커의 시선으로 보안 취약점만 집요하게 파고듭니다.
  { id: 38, visuals: [{ type: "featurecard", icon: "🔐", title: "보안 전문 에이전트", sub: "해커 시선으로 취약점 탐색" }] },
  // 39: 다른 한 명은 렌더링 속도와 메모리 누수 같은 퍼포먼스 최적화만 검사하죠.
  { id: 39, visuals: [{ type: "featurecard", icon: "⚡", title: "퍼포먼스 전문 에이전트", sub: "속도 + 메모리 최적화" }] },
  // 40: 또 다른 한 명은 엣지 케이스를 찾아내며 테스트 커버리지의 맹점을 공격합니다.
  { id: 40, visuals: [{ type: "featurecard", icon: "🎯", title: "테스트 전문 에이전트", sub: "엣지 케이스 + 커버리지" }] },
  // 41: 시니어 개발자 3명이 당신의 코드를 현미경으로 들여다보는 것과 같습니다.
  { id: 41, visuals: [{ type: "counter", from: 0, to: 3, suffix: "명의 시니어가 리뷰" }] },
  // 42: 단순히 코드를 짜주는 것을 넘어, 소프트웨어의 퀄리티 자체를 끌어올리는 겁니다.
  { id: 42, visuals: [{ type: "keyword", text: "코드 품질 자체를 끌어올린다" }] },
  // 43: 여기서 절대 놓치면 안 되는 기술적인 함정이 하나 있습니다.
  { id: 43, visuals: [{ type: "callout", text: "절대 놓치면 안 될 함정" }] },
  // 44: 새로 생성된 팀원들은 메인 에이전트가 당신과 나눈 '이전 대화 기록'을 모른다는 사실입니다.
  { id: 44, visuals: [{ type: "callout", text: "팀원들은 이전 대화를 모른다", sub: "히스토리를 물려주지 않는다" }] },
  // 45: 시스템을 가볍게 유지하기 위해 히스토리를 전부 물려주지 않기 때문이죠.
  { id: 45, visuals: [{ type: "icon", emoji: "💾", label: "시스템 경량 유지 전략" }] },
  // 46: 따라서 작업을 지시할 때 반드시 "지금까지의 핵심 컨텍스트를 작업 지시서에 포함시켜라"라고 명령해야 합니다.
  { id: 46, visuals: [{ type: "callout", text: "컨텍스트를 지시서에 포함", sub: "반드시 명령해야 할 것" }] },
  // 47: 그래야 새로 투입된 AI들이 엉뚱한 소리를 하지 않고 즉각 실전에 투입될 수 있습니다.
  { id: 47, visuals: [{ type: "keyword", text: "즉각 실전 투입 가능" }] },
  // 48: 물론 이 강력한 도구도 잘못 쓰면 독이 됩니다. 반드시 피해야 할 안티 패턴이 있죠.
  { id: 48, visuals: [{ type: "callout", text: "잘못 쓰면 독이 된다", sub: "안티 패턴 주의" }] },
  // 49: 첫 번째, 순차적으로 진행해야 하는 단선적인 작업에는 절대 팀을 꾸리지 마세요.
  { id: 49, visuals: [{ type: "split", emoji: "🚫", title: "안티 패턴 ①", items: ["단선적 순차 작업 ← 팀 금지", "병목현상만 생긴다"] }] },
  // 50: A가 끝나야 B를 할 수 있는 일에 여러 명을 투입해 봤자 병목현상만 생길 뿐입니다.
  { id: 50, visuals: [{ type: "keyword", text: "순차 작업에 팀 투입 = 금지" }] },
  // 51: 두 번째, 여러 에이전트가 동시에 '같은 파일'을 수정하도록 내버려두지 마세요.
  { id: 51, visuals: [{ type: "split", emoji: "⚠️", title: "안티 패턴 ②", items: ["같은 파일 동시 수정 금지", "코드베이스 충돌 발생"] }] },
  // 52: 프론트엔드 에이전트 세 명이 같은 페이지의 코드를 동시에 뜯어고친다고 상상해 보십시오.
  { id: 52, visuals: [{ type: "icon", emoji: "💥", label: "코드베이스 충돌 상상" }] },
  // 53: 코드베이스는 엉망진창으로 꼬이고 충돌을 해결하느라 하루를 다 날리게 될 겁니다.
  { id: 53, visuals: [{ type: "keyword", text: "하루를 다 날린다" }] },
  // 54: 작업 범위를 완벽하게 분리하거나, 아예 파일 수정 권한이 없는 '읽기 전용' 팀부터 시작하세요.
  { id: 54, visuals: [{ type: "techbadge", label: "해결책", tags: ["작업 범위 완전 분리", "읽기 전용 팀부터"] }] },
  // 55: 그리고 가장 중요한 건, 이 팀의 통제권은 언제나 당신에게 있어야 한다는 겁니다.
  { id: 55, visuals: [{ type: "callout", text: "통제권은 언제나 당신에게", sub: "가장 중요한 원칙" }] },
  // 56: 에이전트들이 스스로 알아서 명작을 만들어 줄 거라는 환상은 버리셔야 합니다.
  { id: 56, visuals: [{ type: "keyword", text: "명작 자동 생성 환상을 버려라" }] },
  // 57: 실행 버튼을 누르기 전에, 명확한 '작업 계획서'를 작성하는 것이 성공의 9할입니다.
  { id: 57, visuals: [{ type: "counter", from: 0, to: 90, suffix: "% = 계획서 작성" }] },
  // 58: 메인 에이전트와 먼저 대화하며 스텝 바이 스텝으로 플랜을 확정 지으세요.
  { id: 58, visuals: [{ type: "infotip", title: "성공 루틴", items: ["① 메인 에이전트와 대화", "② 스텝 바이 스텝 플랜", "③ 실행 후 모니터링"] }] },
  // 59: 당신이 명확한 가이드라인을 주지 않으면, 이 똑똑한 AI들은 각자 엉뚱한 곳으로 달려갈 겁니다.
  { id: 59, visuals: [{ type: "keyword", text: "가이드라인 없으면 각자도생" }] },
  // 60: 팀의 규모도 너무 키우지 마세요. 가장 이상적인 숫자는 3명에서 최대 5명입니다.
  { id: 60, visuals: [{ type: "counter", from: 0, to: 5, suffix: "명이 최적 팀 사이즈" }] },
  // 61: 그 이상 넘어가면 이들끼리 소통하는 데에만 엄청난 자원이 낭비됩니다.
  { id: 61, visuals: [{ type: "keyword", text: "소통 비용이 폭발한다" }] },
  // 62: 이 방식은 코딩에만 국한되지 않습니다. 콘텐츠 제작이나 기획 리서치에도 완벽히 적용됩니다.
  { id: 62, visuals: [{ type: "callout", text: "코딩 너머의 영역", sub: "콘텐츠·기획·리서치에도" }] },
  // 63: 지금 당장 당신만의 전속 콘텐츠 팀을 만든다고 상상해 보세요.
  { id: 63, visuals: [{ type: "keyword", text: "전속 콘텐츠 팀을 상상해봐" }] },
  // 64: 한 명은 인터넷을 뒤져 가장 최신의 팩트와 데이터를 긁어모으는 리서처입니다.
  { id: 64, visuals: [{ type: "featurecard", icon: "🔍", title: "리서처 에이전트", sub: "최신 팩트·데이터 수집" }] },
  // 65: 다른 한 명은 그 데이터를 바탕으로 뼈대를 잡는 초안 작성자 역할을 하죠.
  { id: 65, visuals: [{ type: "featurecard", icon: "✍️", title: "초안 작성 에이전트", sub: "데이터 기반 뼈대 작성" }] },
  // 66: 마지막 한 명은 문맥의 흐름과 톤앤매너를 교정하는 까다로운 편집장입니다.
  { id: 66, visuals: [{ type: "featurecard", icon: "✏️", title: "편집장 에이전트", sub: "문맥·톤앤매너 교정" }] },
  // 67: 당신이 커피를 타오는 동안, 이 세 명의 에이전트는 피드백을 주고받으며 완벽한 결과물을 뽑아냅니다.
  { id: 67, visuals: [{ type: "icon", emoji: "☕", label: "커피 한 잔 = 완벽한 결과물" }] },
  // 68: 가끔 할 일을 다 하고 대기 상태에 빠진 에이전트들이 화면에 보일 때가 있을 겁니다.
  { id: 68, visuals: [{ type: "mockup", device: "monitor", lines: ["에이전트 1: 완료 ✓", "에이전트 2: 대기 중...", "에이전트 3: 완료 ✓"] }] },
  // 69: 그럴 때 마음이 급해져서 수동으로 종료하거나 시스템에 간섭하려고 하지 마세요.
  { id: 69, visuals: [{ type: "callout", text: "간섭하지 마라", sub: "수동 종료 절대 금지" }] },
  // 70: 메인 에이전트가 전체 수명을 알아서 관리하도록 놔두는 것이 가장 안전합니다.
  { id: 70, visuals: [{ type: "keyword", text: "메인이 알아서 관리한다" }] },
  // 71: 어설픈 수동 개입은 오히려 메모리 누수나 작업 꼬임을 유발할 수 있기 때문입니다.
  { id: 71, visuals: [{ type: "techbadge", label: "수동 개입의 위험", tags: ["메모리 누수", "작업 꼬임", "시스템 불안정"] }] },
  // 72: 당신은 그저 거시적인 관점에서 이들이 산으로 가지 않도록 모니터링만 유지하면 됩니다.
  { id: 72, visuals: [{ type: "icon", emoji: "👁️", label: "거시적 모니터링만 유지" }] },
  // 73: 지금 AI 업계의 발전 속도는 말 그대로 폭발적입니다.
  { id: 73, visuals: [{ type: "callout", text: "AI 발전 속도가 폭발적이다" }] },
  // 74: 불과 몇 달 전의 혁신이 오늘날엔 당연한 기본기가 되어버리는 세상입니다.
  { id: 74, visuals: [{ type: "keyword", text: "몇 달 전 혁신 = 오늘의 기본" }] },
  // 75: 단일 AI를 넘어 '에이전트 팀'을 지휘하는 통찰력.
  { id: 75, visuals: [{ type: "callout", text: "에이전트 팀을 지휘하는 통찰력" }] },
  // 76: 이것이 앞으로 상위 1%의 생산성을 결정짓는 가장 거대한 무기가 될 것입니다.
  { id: 76, visuals: [{ type: "counter", from: 0, to: 1, suffix: "% 생산성의 비밀 무기" }] },
  // 77: 오늘 당장 당신의 워크플로우에 이 AI 팀원들을 투입해 보시기 바랍니다.
  { id: 77, visuals: [{ type: "keyword", text: "오늘 당장 투입해라" }] },
  // 78: 압도적인 퍼포먼스의 차이를 직접 경험하게 되실 겁니다.
  { id: 78, visuals: [{ type: "callout", text: "압도적인 퍼포먼스 차이", sub: "직접 경험하게 될 것" }] },
  // 79: 이번 영상이 여러분의 시야를 넓히는 데 확실한 도움이 되셨기를 바랍니다.
  { id: 79, visuals: [{ type: "icon", emoji: "🙏", label: "시야를 넓히는 인사이트" }] },
  // 80: 구독과 좋아요를 눌러두시면, 남들보다 한발 앞서가는 AI 치트키를 계속 받아보실 수 있습니다.
  { id: 80, visuals: [
    { type: "icon", emoji: "👍", label: "구독 & 좋아요" },
    { type: "icon", emoji: "🔔", label: "알림 설정" },
  ]},
  // 81: 다음에도 당신의 시간을 획기적으로 아껴줄 날카로운 인사이트로 찾아오겠습니다.
  { id: 81, visuals: [{ type: "callout", text: "다음 인사이트가 기다린다" }] },
];

// ─────────────────────────────────────────────────────────────
// 타임라인 빌더
// ─────────────────────────────────────────────────────────────
interface TimelineItem { from_ms: number; to_ms: number; visual: SceneVisual }

function buildTimeline(): TimelineItem[] {
  const planMap = new Map(SCENE_PLAN.map((p) => [p.id, p.visuals]));
  const timeline: TimelineItem[] = [];
  for (const sentence of syncData.sentences) {
    const visuals = planMap.get(sentence.id) ?? [{ type: "none" as const }];
    const seg = (sentence.end_ms - sentence.start_ms) / visuals.length;
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
// useSlideUp — 핵심 모션 훅 (slide-up + fade + spring)
// ─────────────────────────────────────────────────────────────
function useSlideUp(delay = 0, totalDur = 90) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = Math.max(0, frame - delay);
  const opacity = interpolate(
    f, [0, 10, Math.max(11, totalDur - 14), totalDur], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );
  const sp = spring({ fps, frame: f, config: { damping: 18, stiffness: 115 } });
  const translateY = interpolate(sp, [0, 1], [38, 0]);
  return { opacity, translateY };
}

// 중앙 위치 (top 38%)
const WRAP: React.CSSProperties = {
  position: "absolute", left: "50%", top: "38%",
  textAlign: "center",
};

// ─────────────────────────────────────────────────────────────
// SceneIcon
// ─────────────────────────────────────────────────────────────
const SceneIcon: React.FC<{ v: VisualIcon; dur: number }> = ({ v, dur }) => {
  const { opacity, translateY } = useSlideUp(0, dur);
  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <div style={{
        display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 20,
      }}>
        <div style={{
          width: 180, height: 180, borderRadius: "50%",
          background: SURFACE, border: `1px solid ${BORDER}`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 90,
        }}>
          {v.emoji}
        </div>
        {v.label && (
          <div style={{ fontSize: 26, fontWeight: 500, color: MUTED, fontFamily: FONT, letterSpacing: "0.06em" }}>
            {v.label}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneKeyword
// ─────────────────────────────────────────────────────────────
const SceneKeyword: React.FC<{ v: VisualKeyword; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const lineW = interpolate(frame, [8, 30], [0, 100], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, whiteSpace: "nowrap" }}>
      <div style={{
        fontSize: 92, fontWeight: 900, color: TEXT,
        fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1.15,
      }}>
        {v.text}
      </div>
      <div style={{
        height: 4, borderRadius: 2, marginTop: 14, marginLeft: "auto", marginRight: "auto",
        background: ACCENT, width: `${lineW}%`,
        boxShadow: `0 0 18px ${ACCENT}77`,
      }} />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneCounter
// ─────────────────────────────────────────────────────────────
const SceneCounter: React.FC<{ v: VisualCounter; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(52, dur - 10);
  const eased = 1 - Math.pow(1 - interpolate(frame, [0, RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);
  const value = v.from + (v.to - v.from) * eased;

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, justifyContent: "center" }}>
        <span style={{
          fontSize: 160, fontWeight: 900, color: TEXT,
          fontFamily: FONT, letterSpacing: "-0.05em", lineHeight: 1,
        }}>
          {fmt(value)}
        </span>
        <span style={{
          fontSize: 48, fontWeight: 700, color: ACCENT,
          fontFamily: FONT,
          textShadow: `0 0 40px ${ACCENT}66`,
        }}>
          {v.suffix}
        </span>
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
  const { opacity: opCard, translateY: tyCard } = useSlideUp(0, dur);

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${tyCard}px))`, opacity: opCard, width: 780 }}>
      <div style={{
        padding: "40px 52px", borderRadius: 24,
        background: SURFACE, border: `1px solid ${BORDER}`,
        boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
        textAlign: "left",
      }}>
        <div style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "0.16em",
          color: MUTED, textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 20,
        }}>{v.title}</div>
        <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />
        {v.items.map((item, i) => {
          const delay = i * 7;
          const f = Math.max(0, frame - delay);
          const itemOp = interpolate(f, [0, 12], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          const sp = spring({ fps, frame: f, config: { damping: 18, stiffness: 130 } });
          const ty = interpolate(sp, [0, 1], [20, 0]);
          return (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 18,
              marginBottom: i < v.items.length - 1 ? 20 : 0,
              opacity: itemOp, transform: `translateY(${ty}px)`,
            }}>
              <div style={{
                width: 4, height: 32, borderRadius: 2, flexShrink: 0,
                background: ACCENT,
              }} />
              <span style={{ fontSize: 32, fontWeight: 500, color: TEXT, fontFamily: FONT }}>{item}</span>
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
  const { opacity, translateY } = useSlideUp(0, dur);

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, width: 900 }}>
      {v.label && (
        <div style={{
          fontSize: 20, fontWeight: 700, letterSpacing: "0.18em",
          color: MUTED, textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 22,
        }}>{v.label}</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14 }}>
        {v.tags.map((tag, i) => {
          const delay = i * 6;
          const f = Math.max(0, frame - delay);
          const sp = spring({ fps, frame: f, config: { damping: 15, stiffness: 145 } });
          const ty = interpolate(sp, [0, 1], [24, 0]);
          const tagOp = interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <div key={i} style={{
              opacity: tagOp, transform: `translateY(${ty}px)`,
              padding: "12px 30px", borderRadius: 100,
              background: SURFACE, border: `1px solid ${BORDER}`,
              fontSize: 26, fontWeight: 600, color: TEXT,
              fontFamily: "'SF Mono','Fira Code',monospace",
              letterSpacing: "-0.01em",
            }}>{tag}</div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneDonut
// ─────────────────────────────────────────────────────────────
const SceneDonut: React.FC<{ v: VisualDonut; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(60, dur - 10);
  const eased = 1 - Math.pow(1 - interpolate(frame, [0, RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);

  const size = 380, cx = 190, cy = 190, radius = 148, strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;
  const filled = circumference * (v.value / 100) * eased;

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={radius} fill="none" stroke={SURFACE} strokeWidth={strokeWidth} />
          <circle cx={cx} cy={cy} r={radius} fill="none"
            stroke={ACCENT} strokeWidth={strokeWidth} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={circumference - filled}
            style={{ filter: `drop-shadow(0 0 12px ${ACCENT}88)` }}
          />
        </svg>
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 96, fontWeight: 900, color: TEXT, fontFamily: FONT }}>
            {Math.round(v.value * eased)}%
          </span>
        </div>
      </div>
      <div style={{ fontSize: 36, fontWeight: 700, color: TEXT, fontFamily: FONT, marginTop: 8 }}>{v.label}</div>
      {v.sublabel && (
        <div style={{ fontSize: 22, color: MUTED, fontFamily: FONT, marginTop: 6 }}>{v.sublabel}</div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneBarChart
// ─────────────────────────────────────────────────────────────
const SceneBarChart: React.FC<{ v: VisualBarChart; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(55, dur - 10);
  const maxVal = v.maxValue ?? Math.max(...v.bars.map((b) => b.value));
  const BAR_H = 56;

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, width: 860 }}>
      {v.title && (
        <div style={{
          fontSize: 22, fontWeight: 700, letterSpacing: "0.14em",
          color: MUTED, textTransform: "uppercase",
          fontFamily: FONT, marginBottom: 28,
        }}>{v.title}</div>
      )}
      <div style={{
        background: SURFACE, borderRadius: 24,
        border: `1px solid ${BORDER}`,
        padding: "32px 40px",
        boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
      }}>
        {v.bars.map((bar, i) => {
          const isLast = i === v.bars.length - 1;
          const delay = i * 7;
          const barEased = 1 - Math.pow(1 - interpolate(frame, [delay, delay + RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);
          const barW = (bar.value / maxVal) * 560 * barEased;
          const barColor = isLast ? ACCENT : "rgba(255,255,255,0.18)";

          return (
            <div key={i} style={{ marginBottom: isLast ? 0 : 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 26, fontWeight: 500, color: TEXT, fontFamily: FONT }}>{bar.label}</span>
                <span style={{
                  fontSize: 30, fontWeight: 900,
                  color: isLast ? ACCENT : MUTED,
                  fontFamily: FONT, opacity: barEased,
                  textShadow: isLast ? `0 0 20px ${ACCENT}77` : "none",
                }}>{bar.value}</span>
              </div>
              <div style={{ width: "100%", height: BAR_H, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden" }}>
                <div style={{
                  width: barW, height: "100%", borderRadius: 10,
                  background: barColor,
                  boxShadow: isLast ? `0 0 24px ${ACCENT}55` : "none",
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneLineChart
// ─────────────────────────────────────────────────────────────
const SceneLineChart: React.FC<{ v: VisualLineChart; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const RAMP = Math.min(60, dur - 10);
  const eased = 1 - Math.pow(1 - interpolate(frame, [0, RAMP], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }), 3);

  const W = 840, H = 280;
  const PAD = { top: 28, right: 48, bottom: 60, left: 48 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...v.points.map((p) => p.value));
  const pts = v.points.map((p, i) => ({
    x: PAD.left + (i / (v.points.length - 1)) * innerW,
    y: PAD.top + (1 - p.value / maxVal) * innerH,
    value: p.value, label: p.label,
  }));
  const totalLength = pts.slice(1).reduce((acc, pt, i) => {
    const prev = pts[i];
    return acc + Math.sqrt(Math.pow(pt.x - prev.x, 2) + Math.pow(pt.y - prev.y, 2));
  }, 0);
  const dashOffset = totalLength * (1 - eased);
  const visiblePts = pts.filter((_, i) => i / (pts.length - 1) <= eased + 0.001);

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity, width: W }}>
      {v.title && (
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "0.14em", color: MUTED, textTransform: "uppercase", fontFamily: FONT, marginBottom: 20 }}>{v.title}</div>
      )}
      <div style={{ background: SURFACE, borderRadius: 24, border: `1px solid ${BORDER}`, padding: "24px 28px", boxShadow: "0 24px 60px rgba(0,0,0,0.4)" }}>
        <svg width={W - 56} height={H} style={{ overflow: "visible" }}>
          {[0.25, 0.5, 0.75, 1].map((t, i) => (
            <line key={i} x1={PAD.left} y1={PAD.top + (1 - t) * innerH} x2={PAD.left + innerW} y2={PAD.top + (1 - t) * innerH}
              stroke={BORDER} strokeWidth={1} />
          ))}
          <clipPath id="lineClip">
            <rect x={0} y={0} width={(PAD.left + innerW * eased) + 10} height={H} />
          </clipPath>
          <defs>
            <linearGradient id="areaGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ACCENT} stopOpacity={0.18} />
              <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path
            d={[`M ${pts[0].x} ${PAD.top + innerH}`, ...pts.map((p) => `L ${p.x} ${p.y}`), `L ${pts[pts.length - 1].x} ${PAD.top + innerH}`, "Z"].join(" ")}
            fill="url(#areaGrad2)" clipPath="url(#lineClip)"
          />
          <polyline points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none" stroke={ACCENT} strokeWidth={3.5}
            strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={totalLength} strokeDashoffset={dashOffset}
          />
          {visiblePts.map((pt, i) => {
            const isLast = i === visiblePts.length - 1;
            return (
              <g key={i}>
                <circle cx={pt.x} cy={pt.y} r={isLast ? 10 : 5}
                  fill={isLast ? ACCENT : SURFACE} stroke={ACCENT} strokeWidth={isLast ? 0 : 2.5}
                  style={{ filter: isLast ? `drop-shadow(0 0 10px ${ACCENT})` : "none" }}
                />
                <text x={pt.x} y={H - 6} textAnchor="middle" fontSize={18} fill={MUTED} fontFamily={FONT}>{pt.label}</text>
                {isLast && (
                  <text x={pt.x + 16} y={pt.y + 5} textAnchor="start" fontSize={28} fontWeight={900} fill={ACCENT} fontFamily={FONT}>
                    {pt.value}{v.unit ?? ""}
                  </text>
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
// SceneCallout — 핵심 임팩트 카드
// ─────────────────────────────────────────────────────────────
const SceneCallout: React.FC<{ v: VisualCallout; dur: number }> = ({ v, dur }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const sp = spring({ fps, frame, config: { damping: 18, stiffness: 105 } });
  const scale = interpolate(sp, [0, 1], [0.93, 1]);

  return (
    <div style={{
      ...WRAP,
      transform: `translate(-50%, calc(-50% + ${translateY}px)) scale(${scale})`,
      opacity, width: 980,
    }}>
      <div style={{
        padding: "52px 64px", borderRadius: 28,
        background: SURFACE, border: `1px solid ${BORDER}`,
        boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
        position: "relative", textAlign: "center",
      }}>
        {/* Accent left bar */}
        <div style={{
          position: "absolute", left: 0, top: "15%", bottom: "15%",
          width: 4, borderRadius: "0 4px 4px 0",
          background: ACCENT,
          boxShadow: `0 0 20px ${ACCENT}66`,
        }} />

        <div style={{
          fontSize: 84, fontWeight: 900, color: TEXT,
          fontFamily: FONT, letterSpacing: "-0.03em", lineHeight: 1.18,
        }}>
          {v.text}
        </div>
        {v.sub && (
          <div style={{
            fontSize: 28, color: MUTED,
            fontFamily: FONT, marginTop: 20, letterSpacing: "0.03em",
          }}>
            {v.sub}
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneSplit — 좌우 분할 패널
// ─────────────────────────────────────────────────────────────
const SceneSplit: React.FC<{ v: VisualSplit; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, translateY } = useSlideUp(0, dur);

  return (
    <div style={{
      position: "absolute", left: "50%", top: "38%",
      transform: `translate(-50%, calc(-50% + ${translateY}px))`,
      opacity, width: 1000,
    }}>
      <div style={{
        display: "flex", alignItems: "stretch",
        background: SURFACE, borderRadius: 24,
        border: `1px solid ${BORDER}`,
        overflow: "hidden",
        boxShadow: "0 28px 72px rgba(0,0,0,0.5)",
      }}>
        {/* Left */}
        <div style={{
          width: 240, flexShrink: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "44px 28px",
          borderRight: `1px solid ${BORDER}`,
        }}>
          <div style={{ fontSize: 88 }}>{v.emoji}</div>
          <div style={{
            fontSize: 18, fontWeight: 700, letterSpacing: "0.1em",
            color: MUTED, textTransform: "uppercase",
            fontFamily: FONT, marginTop: 16, textAlign: "center", lineHeight: 1.5,
          }}>{v.title}</div>
        </div>
        {/* Right */}
        <div style={{ flex: 1, padding: "36px 44px 36px 40px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
          {v.items.map((item, i) => {
            const delay = i * 9;
            const f = Math.max(0, frame - delay);
            const iOp = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sp = spring({ fps, frame: f, config: { damping: 18, stiffness: 135 } });
            const tx = interpolate(sp, [0, 1], [-24, 0]);
            return (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 18,
                opacity: iOp, transform: `translateX(${tx}px)`,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", flexShrink: 0, background: ACCENT }} />
                <span style={{ fontSize: 28, fontWeight: 500, color: TEXT, fontFamily: FONT }}>{item}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneFeatureCard — 신규: 아이콘 + 제목 카드 (standalone)
// ─────────────────────────────────────────────────────────────
const SceneFeatureCard: React.FC<{ v: VisualFeatureCard; dur: number }> = ({ v, dur }) => {
  const { opacity, translateY } = useSlideUp(0, dur);
  return (
    <div style={{
      ...WRAP,
      transform: `translate(-50%, calc(-50% + ${translateY}px))`,
      opacity, width: 640,
    }}>
      <div style={{
        padding: "52px 60px", borderRadius: 28,
        background: SURFACE, border: `1px solid ${BORDER}`,
        boxShadow: "0 28px 64px rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20,
        textAlign: "left",
      }}>
        <div style={{ fontSize: 72 }}>{v.icon}</div>
        <div style={{ fontSize: 52, fontWeight: 800, color: TEXT, fontFamily: FONT, letterSpacing: "-0.02em", lineHeight: 1.2 }}>{v.title}</div>
        {v.sub && (
          <div style={{ fontSize: 26, color: MUTED, fontFamily: FONT, lineHeight: 1.6 }}>{v.sub}</div>
        )}
        <div style={{ height: 3, width: 48, borderRadius: 2, background: ACCENT, boxShadow: `0 0 14px ${ACCENT}77` }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneMockup — 신규: 미니멀 기기 목업 (phone | monitor)
// ─────────────────────────────────────────────────────────────
const SceneMockup: React.FC<{ v: VisualMockup; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { opacity, translateY } = useSlideUp(0, dur);

  if (v.device === "phone") {
    const W = 240, H = 440;
    const lines = v.lines ?? ["안녕하세요.", "무엇을 도와드릴까요?", "지금 바로 답변드립니다."];
    return (
      <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          {/* Shell */}
          <rect x={2} y={2} width={W - 4} height={H - 4} rx={32} ry={32}
            fill="#1A1A1A" stroke={BORDER} strokeWidth={1.5} />
          {/* Notch */}
          <rect x={W / 2 - 30} y={10} width={60} height={14} rx={7} fill="#2A2A2A" />
          {/* Screen area */}
          <rect x={14} y={38} width={W - 28} height={H - 80} rx={8} fill="#151515" />
          {/* Chat lines */}
          {lines.map((line, i) => {
            const delay = i * 10;
            const f = Math.max(0, frame - delay);
            const lineOp = interpolate(f, [0, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
            const sp2 = spring({ fps, frame: f, config: { damping: 18, stiffness: 140 } });
            const ty2 = interpolate(sp2, [0, 1], [12, 0]);
            const isUser = i % 2 === 0;
            const bubbleW = Math.min(140, line.length * 7 + 20);
            const bx = isUser ? W - 14 - 14 - bubbleW : 14 + 14;
            const by = 54 + i * 76;
            return (
              <g key={i} style={{ opacity: lineOp, transform: `translateY(${ty2}px)` }}>
                <rect x={bx} y={by} width={bubbleW} height={54} rx={14}
                  fill={isUser ? ACCENT : "#2C2C2C"} />
                <foreignObject x={bx + 8} y={by + 8} width={bubbleW - 16} height={38}>
                  <div style={{
                    fontSize: 13, color: isUser ? "#fff" : MUTED,
                    fontFamily: FONT, lineHeight: "18px",
                    whiteSpace: "nowrap", overflow: "hidden",
                  }}>
                    {line}
                  </div>
                </foreignObject>
              </g>
            );
          })}
          {/* Home bar */}
          <rect x={W / 2 - 40} y={H - 20} width={80} height={5} rx={3} fill="#333" />
        </svg>
      </div>
    );
  }

  // Monitor
  const W = 720, H = 440, BEZ = 16;
  const lines = v.lines ?? ["처리 중...", "오디오 생성 완료 ✓", "스트리밍 시작 →"];
  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <svg width={W} height={H + 60} viewBox={`0 0 ${W} ${H + 60}`}>
        {/* Monitor shell */}
        <rect x={2} y={2} width={W - 4} height={H - 4} rx={BEZ} fill="#1A1A1A" stroke={BORDER} strokeWidth={1.5} />
        {/* Screen */}
        <rect x={18} y={18} width={W - 36} height={H - 36} rx={8} fill="#111" />
        {/* Stand */}
        <rect x={W / 2 - 40} y={H - 2} width={80} height={40} rx={4} fill="#1A1A1A" stroke={BORDER} strokeWidth={1} />
        <rect x={W / 2 - 90} y={H + 36} width={180} height={12} rx={6} fill="#1A1A1A" stroke={BORDER} strokeWidth={1} />
        {/* Terminal lines */}
        {lines.map((line, i) => {
          const delay = i * 12;
          const f = Math.max(0, frame - delay);
          const lineOp = interpolate(f, [0, 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
          return (
            <text key={i} x={42} y={70 + i * 44} opacity={lineOp}
              fontSize={20} fontFamily="'SF Mono','Fira Code',monospace"
              fill={i === lines.length - 1 ? ACCENT : MUTED}
            >
              <tspan fill={ACCENT}>❯ </tspan>{line}
            </text>
          );
        })}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// SceneArrow — 신규: 점진적으로 그려지는 선 애니메이션
// ─────────────────────────────────────────────────────────────
const SceneArrow: React.FC<{ v: VisualArrow; dur: number }> = ({ v, dur }) => {
  const frame = useCurrentFrame();
  const { opacity, translateY } = useSlideUp(0, dur);
  const progress = interpolate(frame, [8, Math.min(50, dur - 10)], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  const W = 640, H = 80;
  const lineLen = 540;
  const dashOffset = lineLen * (1 - progress);
  const arrowOp = interpolate(progress, [0.85, 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div style={{ ...WRAP, transform: `translate(-50%, calc(-50% + ${translateY}px))`, opacity }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <line x1={50} y1={H / 2} x2={590} y2={H / 2}
          stroke={ACCENT} strokeWidth={3} strokeLinecap="round"
          strokeDasharray={lineLen} strokeDashoffset={dashOffset}
          style={{ filter: `drop-shadow(0 0 8px ${ACCENT}99)` }}
        />
        {/* Arrowhead */}
        <polygon points="590,30 620,40 590,50" fill={ACCENT} opacity={arrowOp}
          style={{ filter: `drop-shadow(0 0 8px ${ACCENT}99)` }}
        />
        {v.label && (
          <text x={W / 2} y={H / 2 - 18} textAnchor="middle"
            fontSize={20} fontFamily={FONT} fill={MUTED} opacity={arrowOp}
          >{v.label}</text>
        )}
      </svg>
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
            {v.type === "icon"        && <SceneIcon        v={v} dur={dur} />}
            {v.type === "keyword"     && <SceneKeyword     v={v} dur={dur} />}
            {v.type === "counter"     && <SceneCounter     v={v} dur={dur} />}
            {v.type === "infotip"     && <SceneInfoTip     v={v} dur={dur} />}
            {v.type === "techbadge"   && <SceneTechBadge   v={v} dur={dur} />}
            {v.type === "donut"       && <SceneDonut       v={v} dur={dur} />}
            {v.type === "barchart"    && <SceneBarChart    v={v} dur={dur} />}
            {v.type === "linechart"   && <SceneLineChart   v={v} dur={dur} />}
            {v.type === "callout"     && <SceneCallout     v={v} dur={dur} />}
            {v.type === "split"       && <SceneSplit       v={v} dur={dur} />}
            {v.type === "featurecard" && <SceneFeatureCard v={v} dur={dur} />}
            {v.type === "mockup"      && <SceneMockup      v={v} dur={dur} />}
            {v.type === "arrow"       && <SceneArrow       v={v} dur={dur} />}
          </Sequence>
        );
      })}
    </>
  );
};

// ─────────────────────────────────────────────────────────────
// IntroOverlay
// ─────────────────────────────────────────────────────────────
const IntroOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [0, fps * 0.5, fps * 1.5, fps * 2], [0, 1, 1, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const sp = spring({ fps, frame, config: { damping: 22, stiffness: 85 } });
  const translateY = interpolate(sp, [0, 1], [30, 0]);

  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity,
    }}>
      <div style={{ transform: `translateY(${translateY}px)`, textAlign: "center" }}>
        <div style={{
          fontSize: 26, fontWeight: 700, color: MUTED,
          letterSpacing: "0.28em", fontFamily: FONT, marginBottom: 18,
          textTransform: "uppercase",
        }}>
          바이브빌더
        </div>
        <div style={{ width: 48, height: 2, margin: "0 auto", background: ACCENT, borderRadius: 1 }} />
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// MainVideo
// ─────────────────────────────────────────────────────────────
export const MainVideo: React.FC = () => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const progress = frame / durationInFrames;

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", overflow: "hidden" }}>
      <Visuals progress={progress} />
      <Audio src={staticFile("audio.mp3")} volume={1.6} />

      <Sequence from={0} durationInFrames={fps * 2}>
        <IntroOverlay />
      </Sequence>

      <SceneRenderer />
      <Subtitle sentences={syncData.sentences} />

      {/* 하단 프로그레스 바 — ACCENT 단색 */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, height: 3,
        width: `${progress * 100}%`,
        background: ACCENT,
        opacity: 0.7,
      }} />
    </div>
  );
};
