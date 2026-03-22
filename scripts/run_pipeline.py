"""
멀티채널 파이프라인 오케스트레이터

사용법:
  python3 scripts/run_pipeline.py vibe__2026ai.txt
  python3 scripts/run_pipeline.py vibe__2026ai.txt kdrama__news.txt
  python3 scripts/run_pipeline.py --channel vibe vibe.txt
  python3 scripts/run_pipeline.py   # 인터랙티브

  python3 scripts/run_pipeline.py vibe__script.txt --skip-tts
  python3 scripts/run_pipeline.py vibe__script.txt --skip-render
  python3 scripts/run_pipeline.py vibe__script.txt --skip-upload

파이프라인:
  Phase 1 (TTS)    → 병렬 (채널별 독립 API 호출)
  Phase 2 (Render) → 순차 (Remotion 공유 파일 의존)
  Phase 3 (Upload) → 병렬 (채널별 독립 OAuth)
"""

import sys
import json
import shutil
import subprocess
import argparse
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from config import ROOT, load_config


def detect_channel(script_path: Path) -> str | None:
    """vibe__script.txt → 'vibe'"""
    name = script_path.stem
    return name.split("__", 1)[0] if "__" in name else None


def ask_channel(channels: dict) -> str:
    keys = list(channels.keys())
    print("\n사용 가능한 채널:")
    for i, (cid, ch) in enumerate(channels.items()):
        print(f"  {i+1}. {cid}  ({ch['display_name']})")
    while True:
        choice = input("채널 번호 또는 ID: ").strip()
        if choice in channels:
            return choice
        try:
            idx = int(choice) - 1
            if 0 <= idx < len(keys):
                return keys[idx]
        except ValueError:
            pass
        print("올바른 채널을 선택하세요.")


def run_cmd(args: list[str], label: str) -> tuple[bool, str]:
    result = subprocess.run(args, cwd=ROOT, capture_output=True, text=True)
    out = (result.stdout + result.stderr).strip()
    if result.returncode != 0:
        print(f"[{label}] 오류:\n{out}")
    return result.returncode == 0, out


def phase_tts(channel_id: str, script_path: Path) -> bool:
    print(f"[{channel_id}] TTS 시작: {script_path.name}")
    ok, _ = run_cmd([
        sys.executable, str(ROOT / "scripts" / "generate_audio.py"),
        "--channel", channel_id,
        "--script", str(script_path),
        "--force",
    ], channel_id)
    if ok:
        print(f"[{channel_id}] TTS 완료")
    return ok


def phase_render(channel_id: str, channels: dict) -> bool:
    ch = channels[channel_id]
    out_dir = ROOT / ch["output_dir"]
    src_audio = out_dir / "audio.mp3"
    src_sync = out_dir / "sync_data.json"

    if not src_audio.exists() or not src_sync.exists():
        print(f"[{channel_id}] TTS 파일 없음. TTS 먼저 실행하세요.")
        return False

    # Remotion 공유 파일 갱신
    shutil.copy(src_audio, ROOT / "public" / "audio.mp3")
    shutil.copy(src_sync, ROOT / "src" / "data" / "sync_data.json")

    # 빌드 캐시 전체 삭제 (webpack/esbuild 등 — 이전 대본으로 렌더되는 문제 방지)
    cache_dir = ROOT / "node_modules" / ".cache"
    if cache_dir.exists():
        shutil.rmtree(cache_dir)
        print(f"[{channel_id}] 빌드 캐시 전체 초기화 (node_modules/.cache)")

    # output/{channel}/video.mp4 로 직접 렌더 (out/ 경유 없음)
    out_dir.mkdir(parents=True, exist_ok=True)
    video_out = out_dir / "video.mp4"
    print(f"[{channel_id}] 렌더링 시작...")

    ok, _ = run_cmd(
        ["npx", "remotion", "render", "src/index.ts", "MainVideo", str(video_out)],
        channel_id,
    )
    if not ok:
        return False

    if not video_out.exists():
        print(f"[{channel_id}] 렌더 결과물 없음")
        return False

    print(f"[{channel_id}] 렌더 완료 → {video_out}")
    return True


def phase_thumbnail(channel_id: str) -> bool:
    print(f"[{channel_id}] 썸네일 생성 중...")
    ok, _ = run_cmd([
        sys.executable, str(ROOT / "scripts" / "generate_thumbnail.py"),
        "--channel", channel_id,
    ], channel_id)
    if ok:
        print(f"[{channel_id}] 썸네일 완료")
    return ok


def inject_timeline(channel_id: str, channels: dict) -> None:
    """sync_data.json의 실제 타임스탬프로 metadata.json 타임라인 섹션을 항상 교체"""
    import re
    out_dir = ROOT / channels[channel_id]["output_dir"]
    meta_path = out_dir / "metadata.json"
    sync_path = out_dir / "sync_data.json"

    if not meta_path.exists() or not sync_path.exists():
        return

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    chapters = meta.get("chapters")
    if not chapters:
        return

    sync = json.loads(sync_path.read_text(encoding="utf-8"))
    id_to_ms = {s["id"]: s["start_ms"] for s in sync["sentences"]}

    timecodes = []
    for ch in chapters:
        ms = id_to_ms.get(ch["sentence_id"], 0)
        m, s = divmod(ms // 1000, 60)
        timecodes.append(f"{m:02d}:{s:02d} {ch['name']}")
    timeline_block = "📌 타임라인\n" + "\n".join(timecodes)

    desc = meta.get("description", "")
    if "{{TIMELINE}}" in desc:
        # {{TIMELINE}} 앞에 이미 "📌 타임라인"이 있으면 헤더 없이 타임코드만 삽입
        if "📌 타임라인" in desc:
            desc = desc.replace("{{TIMELINE}}", "\n".join(timecodes))
        else:
            desc = desc.replace("{{TIMELINE}}", timeline_block)
    elif "📌 타임라인" in desc:
        # 기존 타임라인 섹션 전체를 교체
        desc = re.sub(r"📌 타임라인\n(?:\d{2}:\d{2}[^\n]*\n?)*", timeline_block, desc)
    else:
        desc = desc + "\n\n" + timeline_block

    meta["description"] = desc
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{channel_id}] 타임라인 자동 주입 완료")


def phase_upload(channel_id: str, channels: dict, force_new: bool = False) -> bool:
    print(f"[{channel_id}] 업로드 시작...")

    # metadata.json 없으면 루트 youtube_metadata.json 복사
    out_dir = ROOT / channels[channel_id]["output_dir"]
    meta_dst = out_dir / "metadata.json"
    if not meta_dst.exists():
        meta_src = ROOT / "youtube_metadata.json"
        if meta_src.exists():
            shutil.copy(meta_src, meta_dst)

    cmd = [sys.executable, str(ROOT / "scripts" / "upload_youtube.py"), "--channel", channel_id]
    if force_new:
        cmd.append("--force-new")
    ok, out = run_cmd(cmd, channel_id)
    if ok:
        for line in out.splitlines():
            if "youtu.be" in line or "완료" in line:
                print(f"[{channel_id}] {line.strip()}")
    return ok



def main():
    parser = argparse.ArgumentParser(description="멀티채널 유튜브 파이프라인")
    parser.add_argument("scripts", nargs="*", help="대본 파일들")
    parser.add_argument("--channel", help="채널 ID (파일명 prefix 없을 때)")
    parser.add_argument("--skip-tts", action="store_true")
    parser.add_argument("--skip-render", action="store_true")
    parser.add_argument("--skip-thumbnail", action="store_true")
    parser.add_argument("--skip-upload", action="store_true")
    parser.add_argument("--update-existing", action="store_true", help="기존 video_id 메타데이터만 업데이트 (기본값: 항상 신규 업로드)")
    args = parser.parse_args()

    config = load_config()
    channels = config["channels"]

    # ── 작업 목록 구성 ──
    jobs: list[tuple[str, Path]] = []

    script_inputs = args.scripts or [input("대본 파일 경로: ").strip()]
    for s in script_inputs:
        sp = Path(s)
        if not sp.is_absolute():
            sp = ROOT / sp
        if not sp.exists():
            print(f"파일 없음: {sp}")
            sys.exit(1)
        channel_id = detect_channel(sp) or args.channel
        if not channel_id:
            channel_id = ask_channel(channels)
        if channel_id not in channels:
            print(f"채널 '{channel_id}' 가 channels.json에 없습니다.")
            sys.exit(1)
        jobs.append((channel_id, sp))

    print(f"\n처리할 작업 {len(jobs)}개:")
    for cid, sp in jobs:
        print(f"  [{cid}] {channels[cid]['display_name']}  ←  {sp.name}")
    print()

    # ── Phase 1: TTS (병렬) ──
    if not args.skip_tts:
        print("=" * 50 + "\nPhase 1: TTS 생성 (병렬)\n" + "=" * 50)
        failed = []
        with ThreadPoolExecutor(max_workers=len(jobs)) as ex:
            futures = {ex.submit(phase_tts, cid, sp): cid for cid, sp in jobs}
            for f in as_completed(futures):
                if not f.result():
                    failed.append(futures[f])
        if failed:
            print(f"TTS 실패: {failed}")
            sys.exit(1)
        print()

    # ── Phase 2: 렌더 (순차) ──
    if not args.skip_render:
        print("=" * 50 + "\nPhase 2: 렌더링 (순차)\n" + "=" * 50)
        for cid, _ in jobs:
            if not phase_render(cid, channels):
                print(f"[{cid}] 렌더 실패. 중단합니다.")
                sys.exit(1)
        print()

    # ── Phase 2.5: 썸네일 생성 (병렬) ──
    if not args.skip_thumbnail:
        print("=" * 50 + "\nPhase 2.5: 썸네일 생성 (병렬)\n" + "=" * 50)
        with ThreadPoolExecutor(max_workers=len(jobs)) as ex:
            futures = {ex.submit(phase_thumbnail, cid): cid for cid, _ in jobs}
            for f in as_completed(futures):
                if not f.result():
                    print(f"[{futures[f]}] 썸네일 생성 실패 (업로드는 계속 진행)")
        print()

    # ── Phase 2.7: 타임라인 주입 ──
    for cid, _ in jobs:
        inject_timeline(cid, channels)

    # ── Phase 3: 업로드 (병렬) ──
    if not args.skip_upload:
        print("=" * 50 + "\nPhase 3: YouTube 업로드 (병렬)\n" + "=" * 50)
        failed = []
        with ThreadPoolExecutor(max_workers=len(jobs)) as ex:
            force_new = not args.update_existing
        futures = {ex.submit(phase_upload, cid, channels, force_new): cid for cid, _ in jobs}
            for f in as_completed(futures):
                if not f.result():
                    failed.append(futures[f])
        if failed:
            print(f"업로드 실패: {failed}")
        print()

    print("=" * 50 + "\n전체 파이프라인 완료!\n" + "=" * 50)


if __name__ == "__main__":
    main()
