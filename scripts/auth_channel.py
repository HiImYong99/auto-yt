"""
채널 OAuth 토큰 사전 등록

사용법:
  python3 scripts/auth_channel.py --channel info
"""

import argparse
from config import ROOT, SCOPES, get_channel


def main():
    parser = argparse.ArgumentParser(description="채널 OAuth 토큰 등록")
    parser.add_argument("--channel", required=True, help="채널 ID (channels.json 키)")
    args = parser.parse_args()

    from config import load_config
    auth, ch = get_channel(args.channel)
    secret_path = ROOT / auth["client_secret"]
    token_path = ROOT / ch["token"]

    if not secret_path.exists():
        print(f"client_secret.json 없음: {secret_path}")
        return

    from google_auth_oauthlib.flow import InstalledAppFlow

    print(f"채널: {ch['display_name']} ({args.channel})")
    print("브라우저가 열립니다. 해당 채널로 로그인 후 승인해주세요.\n")

    creds = InstalledAppFlow.from_client_secrets_file(str(secret_path), SCOPES).run_local_server(port=0)

    token_path.parent.mkdir(parents=True, exist_ok=True)
    token_path.write_text(creds.to_json(), encoding="utf-8")
    print(f"토큰 저장 완료: {token_path}")


if __name__ == "__main__":
    main()
