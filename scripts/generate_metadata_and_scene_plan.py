import os
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv
import anthropic

ROOT = Path(__file__).parent.parent
load_dotenv(ROOT / ".env")

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
MODEL = "claude-sonnet-4-6"

METADATA_PROMPT = """
당신은 유튜브 SEO 전문가입니다. 제공된 대본 내용을 분석하여 유튜브 메타데이터 JSON을 생성하세요.

[제목 규칙]
- 반드시 25자 이내 (공백 포함)
- 숫자, 호기심, 임팩트 중심
- 좋은 예: "클로드 코드 치트키 11개 총정리", "혼자서 60만 줄… AI 비밀 도구"
- 나쁜 예: "클로드 AI, 비싼 챗봇으로만 쓰지 마세요! 숨겨진 11가지 기능으로 자동화 공장 만드세요" (너무 김)

[썸네일 텍스트 규칙]
- thumbnail_big: 임팩트 있는 1~2단어 (숫자 또는 핵심 키워드). 예: "60만", "11개", "AI 팀"
- thumbnail_bottom: 짧은 문구 4~6단어. 예: "터미널 하나로 만들다", "숨겨진 치트키"

[출력 형식]
JSON 형식으로만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
{
  "optimized_title": "25자 이내 임팩트 제목",
  "thumbnail_big": "큰 텍스트 1~2단어",
  "thumbnail_bottom": "하단 문구 4~6단어",
  "thumbnail_visual_prompt": "영상 주제를 표현하는 3D 오브젝트 영어 프롬프트 (예: A futuristic AI processor chip with circuit traces)",
  "thumbnail_emoji": "썸네일에 어울리는 이모지 1개",
  "description": "영상에 대한 상세 설명 (주요 포인트 포함)",
  "chapters": [
    { "name": "챕터 제목 1", "sentence_id": 시작_문장_ID },
    ... (최소 5개 이상)
  ],
  "tags": ["태그1", "태그2", ...] (최소 10개 이상)
}

[대본 내용]
{script_text}

[문장 리스트 (ID: 텍스트)]
{sentence_list}
"""

SCENE_PLAN_PROMPT = """
당신은 Remotion 영상 제작자입니다. 각 문장(ID)에 어울리는 시각 요소(SceneVisual)를 설계하여 JSON 배열을 생성하세요.

[영상 컨셉: IDE / 개발자 감성]
- 전체적으로 코드 에디터, 터미널, 개발 도구 느낌의 시각 요소를 우선 활용하세요.
- techbadge, featurecard, infotip 타입을 적극 활용하고, 코드 스니펫·CLI 명령어·개발 용어를 자연스럽게 포함하세요.
- 이모지는 개발자 도구 관련(⚡🔧💻🛠️📦🔌⌨️🖥️)을 우선 사용하세요.

[지원되는 시각 요소 타입]
- { "type": "callout", "text": "핵심문구", "sub": "보조문구" }
- { "type": "keyword", "text": "강조단어" }
- { "type": "icon", "emoji": "이모지", "label": "설명" }
- { "type": "infotip", "title": "제목", "items": ["항목1", "항목2", ...] }
- { "type": "techbadge", "label": "제목", "tags": ["태그1", "태그2", ...] }
- { "type": "split", "emoji": "이모지", "title": "제목", "items": ["항목1", "항목2"] }
- { "type": "featurecard", "icon": "이모지", "title": "제목", "sub": "설명" }
- { "type": "none" } (시각 요소 없음)

[출력 형식]
JSON 배열 형식으로만 출력하세요. 마크다운 코드블록 없이 순수 JSON만 출력하세요.
[
  { "id": 0, "visuals": [{ "type": "callout", ... }] },
  { "id": 1, "visuals": [{ "type": "keyword", ... }] },
  ...
]

[대본 내용]
{script_text}

[문장 리스트 (ID: 텍스트)]
{sentence_list}
"""


def generate_data(channel_id: str):
    out_dir = ROOT / "output" / channel_id
    sync_path = out_dir / "sync_data.json"
    script_path = ROOT / "vibe.txt"

    if not sync_path.exists():
        print(f"Error: {sync_path} not found. Run TTS first.")
        return

    sync_data = json.loads(sync_path.read_text(encoding="utf-8"))
    sentences = sync_data.get("sentences", [])
    sentence_list_text = "\n".join([f"{s['id']}: {s['text']}" for s in sentences])
    script_text = script_path.read_text(encoding="utf-8")

    # 1. Metadata 생성
    print("Generating metadata...")
    meta_response = client.messages.create(
        model=MODEL,
        max_tokens=2048,
        messages=[{
            "role": "user",
            "content": METADATA_PROMPT.format(
                script_text=script_text,
                sentence_list=sentence_list_text,
            )
        }]
    )
    try:
        meta_json_str = meta_response.content[0].text.strip()
        # 마크다운 백틱 제거 (모델이 가끔 포함할 경우 대비)
        meta_json_str = meta_json_str.replace("```json", "").replace("```", "").strip()
        meta_data = json.loads(meta_json_str)
        (out_dir / "metadata.json").write_text(
            json.dumps(meta_data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print("metadata.json updated.")
    except Exception as e:
        print(f"Failed to parse metadata JSON: {e}")
        print(meta_response.content[0].text)

    # 2. Scene Plan 생성
    print("Generating scene plan...")
    scene_response = client.messages.create(
        model=MODEL,
        max_tokens=8192,
        messages=[{
            "role": "user",
            "content": SCENE_PLAN_PROMPT.format(
                script_text=script_text,
                sentence_list=sentence_list_text,
            )
        }]
    )
    try:
        scene_json_str = scene_response.content[0].text.strip()
        scene_json_str = scene_json_str.replace("```json", "").replace("```", "").strip()
        scene_data = json.loads(scene_json_str)
        (out_dir / "scene_plan.json").write_text(
            json.dumps(scene_data, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        print("scene_plan.json updated.")
    except Exception as e:
        print(f"Failed to parse scene plan JSON: {e}")
        print(scene_response.content[0].text)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--channel", default="vibe")
    args = parser.parse_args()
    generate_data(args.channel)
