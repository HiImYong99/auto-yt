# auto-yt

`auto-yt`는 **대본 파일 하나로 유튜브 영상을 자동 생성하는 1인 크리에이터용 콘텐츠 파이프라인**입니다.

핵심 목적은 반복적인 영상 제작 과정을 줄여서,
**스크립트 → 음성 → 싱크 → 영상 → 썸네일 → 메타데이터** 흐름을 빠르게 돌리는 것입니다.

## What it solves

- 영상 하나 만들 때 반복 작업이 너무 많다
- 대본은 있는데 영상화가 느리다
- 1인 크리에이터가 제작 시간을 줄이기 어렵다

## Pipeline

```text
vibe.txt (대본)
  → ElevenLabs TTS + 타임스탬프 생성
  → sync_data.json 생성
  → Remotion 영상 렌더
  → out/video.mp4
  → out/thumbnail.png
  → youtube_metadata.json
```

## Core Features

- 🎙️ 대본 기반 TTS 생성
- ⏱️ 오디오 싱크 데이터 자동 생성
- 🎬 Remotion 기반 영상 렌더링
- 🖼️ 썸네일 생성
- 📝 유튜브 메타데이터 관리

## Tech Stack

- TypeScript
- Remotion
- Python
- ElevenLabs API

## Status

**MVP / Active**

현재는 범용 유튜브 자동화 툴이라기보다,
**1인 크리에이터용 자동 제작 파이프라인 프로토타입**에 가깝습니다.

## Quick Start

### 1. Install

```bash
npm install
pip3 install elevenlabs python-dotenv requests
```

### 2. Environment

`.env`:

```env
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

### 3. Write Script

`vibe.txt`에 대본 작성

### 4. Generate Audio + Sync

```bash
python3 scripts/generate_audio.py
```

출력:
- `public/audio.mp3`
- `src/data/sync_data.json`

### 5. Preview

```bash
npm start
```

### 6. Render Final Video

```bash
npm run render
```

### 7. Generate Thumbnail

```bash
npx remotion still src/index.ts Thumbnail out/thumbnail.png --frame=0
```

## Output

- `out/video.mp4`
- `out/thumbnail.png`
- `youtube_metadata.json`

## Best Fit

이 프로젝트는 특히 아래에 맞습니다.

- 쇼츠/정보형 영상 반복 제작
- 대본 중심 콘텐츠 제작
- 1인 운영 크리에이터 자동화
- AI 음성 기반 콘텐츠 실험

## Next Steps

- 특정 니치용 템플릿화
- 메타데이터 자동 생성 품질 개선
- 업로드 전 검수 플로우 추가
- 반자동 → 준자동 운영 흐름 확장
