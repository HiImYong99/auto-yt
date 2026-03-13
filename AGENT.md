# 에이전트 역할 정의

## Phase 1: 수석 아키텍트 ✅
- **산출물:** `docs/architecture.md`
- **역할:** 디렉토리 구조, 데이터 플로우, 라이브러리 선정

## Phase 2: 오디오 & 싱크 엔지니어 ✅
- **산출물:** `scripts/generate_audio.py`, `public/audio.mp3`, `src/data/sync_data.json`
- **역할:** ElevenLabs API 연동, 타임스탬프 추출, 캐싱 로직
- **주의:** ElevenLabs `/with-timestamps` 엔드포인트 사용, alignment.characters 기반 파싱

## Phase 3: Motion & Remotion 개발자 ✅
- **산출물:** `src/components/` 전체, `remotion.config.ts`, `package.json`, `tsconfig.json`
- **역할:** 비주얼 배경(그라데이션+파티클), 자막 렌더러(단어 하이라이트), Sequence 분할
- **성능:** `CHUNK_SIZE_SENTENCES = 10` 단위로 Sequence 분할

## Phase 4: YouTube SEO 스페셜리스트 ✅
- **산출물:** `youtube_metadata.json`
- **역할:** 클릭 유도 제목, SEO 설명(타임라인 포함), 핵심 태그 15개

## Phase 5: 컨텍스트 매니저 ✅
- **산출물:** `CLAUDE.md`, `AGENT.md`, `SKILL.md`
- **역할:** 프로젝트 컨텍스트 보존, 다음 세션 즉시 복구 가능하도록 문서화
