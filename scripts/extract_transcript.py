"""
YouTube 트랜스크립트 추출
- youtube_transcript_api로 자막 추출
- 한국어 우선, 없으면 영어, 없으면 자동생성 자막
"""

import re
import sys


def extract_video_id(url: str) -> str:
    patterns = [
        r"(?:v=|youtu\.be/)([A-Za-z0-9_-]{11})",
        r"(?:embed/)([A-Za-z0-9_-]{11})",
        r"(?:shorts/)([A-Za-z0-9_-]{11})",
    ]
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)
    raise ValueError(f"유효한 YouTube URL이 아닙니다: {url}")


def fetch_transcript(url: str) -> str:
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
    except ImportError:
        print("youtube-transcript-api 미설치. 설치 중...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "youtube-transcript-api", "-q"])
        from youtube_transcript_api import YouTubeTranscriptApi

    video_id = extract_video_id(url)
    print(f"  영상 ID: {video_id}")

    api = YouTubeTranscriptApi()

    try:
        # 한국어 우선, 없으면 영어
        for lang in ["ko", "en"]:
            try:
                fetched = api.fetch(video_id, languages=[lang])
                entries = list(fetched)
                break
            except Exception:
                continue
        else:
            # 언어 제한 없이 fallback
            transcript_list = api.list(video_id)
            transcript = next(iter(transcript_list))
            fetched = transcript.fetch()
            entries = list(fetched)

        text = " ".join(e.text.strip() for e in entries if e.text.strip())
        print(f"  트랜스크립트 추출 완료: {len(text)}자")
        return text

    except Exception as e:
        raise RuntimeError(f"트랜스크립트 추출 실패: {e}")


if __name__ == "__main__":
    url = sys.argv[1] if len(sys.argv) > 1 else input("YouTube URL: ").strip()
    print(fetch_transcript(url))
