# auto-yt

대본 파일 하나로 유튜브 영상을 자동 생성하는 1인 크리에이터 파이프라인.

## 파이프라인 흐름

```
vibe.txt (대본)
  → ElevenLabs TTS + 타임스탬프
  → sync_data.json
  → Remotion 영상 렌더
  → out/video.mp4

  + out/thumbnail.png
  + youtube_metadata.json
```

## 빠른 시작

### 1. 환경 설정
```bash
npm install
pip3 install elevenlabs python-dotenv requests
```

`.env` 파일에 API 키 입력:
```
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

### 2. 대본 작성
`vibe.txt`에 대본 작성 (한국어, 줄바꿈으로 문장 구분)

### 3. 오디오 + 싱크 데이터 생성
```bash
python3 scripts/generate_audio.py
```
- 출력: `public/audio.mp3`, `src/data/sync_data.json`
- 이미 생성된 경우 캐시 사용 (강제 재생성: `--force`)

### 4. 미리보기
```bash
npm start
# http://localhost:3000 → MainVideo 선택
```

### 5. 최종 렌더
```bash
npm run render
# 출력: out/video.mp4
```

### 6. 썸네일 생성
```bash
npx remotion still src/index.ts Thumbnail out/thumbnail.png --frame=0
```

---

## 산출물

| 파일 | 설명 |
|------|------|
| `out/video.mp4` | 최종 영상 |
| `out/thumbnail.png` | 유튜브 썸네일 (1280×720) |
| `youtube_metadata.json` | 제목 · 설명 · 태그 |

---

## 영상 스펙

- 해상도: 1920×1080
- 프레임레이트: 30fps
- 자막: 5단어씩 한 줄, 단어 그룹 페이드 인/아웃

## 시각 요소 타입

| 타입 | 설명 | 사용 시점 |
|------|------|---------|
| Icon | 이모지 + 레이블 | 개념 시각화 |
| Keyword | 큰 텍스트 팝인 | 핵심 메시지 강조 |
| Counter | 숫자 카운터 | 수치 임팩트 |
| InfoTip | 제목 + 불릿 카드 | 정보 전달 |
| TechBadge | 기술 이름 pill | 스택/도구 소개 |

---

## 프로젝트 구조

```
auto-yt/
├── vibe.txt                  # 대본
├── scripts/
│   └── generate_audio.py     # TTS + 타임스탬프 생성
├── src/
│   ├── components/
│   │   ├── Root.tsx           # Remotion 루트
│   │   ├── MainVideo.tsx      # 메인 컴포지션 + 씬 플랜
│   │   ├── Subtitle.tsx       # 자막 렌더러
│   │   ├── Visuals.tsx        # 배경 그라데이션 + 파티클
│   │   └── Thumbnail.tsx      # 썸네일 컴포지션
│   ├── data/
│   │   └── sync_data.json     # 타임스탬프 데이터
│   └── types.ts
├── public/
│   └── audio.mp3              # TTS 오디오
├── out/
│   ├── video.mp4
│   └── thumbnail.png
├── docs/
│   └── architecture.md
├── youtube_metadata.json
├── .env                       # API 키 (커밋 금지)
├── CLAUDE.md                  # AI 에이전트 컨텍스트
└── README.md
```

---

## 새 영상 만들기

1. `vibe.txt` 교체
2. `python3 scripts/generate_audio.py --force`
3. `MainVideo.tsx`의 `SCENE_PLAN` 업데이트 (대본 내용에 맞게)
4. `npm run render`
5. `npx remotion still src/index.ts Thumbnail out/thumbnail.png --frame=0`
6. `youtube_metadata.json` 업데이트
