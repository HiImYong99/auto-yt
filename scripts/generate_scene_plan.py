"""
Gemini로 SCENE_PLAN 자동 생성
- vibe.txt 문장들을 분석해 각 문장에 맞는 시각 요소를 JSON으로 생성
- 출력: src/data/scene_plan.json
"""

import os
import sys
import json
import re
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
VIBE_FILE = ROOT / "vibe.txt"
SCENE_PLAN_FILE = ROOT / "src" / "data" / "scene_plan.json"

PROMPT = """당신은 유튜브 영상 비주얼 디렉터입니다. 아래 대본의 각 문장에 어울리는 다채롭고 동적인 시각 요소를 JSON으로 생성하세요.

[사용 가능한 시각 타입]
- icon: {"type":"icon", "emoji":"이모지", "label":"설명", "position":"center|left|right"}
- keyword: {"type":"keyword", "text":"핵심단어", "color":"#hex", "position":"center|left|right"}
- counter: {"type":"counter", "from":0, "to":숫자, "suffix":"단위", "position":"center|left|right"}
- infotip: {"type":"infotip", "title":"제목", "items":["항목1","항목2"], "position":"center|left|right"}
- techbadge: {"type":"techbadge", "label":"설명", "tags":["태그1","태그2"], "position":"center|left|right"}
- bar_chart: {"type":"bar_chart", "title":"차트 제목", "data":[{"label":"항목A","value":숫자}, {"label":"항목B","value":숫자}], "position":"center|left|right"}
- line_graph: {"type":"line_graph", "title":"그래프 제목", "data":[숫자1, 숫자2, 숫자3, 숫자4], "position":"center"}
- progress_bar: {"type":"progress_bar", "label":"진행 상태", "percent":숫자, "position":"bottom|center"}
- quote: {"type":"quote", "text":"핵심 인용문이나 명언", "author":"화자", "position":"center"}
- none: {"type":"none"}

[배정 및 조합 규칙]
- 단조로움을 피하기 위해 시각 요소를 적극적으로 조합하세요. (예: 왼쪽엔 `bar_chart`, 오른쪽엔 `keyword` 배치)
- 데이터, 실적 비교, 트렌드, 자산 변화 등의 내용이 나오면 반드시 `bar_chart`나 `line_graph`를 활용하세요.
- 누군가의 발언이나 중요한 철학, 메시지가 등장하면 `quote`를 사용하여 화면을 채우세요.
- 목표 달성이나 과정, 단계가 나오면 `progress_bar`와 `counter`를 함께 조합하세요.
- 각 문장당 visuals 배열에는 1~3개의 요소를 넣을 수 있으며, 서로 화면에서 겹치지 않도록 `position` 값을 다르게 부여하세요.
- keyword color는 다음 중 선택: #aaff00, #f87171, #facc15, #7bb4ff, #f472b6, #34d399, #fb923c, #a78bfa

[출력 규칙]
- 순수 JSON 배열만 출력
- 마크다운(```), 설명, 부연 텍스트 절대 금지
- 형식: [{"id":0,"visuals":[...]},{"id":1,"visuals":[...]},...]

[대본 문장 목록 (id는 0부터 순서대로)]
"""


def parse_sentences(text: str) -> list[str]:
    return [s.strip() for s in text.split("\n") if s.strip()]


def extract_json(raw: str) -> list:
    """LLM 응답에서 JSON 배열 추출 (마크다운 코드블록 처리)"""
    try:
        # 코드블록 제거
        clean_raw = re.sub(r"```(?:json)?", "", raw).strip()
        # 첫 [ 부터 마지막 ] 까지 추출
        start = clean_raw.find("[")
        end = clean_raw.rfind("]") + 1
        if start == -1 or end == 0:
            raise ValueError("JSON 배열을 찾을 수 없습니다.")
        return json.loads(clean_raw[start:end])
    except json.JSONDecodeError as e:
        # 실패 시 raw 데이터를 파일로 저장하여 디버깅 지원
        debug_file = Path("debug_raw_response.txt")
        debug_file.write_text(raw, encoding="utf-8")
        print(f"  [Error] JSON 파싱 실패. 원본 응답을 {debug_file}에 저장했습니다.")
        print(f"  [Error] 상세: {e}")
        raise


def generate_scene_plan(sentences: list[str]) -> list:
    from google import genai
    from google.genai import types

    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise ValueError("GEMINI_API_KEY가 .env에 설정되지 않았습니다.")

    client = genai.Client(api_key=api_key)

    # 67개의 문장은 한 번에 처리하기에 JSON이 너무 길어질 수 있으므로 두 번에 나누어 요청
    mid = len(sentences) // 2
    chunks = [sentences[:mid], sentences[mid:]]
    full_plan = []

    print(f"  총 {len(sentences)}개 문장 → Gemini 씬 플랜 생성 중 (2단계 분할)...")

    for idx, chunk in enumerate(chunks):
        offset = 0 if idx == 0 else mid
        numbered = "\n".join(f"{i + offset}: {s}" for i, s in enumerate(chunk))
        prompt = PROMPT + f"\n\n[이번에 처리할 문장 목록 (id {offset}부터)]\n" + numbered
        
        print(f"    단계 {idx + 1}/2 처리 중 (ID {offset} ~ {offset + len(chunk) - 1})...")
        
        # Simple retry logic
        import time
        from google.genai.errors import ClientError
        
        max_retries = 3
        retry_delay = 5
        
        for attempt in range(max_retries):
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        temperature=0.1,
                        max_output_tokens=8192,
                        response_mime_type="application/json",
                    ),
                )
                break
            except ClientError as e:
                if "429" in str(e) and attempt < max_retries - 1:
                    print(f"      [Quota] 할당량 초과. {retry_delay}초 후 재시도 중... ({attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                    continue
                raise

        raw = response.text.strip()
        plan_chunk = extract_json(raw)
        full_plan.extend(plan_chunk)

    # 누락된 ID 보완 (none으로 채움)
    existing_ids = {item["id"] for item in full_plan}
    for i in range(len(sentences)):
        if i not in existing_ids:
            full_plan.append({"id": i, "visuals": [{"type": "none"}]})

    full_plan.sort(key=lambda x: x["id"])
    return full_plan


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Gemini 씬 플랜 생성")
    parser.add_argument("--vibe-file", default=None, help="대본 파일 경로 (기본값: vibe.txt)")
    parser.add_argument("--output", default=None, help="씬 플랜 출력 경로 (기본값: src/data/scene_plan.json)")
    args = parser.parse_args()

    vibe_file = Path(args.vibe_file) if args.vibe_file else VIBE_FILE
    scene_plan_file = Path(args.output) if args.output else SCENE_PLAN_FILE

    if not vibe_file.exists():
        print(f"vibe.txt가 없습니다: {vibe_file}")
        sys.exit(1)

    text = vibe_file.read_text(encoding="utf-8")
    sentences = parse_sentences(text)
    print(f"  vibe.txt 읽기 완료: {len(sentences)}개 문장")

    plan = generate_scene_plan(sentences)

    scene_plan_file.parent.mkdir(parents=True, exist_ok=True)
    scene_plan_file.write_text(
        json.dumps(plan, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  씬 플랜 저장 완료: {scene_plan_file} ({len(plan)}개 항목)")


if __name__ == "__main__":
    main()
