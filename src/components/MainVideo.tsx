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
// 씬 플랜 — 알리바바 Qwen3-TTS 오픈소스 음성 혁명 (2026-03-22)
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: 우리가 인공지능과 대화할 때마다 무의식적으로 느끼는 묘한 불쾌감이 하나 있습니다.
  { id: 0, visuals: [{ type: "callout", text: "AI 대화의 묘한 불쾌감", sub: "무의식적으로 느끼는 것", color: "#7bb4ff" }] },
  // 1: 질문을 던지고 나서 답변이 돌아오기까지 발생하는 그 미세한 정적, 바로 그 1초 남짓한 시간입니다.
  { id: 1, visuals: [{ type: "counter", from: 0, to: 1, suffix: "초의 침묵" }] },
  // 2: 이 짧고 어색한 침묵은 차가운 쇳덩어리와 소통하고 있다는 사실을 뼈저리게 일깨워주죠.
  { id: 2, visuals: [
    { type: "icon", emoji: "🤖", label: "차가운 쇳덩어리와 대화" },
    { type: "keyword", text: "몰입이 깨진다", color: "#94a3b8" },
  ]},
  // 3: 아무리 AI의 지능이 뛰어나도 대화의 티키타카가 성립되지 않으면 몰입감은 산산조각 날 수밖에 없습니다.
  { id: 3, visuals: [{ type: "keyword", text: "티키타카 없으면 몰입 산산조각", color: "#f87171" }] },
  // 4: 그런데 최근 이 불쾌한 골짜기를 완전히 박살 내버린, 생태계 교란종 같은 기술이 등장했습니다.
  { id: 4, visuals: [{ type: "callout", text: "불쾌한 골짜기를 박살냈다", sub: "생태계 교란종 등장", color: "#a78bfa" }] },
  // 5: 그동안 일레븐랩스 같은 소수의 독점 기업들이 장악하고 있던 프리미엄 음성 AI 시장에 거대한 지각 변동이 시작된 겁니다.
  { id: 5, visuals: [
    { type: "icon", emoji: "🌋", label: "음성 AI 시장 지각 변동" },
    { type: "keyword", text: "일레븐랩스 독점 끝났다", color: "#f97316" },
  ]},
  // 6: 알리바바 연구진이 세상에 던진 새로운 인공지능 모델은 기존의 룰을 완전히 엎어버렸습니다.
  { id: 6, visuals: [{ type: "callout", text: "알리바바가 룰을 엎었다", sub: "새로운 AI 모델 투하", color: "#f97316" }] },
  // 7: 가장 충격적인 사실은 핵심 소스코드 전체를 세상에 완전 개방해버렸다는 점입니다.
  { id: 7, visuals: [
    { type: "icon", emoji: "🎁", label: "핵심 소스코드 전체 무료 공개" },
    { type: "keyword", text: "오픈소스 완전 개방", color: "#4ade80" },
  ]},
  // 8: 거대 자본을 쥔 빅테크 기업들의 등골을 서늘하게 만든 이 파괴적인 기술의 실체는 과연 무엇일까요?
  { id: 8, visuals: [{ type: "icon", emoji: "❄️", label: "빅테크 등골 서늘하게" }] },
  // 9: 오늘은 이 오픈소스가 비즈니스와 콘텐츠 시장을 어떻게 찢어놓을지 그 이면을 깊게 파헤쳐 보겠습니다.
  { id: 9, visuals: [{ type: "keyword", text: "콘텐츠 시장의 미래를 파헤친다", color: "#7bb4ff" }] },
  // 10: 본격적인 인사이트를 파보기 전에, 구독과 좋아요 한 번씩 부탁드립니다.
  { id: 10, visuals: [
    { type: "icon", emoji: "👍", label: "구독" },
    { type: "icon", emoji: "🔔", label: "알림 설정" },
  ]},
  // 11: 이 괴물 같은 모델이 업계 1위들을 공포에 떨게 만든 첫 번째 무기는 바로 소름 돋는 반응 속도입니다.
  { id: 11, visuals: [{ type: "callout", text: "무기 ① 소름 돋는 반응 속도", sub: "업계 1위들을 공포에 떨게", color: "#7bb4ff" }] },
  // 12: 사람이 눈을 한 번 깜빡이는 데 걸리는 시간조차 안 되는, 0.1초 만에 AI가 입을 열기 시작합니다.
  { id: 12, visuals: [{ type: "counter", from: 0, to: 100, suffix: "ms 반응 시작" }] },
  // 13: 사용자가 키보드로 단 한 글자만 입력해도, 그 즉시 소리로 변환되어 튀어나오는 극단적인 최적화를 이뤄냈죠.
  { id: 13, visuals: [{ type: "icon", emoji: "⚡", label: "한 글자 = 즉시 음성 출력" }] },
  // 14: 이건 단순히 데이터 처리 속도가 빨라졌다는 1차원적인 이야기가 아닙니다.
  { id: 14, visuals: [{ type: "keyword", text: "단순 속도 향상이 아니다", color: "#94a3b8" }] },
  // 15: 인간과 기계의 대화에서 지연 시간이라는 벽 자체를 허물어버림으로써, 실시간 동시통역과 난상토론이 가능해졌다는 뜻입니다.
  { id: 15, visuals: [
    { type: "techbadge", label: "가능해진 것들", tags: ["실시간 동시통역", "자연스러운 난상토론", "지연 0 대화"] },
  ]},
  // 16: 고객 센터의 AI 상담원이나 나만의 개인 비서가 1초의 망설임 없이 즉각적으로 맞장구를 쳐주는 시대가 온 겁니다.
  { id: 16, visuals: [
    { type: "split", emoji: "🤝", title: "AI가 눈앞의 사람처럼", items: ["💼 고객센터 AI 상담원", "🏠 나만의 개인 비서"], color: "#4ade80" },
  ]},
  // 17: 여기에 더해, 목소리를 대하는 우리의 기존 상식마저 완벽하게 뒤집어버렸습니다.
  { id: 17, visuals: [{ type: "callout", text: "목소리 상식을 완벽히 뒤집었다", color: "#a78bfa" }] },
  // 18: 과거에는 수백 개의 샘플 중에서 목소리를 타협하며 '골라야'만 했습니다.
  { id: 18, visuals: [
    { type: "split", emoji: "🕰️", title: "과거 vs 현재", items: ["❌ 수백 개 중 타협하며 선택", "✅ 텍스트로 목소리 창조"], color: "#94a3b8" },
  ]},
  // 19: 하지만 이제는 드롭다운 메뉴에서 목소리를 고르는 시대는 영원히 끝났습니다.
  { id: 19, visuals: [{ type: "keyword", text: "드롭다운 선택의 시대 끝났다", color: "#f87171" }] },
  // 20: "비 오는 새벽, 위스키를 마시며 나지막이 속삭이는 40대 중후반 남성의 허스키한 목소리"
  { id: 20, visuals: [{ type: "callout", text: "비 오는 새벽, 허스키한 속삭임", sub: "텍스트로 이렇게 설계한다", color: "#7bb4ff" }] },
  // 21: 이런 식으로 머릿속에 그리는 구체적인 상황과 질감을 텍스트로 적어내기만 하면 됩니다.
  { id: 21, visuals: [{ type: "icon", emoji: "✍️", label: "머릿속 상상을 텍스트로" }] },
  // 22: 그러면 인공지능이 그 문장 뒤에 숨은 의도를 파악하고, 세상에 단 하나뿐인 목소리를 즉석에서 빚어냅니다.
  { id: 22, visuals: [
    { type: "icon", emoji: "✨", label: "AI가 의도 파악 → 목소리 창조" },
    { type: "keyword", text: "세상에 단 하나뿐인 목소리", color: "#a78bfa" },
  ]},
  // 23: 성별과 나이는 물론이고, 감정의 깊이나 목소리의 온도 같은 추상적인 느낌마저 텍스트 한 줄로 통제할 수 있습니다.
  { id: 23, visuals: [
    { type: "infotip", title: "텍스트로 통제 가능한 것들", items: ["성별·나이·음색", "감정의 깊이", "목소리의 온도와 질감"] },
  ]},
  // 24: 마치 할리우드 영화감독이 되어 내 대본에 가장 완벽하게 어울리는 배우를 무에서 유로 창조해 내는 겁니다.
  { id: 24, visuals: [{ type: "callout", text: "할리우드 감독처럼", sub: "배우를 무에서 유로 창조", color: "#facc15" }] },
  // 25: 이 기술이 진짜 무서운 이유는, 단 3초 분량의 짧은 녹음 파일만 있으면 이 모든 마법이 시작된다는 겁니다.
  { id: 25, visuals: [{ type: "counter", from: 0, to: 3, suffix: "초면 마법이 시작된다" }] },
  // 26: 과거에 목소리를 복제하려면 스튜디오에서 수십 시간 동안 대본을 읽고 녹음해야 했습니다.
  { id: 26, visuals: [
    { type: "split", emoji: "⏱️", title: "목소리 복제 시간 비교", items: ["❌ 스튜디오 수십 시간 녹음", "✅ 스마트폰 3초 음성"], color: "#94a3b8" },
  ]},
  // 27: 이제는 스마트폰으로 대충 녹음한 3초짜리 파일 하나면 게임 끝입니다.
  { id: 27, visuals: [{ type: "callout", text: "3초짜리 파일 하나면 게임 끝", sub: "스마트폰으로 대충 녹음해도", color: "#4ade80" }] },
  // 28: AI는 단 3초 만에 그 사람 특유의 숨소리, 억양, 발성의 특징까지 세포 단위로 흡수해 버립니다.
  { id: 28, visuals: [
    { type: "infotip", title: "3초가 흡수하는 것들", items: ["숨소리의 결", "억양의 패턴", "발성의 특징까지"] },
  ]},
  // 29: 더욱 경악스러운 건 이렇게 복제된 목소리가 언어의 장벽마저 가볍게 씹어먹는다는 사실입니다.
  { id: 29, visuals: [{ type: "callout", text: "언어 장벽마저 씹어먹는다", color: "#f97316" }] },
  // 30: 평생 한국어만 써온 토종 한국인의 목소리를 3초만 들려주면, 그 목소리 그대로 프랑스어를 구사하게 됩니다.
  { id: 30, visuals: [
    { type: "techbadge", label: "가능한 언어 조합", tags: ["한국인 목소리 → 프랑스어", "한국인 목소리 → 스페인어", "억양·발음 그대로"] },
  ]},
  // 31: 글로벌 진출을 노리는 크리에이터와 기업들에게 수천만 원의 현지화 비용을 아껴줄 치명적인 무기입니다.
  { id: 31, visuals: [{ type: "counter", from: 0, to: 3000, suffix: "만원 현지화 비용 절감" }] },
  // 32: 해외 시청자들은 유튜버 본인의 목소리로 현지 언어를 들으며 완벽한 몰입을 경험하게 될 것입니다.
  { id: 32, visuals: [
    { type: "icon", emoji: "🌍", label: "본인 목소리로 전 세계" },
    { type: "keyword", text: "완벽한 현지화 몰입", color: "#4ade80" },
  ]},
  // 33: 이러한 혁신을 가능하게 만든 배경에는 알리바바의 영악한 전략이 숨어 있습니다.
  { id: 33, visuals: [{ type: "callout", text: "알리바바의 영악한 전략", sub: "이 혁신은 계산된 것이다", color: "#a78bfa" }] },
  // 34: 그들은 속도와 품질이라는 두 마리 토끼를 잡기 위해 아예 두 개의 심장을 모델 안에 심어버렸습니다.
  { id: 34, visuals: [
    { type: "split", emoji: "💗", title: "두 개의 심장", items: ["⚡ 초경량·초고속 심장", "💎 하이엔드·고퀄리티 심장"], color: "#7bb4ff" },
  ]},
  // 35: 라이브 커머스나 전화 응대처럼 1초 반응이 수익과 직결되는 서비스에는 빠른 심장을 장착하면 됩니다.
  { id: 35, visuals: [
    { type: "techbadge", label: "빠른 심장 적용처", tags: ["라이브 커머스", "전화 응대", "실시간 챗봇"] },
  ]},
  // 36: 반대로 오디오북이나 장편 영화 더빙처럼 퀄리티가 필요할 때는 하이엔드 심장을 꺼내 들면 되죠.
  { id: 36, visuals: [
    { type: "infotip", title: "하이엔드 심장 적용처", items: ["오디오북", "장편 영화 더빙", "고품질 콘텐츠"] },
  ]},
  // 37: 마치 레이싱 트랙에서는 스포츠카를 타고, 짐을 옮길 때는 대형 트럭으로 바꿔 타듯 엔진을 갈아 끼울 수 있는 겁니다.
  { id: 37, visuals: [
    { type: "split", emoji: "🔄", title: "목적별 엔진 선택", items: ["🏎️ 스포츠카 = 속도 우선", "🚛 대형 트럭 = 퀄리티 우선"], color: "#4ade80" },
  ]},
  // 38: 덕분에 수십 분이 넘어가는 긴 대본을 읽혀도 기계음이 섞여 나오는 방송 사고를 원천 차단했습니다.
  { id: 38, visuals: [{ type: "icon", emoji: "🛡️", label: "수십 분 대본도 방송 사고 없음" }] },
  // 39: 자, 여기까지 들으셨다면 한국인으로서 가장 중요한 질문 하나가 머릿속에 떠오르실 겁니다.
  { id: 39, visuals: [{ type: "keyword", text: "한국인이라면 이 질문이 떠오른다", color: "#facc15" }] },
  // 40: "아무리 뛰어나도, 결국 외국 기업이 만든 AI인데 한국어는 어색하지 않을까?"
  { id: 40, visuals: [{ type: "callout", text: "외국 AI인데 한국어는?", sub: "아무리 뛰어나도...", color: "#94a3b8" }] },
  // 41: 글로벌 빅테크들이 내놓은 음성 AI들이 한국어만 시키면 어색한 교포 흉내를 냈던 게 사실입니다.
  { id: 41, visuals: [{ type: "icon", emoji: "😞", label: "기존 AI의 어색한 교포 한국어" }] },
  // 42: 하지만 이번 모델은 한국어의 미세하고 복잡한 뉘앙스를 한국인보다 더 한국인처럼 소화해 냈습니다.
  { id: 42, visuals: [{ type: "callout", text: "한국인보다 더 한국인처럼", sub: "미세한 뉘앙스까지 완벽", color: "#4ade80" }] },
  // 43: 단순히 발음 기호를 또박또박 읽는 수준을 뛰어넘어, 대본의 '맥락'과 '눈치'를 파악하는 경지에 올랐습니다.
  { id: 43, visuals: [
    { type: "split", emoji: "🧠", title: "발음 읽기 vs 맥락 이해", items: ["❌ 발음 기호 또박또박", "✅ 맥락·눈치 완벽 파악"], color: "#a78bfa" },
  ]},
  // 44: 대본에 느낌표가 있으면 알아서 텐션을 끌어올리고, 진지한 내용이 나오면 스스로 호흡을 가라앉힙니다.
  { id: 44, visuals: [
    { type: "infotip", title: "자동 감정 표현", items: ["느낌표 → 텐션 자동 상승", "진지한 내용 → 차분한 호흡", "감정선 자동 조절"] },
  ]},
  // 45: 문맥 속에 숨겨진 씁쓸함, 기쁨, 분노 같은 감정선까지 목소리의 떨림으로 표현해 내는 퍼포먼스는 충격적입니다.
  { id: 45, visuals: [
    { type: "techbadge", label: "표현 가능한 감정들", tags: ["씁쓸함", "기쁨", "분노"] },
  ]},
  // 46: 최고의 성우를 섭외해 디렉팅하는 과정과 결과물의 차이를 이제는 귀로 구분하기 힘든 수준까지 와버렸습니다.
  { id: 46, visuals: [
    { type: "barchart", title: "음성 품질 비교", bars: [
      { label: "최고급 성우", value: 95, color: "#7bb4ff" },
      { label: "Qwen3-TTS", value: 93, color: "#4ade80" },
    ], maxValue: 100 },
  ]},
  // 47: 우리는 지금, 고품질 오디오 콘텐츠를 만들기 위해 자본이 필요했던 시대의 영원한 종말을 목격하고 있습니다.
  { id: 47, visuals: [{ type: "callout", text: "자본이 필요한 시대의 종말", sub: "지금 이 순간 목격 중", color: "#f97316" }] },
  // 48: 수백만 시간의 피와 땀이 서린 이 엄청난 기술의 결정체가 아무런 제약 없이 전 세계에 공짜로 풀려버렸기 때문입니다.
  { id: 48, visuals: [
    { type: "icon", emoji: "🌐", label: "전 세계에 공짜로" },
    { type: "keyword", text: "아무런 제약 없이", color: "#4ade80" },
  ]},
  // 49: 이것은 단순히 좋은 무료 툴 하나가 등장했다는 가벼운 가십거리가 아닙니다.
  { id: 49, visuals: [{ type: "icon", emoji: "⚠️", label: "가십거리가 아니다" }] },
  // 50: 오디오 콘텐츠 시장의 진입 장벽이 완벽하게 붕괴되었고, 누구나 상상력만 있다면 글로벌 무대에서 놀 수 있는 판이 깔렸다는 뜻입니다.
  { id: 50, visuals: [{ type: "callout", text: "진입 장벽 완전 붕괴", sub: "상상력만 있으면 글로벌", color: "#a78bfa" }] },
  // 51: 막대한 자본력으로 시장을 쥐락펴락하던 거대 공룡들의 독점은 오늘부로 끝이 났습니다.
  { id: 51, visuals: [{ type: "icon", emoji: "🦖", label: "거대 공룡들의 독점 종료" }] },
  // 52: 이제 다가올 전쟁터에서 승패를 가르는 유일한 기준은 '누가 더 기발한 상상력을 텍스트로 풀어낼 수 있느냐'뿐입니다.
  { id: 52, visuals: [{ type: "callout", text: "승패 기준: 기발한 상상력", sub: "텍스트로 풀어낼 수 있느냐", color: "#facc15" }] },
  // 53: 돈이 없어서, 장비가 없어서, 외국어를 못해서라는 핑계는 더 이상 통하지 않는 시대가 열린 것입니다.
  { id: 53, visuals: [
    { type: "infotip", title: "더 이상 통하지 않는 핑계들", items: ["💸 돈이 없어서?", "🎙️ 장비가 없어서?", "🌐 외국어를 못해서?"] },
  ]},
  // 54: 이 기술이 여러분의 일상과 비즈니스에 어떤 파도를 몰고 올지 상상해 보십시오.
  { id: 54, visuals: [{ type: "icon", emoji: "🌊", label: "여러분의 비즈니스에 파도가 온다" }] },
  // 55: 여러분이 상상하는 가장 완벽한 AI의 활용법은 무엇인가요? 댓글을 통해 통찰을 나눠주시기 바랍니다.
  { id: 55, visuals: [
    { type: "icon", emoji: "💬", label: "댓글로 통찰 공유" },
    { type: "icon", emoji: "👍", label: "구독 & 좋아요" },
  ]},
  // 56: 오늘 전해드린 이 묵직한 인사이트가 여러분의 새로운 비즈니스와 콘텐츠 창작에 강력한 무기가 되었기를 바랍니다.
  { id: 56, visuals: [{ type: "callout", text: "강력한 무기가 되길", sub: "비즈니스와 콘텐츠 창작에", color: "#4ade80" }] },
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
