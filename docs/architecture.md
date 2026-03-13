# Auto-YT Project Architecture

## 프로젝트 개요
`vibe.txt` 대본을 기반으로 ElevenLabs TTS + Remotion을 활용하여 유튜브 영상을 자동 생성하는 파이프라인.

---

## 디렉토리 구조

```
auto-yt/
├── docs/
│   └── architecture.md          # 이 파일
├── src/
│   ├── data/
│   │   └── sync_data.json       # TTS 타임스탬프 + 자막 싱크 데이터
│   ├── components/
│   │   ├── Root.tsx             # Remotion 루트 컴포넌트
│   │   ├── MainVideo.tsx        # 메인 비디오 컴포지션
│   │   ├── Subtitle.tsx         # 자막 렌더러
│   │   └── Visuals.tsx          # 배경 비주얼 (그라데이션, 파티클 등)
│   └── index.ts                 # Remotion 진입점
├── public/
│   └── audio.mp3                # ElevenLabs 생성 오디오
├── scripts/
│   └── generate_audio.py        # ElevenLabs TTS + 타임스탬프 생성 스크립트
├── .env                         # API 키 (ELEVENLABS_API_KEY)
├── vibe.txt                     # 원본 대본
├── youtube_metadata.json        # Phase 4에서 생성되는 SEO 메타데이터
├── remotion.config.ts           # Remotion 설정
├── package.json
├── tsconfig.json
├── CLAUDE.md                    # 에이전트 컨텍스트 (Phase 5)
└── AGENT.md                     # 에이전트 역할 정의 (Phase 5)
```

---

## 데이터 흐름

```
vibe.txt (원본 대본)
    │
    ▼
[generate_audio.py]
    │  ElevenLabs API (text-to-speech with timestamps)
    │  → 단어/문장 단위 타임스탬프 추출 (alignment API)
    │
    ├──→ public/audio.mp3          (TTS 오디오)
    └──→ src/data/sync_data.json   (타임스탬프 싱크 데이터)
              │
              ▼
    [Remotion 컴포지션]
              │  sync_data.json 로드
              │  audio.mp3 재생
              │  타임스탬프 기반 자막 렌더링
              │  비주얼 모션 그래픽
              │
              ▼
    [remotion render]
              │
              ▼
         output.mp4 (유튜브 업로드용)
```

---

## sync_data.json 스키마

```json
{
  "duration_ms": 480000,
  "sentences": [
    {
      "id": 0,
      "text": "프로그래밍의 시대는 완전히 저물었습니다.",
      "start_ms": 0,
      "end_ms": 3200,
      "words": [
        { "word": "프로그래밍의", "start_ms": 0, "end_ms": 820 },
        { "word": "시대는", "start_ms": 830, "end_ms": 1400 },
        { "word": "완전히", "start_ms": 1420, "end_ms": 2100 },
        { "word": "저물었습니다.", "start_ms": 2120, "end_ms": 3200 }
      ]
    }
  ]
}
```

---

## 사용 라이브러리

### Python (오디오 생성)
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `elevenlabs` | latest | TTS 생성 + 타임스탬프 추출 |
| `python-dotenv` | latest | .env 로드 |
| `requests` | latest | HTTP 폴백 |

### Node.js / TypeScript (영상 렌더링)
| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| `remotion` | ^4.x | 영상 렌더링 프레임워크 |
| `@remotion/player` | ^4.x | 미리보기 플레이어 |
| `@remotion/cli` | ^4.x | CLI 렌더 도구 |
| `react` | ^18 | UI 컴포넌트 |
| `typescript` | ^5 | 타입 안전성 |

---

## 영상 사양
- 해상도: 1920x1080 (Full HD)
- 프레임레이트: 30fps
- 총 길이: ~8분 (≈14,400 프레임)
- 오디오: MP3, 44.1kHz

---

## 환경 변수 (.env)
```
ELEVENLABS_API_KEY=your_key_here
ELEVENLABS_VOICE_ID=your_voice_id_here
```

---

## 캐싱 전략
- `public/audio.mp3` 존재 시 TTS API 재호출 스킵
- `src/data/sync_data.json` 존재 시 타임스탬프 파싱 스킵
- 강제 재생성: `--force` 플래그 사용
