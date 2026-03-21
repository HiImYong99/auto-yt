"""
Qwen3-TTS-12Hz-0.6B-Base 실행기
반드시 qwen3-tts conda 환경에서 실행 (generate_audio.py가 자동 호출)

흐름:
  CHUNK_SIZE 문장씩 생성 → 청크별 faster-whisper 타임스탬프
  → 오프셋 합산 → 전체 오디오 합치기 → ffmpeg 1.25배속 → 타임스탬프 보정
"""
import argparse
import json
import io
import subprocess
import tempfile
import numpy as np
import soundfile as sf
import torch
from pathlib import Path
from pydub import AudioSegment

CHUNK_SIZE  = 10    # 청크당 문장 수 (청크 내부는 자연스럽게 이어짐)
SILENCE_MS  = 300   # 청크 간 묵음
SPEED       = 1.15  # 배속


def load_tts_model():
    from qwen_tts import Qwen3TTSModel
    print("TTS 모델 로딩 중...")
    model = Qwen3TTSModel.from_pretrained(
        "Qwen/Qwen3-TTS-12Hz-0.6B-Base",
        device_map="cpu",
        dtype=torch.float32,
    )
    print("TTS 모델 로딩 완료")
    return model


def speedup_wav(wav_data: np.ndarray, sample_rate: int, factor: float) -> np.ndarray:
    """ffmpeg atempo로 고품질 배속 처리"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        in_path = f.name
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        out_path = f.name
    try:
        sf.write(in_path, wav_data, sample_rate)
        subprocess.run(
            ["ffmpeg", "-y", "-i", in_path, "-filter:a", f"atempo={factor}", out_path],
            capture_output=True, check=True,
        )
        result, _ = sf.read(out_path)
        return result.astype(np.float32)
    finally:
        Path(in_path).unlink(missing_ok=True)
        Path(out_path).unlink(missing_ok=True)


def transcribe_chunk(wav_data: np.ndarray, sample_rate: int) -> list[dict]:
    """청크 오디오를 faster-whisper로 단어 타임스탬프 추출"""
    from faster_whisper import WhisperModel
    model = WhisperModel("base", device="cpu", compute_type="int8")

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        tmp_path = f.name
    try:
        sf.write(tmp_path, wav_data, sample_rate)
        segments, _ = model.transcribe(
            tmp_path, language="ko", word_timestamps=True, vad_filter=True,
        )
        words = []
        for seg in segments:
            for w in (seg.words or []):
                words.append({
                    "word": w.word.strip(),
                    "start_ms": int(w.start * 1000),
                    "end_ms": int(w.end * 1000),
                })
    finally:
        Path(tmp_path).unlink(missing_ok=True)
    return words


def match_chunk_sentences(
    sentences: list[str],
    words: list[dict],
    chunk_start_ms: int,
    chunk_end_ms: int,
    sent_id_offset: int,
) -> list[dict]:
    """청크 내 문장을 word 타임스탬프에 매핑. 실패 시 글자 수 비례로 추정."""
    groups = []
    word_idx = 0
    chunk_dur = chunk_end_ms - chunk_start_ms
    total_chars = sum(len(s) for s in sentences)

    for i, sentence in enumerate(sentences):
        sent_words = sentence.strip().split()
        matched = []

        for sw in sent_words:
            sw_clean = sw.strip(".,!?\"'…()[]")
            for lookahead in range(word_idx, min(word_idx + 10, len(words))):
                ww = words[lookahead]["word"].strip(".,!?\"'…()[]")
                if ww == sw_clean or ww in sw_clean or sw_clean in ww:
                    matched.append(words[lookahead])
                    word_idx = lookahead + 1
                    break

        if matched:
            groups.append({
                "id": sent_id_offset + i,
                "text": sentence.strip(),
                "start_ms": chunk_start_ms + matched[0]["start_ms"],
                "end_ms": chunk_start_ms + matched[-1]["end_ms"],
                "words": [
                    {**w, "start_ms": chunk_start_ms + w["start_ms"],
                          "end_ms":   chunk_start_ms + w["end_ms"]}
                    for w in matched
                ],
            })
        else:
            # 글자 수 비례 추정 (청크 범위 내)
            prev_end = groups[-1]["end_ms"] if groups else chunk_start_ms
            char_ratio = len(sentence) / max(total_chars, 1)
            est_dur = int(chunk_dur * char_ratio)
            groups.append({
                "id": sent_id_offset + i,
                "text": sentence.strip(),
                "start_ms": prev_end + 50,
                "end_ms": prev_end + 50 + est_dur,
                "words": [],
            })

    return groups


def scale_timestamps(groups: list[dict], factor: float) -> list[dict]:
    """배속 적용 후 타임스탬프 보정 (÷ factor)"""
    scaled = []
    for g in groups:
        scaled.append({
            **g,
            "start_ms": int(g["start_ms"] / factor),
            "end_ms":   int(g["end_ms"] / factor),
            "words": [
                {**w, "start_ms": int(w["start_ms"] / factor),
                       "end_ms":   int(w["end_ms"] / factor)}
                for w in g["words"]
            ],
        })
    return scaled


def wav_to_mp3(wav_data: np.ndarray, sample_rate: int) -> bytes:
    buf = io.BytesIO()
    sf.write(buf, wav_data, sample_rate, format="WAV")
    buf.seek(0)
    mp3_buf = io.BytesIO()
    AudioSegment.from_wav(buf).export(mp3_buf, format="mp3", bitrate="192k")
    return mp3_buf.getvalue()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--script", required=True)
    parser.add_argument("--ref-audio", required=True)
    parser.add_argument("--output-audio", required=True)
    parser.add_argument("--output-sync", required=True)
    args = parser.parse_args()

    ref_audio = Path(args.ref_audio)
    if not ref_audio.exists():
        raise FileNotFoundError(f"레퍼런스 음성 없음: {ref_audio}")

    sentences = [s.strip() for s in Path(args.script).read_text(encoding="utf-8").split("\n") if s.strip()]
    chunks = [sentences[i:i+CHUNK_SIZE] for i in range(0, len(sentences), CHUNK_SIZE)]
    print(f"대본: {len(sentences)}개 문장 / {len(chunks)}개 청크 / {SPEED}x 배속")

    model = load_tts_model()

    sample_rate = 24000
    silence = np.zeros(int(sample_rate * SILENCE_MS / 1000), dtype=np.float32)

    all_audio   = []
    all_groups  = []
    cursor_ms   = 0
    sent_offset = 0

    print("\n[Whisper 타임스탬프 추출 중...]")
    whisper_loaded = False

    for ci, chunk in enumerate(chunks):
        chunk_text = "\n".join(chunk)
        print(f"  청크 [{ci+1}/{len(chunks)}] {len(chunk)}문장 TTS 생성...")
        wavs, sr = model.generate_voice_clone(
            text=chunk_text,
            language="Korean",
            ref_audio=str(ref_audio),
            x_vector_only_mode=True,
        )
        wav = np.array(wavs[0], dtype=np.float32)
        chunk_dur_ms = int(len(wav) / sr * 1000)

        # 청크별 whisper
        if not whisper_loaded:
            print("  Whisper 모델 로딩...")
            whisper_loaded = True
        words = transcribe_chunk(wav, sr)
        print(f"    → {len(words)}개 단어 인식")

        groups = match_chunk_sentences(
            chunk, words,
            chunk_start_ms=cursor_ms,
            chunk_end_ms=cursor_ms + chunk_dur_ms,
            sent_id_offset=sent_offset,
        )
        matched = sum(1 for g in groups if g["words"])
        print(f"    → {matched}/{len(chunk)}문장 매핑 성공")

        all_groups.extend(groups)
        all_audio.append(wav)
        cursor_ms += chunk_dur_ms
        sent_offset += len(chunk)

        if ci < len(chunks) - 1:
            all_audio.append(silence)
            cursor_ms += SILENCE_MS

    full_audio = np.concatenate(all_audio)
    total_ms_before = int(len(full_audio) / sample_rate * 1000)
    print(f"\n원본 길이: {total_ms_before/1000:.1f}초")

    # 배속 처리
    print(f"{SPEED}x 배속 처리 중...")
    sped_audio = speedup_wav(full_audio, sample_rate, SPEED)
    total_ms = int(len(sped_audio) / sample_rate * 1000)
    print(f"배속 후 길이: {total_ms/1000:.1f}초")

    # 타임스탬프 보정
    scaled_groups = scale_timestamps(all_groups, SPEED)

    # 저장
    out_audio = Path(args.output_audio)
    out_audio.parent.mkdir(parents=True, exist_ok=True)
    out_audio.write_bytes(wav_to_mp3(sped_audio, sample_rate))
    print(f"오디오 저장: {out_audio}")

    out_sync = Path(args.output_sync)
    out_sync.parent.mkdir(parents=True, exist_ok=True)
    out_sync.write_text(
        json.dumps({"duration_ms": total_ms, "sentences": scaled_groups}, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(f"싱크 저장: {out_sync} ({len(scaled_groups)}문장)")
    print(f"\nTTS 완료! ({len(sentences)}문장 / {total_ms/1000:.1f}초)")


if __name__ == "__main__":
    main()
