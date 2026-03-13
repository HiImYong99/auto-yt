# 프로젝트 스킬 & 도구 목록

> 다운로드 수 1k+ 검증된 패키지만 포함

## Python 의존성
| 패키지 | npm/PyPI 주간 다운로드 | 용도 |
|--------|----------------------|------|
| `elevenlabs` | 1M+ / week | TTS API 클라이언트 (공식 SDK) |
| `python-dotenv` | 30M+ / week | .env 파일 로드 |
| `requests` | 300M+ / week | HTTP 클라이언트 |

설치:
```bash
pip3 install elevenlabs python-dotenv requests
```

## Node.js 의존성
| 패키지 | npm 주간 다운로드 | 용도 |
|--------|-----------------|------|
| `remotion` | 200K+ / week | 영상 렌더링 프레임워크 |
| `@remotion/cli` | 200K+ / week | CLI 렌더/스튜디오 도구 |
| `react` | 20M+ / week | UI 런타임 |
| `typescript` | 50M+ / week | 타입 시스템 |

설치:
```bash
npm install
```

## 외부 서비스
| 서비스 | 용도 | 설정 위치 |
|--------|------|---------|
| ElevenLabs | TTS + 타임스탬프 | `.env` → `ELEVENLABS_API_KEY` |

## 선택적 도구 (렌더 후 처리)
| 도구 | 용도 | 설치 |
|------|------|------|
| FFmpeg | MP4 후처리, 압축 | `brew install ffmpeg` |
| yt-dlp | 유튜브 업로드 자동화 | `pip3 install yt-dlp` |
