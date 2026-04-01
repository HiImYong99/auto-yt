"""
메타데이터 & 씬플랜 생성

⚠️  이 스크립트는 외부 API를 호출하지 않습니다.
    metadata.json / scene_plan.json은 Claude Code가 직접 생성합니다.

파이프라인은 기본적으로 --skip-metadata 로 동작합니다.
새 대본(vibe.txt)이 업데이트된 후 Claude Code에게 아래를 요청하세요:

    "metadata와 scene_plan 생성해줘"

그러면 Claude Code가 vibe.txt + sync_data.json을 읽고
output/{channel}/metadata.json 과 output/{channel}/scene_plan.json 을 직접 작성합니다.
"""

import sys

if __name__ == "__main__":
    print("metadata/scene_plan 생성은 Claude Code가 직접 수행합니다.")
    print("파이프라인은 --skip-metadata 플래그를 사용하거나,")
    print("Claude Code에게 'metadata와 scene_plan 생성해줘'라고 요청하세요.")
    sys.exit(0)
