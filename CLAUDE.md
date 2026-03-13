# auto-yt 프로젝트 컨텍스트

## 프로젝트 목적
`vibe.txt` 대본 파일을 입력으로 받아, ElevenLabs TTS + Remotion을 이용해 유튜브 영상을 자동 생성하는 파이프라인.

## 핵심 파일 맵
| 파일 | 역할 |
|------|------|
| `vibe.txt` | 원본 대본 (한국어) |
| `scripts/generate_audio.py` | ElevenLabs TTS 호출 → `public/audio.mp3` + `src/data/sync_data.json` 생성 |
| `src/data/sync_data.json` | 단어/문장 단위 타임스탬프 (ms 단위) |
| `public/audio.mp3` | TTS 오디오 |
| `src/components/Root.tsx` | Remotion 루트, 컴포지션 등록 |
| `src/components/MainVideo.tsx` | 메인 영상 컴포지션 (오디오 + 자막 + 비주얼) |
| `src/components/Subtitle.tsx` | 타임스탬프 기반 자막 렌더러 (단어 하이라이트) |
| `src/components/Visuals.tsx` | 배경 그라데이션 + 파티클 모션 |
| `youtube_metadata.json` | SEO 최적화 제목/설명/태그 |
| `.env` | API 키 (ELEVENLABS_API_KEY, ELEVENLABS_VOICE_ID) |

## 워크플로우

### 1. 대본 변경 시
```bash
# vibe.txt 수정 후
python3 scripts/generate_audio.py --force
npm start   # Remotion Studio에서 미리보기
```

### 2. 최초 실행 (캐시 없음)
```bash
python3 scripts/generate_audio.py   # 오디오 + 싱크 데이터 생성
npm install                          # 패키지 설치
npm start                            # Studio 미리보기
```

### 3. 최종 렌더
```bash
npm run render
# 출력: out/video.mp4
```

## 중요 규칙
- `.env`를 절대 커밋하지 말 것 (API 키 포함)
- `public/audio.mp3`와 `src/data/sync_data.json`이 존재하면 TTS API를 재호출하지 않음 (캐싱)
- 강제 재생성 시 `--force` 플래그 사용
- `sync_data.json`의 타임스탬프 단위는 **밀리초(ms)**
- Remotion 컴포지션 ID: `MainVideo`
- 영상 스펙: 1920x1080, 30fps

## 현재 상태 (Phase 완료 기록)
- [x] Phase 1: 아키텍처 설계 (`docs/architecture.md`)
- [x] Phase 2: TTS + 싱크 데이터 생성 스크립트 (`scripts/generate_audio.py`)
- [x] Phase 3: Remotion 컴포넌트 구현 (`src/components/`)
- [x] Phase 4: SEO 메타데이터 (`youtube_metadata.json`)
- [x] Phase 5: 컨텍스트 문서화 (이 파일)

## 다음 단계
- `public/audio.mp3` 존재 확인 후 `npm start`로 Remotion Studio 미리보기
- 디자인 조정 원할 시: `src/components/Visuals.tsx` (배경), `src/components/Subtitle.tsx` (자막 스타일)
- 최종 렌더: `npm run render`
