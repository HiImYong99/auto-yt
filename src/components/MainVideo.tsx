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

type SceneVisual =
  | VisualNone | VisualIcon | VisualKeyword | VisualCounter
  | VisualInfoTip | VisualTechBadge
  | VisualDonut | VisualBarChart | VisualLineChart;

// ─────────────────────────────────────────────────────────────
// 씬 플랜
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: 혹시 아직도 인공지능이 그저 신기한 장난감이라고 생각하시나요?
  { id: 0,  visuals: [{ type: "icon", emoji: "🤔", label: "아직도 장난감이라고?" }] },
  // 1: 그렇다면 당장 그 생각부터 머릿속에서 완전히 지워버리셔야 합니다.
  { id: 1,  visuals: [{ type: "keyword", text: "지금 당장 지워버려라", color: "#f87171" }] },
  // 2: 올해는 판이 완전히 뒤집히는 해가 될 테니까요.
  { id: 2,  visuals: [{ type: "keyword", text: "판이 완전히 뒤집힌다", color: "#facc15" }] },
  // 3: 이 녀석들이 우리의 현실적인 밥그릇을 노리고 있습니다.
  { id: 3,  visuals: [{ type: "icon", emoji: "🤖", label: "AI가 밥그릇을 노린다" }] },
  // 4: 이 거대한 기술의 파도에 휩쓸려 익사할 것인가.
  { id: 4,  visuals: [{ type: "icon", emoji: "🌊", label: "파도에 익사할 것인가?" }] },
  // 5: 아니면 그 거친 파도 위에 멋지게 올라타 짜릿한 서핑을 즐길 것인가.
  { id: 5,  visuals: [{ type: "icon", emoji: "🏄", label: "파도 위에 올라탈 것인가?" }] },
  // 6: 선택은 온전히 여러분의 몫이지만, 오늘 생존 전략을 무시하면 후회하실 겁니다.
  { id: 6,  visuals: [{ type: "keyword", text: "생존 전략", color: "#aaff00" }] },
  // 7: 여러분의 인생 궤도를 바꿀 핵심 무기들을 하나씩 꺼내보겠습니다.
  { id: 7,  visuals: [{ type: "infotip", title: "6가지 핵심 무기", items: ["① 소통의 기술", "② 도구 편식 금지", "③ 자율 주행 비서", "④ 입 코딩", "⑤ 초연결 창작", "⑥ 철통 보안"] }] },
  // 8: 첫 번째 무기는 바로 '소통의 기술'입니다.
  { id: 8,  visuals: [{ type: "keyword", text: "① 소통의 기술", color: "#7bb4ff" }] },
  // 9: AI가 똑똑해지면 개떡같이 말해도 찰떡같이 알아들을 거라고 착각하죠.
  { id: 9,  visuals: [{ type: "icon", emoji: "💭", label: "찰떡같이 알아들을 거란 착각" }] },
  // 10: 하지만 현실의 냉혹함은 그 정반대입니다.
  { id: 10, visuals: [{ type: "keyword", text: "현실은 정반대", color: "#f87171" }] },
  // 11: 여러분이 던지는 질문의 퀄리티가 곧 결과물의 수준을 결정짓는 잔인한 시대가 왔습니다.
  { id: 11, visuals: [{ type: "keyword", text: "질문 품질 = 결과물 품질", color: "#aaff00" }] },
  // 12: 목적지도 입력하지 않고 내비게이션에게 알아서 좋은 곳으로 데려가 달라고 떼쓰는 것과 같습니다.
  { id: 12, visuals: [{ type: "icon", emoji: "🗺️", label: "목적지 없는 내비게이션" }] },
  // 13: AI가 멍청해졌다고 느끼신 적이 있나요?
  { id: 13, visuals: [{ type: "icon", emoji: "🤦", label: "AI가 멍청해졌다고?" }] },
  // 14: 그렇다면 기계의 문제가 아니라 본인의 질문 방식을 의심해 봐야 합니다.
  { id: 14, visuals: [{ type: "keyword", text: "내 질문 방식이 문제", color: "#f87171" }] },
  // 15: 그럼 어떻게 명령을 내려야 할까요?
  { id: 15, visuals: [{ type: "icon", emoji: "❓", label: "어떻게 명령해야 할까?" }] },
  // 16: 딱 네 가지 핵심 요소만 기억하시면 됩니다.
  { id: 16, visuals: [{ type: "infotip", title: "프롬프트 4대 공식", items: ["① 역할 부여", "② 배경 상황 묘사", "③ 명확한 목표", "④ 출력 형식 지정"] }] },
  // 17: 첫째, 구체적인 '역할'을 쥐어주세요.
  { id: 17, visuals: [{ type: "keyword", text: "① 역할 부여", color: "#7bb4ff" }] },
  // 18: 둘째, '배경 상황'을 영화처럼 묘사해 주는 겁니다.
  { id: 18, visuals: [{ type: "keyword", text: "② 배경 상황", color: "#a78bfa" }] },
  // 19: 셋째, 얻어내고 싶은 '명확한 목표점'을 짚어주세요.
  { id: 19, visuals: [{ type: "keyword", text: "③ 명확한 목표", color: "#facc15" }] },
  // 20: 마지막으로, 어떤 형식과 '순서'로 결과물을 내놓아야 할지 지정해 주는 겁니다.
  { id: 20, visuals: [{ type: "keyword", text: "④ 출력 형식", color: "#fb923c" }] },
  // 21: 이 공식만 적용해도 답변의 퀄리티가 수직 상승할 겁니다.
  { id: 21, visuals: [{ type: "linechart", title: "프롬프트 공식 적용 후 품질", points: [
    { label: "공식 전", value: 25 },
    { label: "역할 추가", value: 50 },
    { label: "상황 추가", value: 72 },
    { label: "4공식 완성", value: 96 },
  ], color: "#aaff00", unit: "점" }] },
  // 22: 혼자서 머리 싸매고 끙끙댈 필요도 전혀 없습니다.
  { id: 22, visuals: [{ type: "icon", emoji: "😌", label: "혼자 고민할 필요 없다" }] },
  // 23: 어설픈 질문을 전문가 수준으로 다듬어주는 최적화 도구들이 널려 있으니까요.
  { id: 23, visuals: [{ type: "techbadge", label: "프롬프트 최적화 도구", tags: ["ChatGPT", "Claude", "Gemini", "Copilot"] }] },
  // 24: 그저 복사해서 붙여넣기만 하면, 완벽한 명령어로 탈바꿈시켜 줍니다.
  { id: 24, visuals: [{ type: "keyword", text: "복붙으로 완성", color: "#aaff00" }] },
  // 25: 두 번째 생존 비급은 바로 '도구 편식하지 않기'입니다.
  { id: 25, visuals: [{ type: "keyword", text: "② 도구 편식 금지", color: "#fb923c" }] },
  // 26: 아직도 유명한 서비스 딱 하나만 주야장천 붙잡고 계신가요?
  { id: 26, visuals: [{ type: "icon", emoji: "🔨", label: "망치 하나로 전부 하려고?" }] },
  // 27: 망치 하나만 들고 거대한 아파트 전체를 지으려는 것과 다름없습니다.
  { id: 27, visuals: [{ type: "icon", emoji: "🏗️", label: "망치 하나로 아파트 건설?" }] },
  // 28: 어떤 녀석은 논리적이고 유려한 글쓰기에 완전히 미쳐있습니다.
  { id: 28, visuals: [{ type: "techbadge", label: "글쓰기 특화 AI", tags: ["Claude", "GPT-4o", "Gemini"] }] },
  // 29: 반면 어떤 녀석은 방대한 자료를 순식간에 요약하는 데 도가 텄죠.
  { id: 29, visuals: [{ type: "techbadge", label: "요약·분석 특화 AI", tags: ["NotebookLM", "Claude", "Perplexity"] }] },
  // 30: 또 다른 녀석은 실사 뺨치는 그림을 뽑아내거나, 실시간 검색의 달인입니다.
  { id: 30, visuals: [{ type: "techbadge", label: "이미지·검색 특화 AI", tags: ["Midjourney", "DALL-E", "Perplexity", "Grok"] }] },
  // 31: 이 각기 다른 재능을 가진 녀석들을 모아 나만의 어벤져스 팀을 꾸려야 합니다.
  { id: 31, visuals: [{ type: "icon", emoji: "🦸", label: "나만의 AI 어벤져스" }] },
  // 32: 뼈대 기획은 A에게, 살을 붙이는 작업은 B에게, 검수는 C에게 맡기는 겁니다.
  { id: 32, visuals: [{ type: "barchart", title: "AI 역할 분담 전략", bars: [
    { label: "기획 (A)",  value: 40, color: "#7bb4ff" },
    { label: "작성 (B)",  value: 35, color: "#aaff00" },
    { label: "검수 (C)",  value: 25, color: "#f472b6" },
  ], maxValue: 100 }] },
  // 33: 도구 골라 쓰는 사람과 하나만 쓰는 사람의 작업 속도는 비교조차 할 수 없습니다.
  { id: 33, visuals: [{ type: "barchart", title: "작업 속도 비교", bars: [
    { label: "멀티툴 활용자", value: 95, color: "#aaff00" },
    { label: "단일툴 고집자", value: 28, color: "#f87171" },
  ], maxValue: 100 }] },
  // 34: 그렇다고 이 모든 서비스를 전부 유료로 결제할 필요는 없습니다.
  { id: 34, visuals: [{ type: "icon", emoji: "💰", label: "전부 유료? 필요 없다" }] },
  // 35: 핵심 주력 무기 딱 하나만 프리미엄으로 업그레이드 하세요.
  { id: 35, visuals: [{ type: "keyword", text: "핵심 1개만 유료", color: "#facc15" }] },
  // 36: 나머지는 무료 버전으로도 얼마든지 부려먹을 수 있습니다.
  { id: 36, visuals: [{ type: "keyword", text: "나머지는 무료로 충분", color: "#4ade80" }] },
  // 37: 세 번째 무기는 올해 가장 뜨거운 '자율 주행 비서'의 등장입니다.
  { id: 37, visuals: [{ type: "keyword", text: "③ 자율 주행 비서", color: "#34d399" }] },
  // 38: 지금까지는 하나부터 열까지 일일이 명령해야 하는 수동 기어였다면요.
  { id: 38, visuals: [{ type: "icon", emoji: "⚙️", label: "수동 기어 → 명령 하나하나" }] },
  // 39: 이제는 알아서 척척 수행하는 풀 오토매틱 기어의 시대가 열리고 있습니다.
  { id: 39, visuals: [{ type: "icon", emoji: "🚗", label: "풀 오토매틱 시대 개막" }] },
  // 40: "이번 주말에 제주도 여행 알아서 완벽하게 준비 좀 해줘."
  { id: 40, visuals: [{ type: "infotip", title: "AI 에이전트 한 마디면?", items: ["✈️ 비행기 표 예매", "🍽️ 맛집 동선 짜기", "🚗 렌터카 예약", "→ 알아서 전부 완료!"] }] },
  // 41: 이 한마디면 비행기 표부터 렌터카 예약까지 지가 알아서 다 끝내버리는 세상입니다.
  { id: 41, visuals: [{ type: "icon", emoji: "✈️", label: "한 마디로 여행 준비 완료" }] },
  // 42: 물론 아직은 초창기라 가끔 엉뚱한 헛발질을 할 때도 있긴 합니다.
  { id: 42, visuals: [{ type: "icon", emoji: "🌱", label: "아직은 초창기" }] },
  // 43: 하지만 지난 몇 년간의 발전 속도를 보면, 이것이 완벽해지는 건 시간문제입니다.
  { id: 43, visuals: [{ type: "linechart", title: "AI 에이전트 성능 성장", points: [
    { label: "2023", value: 20 },
    { label: "2024", value: 50 },
    { label: "2025", value: 78 },
    { label: "2026", value: 98 },
  ], color: "#34d399", unit: "점" }] },
  // 44: 이 자율형 AI를 내 일상과 업무에 어떻게 끌어들이느냐.
  { id: 44, visuals: [{ type: "icon", emoji: "🎯", label: "내 업무에 끌어들여라" }] },
  // 45: 이것이 앞으로 여러분의 시장 경쟁력을 좌우할 절대적인 기준이 될 겁니다.
  { id: 45, visuals: [{ type: "keyword", text: "경쟁력 = AI 활용력", color: "#aaff00" }] },
  // 46: 네 번째 트렌드는 '입 코딩'의 시대입니다.
  { id: 46, visuals: [{ type: "keyword", text: "④ 입 코딩", color: "#a78bfa" }] },
  // 47: 예전에는 코딩을 모르면 그저 머릿속 상상으로 끝났죠.
  { id: 47, visuals: [{ type: "icon", emoji: "💡", label: "코딩 몰라도 앱을 만든다" }] },
  // 48: 수천만 원의 거금을 들여 외주를 맡기거나, 꿈을 포기하거나 둘 중 하나였습니다.
  { id: 48, visuals: [{ type: "barchart", title: "기존 앱 제작 비용", bars: [
    { label: "외주 비용", value: 5000, color: "#f87171" },
    { label: "AI 활용",   value: 0,    color: "#aaff00" },
  ], maxValue: 5000 }] },
  // 49: 이제는 한국어만 할 줄 알면 누구나 앱을 만들고 웹사이트를 찍어낼 수 있습니다.
  { id: 49, visuals: [{ type: "keyword", text: "한국어로 앱 제작", color: "#a78bfa" }] },
  // 50: 말 그대로 키보드 대신 입으로 명령만 내리면 끝입니다.
  { id: 50, visuals: [{ type: "icon", emoji: "🗣️", label: "말로 명령하면 끝" }] },
  // 51: AI가 보이지 않는 뒤편에서 코드를 짜내어 결과물을 뱉어냅니다.
  { id: 51, visuals: [{ type: "icon", emoji: "💻", label: "AI가 코드를 뚝딱" }] },
  // 52: 초기 자본도, 전문 기술도 필요 없는 1인 창업의 황금기가 열린 겁니다.
  { id: 52, visuals: [{ type: "keyword", text: "1인 창업 황금기", color: "#aaff00" }] },
  // 53: 심지어 날고 기는 전문 개발자들조차 이 방식을 적극 도입하고 있습니다.
  { id: 53, visuals: [{ type: "icon", emoji: "👨‍💻", label: "전문 개발자도 도입 중" }] },
  // 54: 단순 반복 작업을 기계에 맡기고 퇴근 시간을 절반으로 줄이고 있다는 사실.
  { id: 54, visuals: [{ type: "donut", value: 50, label: "퇴근 시간 단축", sublabel: "AI 코딩 도구 도입 후", color: "#a78bfa" }] },
  // 55: 다섯 번째 무기는 '초연결 창작' 기술입니다.
  { id: 55, visuals: [{ type: "keyword", text: "⑤ 초연결 창작", color: "#f472b6" }] },
  // 56: 이제는 소리, 이미지, 영상까지 한 번에 버무려내는 경지에 올랐습니다.
  { id: 56, visuals: [{ type: "techbadge", label: "AI가 생성하는 것들", tags: ["텍스트", "이미지", "음악", "영상", "목소리"] }] },
  // 57: 단어 몇 개만 던져줘도 감성을 후벼파는 고퀄리티 노래를 작곡해 냅니다.
  { id: 57, visuals: [{ type: "icon", emoji: "🎵", label: "단어 몇 개 → 노래 완성" }] },
  // 58: 수백만 원짜리 화보도 순식간에 뚝딱 만들어내죠.
  { id: 58, visuals: [{ type: "icon", emoji: "📸", label: "수백만원짜리 화보 뚝딱" }] },
  // 59: 캐릭터의 얼굴이 컷마다 바뀌는 문제도 이제는 완벽하게 해결됐습니다.
  { id: 59, visuals: [{ type: "keyword", text: "얼굴 일관성 해결 완료", color: "#4ade80" }] },
  // 60: 나만의 브랜드를 당장 시작하고 싶은 분들에게 이보다 완벽한 기회가 없습니다.
  { id: 60, visuals: [{ type: "icon", emoji: "🌟", label: "나만의 브랜드 시작" }] },
  // 61: 방구석 1인 크리에이터가 대형 프로덕션과 맞먹는 결과물을 쏟아낼 수 있는 도구니까요.
  { id: 61, visuals: [{ type: "barchart", title: "콘텐츠 생산력 비교", bars: [
    { label: "AI 활용 1인",   value: 90,  color: "#f472b6" },
    { label: "대형 스튜디오", value: 100, color: "#7bb4ff" },
    { label: "기존 1인",      value: 15,  color: "#f87171" },
  ], maxValue: 100 }] },
  // 62: 하지만 이런 강력한 무기들 뒤에는 치명적인 독이 숨어 있는 법입니다.
  { id: 62, visuals: [{ type: "icon", emoji: "⚠️", label: "치명적인 독이 숨어있다" }] },
  // 63: 마지막으로 절대 간과해서는 안 될 핵심, 바로 '철통 보안'입니다.
  { id: 63, visuals: [{ type: "keyword", text: "⑥ 철통 보안", color: "#f87171" }] },
  // 64: 내 통장 비밀번호를 동네방네 떠들고 다니는 비서라면 당장 해고해야 마땅합니다.
  { id: 64, visuals: [{ type: "icon", emoji: "🔐", label: "보안이 없으면 바로 해고" }] },
  // 65: 무심코 대화창에 입력하는 회사 기밀이나 민감한 개인 정보를 떠올려보세요.
  { id: 65, visuals: [{ type: "icon", emoji: "📄", label: "기밀 자료 무심코 입력?" }] },
  // 66: 이 정보들이 이름 모를 AI의 학습 데이터가 되고 있을지도 모릅니다.
  { id: 66, visuals: [{ type: "keyword", text: "내 정보 = 학습 데이터?", color: "#f87171" }] },
  // 67: 지금 설정창을 열어서 데이터 수집에 쓰이지 않도록 차단 버튼부터 누르세요.
  { id: 67, visuals: [{ type: "infotip", title: "지금 당장 설정하세요", items: ["① 데이터 수집 차단 ON", "② 대화 기록 저장 OFF", "③ 이중 인증 설정"] }] },
  // 68: 과거의 대화를 기억해 주는 기능도 물론 편리하긴 합니다.
  { id: 68, visuals: [{ type: "icon", emoji: "💭", label: "기억 기능은 편리하지만..." }] },
  // 69: 정보 유출이 걱정된다면, 과감하게 꺼버리는 것이 최고의 상책입니다.
  { id: 69, visuals: [{ type: "keyword", text: "걱정되면 꺼버려라", color: "#f87171" }] },
  // 70: 외부의 악의적인 해커들의 먹잇감이 되지 않도록 조심해야 합니다.
  { id: 70, visuals: [{ type: "icon", emoji: "🎣", label: "해커의 표적이 되지 마라" }] },
  // 71: 로그인 이중 인증 같은 기본적인 안전장치는 이제 선택이 아닌 필수입니다.
  { id: 71, visuals: [{ type: "keyword", text: "이중 인증 = 생존 필수", color: "#4ade80" }] },
  // 72: 가장 확실하고 강력한 방어책은 따로 있습니다.
  { id: 72, visuals: [{ type: "icon", emoji: "🛡️", label: "가장 강력한 방어책" }] },
  // 73: 애초에 유출되면 치명적인 정보는 절대 시스템에 입력하지 않는 것.
  { id: 73, visuals: [{ type: "keyword", text: "위험 정보 입력 자체를 금지", color: "#f87171" }] },
  // 74: 이 날카로운 무기들을 쥐고 어떻게 휘두르느냐.
  { id: 74, visuals: [{ type: "keyword", text: "어떻게 휘두르느냐", color: "#facc15" }] },
  // 75: 오직 그 선택에 따라 다음 달의 여러분의 위치는 완전히 달라질 겁니다.
  { id: 75, visuals: [{ type: "icon", emoji: "⚖️", label: "선택이 미래를 결정한다" }] },
  // 76: 누군가는 AI에 밀려나 조용히 도태될 것입니다.
  { id: 76, visuals: [{ type: "icon", emoji: "📉", label: "AI에 밀려 도태" }] },
  // 77: 하지만 누군가는 이 도구들을 발판 삼아 상상도 못 할 높이로 날아오르겠죠.
  { id: 77, visuals: [{ type: "icon", emoji: "📈", label: "AI 타고 고공 성장" }] },
  // 78: 매일 쏟아지는 새로운 기술에 지레 겁먹고 압도당할 필요는 없습니다.
  { id: 78, visuals: [{ type: "icon", emoji: "😌", label: "겁먹지 마세요" }] },
  // 79: 오늘 짚어드린 단단한 뼈대들을 바탕으로 무장하시면 됩니다.
  { id: 79, visuals: [{ type: "infotip", title: "오늘의 핵심 무기 요약", items: ["① 소통의 기술", "② 멀티툴 활용", "③ 자율 비서", "④ 입 코딩", "⑤ 초연결 창작", "⑥ 철통 보안"] }] },
  // 80: 하나씩 천천히 내 일상에 적용해 보는 것만으로도 시작은 충분합니다.
  { id: 80, visuals: [{ type: "keyword", text: "하나씩 천천히 적용", color: "#aaff00" }] },
  // 81: 여러분이 기술의 파도에 휩쓸리지 않도록 든든한 등대가 되어드리겠습니다.
  { id: 81, visuals: [{ type: "icon", emoji: "🏮", label: "든든한 등대" }] },
  // 82: 시장 트렌드의 최전선에서 가장 빠른 무기들을 공수해 오겠습니다.
  { id: 82, visuals: [{ type: "icon", emoji: "⚔️", label: "최전선 무기 공수" }] },
  // 83: 오늘 생존 전략이 피가 되고 살이 되셨다면, 구독과 좋아요 한 번씩 꾹 부탁드립니다.
  { id: 83, visuals: [{ type: "icon", emoji: "👍", label: "구독 & 좋아요 꾹!" }] },
  // 84: 느낀 점이나 기대되는 변화가 있다면 댓글로 편하게 남겨주세요.
  { id: 84, visuals: [{ type: "icon", emoji: "💬", label: "댓글로 소통해요" }] },
  // 85: 이보다 훨씬 강력한 생존 비급을 들고 다음 영상에서 다시 찾아뵙겠습니다.
  { id: 85, visuals: [{ type: "icon", emoji: "🎬", label: "다음 영상에서 만나요" }] },
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
  const { scale, opacity } = usePopIn(dur);
  return (
    <div style={{ ...CENTER, opacity, transform: `translate(-50%, -50%) scale(${scale})` }}>
      <div style={{ fontSize: 130 }}>{v.emoji}</div>
      {v.label && (
        <div style={{
          fontSize: 28, fontWeight: 600, marginTop: 10,
          color: "rgba(255,255,255,0.6)", letterSpacing: "0.12em",
          fontFamily: FONT,
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
        fontFamily: FONT, letterSpacing: "-0.03em",
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
        {v.items.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 16,
            marginBottom: i < v.items.length - 1 ? 18 : 0,
          }}>
            <div style={{
              width: 5, height: 36, borderRadius: 3, flexShrink: 0,
              background: "linear-gradient(180deg, #7bb4ff, #a855f7)",
            }} />
            <span style={{
              fontSize: 34, fontWeight: 600, color: "rgba(255,255,255,0.88)",
              fontFamily: FONT,
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
