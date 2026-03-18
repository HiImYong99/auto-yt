"""
ElevenLabs TTS + 타임스탬프 생성 스크립트

사용법:
  python3 scripts/generate_audio.py --channel vibe --script vibe__2026ai.txt
  python3 scripts/generate_audio.py --force   # 레거시
"""

import os
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv
from config import ROOT, get_channel

load_dotenv()


def parse_args():
    parser = argparse.ArgumentParser(description="ElevenLabs TTS + Sync Data Generator")
    parser.add_argument("--force", action="store_true", help="캐시 무시하고 강제 재생성")
    parser.add_argument("--channel", help="채널 ID (channels.json 키)")
    parser.add_argument("--script", help="대본 파일 경로 (기본: vibe.txt)")
    return parser.parse_args()


def resolve_output(ch: dict | None) -> tuple[Path, Path]:
    """(audio_file, sync_file) 출력 경로 반환. ch=None 이면 레거시 경로."""
    if ch:
        out_dir = ROOT / ch["output_dir"]
        out_dir.mkdir(parents=True, exist_ok=True)
        return out_dir / "audio.mp3", out_dir / "sync_data.json"
    return ROOT / "public" / "audio.mp3", ROOT / "src" / "data" / "sync_data.json"


def generate_tts_with_timestamps(text: str, voice_id: str) -> dict:
    api_key = os.getenv("ELEVENLABS_API_KEY")
    if not api_key or api_key == "your_key_here":
        raise ValueError("ELEVENLABS_API_KEY가 설정되지 않았습니다.")

    import requests

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    response = requests.post(url, headers={
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }, json={
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {"stability": 0.5, "similarity_boost": 0.75},
    })

    if response.status_code != 200:
        raise RuntimeError(f"API 오류 {response.status_code}: {response.text[:300]}")
    return response.json()


def save_audio(api_response: dict, audio_file: Path) -> None:
    import base64
    audio_b64 = api_response.get("audio_base64", "")
    if not audio_b64:
        raise ValueError("API 응답에 audio_base64 필드가 없습니다.")
    audio_file.parent.mkdir(parents=True, exist_ok=True)
    audio_file.write_bytes(base64.b64decode(audio_b64))
    print(f"오디오 저장 완료: {audio_file}")


def build_sync_data(api_response: dict, sentences: list[str]) -> dict:
    alignment = api_response.get("alignment", {})
    chars = alignment.get("characters", [])
    char_starts = alignment.get("character_start_times_seconds", [])
    char_ends = alignment.get("character_end_times_seconds", [])

    total_duration_ms = int(max(char_ends) * 1000) if char_ends else 0

    words_data = []
    word_buf = []
    word_start_idx = None

    for i, (ch, t_start, t_end) in enumerate(zip(chars, char_starts, char_ends)):
        if ch in (" ", "\n"):
            if word_buf:
                words_data.append({
                    "word": "".join(word_buf),
                    "start_ms": int(char_starts[word_start_idx] * 1000),
                    "end_ms": int(char_ends[i - 1] * 1000),
                })
                word_buf = []
                word_start_idx = None
        else:
            if not word_buf:
                word_start_idx = i
            word_buf.append(ch)

    if word_buf:
        words_data.append({
            "word": "".join(word_buf),
            "start_ms": int(char_starts[word_start_idx] * 1000),
            "end_ms": int(char_ends[-1] * 1000),
        })

    sentence_groups = []
    word_idx = 0

    for sent_id, sentence in enumerate(sentences):
        if not sentence.strip():
            continue

        matched_words = []
        for sw in sentence.strip().split():
            sw_clean = sw.strip(".,!?\"'…")
            while word_idx < len(words_data):
                wd_clean = words_data[word_idx]["word"].strip(".,!?\"'…")
                if wd_clean == sw_clean or words_data[word_idx]["word"] == sw:
                    matched_words.append(words_data[word_idx])
                    word_idx += 1
                    break
                word_idx += 1

        if matched_words:
            sentence_groups.append({
                "id": sent_id,
                "text": sentence.strip(),
                "start_ms": matched_words[0]["start_ms"],
                "end_ms": matched_words[-1]["end_ms"],
                "words": matched_words,
            })

    return {"duration_ms": total_duration_ms, "sentences": sentence_groups}


def save_sync_data(sync_data: dict, sync_file: Path) -> None:
    sync_file.parent.mkdir(parents=True, exist_ok=True)
    with open(sync_file, "w", encoding="utf-8") as f:
        json.dump(sync_data, f, ensure_ascii=False, indent=2)
    print(f"싱크 데이터 저장 완료: {sync_file}")
    print(f"  총 길이: {sync_data['duration_ms']}ms ({sync_data['duration_ms']/1000:.1f}초)")
    print(f"  문장 수: {len(sync_data['sentences'])}개")


def main():
    args = parse_args()
    channel_id = args.channel

    ch = None
    if channel_id:
        _, ch = get_channel(channel_id)
        print(f"채널: {channel_id} ({ch['display_name']})")

    audio_file, sync_file = resolve_output(ch)

    if not args.force and audio_file.exists() and sync_file.exists():
        print(f"캐시된 파일 존재: {audio_file.parent} (강제 재생성: --force)")
        return

    script_file = Path(args.script) if args.script else ROOT / "vibe.txt"
    if not script_file.is_absolute():
        script_file = ROOT / script_file

    voice_id = ch["voice_id"] if ch else os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")

    print(f"대본: {script_file} / Voice: {voice_id}")
    text = script_file.read_text(encoding="utf-8").strip()
    sentences = [s for s in text.split("\n") if s.strip()]
    print(f"  {len(text)}자, {len(sentences)}개 문장")

    api_response = generate_tts_with_timestamps(text, voice_id)
    save_audio(api_response, audio_file)
    save_sync_data(build_sync_data(api_response, sentences), sync_file)
    print("\nTTS 생성 완료!")


if __name__ == "__main__":
    main()
