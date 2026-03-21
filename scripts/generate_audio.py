"""
TTS + 타임스탬프 생성 스크립트 (Qwen3-TTS-12Hz-0.6B-Base)

사용법:
  python3 scripts/generate_audio.py --channel vibe --script vibe.txt
  python3 scripts/generate_audio.py --channel vibe --script vibe.txt --force
"""

import json
import argparse
import subprocess
from pathlib import Path
from config import ROOT, get_channel


def parse_args():
    parser = argparse.ArgumentParser(description="Qwen3-TTS + Sync Data Generator")
    parser.add_argument("--force", action="store_true", help="캐시 무시하고 강제 재생성")
    parser.add_argument("--channel", help="채널 ID (channels.json 키)")
    parser.add_argument("--script", help="대본 파일 경로 (기본: vibe.txt)")
    return parser.parse_args()


def resolve_output(ch: dict | None) -> tuple[Path, Path]:
    if ch:
        out_dir = ROOT / ch["output_dir"]
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir / "audio.mp3", out_dir / "sync_data.json"
    return ROOT / "public" / "audio.mp3", ROOT / "src" / "data" / "sync_data.json"


def main():
    args = parse_args()
    ch = None
    if args.channel:
        _, ch = get_channel(args.channel)
        print(f"채널: {args.channel} ({ch['display_name']})")

    audio_file, sync_file = resolve_output(ch)
    if not args.force and audio_file.exists() and sync_file.exists():
        print(f"캐시 존재 ({audio_file.parent}) — 강제 재생성: --force")
        return

    script_file = Path(args.script) if args.script else ROOT / "vibe.txt"
    if not script_file.is_absolute():
        script_file = ROOT / script_file

    ref_audio = ROOT / (ch.get("ref_audio", "ref_voice.wav") if ch else "ref_voice.wav")
    runner = ROOT / "scripts" / "qwen3_tts_runner.py"

    print(f"대본: {script_file.name} / ref: {ref_audio.name}")
    result = subprocess.run([
        "conda", "run", "--no-capture-output", "-n", "qwen3-tts", "python", str(runner),
        "--script", str(script_file),
        "--ref-audio", str(ref_audio),
        "--output-audio", str(audio_file),
        "--output-sync", str(sync_file),
    ], cwd=ROOT)

    if result.returncode != 0:
        raise RuntimeError("Qwen3-TTS 실패")

    sync_data = json.loads(sync_file.read_text(encoding="utf-8"))
    print(f"\nTTS 완료! {len(sync_data['sentences'])}문장 / {sync_data['duration_ms']/1000:.1f}초")


if __name__ == "__main__":
    main()
