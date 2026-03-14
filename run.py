"""
auto-yt 자동화 파이프라인
사용법: python3 run.py
흐름: YouTube URL → 트랜스크립트 → 대본(Gemini) → TTS → 렌더 → YouTube 업로드
"""

import sys
import subprocess
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent


def run_step(label: str, cmd: list, cwd=None) -> bool:
    print(f"\n{'─' * 50}")
    print(f"[{label}]")
    print(f"{'─' * 50}")
    result = subprocess.run(cmd, cwd=cwd or ROOT)
    if result.returncode != 0:
        print(f"\n오류: [{label}] 실패 (exit code {result.returncode})")
        return False
    return True


def main():
    print("=" * 50)
    print("  auto-yt 자동화 파이프라인")
    print("=" * 50)

    # ── 1. YouTube URL 입력 ───────────────────────────
    print()
    url = input("YouTube URL을 입력하세요: ").strip()
    if not url:
        print("URL이 입력되지 않았습니다.")
        sys.exit(1)

    # ── 2. 트랜스크립트 추출 ─────────────────────────
    print("\n[1/5] 트랜스크립트 추출 중...")
    try:
        from scripts.extract_transcript import fetch_transcript
        transcript = fetch_transcript(url)
    except Exception as e:
        print(f"트랜스크립트 추출 실패: {e}")
        sys.exit(1)

    # ── 3. 대본 + 메타데이터 생성 ────────────────────
    print("\n[2/6] 대본 생성 중 (Gemini)...")
    try:
        from scripts.generate_script import generate_script, generate_metadata
        script = generate_script(transcript)
        generate_metadata(script)
    except Exception as e:
        print(f"대본 생성 실패: {e}")
        sys.exit(1)

    # ── 4. 씬 플랜 생성 ──────────────────────────────
    print("\n[3/6] 씬 플랜 생성 중 (Gemini)...")
    try:
        from scripts.generate_scene_plan import main as gen_scene_plan
        gen_scene_plan()
    except Exception as e:
        print(f"씬 플랜 생성 실패: {e}")
        sys.exit(1)

    # ── 5. TTS + 싱크 데이터 생성 ────────────────────
    print("\n[4/6] TTS 생성 중 (ElevenLabs)...")
    ok = run_step(
        "TTS",
        [sys.executable, "scripts/generate_audio.py", "--force"],
    )
    if not ok:
        sys.exit(1)

    # ── 6. Remotion 렌더 + 썸네일 ────────────────────
    print("\n[5/6] 영상 렌더 중 (Remotion)...")
    ok = run_step("Render", ["npm", "run", "render"])
    if not ok:
        sys.exit(1)

    print("  썸네일 생성 중...")
    run_step("Thumbnail", ["npm", "run", "thumbnail"])

    # ── 7. YouTube 업로드 ─────────────────────────────
    print("\n[6/6] YouTube 업로드")
    answer = input("YouTube에 업로드하시겠습니까? (y/N): ").strip().lower()
    if answer == "y":
        ok = run_step(
            "Upload",
            [sys.executable, "scripts/upload_youtube.py"],
        )
        if not ok:
            print("업로드 실패. out/video.mp4를 수동으로 업로드하세요.")
    else:
        print("업로드를 건너뜁니다. out/video.mp4를 확인하세요.")

    print("\n" + "=" * 50)
    print("  완료!")
    print("=" * 50)


if __name__ == "__main__":
    main()
