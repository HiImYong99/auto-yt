"""채널 설정 공유 유틸리티 — 모든 스크립트가 이걸 import"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
SCOPES = ["https://www.googleapis.com/auth/youtube"]


def load_config() -> dict:
    config_file = ROOT / "channels.json"
    if not config_file.exists():
        print("channels.json 파일이 없습니다.")
        sys.exit(1)
    with open(config_file, encoding="utf-8") as f:
        return json.load(f)


def get_channel(channel_id: str) -> tuple[dict, dict]:
    """(auth, channel) 튜플 반환. channel은 defaults와 머지됨. 채널 없으면 종료."""
    config = load_config()
    channels = config["channels"]
    if channel_id not in channels:
        print(f"채널 '{channel_id}'가 channels.json에 없습니다.")
        print(f"사용 가능: {list(channels.keys())}")
        sys.exit(1)
    ch = {**config.get("defaults", {}), **channels[channel_id]}
    return config["auth"], ch
