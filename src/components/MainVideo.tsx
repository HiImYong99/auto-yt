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
// 씬 플랜 — Qwen3 TTS 완전 분석 (2026-03-23)
// ─────────────────────────────────────────────────────────────
const SCENE_PLAN: Array<{ id: number; visuals: SceneVisual[] }> = [
  // 0: 인공지능과 대화할 때 느껴지는 그 묘한 이질감, 기억하시나요?
  { id: 0, visuals: [{ type: "callout", text: "AI의 이질감", sub: "기억하시나요?" }] },
  // 1: 질문을 던지고 나서 돌아오는 그 짧지만 어색한 정적 말입니다.
  { id: 1, visuals: [{ type: "icon", emoji: "⏱️", label: "응답 전 어색한 정적" }] },
  // 2: 우리는 그 찰나의 순간에 상대가 기계라는 사실을 뼈저리게 체감하곤 하죠.
  { id: 2, visuals: [{ type: "keyword", text: "기계라는 걸 뼈저리게 느낀다" }] },
  // 3: 하지만 이제 그 불쾌한 골짜기가 완전히 메워질지도 모르겠습니다.
  { id: 3, visuals: [{ type: "callout", text: "불쾌한 골짜기가 사라진다", sub: "새로운 시대가 왔다" }] },
  // 4: 알리바바가 최근 공개한 오픈소스 AI, 'Qwen3 TTS'가 그 주인공입니다.
  { id: 4, visuals: [{ type: "callout", text: "Qwen3 TTS", sub: "알리바바 오픈소스 AI 혁신" }] },
  // 5: 이 모델은 무려 97ms라는 경이로운 반응 속도를 기록했습니다.
  { id: 5, visuals: [{ type: "counter", from: 500, to: 97, suffix: "ms 반응 속도" }] },
  // 6: 인간이 도저히 지연을 인지할 수 없는 수준의 실시간 대화를 구현한 겁니다.
  { id: 6, visuals: [{ type: "keyword", text: "인간이 지연을 인지 불가" }] },
  // 7: 더 충격적인 사실은 이 괴물 같은 성능의 모델이 완전히 무료로 풀렸다는 점이죠.
  { id: 7, visuals: [{ type: "callout", text: "완전 무료 오픈소스", sub: "괴물 성능이 공짜로" }] },
  // 8: 유료 서비스의 최강자, 일레븐랩스의 아성을 위협하는 다섯 가지 핵심 이유를 분석해 보겠습니다.
  { id: 8, visuals: [{ type: "infotip", title: "일레븐랩스를 위협하는 5가지", items: ["① 반응 속도", "② 목소리 설계", "③ 복제 성능", "④ 맞춤형 엔진", "⑤ 한국어 현지화"] }] },
  // 9: 가장 먼저 주목할 점은 압도적인 '반응의 속도'입니다.
  { id: 9, visuals: [{ type: "icon", emoji: "⚡", label: "① 반응의 속도" }] },
  // 10: 기존 모델들이 수백 밀리초 동안 뜸을 들일 때, 이 녀석은 첫 글자만 보고도 입을 뗍니다.
  { id: 10, visuals: [{ type: "split", emoji: "⚡", title: "반응 속도 비교", items: ["기존 모델: 수백ms 뜸", "Qwen3: 첫 글자만 보고 출력"] }] },
  // 11: 1.7B 모델 기준으로도 단 101ms면 음성 출력이 시작되죠.
  { id: 11, visuals: [{ type: "counter", from: 500, to: 101, suffix: "ms (1.7B 모델)" }] },
  // 12: 이 기술의 핵심은 멀티토큰 프레딕션이라는 혁신적인 아키텍처에 있습니다.
  { id: 12, visuals: [{ type: "techbadge", label: "핵심 기술", tags: ["멀티토큰 프레딕션"] }] },
  // 13: 다음 프레임을 미리 예측해서 생성하기 때문에 지연 시간을 극한으로 줄인 겁니다.
  { id: 13, visuals: [{ type: "featurecard", icon: "🧠", title: "선행 예측 생성", sub: "다음 프레임을 미리 예측" }] },
  // 14: 단순히 빠른 게 아니라, 기계라는 이질감을 지워버리는 결정적 한 방이죠.
  { id: 14, visuals: [{ type: "callout", text: "기계 이질감을 지운다", sub: "결정적 한 방" }] },
  // 15: 실시간 통역이나 음성 비서 서비스에서 이 속도는 생태계 파괴 수준입니다.
  { id: 15, visuals: [{ type: "split", emoji: "🌐", title: "생태계 파괴급 속도", items: ["실시간 통역", "음성 비서", "라이브 서비스"] }] },
  // 16: 두 번째 혁신은 목소리를 '설계'할 수 있다는 점입니다.
  { id: 16, visuals: [{ type: "icon", emoji: "🎨", label: "② 목소리를 설계한다" }] },
  // 17: 이제 미리 만들어진 리스트에서 목소리를 고를 필요가 없습니다.
  { id: 17, visuals: [{ type: "keyword", text: "리스트에서 고르는 시대 끝났다" }] },
  // 18: 내가 원하는 목소리의 특징을 채팅하듯 설명하면 AI가 즉석에서 창조합니다.
  { id: 18, visuals: [{ type: "callout", text: "채팅으로 목소리를 창조", sub: "원하는 특징을 말하면 즉석 생성" }] },
  // 19: "신뢰감 넘치고 깊은 울림이 있는 중년 남성의 목소리"라고 주문해 보세요.
  { id: 19, visuals: [{ type: "mockup", device: "phone", lines: ['"신뢰감 넘치고 깊은 울림이 있는', '중년 남성의 목소리"'] }] },
  // 20: 모델 내부의 사고 토큰이 지시 사항을 정교하게 분석해 발화 스타일을 설계합니다.
  { id: 20, visuals: [{ type: "techbadge", label: "내부 작동", tags: ["사고 토큰", "발화 스타일 설계"] }] },
  // 21: 성별, 나이, 감정 상태까지 조합해 세상에 없던 캐릭터를 만들 수 있죠.
  { id: 21, visuals: [{ type: "infotip", title: "조합 가능한 요소", items: ["성별", "나이", "감정 상태", "억양·리듬"] }] },
  // 22: 물리적인 음성 샘플 한 조각 없이도 완벽한 페르소나를 구축하는 셈입니다.
  { id: 22, visuals: [{ type: "callout", text: "샘플 없이도 완벽한 페르소나", sub: "텍스트만으로 구축" }] },
  // 23: 세 번째는 소름 돋는 수준의 '복제 성능'입니다.
  { id: 23, visuals: [{ type: "icon", emoji: "🧬", label: "③ 복제 성능" }] },
  // 24: 단 3초 분량의 오디오만 있으면 타겟 화자의 음색을 그대로 가져옵니다.
  { id: 24, visuals: [{ type: "counter", from: 60, to: 3, suffix: "초로 목소리 복제" }] },
  // 25: 영어 단어 오류율은 1.24%로, 유료 모델인 일레븐랩스보다도 낮은 수치입니다.
  { id: 25, visuals: [{ type: "barchart", title: "단어 오류율 (낮을수록 좋음)", bars: [{ label: "Qwen3 TTS", value: 1.24 }, { label: "일레븐랩스", value: 2.1 }], maxValue: 5 }] },
  // 26: 특히 놀라운 건 언어를 넘나드는 '크로스 링구얼' 능력인데요.
  { id: 26, visuals: [{ type: "techbadge", label: "크로스 링구얼", tags: ["언어 교차 복제", "억양 보존"] }] },
  // 27: 중국인의 목소리를 복제해 한국어를 시켜도 특유의 억양이 남지 않습니다.
  { id: 27, visuals: [{ type: "split", emoji: "🌍", title: "크로스 링구얼 예시", items: ["중국인 목소리 → 한국어 발화", "외국어 억양 완전 제거"] }] },
  // 28: 기존 오픈소스 모델들이 해결하지 못한 고질적인 문제를 완전히 뿌리 뽑은 거죠.
  { id: 28, visuals: [{ type: "callout", text: "고질적 문제를 뿌리 뽑았다", sub: "기존 오픈소스의 한계 극복" }] },
  // 29: 이런 기술력의 격차는 실제 체감 성능에서 압도적인 차이를 만듭니다.
  { id: 29, visuals: [{ type: "keyword", text: "압도적인 체감 성능 차이" }] },
  // 30: 네 번째는 용도에 따른 '맞춤형 엔진' 제공입니다.
  { id: 30, visuals: [{ type: "icon", emoji: "⚙️", label: "④ 맞춤형 엔진" }] },
  // 31: 알리바바는 속도와 품질 사이에서 고민하는 개발자들에게 명쾌한 해답을 줬습니다.
  { id: 31, visuals: [{ type: "callout", text: "속도 vs 품질, 명쾌한 해답", sub: "개발자를 위한 선택지" }] },
  // 32: 실시간 대화가 중요하다면 12.5Hz의 초고속 토크나이저를 쓰면 됩니다.
  { id: 32, visuals: [{ type: "featurecard", icon: "🚀", title: "실시간 모드 (12.5Hz)", sub: "초저지연 대화 최적화" }] },
  // 33: 반면 고품질 오디오북이나 영화 더빙이 목적이라면 25Hz 모드를 선택하세요.
  { id: 33, visuals: [{ type: "featurecard", icon: "🎙️", title: "고품질 모드 (25Hz)", sub: "오디오북·더빙 최적화" }] },
  // 34: 이 모드는 최대 10분이 넘는 긴 텍스트도 음성 뭉개짐 없이 매끄럽게 읽어 내려갑니다.
  { id: 34, visuals: [{ type: "counter", from: 0, to: 10, suffix: "분+ 텍스트도 매끄럽게" }] },
  // 35: 맥락 유지 능력이 뛰어나서 긴 호흡의 콘텐츠 제작에 최적화되어 있죠.
  { id: 35, visuals: [{ type: "keyword", text: "맥락 유지 능력이 탁월하다" }] },
  // 36: 상황에 따라 엔진을 갈아 끼울 수 있다는 건 창작자에게 엄청난 축복입니다.
  { id: 36, visuals: [{ type: "callout", text: "엔진을 갈아 끼운다", sub: "창작자에게 엄청난 축복" }] },
  // 37: 마지막 다섯 번째는 한국어 사용자들을 위한 '완벽한 현지화'입니다.
  { id: 37, visuals: [{ type: "icon", emoji: "🇰🇷", label: "⑤ 완벽한 한국어 현지화" }] },
  // 38: 외국 AI가 한국어를 읽을 때 느껴지는 특유의 '교포 발음'이 전혀 없습니다.
  { id: 38, visuals: [{ type: "callout", text: "교포 발음이 없다", sub: "네이티브 수준 한국어" }] },
  // 39: 한국어 네이티브 화자의 톤과 리듬을 완벽하게 학습했기 때문입니다.
  { id: 39, visuals: [{ type: "featurecard", icon: "🎵", title: "한국어 네이티브 학습", sub: "톤·리듬·정서 완벽 구현" }] },
  // 40: 문맥에 따라 느낌표 하나에도 밝은 에너지를 담아낼 줄 압니다.
  { id: 40, visuals: [{ type: "techbadge", label: "문맥 감지", tags: ["감탄", "침묵", "생동감", "차분함"] }] },
  // 41: 수치상으로도 GPT-4o 오디오 프리뷰를 가볍게 따돌리는 성적을 거뒀습니다.
  { id: 41, visuals: [{ type: "barchart", title: "한국어 TTS 성능 비교", bars: [{ label: "Qwen3 TTS", value: 90 }, { label: "GPT-4o Audio", value: 72 }], maxValue: 100 }] },
  // 42: 진지한 내용에선 차분하게 가라앉고, 기쁜 내용에선 생동감이 넘칩니다.
  { id: 42, visuals: [{ type: "split", emoji: "🎭", title: "감정 표현", items: ["진지한 내용 → 차분하게", "기쁜 내용 → 생동감 넘치게"] }] },
  // 43: 한국어 특유의 정서를 오픈소스가 이 정도로 구현했다는 게 믿기지 않을 정도죠.
  { id: 43, visuals: [{ type: "keyword", text: "한국어 정서, 오픈소스가 구현했다" }] },
  // 44: 구독과 좋아요를 눌러주시면 이런 혁신적인 AI 정보를 가장 빠르게 만나보실 수 있습니다.
  { id: 44, visuals: [{ type: "callout", text: "구독 & 좋아요", sub: "AI 혁신 정보를 가장 빠르게" }] },
  // 45: 결국 Qwen3 TTS의 등장은 음성 AI 기술의 '민주화'를 의미합니다.
  { id: 45, visuals: [{ type: "callout", text: "음성 AI의 민주화", sub: "Qwen3 TTS가 의미하는 것" }] },
  // 46: 500만 시간 이상의 방대한 데이터를 학습한 기술이 전 세계에 무료로 배포됐습니다.
  { id: 46, visuals: [{ type: "counter", from: 0, to: 500, suffix: "만 시간 데이터 무료 배포" }] },
  // 47: 이제 자본력이 부족한 개인이나 스타트업도 최상급 음성 서비스를 만들 수 있습니다.
  { id: 47, visuals: [{ type: "infotip", title: "이제 가능해진 것들", items: ["개인도 프리미엄 TTS 제작", "스타트업의 음성 앱 개발", "일레븐랩스급 품질 무료로"] }] },
  // 48: 비싼 구독료를 내야만 쓸 수 있었던 프리미엄 기능들이 이제 모두의 손에 쥐어졌습니다.
  { id: 48, visuals: [{ type: "keyword", text: "프리미엄이 모두의 손에" }] },
  // 49: 장벽이 허물어진 만큼, 앞으로 나올 창의적인 서비스들이 기대되지 않나요?
  { id: 49, visuals: [{ type: "callout", text: "장벽이 허물어졌다", sub: "앞으로 나올 창의적 서비스들" }] },
  // 50: 여러분이 상상하는 가장 완벽한 음성 AI의 모습은 무엇인가요?
  { id: 50, visuals: [{ type: "callout", text: "당신이 꿈꾸는 음성 AI는?", sub: "가장 완벽한 모습을 상상해보세요" }] },
  // 51: 댓글로 여러분의 생각을 공유해 주세요.
  { id: 51, visuals: [{ type: "icon", emoji: "💬", label: "댓글로 공유해주세요" }] },
  // 52: 이번 영상이 도움 되셨다면 주변 동료들에게도 공유 부탁드립니다.
  { id: 52, visuals: [{ type: "callout", text: "동료에게도 공유해주세요" }] },
  // 53: 다음에도 눈이 번쩍 뜨이는 기술 소식으로 돌아오겠습니다.
  { id: 53, visuals: [{ type: "icon", emoji: "🙏", label: "다음 인사이트로 돌아오겠습니다" }] },
  // 54: 시청해 주셔서 감사합니다.
  { id: 54, visuals: [{ type: "callout", text: "시청해 주셔서 감사합니다" }] },
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
      <Audio src={staticFile("audio.mp3")} volume={12.6} />

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
