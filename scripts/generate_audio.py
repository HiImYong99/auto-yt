"""
Phase 2: ElevenLabs TTS + 타임스탬프 생성 스크립트
- vibe.txt 대본을 읽어 TTS 오디오(public/audio.mp3) 생성
- 단어/문장 단위 타임스탬프를 src/data/sync_data.json으로 저장
- 로컬 캐싱 지원 (--force 플래그로 강제 재생성)
"""

import os
import sys
import json
import argparse
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

ROOT = Path(__file__).parent.parent
SCRIPT_FILE = ROOT / "vibe.txt"
AUDIO_FILE = ROOT / "public" / "audio.mp3"
SYNC_FILE = ROOT / "src" / "data" / "sync_data.json"


def parse_args():
    parser = argparse.ArgumentParser(description="ElevenLabs TTS + Sync Data Generator")
    parser.add_argument("--force", action="store_true", help="캐시 무시하고 강제 재생성")
    return parser.parse_args()


def read_script() -> str:
    with open(SCRIPT_FILE, "r", encoding="utf-8") as f:
        return f.read().strip()


def is_cached() -> bool:
    return AUDIO_FILE.exists() and SYNC_FILE.exists()


def generate_tts_with_timestamps(text: str) -> dict:
    """
    ElevenLabs API를 사용하여 TTS 생성 + 타임스탬프 추출.
    alignment 응답에서 단어별 start/end 시간(ms)을 파싱.
    """
    api_key = os.getenv("ELEVENLABS_API_KEY")
    voice_id = os.getenv("ELEVENLABS_VOICE_ID", "21m00Tcm4TlvDq8ikWAM")  # Rachel (기본값)

    if not api_key or api_key == "your_key_here":
        raise ValueError(
            "ELEVENLABS_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요."
        )

    import requests

    url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps"
    headers = {
        "xi-api-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "text": text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75,
        },
    }

    print("ElevenLabs API 호출 중...")
    response = requests.post(url, headers=headers, json=payload)

    if response.status_code != 200:
        raise RuntimeError(
            f"API 오류 {response.status_code}: {response.text[:300]}"
        )

    return response.json()


def save_audio(api_response: dict) -> None:
    """API 응답에서 오디오 바이너리를 추출하여 저장."""
    import base64

    audio_b64 = api_response.get("audio_base64", "")
    if not audio_b64:
        raise ValueError("API 응답에 audio_base64 필드가 없습니다.")

    audio_bytes = base64.b64decode(audio_b64)
    AUDIO_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(AUDIO_FILE, "wb") as f:
        f.write(audio_bytes)
    print(f"오디오 저장 완료: {AUDIO_FILE}")


def build_sync_data(api_response: dict, sentences: list[str]) -> dict:
    """
    ElevenLabs alignment 데이터를 sync_data.json 스키마로 변환.
    alignment.characters + character_start_times_seconds 활용.
    """
    alignment = api_response.get("alignment", {})
    chars = alignment.get("characters", [])
    char_starts = alignment.get("character_start_times_seconds", [])
    char_ends = alignment.get("character_end_times_seconds", [])

    # 전체 텍스트를 문자 단위 타임스탬프로 재구성
    full_text = "".join(chars)
    total_duration_ms = int(max(char_ends) * 1000) if char_ends else 0

    # 단어 경계를 기준으로 분할
    words_data = []
    word_buf = []
    word_start_idx = None

    for i, (ch, t_start, t_end) in enumerate(zip(chars, char_starts, char_ends)):
        if ch == " " or ch == "\n":
            if word_buf:
                word_text = "".join(word_buf)
                words_data.append({
                    "word": word_text,
                    "start_ms": int(char_starts[word_start_idx] * 1000),
                    "end_ms": int(t_start * 1000),
                })
                word_buf = []
                word_start_idx = None
        else:
            if not word_buf:
                word_start_idx = i
            word_buf.append(ch)

    # 마지막 단어 처리
    if word_buf:
        words_data.append({
            "word": "".join(word_buf),
            "start_ms": int(char_starts[word_start_idx] * 1000),
            "end_ms": int(char_ends[-1] * 1000),
        })

    # 문장 단위로 그룹핑
    sentence_groups = []
    word_idx = 0

    for sent_id, sentence in enumerate(sentences):
        if not sentence.strip():
            continue

        sent_words = sentence.strip().split()
        matched_words = []

        for sw in sent_words:
            # 구두점 제거 후 매칭
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

    return {
        "duration_ms": total_duration_ms,
        "sentences": sentence_groups,
    }


def save_sync_data(sync_data: dict) -> None:
    SYNC_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(SYNC_FILE, "w", encoding="utf-8") as f:
        json.dump(sync_data, f, ensure_ascii=False, indent=2)
    print(f"싱크 데이터 저장 완료: {SYNC_FILE}")
    print(f"  총 길이: {sync_data['duration_ms']}ms ({sync_data['duration_ms']/1000:.1f}초)")
    print(f"  문장 수: {len(sync_data['sentences'])}개")


def main():
    args = parse_args()

    # 캐시 확인
    if not args.force and is_cached():
        print("캐시된 파일이 존재합니다. 스킵합니다. (강제 재생성: --force)")
        with open(SYNC_FILE, "r", encoding="utf-8") as f:
            sync_data = json.load(f)
        print(f"  캐시된 싱크 데이터: {len(sync_data['sentences'])}개 문장")
        return

    print("대본 파일 읽는 중...")
    text = read_script()

    # 문장 단위로 분할 (빈 줄 기준)
    sentences = [s for s in text.split("\n") if s.strip()]
    print(f"  대본 길이: {len(text)}자, {len(sentences)}개 문장")

    # TTS + 타임스탬프 생성
    api_response = generate_tts_with_timestamps(text)

    # 오디오 저장
    save_audio(api_response)

    # 싱크 데이터 빌드 및 저장
    sync_data = build_sync_data(api_response, sentences)
    save_sync_data(sync_data)

    print("\n Phase 2 완료!")


if __name__ == "__main__":
    main()
