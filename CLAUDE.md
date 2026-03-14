# auto-yt 프로젝트 컨텍스트

## 프로젝트 목적
유튜브 URL을 입력받아 **다중 채널**을 대상으로 대본 생성 → TTS → Remotion 렌더 → YouTube 업로드를 자동화하는 파이프라인.

---

## 빠른 시작 (1분 안에 실행)

### CLI 모드
```bash
npm run start:cli
# → 채널 선택 → URL 입력 → 파이프라인 자동 실행
```

### 웹 대시보드 모드
```bash
npm run start:web
# → http://localhost:3001 에서 채널 선택 + 진행률 실시간 확인
```

### Remotion Studio (영상 미리보기)
```bash
npm start        # Studio 실행
npm run render   # 최종 렌더 (out/video.mp4)
```

---

## 다중 채널 설정 방법

### 1. `channels.config.json` 편집
```json
{
  "channels": [
    {
      "channelId": "tech_ch",
      "channelName": "테크 리뷰 채널",
      "voiceId": "ELEVENLABS_VOICE_ID_HERE",
      "youtubeAuthTokenPath": "./tokens/tech_token.json",
      "systemPrompt": "테크 채널 전용 대본 스타일 지시사항 (선택)"
    },
    {
      "channelId": "finance_ch",
      "channelName": "재테크 채널",
      "voiceId": "ANOTHER_VOICE_ID",
      "youtubeAuthTokenPath": "./tokens/finance_token.json",
      "systemPrompt": ""
    }
  ]
}
```

### 2. `.env` 공통 API 키 설정
```env
ELEVENLABS_API_KEY=your_key
GEMINI_API_KEY=your_key
```
> `.env`에는 공통 키만. `voiceId`는 반드시 `channels.config.json`에서 관리.

### 3. YouTube OAuth 토큰 발급 (채널별 1회)
각 채널의 `youtubeAuthTokenPath` 경로에 OAuth 토큰을 발급받아야 합니다.
```bash
# 업로드 시 해당 경로의 토큰이 없으면 브라우저 인증 화면이 뜸
# 인증 후 자동 저장되어 이후 실행은 브라우저 없이 자동 처리
```

---

## 핵심 파일 맵

| 파일/폴더 | 역할 |
|-----------|------|
| `channels.config.json` | **[NEW]** 다중 채널 설정 (Voice ID, OAuth 경로, 시스템 프롬프트) |
| `pipeline.state.json` | **[NEW]** 현재 실행 중인 파이프라인 상태 (웹 대시보드 연동) |
| `src/core/configManager.ts` | **[NEW]** 채널 설정 로드/검증 유틸리티 |
| `src/core/pipeline.ts` | **[NEW]** 전체 파이프라인 오케스트레이션 (TypeScript) |
| `src/cli/index.ts` | **[NEW]** CLI 엔트리포인트 |
| `src/web/server.ts` | **[NEW]** 웹 대시보드 Express 서버 |
| `src/web/public/index.html` | **[NEW]** 웹 대시보드 UI |
| `output/{channelId}_{jobId}/` | **[NEW]** 작업별 독립 결과물 폴더 |
| `vibe.txt` | 대본 (캐노니컬 경로, 파이프라인이 자동 업데이트) |
| `scripts/generate_audio.py` | ElevenLabs TTS (`--voice-id`, `--script-file`, `--audio-out`, `--sync-out` 지원) |
| `scripts/generate_script.py` | Gemini 대본 생성 (`--output-dir`, `--system-prompt` 지원) |
| `scripts/generate_scene_plan.py` | Gemini 씬 플랜 (`--vibe-file`, `--output` 지원) |
| `scripts/upload_youtube.py` | YouTube 업로드 (`--token-path`, `--video-path`, `--thumb-path`, `--metadata-path` 지원) |
| `src/components/MainVideo.tsx` | Remotion 메인 컴포지션 |
| `.env` | 공통 API 키 (ELEVENLABS_API_KEY, GEMINI_API_KEY) |

---

## 파이프라인 흐름

```
채널 선택 (channels.config.json)
    ↓
YouTube URL 입력
    ↓
트랜스크립트 추출 (scripts/extract_transcript.py)
    ↓
대본 생성 (Gemini + 채널별 systemPrompt)
    ↓
씬 플랜 생성 (Gemini)
    ↓
TTS (ElevenLabs + 채널별 voiceId)
    ↓
Remotion 렌더 (1920x1080, 30fps)
    ↓
YouTube 업로드 (채널별 OAuth 토큰)
    ↓
output/{channelId}_{jobId}/ 에 모든 결과물 보관
```

---

## 중요 규칙

- `.env`를 절대 커밋하지 말 것
- `channels.config.json`은 커밋 가능 (API 키 없음, token 경로만 포함)
- 각 채널의 OAuth 토큰 파일은 절대 혼용 금지 (파이프라인이 격리 보장)
- `output/` 폴더는 대용량 영상 포함 → `.gitignore` 권장
- `sync_data.json` 타임스탬프 단위: **밀리초(ms)**
- Remotion 컴포지션 ID: `MainVideo` / 스펙: 1920×1080, 30fps

---

## 완료된 Phase

- [x] 기존 Phase 1~5: 단일 채널 파이프라인 (TTS, Remotion, SEO)
- [x] 리팩토링 Phase 1: `channels.config.json` + `src/core/configManager.ts`
- [x] 리팩토링 Phase 2: CLI (`npm run start:cli`) + 웹 대시보드 (`npm run start:web`)
- [x] 리팩토링 Phase 3: 파이프라인 파라미터화 (voiceId, outputDir 동적 주입)
- [x] 리팩토링 Phase 4: YouTube 다중 채널 OAuth 라우팅
- [x] 리팩토링 Phase 5: 문서 업데이트 (이 파일)
