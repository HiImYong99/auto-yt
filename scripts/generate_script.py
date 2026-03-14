"""
Gemini API로 대본 + 유튜브 메타데이터 생성
- 입력: 원본 유튜브 트랜스크립트
- 출력: vibe.txt (대본), youtube_metadata.txt (제목/설명/태그)
"""

import os
import sys
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
VIBE_FILE = ROOT / "vibe.txt"
METADATA_FILE = ROOT / "youtube_metadata.txt"

GHOSTWRITER_PROMPT = """당신은 수석 유튜브 스크립트 고스트라이터입니다. 기존 떡상한 유튜브 영상의 대본을 분석하여, 핵심 인사이트는 유지하되 완전히 다른 영상처럼 느껴지도록 대본을 재창조합니다. 표절의 흔적을 완벽히 지우고, 화자의 호흡과 템포까지 고려한 실전용 대본을 작성합니다.

[핵심 규칙]

1. 완벽한 재창조: 단어 선택, 문장 구조, 비유, 예시를 완전히 뒤엎어 "따라 한 티가 전혀 나지 않게" 새롭게 써라.

2. 분량 및 템포: 총 8분 분량의 한국어 대본을 작성한다. 각 시퀀스는 화자가 읽을 때 최대 10초를 넘지 않는 호흡이 되도록 1~2문장으로 짧고 타격감 있게 끊어친다. 3~5초 분량의 아주 짧은 문장도 리듬감을 위해 섞어라.

3. 엄격한 출력 제약:
   - 대본 이외의 어떤 텍스트도 출력하지 마라.
   - 시퀀스 번호, 타임라인, 파트 제목, 화자 표시를 절대 포함하지 마라.
   - 인사말, 요약, 부연 설명, 맺음말 등 AI 응답 멘트 일절 금지.

4. 포맷팅: 하나의 시퀀스가 끝날 때마다 반드시 빈 줄(줄바꿈 2번)을 넣어라.

5. CTA: 내용 흐름상 감정이 고조되는 자연스러운 지점에 댓글 유도 또는 구독 유도 멘트를 자연스럽게 삽입하라. 억지스럽지 않게, 내용의 일부처럼 녹여내라.

[자체 검수]
출력 전 반드시 확인:
- 숫자(번호), 시간, 제목이 섞여 있으면 전부 삭제
- 각 시퀀스가 최대 10초 이내 1~2문장인지 확인
- 전체 분량이 8분을 채우는지 확인 (짧은 시퀀스들이 모여 8분 구성)
- 원본과 표현이 너무 똑같지 않은지 확인

아래는 원본 영상 트랜스크립트입니다. 위 규칙을 따라 완전히 새로운 한국어 대본만 출력하세요:

"""

METADATA_PROMPT = """아래는 유튜브 영상 대본입니다. 이 대본을 기반으로 유튜브 SEO에 최적화된 제목, 설명, 태그를 한국어로 생성해주세요.

반드시 아래 형식 그대로만 출력하세요. 다른 텍스트는 절대 포함하지 마세요:

■ 제목
[훅(핵심 자극 키워드) | 부제목(구체적 혜택/호기심 유발), 40자 이내]

■ 설명
[영상의 핵심 가치를 담은 1문장 요약. SEO 키워드 포함.]

[본문 2~3문단: 영상에서 다루는 핵심 내용을 구체적으로 설명. 시청자가 얻을 수 있는 가치를 명확히 제시. 자연스럽게 키워드 삽입.]

⏱️ 타임스탬프
00:00 인트로
[대본 흐름을 바탕으로 1~2분 간격의 섹션 타임스탬프를 추정하여 작성. 실제 영상은 8분 내외.]

🔔 구독과 좋아요는 더 좋은 영상을 만드는 힘이 됩니다!
💬 여러분의 생각을 댓글로 남겨주세요.

#태그1 #태그2 #태그3 #태그4 #태그5 #태그6 #태그7 #태그8 #태그9 #태그10 #태그11 #태그12 #태그13 #태그14 #태그15

대본:
"""


GEMINI_MODEL = "gemini-2.0-flash"


def get_gemini_client():
    try:
        from google import genai
    except ImportError:
        print("google-genai 미설치. 설치 중...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "google-genai", "-q"])
        from google import genai

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY가 .env에 설정되지 않았습니다.")

    return genai.Client(api_key=api_key)


def call_gemini(client, prompt: str, max_tokens: int = 8192) -> str:
    import time
    from google.genai import types
    from google.genai.errors import ClientError

    max_retries = 3
    retry_delay = 5

    for attempt in range(max_retries):
        try:
            response = client.models.generate_content(
                model=GEMINI_MODEL,
                contents=prompt,
                config=types.GenerateContentConfig(
                    temperature=0.9,
                    max_output_tokens=max_tokens,
                ),
            )
            return response.text.strip()
        except ClientError as e:
            if "429" in str(e) and attempt < max_retries - 1:
                print(f"  [Quota] 할당량 초과. {retry_delay}초 후 재시도 중... ({attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
                retry_delay *= 2
                continue
            raise


def generate_script(transcript: str, vibe_file: Path = VIBE_FILE, ghostwriter_prompt: str = GHOSTWRITER_PROMPT) -> str:
    print("  Gemini로 대본 생성 중...")
    client = get_gemini_client()
    trimmed = transcript[:15000]
    script = call_gemini(client, ghostwriter_prompt + trimmed, max_tokens=8192)
    vibe_file.parent.mkdir(parents=True, exist_ok=True)
    vibe_file.write_text(script, encoding="utf-8")
    print(f"  대본 저장 완료: {vibe_file} ({len(script)}자)")
    return script


def generate_metadata(script: str, metadata_file: Path = METADATA_FILE) -> None:
    print("  Gemini로 메타데이터 생성 중...")
    client = get_gemini_client()
    metadata = call_gemini(client, METADATA_PROMPT + script[:3000], max_tokens=2048)
    metadata_file.parent.mkdir(parents=True, exist_ok=True)
    metadata_file.write_text(metadata, encoding="utf-8")
    print(f"  메타데이터 저장 완료: {metadata_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Gemini 대본 + 메타데이터 생성")
    parser.add_argument("--output-dir", default=None, help="출력 디렉토리 (기본값: 프로젝트 루트)")
    parser.add_argument("--system-prompt", default=None, help="커스텀 시스템 프롬프트 (채널별)")
    args = parser.parse_args()

    # 출력 경로 결정
    if args.output_dir:
        out_dir = Path(args.output_dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        vibe_out = out_dir / "vibe.txt"
        meta_out = out_dir / "youtube_metadata.txt"
    else:
        vibe_out = VIBE_FILE
        meta_out = METADATA_FILE

    # 시스템 프롬프트 결정 (채널별 커스텀 또는 기본값)
    prompt_to_use = args.system_prompt if args.system_prompt else GHOSTWRITER_PROMPT

    transcript = sys.stdin.read().strip()
    script = generate_script(transcript, vibe_file=vibe_out, ghostwriter_prompt=prompt_to_use)
    generate_metadata(script, metadata_file=meta_out)
