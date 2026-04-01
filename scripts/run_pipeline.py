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


def phase_generate_metadata_and_scene_plan(channel_id: str) -> bool:
    print(f"[{channel_id}] 메타데이터 및 씬 플랜 생성 중...")
    ok, _ = run_cmd([
        sys.executable, str(ROOT / "scripts" / "generate_metadata_and_scene_plan.py"),
        "--channel", channel_id
    ], channel_id)
    if ok:
        print(f"[{channel_id}] 생성 완료")
    return ok

def phase_render(channel_id: str, channels: dict) -> bool:
    ch = channels[channel_id]
    out_dir = ROOT / ch["output_dir"]
    src_audio = out_dir / "audio.mp3"
    src_sync = out_dir / "sync_data.json"
    src_scene = out_dir / "scene_plan.json"

    if not src_audio.exists() or not src_sync.exists():
        print(f"[{channel_id}] TTS 파일 없음. TTS 먼저 실행하세요.")
        return False

    # Remotion 공유 파일 갱신
    shutil.copy(src_audio, ROOT / "public" / "audio.mp3")
    shutil.copy(src_sync, ROOT / "src" / "data" / "sync_data.json")
    if src_scene.exists():
        shutil.copy(src_scene, ROOT / "src" / "data" / "scene_plan.json")
        print(f"[{channel_id}] 씬 플랜 적용 완료")

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
    """sync_data.json의 실제 타임스탬프로 metadata.json 타임라인 섹션을 항상 교체 + 설명 문구 다채널 최적화"""
    import re
    import random
    from datetime import datetime
    
    out_dir = ROOT / channels[channel_id]["output_dir"]
    meta_path = out_dir / "metadata.json"
    sync_path = out_dir / "sync_data.json"

    if not meta_path.exists() or not sync_path.exists():
        return

    meta = json.loads(meta_path.read_text(encoding="utf-8"))
    
    # ── 1. 타임라인 생성 ──
    chapters = meta.get("chapters")
    if chapters:
        sync = json.loads(sync_path.read_text(encoding="utf-8"))
        id_to_ms = {s["id"]: s["start_ms"] for s in sync["sentences"]}
        timecodes = []
        for i, ch in enumerate(chapters):
            ms = id_to_ms.get(ch["sentence_id"], 0)
            if i == 0:
                ms = 0
            m, s = divmod(ms // 1000, 60)
            # 가장 표준적인 '00:00 제목' 형식 사용 (특수기호 최소화)
            timecodes.append(f"{m:02d}:{s:02d} {ch['name']}")
        
        # 앞뒤에 확실한 공백 라인 추가
        timeline_block = "\n\n00:00 시작\n" + "\n".join(timecodes[1:]) + "\n\n"
    else:
        timeline_block = ""

    # ── 2. 설명 문구 랜덤화 (SEO 반복 방지) ──
    intro_variations = [
        f"오늘 ({datetime.now().strftime('%Y-%m-%d')}) 전해드리는 AI 소식입니다.",
        "많은 분들이 궁금해하셨던 바로 그 내용을 정리했습니다.",
        "생산성을 극대화하고 싶은 분들이라면 이 영상이 큰 도움이 되실 겁니다.",
        "기술의 변화가 빠른 요즘, 우리가 꼭 알아야 할 핵심만 담았습니다.",
        "어디서도 듣기 힘든 실전 위주의 운영 구조를 공유합니다."
    ]
    cta_variations = [
        "구독과 좋아요는 영상 제작에 정말 큰 힘이 됩니다! 🚀",
        "유익하셨다면 구독 부탁드려요. 더 좋은 콘텐츠로 보답하겠습니다.",
        "여러분의 생각은 어떠신가요? 댓글로 자유롭게 의견 나눠주세요!",
        "알림 설정까지 해두시면 최신 트렌드를 가장 빠르게 확인하실 수 있습니다."
    ]
    
    desc = meta.get("description", "")
    
    # 상단 인트로 삽입 (없을 경우에만)
    if not any(v[:10] in desc for v in intro_variations):
        desc = random.choice(intro_variations) + "\n\n" + desc
        
    # 하단 CTA 삽입 (없을 경우에만)
    if not any(v[:10] in desc for v in cta_variations):
        desc = desc + "\n\n" + random.choice(cta_variations)

    # ── 3. 타임라인 주입 ──
    if "{{TIMELINE}}" in desc:
        if "📌 타임라인" in desc:
            desc = desc.replace("{{TIMELINE}}", "\n".join(timecodes) if timeline_block else "")
        else:
            desc = desc.replace("{{TIMELINE}}", timeline_block)
    elif "📌 타임라인" in desc:
        desc = re.sub(r"📌 타임라인\n(?:\d{2}:\d{2}[^\n]*\n?)*", timeline_block, desc)
    else:
        desc = desc + "\n\n" + timeline_block

    meta["description"] = desc
    meta_path.write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[{channel_id}] 타임라인 및 설명 문구 최적화 완료")

def generate_srt(channel_id: str, channels: dict) -> None:
    """sync_data.json을 기반으로 captions.srt 파일을 생성 (YouTube 자막 SEO 향상)"""
    out_dir = ROOT / channels[channel_id]["output_dir"]
    sync_path = out_dir / "sync_data.json"
    srt_path = out_dir / "captions.srt"

    if not sync_path.exists():
        return

    try:
        sync_data = json.loads(sync_path.read_text(encoding="utf-8"))
        sentences = sync_data.get("sentences", [])
        if not sentences:
            return

        def ms_to_srt_time(ms: int) -> str:
            s, ms = divmod(ms, 1000)
            m, s = divmod(s, 60)
            h, m = divmod(m, 60)
            return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

        srt_lines = []
        for i, s in enumerate(sentences, start=1):
            start_time = ms_to_srt_time(s["start_ms"])
            end_time = ms_to_srt_time(s["end_ms"])
            text = s.get("text", "").strip()
            srt_lines.append(f"{i}\n{start_time} --> {end_time}\n{text}\n")
        
        srt_path.write_text("\n".join(srt_lines), encoding="utf-8")
        print(f"[{channel_id}] 자막(SRT) 생성 완료: {srt_path.name}")
    except Exception as e:
        print(f"[{channel_id}] 자막(SRT) 생성 실패: {e}")

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
    parser.add_argument("--skip-metadata", action="store_true", help="메타데이터 및 씬 플랜 생성 건너뜀")
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

    # ── Phase 1.5: 메타데이터 및 씬 플랜 생성 (병렬) ──
    if not args.skip_metadata:
        print("=" * 50 + "\nPhase 1.5: 메타데이터 및 씬 플랜 생성 (병렬)\n" + "=" * 50)
        failed = []
        with ThreadPoolExecutor(max_workers=len(jobs)) as ex:
            futures = {ex.submit(phase_generate_metadata_and_scene_plan, cid): cid for cid, sp in jobs}
            for f in as_completed(futures):
                if not f.result():
                    failed.append(futures[f])
        if failed:
            print(f"생성 실패: {failed}")
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

    # ── Phase 2.7: 타임라인 및 자막 생성 ──
    for cid, _ in jobs:
        inject_timeline(cid, channels)
        generate_srt(cid, channels)

    # ── Phase 3: 업로드 (병렬) ──
    if not args.skip_upload:
        print("=" * 50 + "\nPhase 3: YouTube 업로드 (병렬)\n" + "=" * 50)
        failed = []
        force_new = not args.update_existing
        with ThreadPoolExecutor(max_workers=len(jobs)) as ex:
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
