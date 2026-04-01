# auto-yt 프로젝트 컨텍스트

## 프로젝트 목적
`vibe.txt` 대본 파일을 입력으로 받아, **Qwen3-TTS (목소리 클로닝)** + Remotion을 이용해 유튜브 영상을 자동 생성하는 파이프라인.

## TTS 엔진
- **Qwen3-TTS-12Hz-0.6B-Base** (로컬, 무료)
- conda 환경: `qwen3-tts`
- 레퍼런스 음성: `ref_voice.wav` (사용자 목소리 클론)
- 실행기: `scripts/qwen3_tts_runner.py`

## 채널 구조

### channels.json
```json
{
  "channels": {
    "vibe": {
      "display_name": "바이브빌더",
      "tts_engine": "qwen3",
      "ref_audio": "ref_voice.wav",
      "token": "secrets/token_vibe.json",
      "output_dir": "output/vibe"
    }
  }
}
```

### 채널별 디렉토리
```
output/{channel_id}/
  audio.mp3        ← Qwen3-TTS 출력
  sync_data.json   ← 타임스탬프 (ms 단위)
  video.mp4        ← 최종 렌더
  metadata.json    ← YouTube 메타데이터
```

## 핵심 파일 맵
| 파일 | 역할 |
|------|------|
| `channels.json` | 채널별 TTS 설정, OAuth 경로 |
| `scripts/run_pipeline.py` | **메인 오케스트레이터** |
| `scripts/generate_audio.py` | Qwen3-TTS 호출 → `output/{channel}/audio.mp3` |
| `scripts/qwen3_tts_runner.py` | Qwen3-TTS 실행기 (qwen3-tts env에서 실행) |
| `scripts/upload_youtube.py` | YouTube 업로드 |
| `src/components/MainVideo.tsx` | 메인 영상 컴포지션 + SCENE_PLAN |
| `src/components/Subtitle.tsx` | 타임스탬프 기반 자막 |
| `src/components/Visuals.tsx` | 배경 그라데이션 + 파티클 |
| `ref_voice.wav` | 목소리 클로닝 레퍼런스 |

## 워크플로우

### 전체 파이프라인 (권장)
```bash
python3 scripts/run_pipeline.py --channel vibe vibe.txt
```

### 단계 스킵
```bash
python3 scripts/run_pipeline.py --channel vibe vibe.txt --skip-tts    # 렌더+업로드만
python3 scripts/run_pipeline.py --channel vibe vibe.txt --skip-render  # TTS+업로드만
```

### 레거시 (단계별 수동 실행)
```bash
python3 scripts/generate_audio.py --channel vibe --script vibe.txt --force
npm start        # Remotion Studio 미리보기
npm run render
python3 scripts/upload_youtube.py
```

## 영상 제작 시 필수 순서 (예외 없음)

**vibe.txt 수정 후 영상 제작 시 반드시:**

1. `output/vibe/sync_data.json` 문장 확인 (TTS 완료 여부)
2. `output/vibe/metadata.json` 전면 교체 (제목·설명·챕터·태그)
3. `src/components/MainVideo.tsx` SCENE_PLAN 전체 교체
4. `run_pipeline.py --skip-tts` 실행

## Video Pipeline
- YouTube 재업로드 시 반드시 `--force-new` 플래그 사용 (metadata update 금지 — 구버전 영상이 노출되는 문제 방지)
- 소스 데이터(vibe.txt 등)가 변경되면 모든 의존 파일을 재생성할 것: SCENE_PLAN, metadata.json, 썸네일

## 중요 규칙
- `.env`, `secrets/`, `output/`는 절대 커밋하지 말 것
- `sync_data.json` 타임스탬프 단위: **밀리초(ms)**
- Remotion 렌더는 `public/audio.mp3` + `src/data/sync_data.json` 공유 사용
- Remotion 컴포지션 ID: `MainVideo` / 영상 스펙: 1920x1080, 30fps
- webpack 캐시 문제 시: `rm -rf node_modules/.cache/webpack`
