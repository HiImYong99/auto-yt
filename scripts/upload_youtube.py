"""
YouTube 자동 업로드 스크립트

사용법:
  python3 scripts/upload_youtube.py --channel vibe
  python3 scripts/upload_youtube.py   # 레거시
"""

import json
import sys
import argparse
from pathlib import Path
from config import ROOT, SCOPES, get_channel


def resolve_paths(channel_id: str | None) -> dict:
    if channel_id:
        auth, ch = get_channel(channel_id)  # defaults 이미 머지됨
        out_dir = ROOT / ch["output_dir"]
        return {
            "secret": ROOT / auth["client_secret"],
            "token": ROOT / ch["token"],
            "video": out_dir / "video.mp4",
            "thumbnail": out_dir / "thumbnail.png",
            "metadata_json": out_dir / "metadata.json",
            "privacy": ch.get("youtube_privacy", "private"),
            "category_id": ch.get("category_id", "22"),
        }
    return {
        "secret": ROOT / "client_secret.json",
        "token": ROOT / "token.json",
        "video": ROOT / "out" / "video.mp4",
        "thumbnail": ROOT / "out" / "thumbnail.png",
        "metadata_json": ROOT / "youtube_metadata.json",
        "privacy": "private",
        "category_id": "22",
    }


def check_files(paths: dict) -> None:
    if not paths["secret"].exists():
        print("=" * 60)
        print(f"client_secret.json 없음: {paths['secret']}")
        print("  1. https://console.cloud.google.com")
        print("  2. YouTube Data API v3 활성화")
        print("  3. OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)")
        print(f"  4. JSON 다운로드 → {paths['secret']} 로 저장")
        print("=" * 60)
        sys.exit(1)
    if not paths["video"].exists():
        print(f"영상 파일 없음: {paths['video']}")
        sys.exit(1)


def parse_metadata(paths: dict) -> tuple[str, str, list[str]]:
    meta = paths["metadata_json"]
    if not meta.exists():
        raise FileNotFoundError(f"메타데이터 없음: {meta}")
    data = json.loads(meta.read_text(encoding="utf-8"))
    title = data.get("optimized_title", data.get("title", ""))
    return title, data.get("description", ""), data.get("tags", [])


def get_credentials(paths: dict):
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request

    token_file = paths["token"]
    creds = None
    if token_file.exists():
        creds = Credentials.from_authorized_user_file(str(token_file), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(paths["secret"]), SCOPES)
            creds = flow.run_local_server(port=0)
        token_file.parent.mkdir(parents=True, exist_ok=True)
        token_file.write_text(creds.to_json(), encoding="utf-8")
    return creds


def upload(channel_id: str | None = None) -> str:
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    paths = resolve_paths(channel_id)
    check_files(paths)

    title, description, tags = parse_metadata(paths)
    label = f"[{channel_id}] " if channel_id else ""
    print(f"{label}제목: {title}")
    print(f"{label}태그: {tags}\n")

    creds = get_credentials(paths)
    youtube = build("youtube", "v3", credentials=creds)

    print(f"{label}영상 업로드 중: {paths['video']}")
    request = youtube.videos().insert(
        part="snippet,status",
        body={
            "snippet": {
                "title": title,
                "description": description,
                "tags": tags,
                "categoryId": paths["category_id"],
                "defaultLanguage": "ko",
            },
            "status": {"privacyStatus": paths["privacy"]},
        },
        media_body=MediaFileUpload(str(paths["video"]), chunksize=-1, resumable=True),
    )

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            print(f"{label}  {int(status.progress() * 100)}%...", end="\r")

    video_id = response["id"]
    print(f"\n{label}업로드 완료: https://youtu.be/{video_id}")

    if paths["thumbnail"].exists():
        youtube.thumbnails().set(
            videoId=video_id,
            media_body=MediaFileUpload(str(paths["thumbnail"])),
        ).execute()
        print(f"{label}썸네일 완료")

    print(f"\n{'='*60}\n{label}영상: https://youtu.be/{video_id} ({paths['privacy']})\n{'='*60}")
    return video_id


def main():
    parser = argparse.ArgumentParser(description="YouTube 업로드")
    parser.add_argument("--channel", help="채널 ID (channels.json 키)")
    upload(parser.parse_args().channel)


if __name__ == "__main__":
    main()
