# auto-yt 프로젝트 컨텍스트

## 프로젝트 목적
`vibe.txt` 대본 파일을 입력으로 받아, ElevenLabs TTS + Remotion을 이용해 유튜브 영상을 자동 생성하는 파이프라인.

## 멀티채널 구조

### channels.json - 채널 레지스트리
```json
{
  "channels": {
    "vibe": {
      "display_name": "바이브코더",
      "voice_id": "7Nah3cbXKVmGX7gQUuwz",
      "client_secret": "secrets/vibe/client_secret.json",
      "token": "secrets/vibe/token.json",
      "output_dir": "output/vibe"
    }
  }
}
```

### 대본 파일 명명 규칙
- `{channel_id}__{이름}.txt` → 채널 자동 감지
- 예: `vibe__2026ai.txt`, `kdrama__news_apr.txt`

### 채널별 디렉토리
```
secrets/{channel_id}/
  client_secret.json   ← Google OAuth (gitignored)
  token.json           ← OAuth 캐시 (gitignored)

output/{channel_id}/
  audio.mp3            ← TTS 출력
  sync_data.json       ← 타임스탬프
  video.mp4            ← 최종 렌더
  metadata.json        ← YouTube 메타데이터
```

## 핵심 파일 맵
| 파일 | 역할 |
|------|------|
| `channels.json` | 채널별 voice_id, OAuth, 출력 경로 설정 |
| `scripts/run_pipeline.py` | **메인 오케스트레이터** (멀티채널 병렬 처리) |
| `scripts/generate_audio.py` | ElevenLabs TTS → `output/{channel}/audio.mp3` |
| `scripts/upload_youtube.py` | YouTube 업로드 (채널별 OAuth) |
| `src/components/MainVideo.tsx` | 메인 영상 컴포지션 |
| `src/components/Subtitle.tsx` | 타임스탬프 기반 자막 |
| `src/components/Visuals.tsx` | 배경 그라데이션 + 파티클 |
| `youtube_metadata.json` | SEO 메타데이터 (기본값) |
| `.env` | ELEVENLABS_API_KEY |

## 워크플로우

### 멀티채널 파이프라인 (권장)
```bash
# 단일 채널 (파일명에서 자동 감지):
python3 scripts/run_pipeline.py vibe__2026ai.txt

# 여러 채널 동시 처리:
python3 scripts/run_pipeline.py vibe__2026ai.txt kdrama__news.txt

# 채널 명시:
python3 scripts/run_pipeline.py --channel vibe vibe.txt

# 인터랙티브:
python3 scripts/run_pipeline.py

# 단계 스킵:
python3 scripts/run_pipeline.py vibe__script.txt --skip-tts --skip-render
```

### 동시성 방식
- **Phase 1 (TTS)**: 병렬 (채널별 독립 API 호출)
- **Phase 2 (Render)**: 순차 (Remotion 공유 파일 의존)
- **Phase 3 (Upload)**: 병렬 (채널별 독립 OAuth)

### 새 채널 추가 방법
1. `channels.json`에 채널 추가
2. `secrets/{channel_id}/client_secret.json` 생성 (Google Cloud Console)
3. 대본 파일 `{channel_id}__script.txt` 작성
4. `python3 scripts/run_pipeline.py {channel_id}__script.txt`

### 레거시 (단일 채널 방식)
```bash
python3 scripts/generate_audio.py --force
npm start
npm run render
python3 scripts/upload_youtube.py
```

## 중요 규칙
- `.env`, `secrets/`, `output/`는 절대 커밋하지 말 것
- `sync_data.json`의 타임스탬프 단위는 **밀리초(ms)**
- Remotion 렌더는 `public/audio.mp3` + `src/data/sync_data.json`을 공유 사용
- 렌더 후 `out/video.mp4` → `output/{channel}/video.mp4`로 자동 복사됨
- Remotion 컴포지션 ID: `MainVideo` / 영상 스펙: 1920x1080, 30fps
