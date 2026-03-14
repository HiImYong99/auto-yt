"""
YouTube 자동 업로드 스크립트
- out/video.mp4 + out/thumbnail.png + youtube_metadata.txt 를 유튜브에 업로드
- 사전 조건: client_secret.json (Google Cloud Console에서 다운로드)
- OAuth 토큰은 token.json에 캐싱 (2회차부터 브라우저 없이 자동 실행)
"""

import os
import sys
import json
import argparse
from pathlib import Path

ROOT         = Path(__file__).parent.parent
SECRET_FILE  = ROOT / "client_secret.json"
TOKEN_FILE   = ROOT / "token.json"
VIDEO_FILE   = ROOT / "out" / "video.mp4"
THUMB_FILE   = ROOT / "out" / "thumbnail.png"
METADATA_FILE= ROOT / "youtube_metadata.txt"

SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def parse_upload_args():
    parser = argparse.ArgumentParser(description="YouTube 업로드")
    parser.add_argument("--token-path", default=None, help="OAuth 토큰 경로 (채널별)")
    parser.add_argument("--video-path", default=None, help="업로드할 영상 경로")
    parser.add_argument("--thumb-path", default=None, help="썸네일 경로")
    parser.add_argument("--metadata-path", default=None, help="메타데이터(.txt) 경로")
    return parser.parse_args()


def check_files():
    if not SECRET_FILE.exists():
        print("=" * 60)
        print("client_secret.json 이 없습니다.")
        print()
        print("1회 설정 방법:")
        print("  1. https://console.cloud.google.com 접속")
        print("  2. 새 프로젝트 생성 → YouTube Data API v3 활성화")
        print("  3. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성 (데스크톱 앱)")
        print("  4. JSON 다운로드 → auto-yt/client_secret.json 으로 저장")
        print("=" * 60)
        sys.exit(1)

    for f in [VIDEO_FILE, THUMB_FILE, METADATA_FILE]:
        if not f.exists():
            print(f"파일 없음: {f}")
            sys.exit(1)


def parse_metadata():
    """youtube_metadata.txt 에서 제목, 설명, 태그 파싱"""
    text = METADATA_FILE.read_text(encoding="utf-8")
    sections = {}
    current = None

    for line in text.splitlines():
        if line.startswith("■ "):
            current = line[2:].strip()
            sections[current] = []
        elif current:
            sections[current].append(line)

    title = "\n".join(sections.get("제목", [])).strip()

    # 설명에서 태그 제거 (마지막 줄 #태그 라인)
    desc_lines = sections.get("설명", [])
    description = "\n".join(desc_lines).strip()

    # 태그 파싱: 마지막 줄의 #태그 형태
    tags = []
    for line in reversed(desc_lines):
        line = line.strip()
        if line.startswith("#"):
            tags = [t.lstrip("#") for t in line.split()]
            break

    return title, description, tags


def get_credentials():
    from google.oauth2.credentials import Credentials
    from google_auth_oauthlib.flow import InstalledAppFlow
    from google.auth.transport.requests import Request

    token_path = Path(TOKEN_FILE)
    creds = None
    if token_path.exists():
        creds = Credentials.from_authorized_user_file(str(token_path), SCOPES)

    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(SECRET_FILE), SCOPES)
            creds = flow.run_local_server(port=0)
        token_path.write_text(creds.to_json(), encoding="utf-8")

    return creds


def upload():
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload

    check_files()

    title, description, tags = parse_metadata()
    print(f"제목: {title}")
    print(f"태그: {tags}")
    print()

    print("Google 인증 중...")
    creds = get_credentials()
    youtube = build("youtube", "v3", credentials=creds)

    # 영상 업로드
    print("영상 업로드 중...")
    body = {
        "snippet": {
            "title": title,
            "description": description,
            "tags": tags,
            "categoryId": "22",  # People & Blogs
            "defaultLanguage": "ko",
        },
        "status": {
            "privacyStatus": "private",  # 업로드 후 직접 공개 설정 권장
        },
    }

    media = MediaFileUpload(str(VIDEO_FILE), chunksize=-1, resumable=True)
    request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)

    response = None
    while response is None:
        status, response = request.next_chunk()
        if status:
            pct = int(status.progress() * 100)
            print(f"  업로드 {pct}%...", end="\r")

    video_id = response["id"]
    print(f"\n영상 업로드 완료: https://youtu.be/{video_id}")

    # 썸네일 업로드
    print("썸네일 업로드 중...")
    youtube.thumbnails().set(
        videoId=video_id,
        media_body=MediaFileUpload(str(THUMB_FILE))
    ).execute()
    print("썸네일 업로드 완료")

    print()
    print("=" * 60)
    print(f"✅ 업로드 완료!")
    print(f"   영상: https://youtu.be/{video_id}")
    print(f"   상태: 비공개 (YouTube Studio에서 공개로 변경하세요)")
    print("=" * 60)


if __name__ == "__main__":
    args = parse_upload_args()
    # 동적 경로 오버라이드 (채널별 OAuth 토큰 격리)
    if args.token_path:
        TOKEN_FILE = Path(args.token_path)
    if args.video_path:
        VIDEO_FILE = Path(args.video_path)
    if args.thumb_path:
        THUMB_FILE = Path(args.thumb_path)
    if args.metadata_path:
        METADATA_FILE = Path(args.metadata_path)
    upload()
