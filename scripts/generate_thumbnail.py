"""
썸네일 자동 생성 스크립트 (1280x720)
Playwright MCP 없이 직접 실행 가능한 headless Chrome 방식

사용법:
  python3 scripts/generate_thumbnail.py --channel vibe
  python3 scripts/generate_thumbnail.py --channel vibe --big "AI 팀" --bottom "터미널 하나로 만들다"
"""

import os
import argparse
import json
import random
import subprocess
import tempfile
from pathlib import Path

from config import ROOT, get_channel

W, H = 1280, 720

NEON_THEMES = [
    {"name": "cyan",    "color": "#00FFFF", "glow": "#00FFFF33", "accent": "#61DAFB"},
    {"name": "green",   "color": "#BFFF00", "glow": "#BFFF0033", "accent": "#10B981"},
    {"name": "pink",    "color": "#FF1493", "glow": "#FF149333", "accent": "#EC4899"},
    {"name": "yellow",  "color": "#FFE500", "glow": "#FFE50033", "accent": "#F59E0B"},
    {"name": "orange",  "color": "#FF5722", "glow": "#FF572233", "accent": "#F97316"},
    {"name": "purple",  "color": "#B400FF", "glow": "#B400FF33", "accent": "#A855F7"},
]


def build_html(big: str, bottom: str, theme: dict, emoji: str = "⚡") -> str:
    color  = theme["color"]
    glow   = theme["glow"]
    accent = theme["accent"]

    # 글자 수에 따라 폰트 크기 자동 조정
    big_size = 220 if len(big) <= 3 else (180 if len(big) <= 6 else 140)
    bottom_size = 96 if len(bottom) <= 10 else (78 if len(bottom) <= 16 else 62)

    return f"""<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  body {{
    width: {W}px; height: {H}px; overflow: hidden;
    background: #000;
    font-family: 'Black Han Sans', 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  }}

  /* 배경 그라데이션 */
  .bg {{
    position: absolute; inset: 0;
    background: radial-gradient(ellipse at 50% 50%,
      {glow} 0%, #000 65%);
  }}

  /* 파티클 SVG */
  .particles {{
    position: absolute; inset: 0;
    opacity: 0.7;
  }}

  /* 좌측 수직 액센트 바 */
  .bar {{
    position: absolute;
    left: 40px; top: 60px; bottom: 60px;
    width: 6px; border-radius: 3px;
    background: linear-gradient(180deg, {color}, transparent);
    box-shadow: 0 0 20px {color}88;
  }}

  /* 큰 텍스트 */
  .big {{
    position: absolute;
    left: 72px; top: 60px;
    font-size: {big_size}px;
    font-weight: 900;
    color: #FFE500;
    line-height: 1.0;
    letter-spacing: -0.04em;
    text-shadow:
      -4px -4px 0 #000,
       4px -4px 0 #000,
      -4px  4px 0 #000,
       4px  4px 0 #000,
       0 0 60px #FFE50099;
    word-break: keep-all;
    max-width: 780px;
  }}

  /* 이모지 우측 배치 */
  .emoji {{
    position: absolute;
    right: 60px; top: 50%;
    transform: translateY(-55%);
    font-size: 240px;
    filter: drop-shadow(0 0 40px {color}88);
    opacity: 0.9;
  }}

  /* 하단 텍스트 */
  .bottom {{
    position: absolute;
    left: 72px; bottom: 56px;
    font-size: {bottom_size}px;
    font-weight: 900;
    color: #FFFFFF;
    letter-spacing: -0.02em;
    text-shadow:
      -3px -3px 0 #000,
       3px -3px 0 #000,
      -3px  3px 0 #000,
       3px  3px 0 #000,
       0 0 30px {accent}99;
    word-break: keep-all;
    max-width: 900px;
  }}

  /* 하단 액센트 라인 */
  .line {{
    position: absolute;
    left: 72px; bottom: 44px;
    height: 3px; width: 120px;
    background: linear-gradient(90deg, {color}, transparent);
    box-shadow: 0 0 12px {color};
  }}
</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&display=swap" rel="stylesheet">
</head>
<body>
  <div class="bg"></div>

  <svg class="particles" viewBox="0 0 {W} {H}" xmlns="http://www.w3.org/2000/svg">
    <!-- 방사형 아크 선 -->
    {_gen_arcs(theme)}
    <!-- 파티클 점 -->
    {_gen_dots(theme)}
  </svg>

  <div class="bar"></div>
  <div class="big">{big}</div>
  <div class="emoji">{emoji}</div>
  <div class="bottom">{bottom}</div>
  <div class="line"></div>
</body>
</html>"""


def _gen_arcs(theme: dict) -> str:
    """랜덤 에너지 아크 SVG (매번 동일 시드 사용)"""
    import math
    color = theme["color"]
    rng = random.Random(hash(theme["name"]) % (2**32))
    cx, cy = W // 2, H // 2
    lines = []
    for _ in range(50):
        angle = rng.uniform(0, 2 * math.pi)
        wobble = rng.uniform(-0.4, 0.4)
        length = rng.uniform(100, 420)
        alpha = rng.randint(40, 160)
        width = rng.uniform(0.8, 3.0)
        x1 = cx + int(math.cos(angle) * 20)
        y1 = cy + int(math.sin(angle) * 20)
        x2 = cx + int(math.cos(angle + wobble) * length)
        y2 = cy + int(math.sin(angle + wobble) * length)
        hex_alpha = f"{alpha:02x}"
        lines.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
            f'stroke="{color}{hex_alpha}" stroke-width="{width:.1f}"/>'
        )
    return "\n    ".join(lines)


def _gen_dots(theme: dict) -> str:
    """랜덤 파티클 점 SVG"""
    import math
    color = theme["color"]
    rng = random.Random(hash(theme["name"] + "dots") % (2**32))
    cx, cy = W // 2, H // 2
    circles = []
    for _ in range(80):
        angle = rng.uniform(0, 2 * math.pi)
        dist = rng.uniform(60, 450)
        px = cx + int(math.cos(angle) * dist)
        py = cy + int(math.sin(angle) * dist)
        size = rng.uniform(1.5, 7)
        alpha = rng.randint(80, 220)
        hex_alpha = f"{alpha:02x}"
        circles.append(
            f'<circle cx="{px}" cy="{py}" r="{size:.1f}" fill="{color}{hex_alpha}"/>'
        )
    return "\n    ".join(circles)


def generate_thumbnail_playwright(
    channel_id: str,
    big: str | None = None,
    bottom: str | None = None,
    emoji: str | None = None,
) -> Path:
    """HTML 렌더링 → Playwright로 PNG 캡처"""
    _, ch = get_channel(channel_id)
    out_dir = ROOT / ch["output_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "thumbnail.png"

    # metadata.json에서 텍스트 파싱
    meta_path = out_dir / "metadata.json"
    if meta_path.exists():
        meta = json.loads(meta_path.read_text(encoding="utf-8"))
        big    = big    or meta.get("thumbnail_big", "AI")
        bottom = bottom or meta.get("thumbnail_bottom", "지금 시작하세요")
        emoji  = emoji  or meta.get("thumbnail_emoji", "⚡")
    else:
        big    = big    or "AI"
        bottom = bottom or "지금 시작하세요"
        emoji  = emoji  or "⚡"

    theme = random.choice(NEON_THEMES)
    print(f"  썸네일 테마: {theme['name']}")

    html = build_html(big, bottom, theme, emoji)

    # 임시 HTML 파일 저장
    html_path = out_dir / "_thumbnail_tmp.html"
    html_path.write_text(html, encoding="utf-8")

    # Playwright CLI로 스크린샷 (npx playwright screenshot)
    try:
        result = subprocess.run(
            [
                "npx", "playwright", "screenshot",
                "--browser", "chromium",
                "--viewport-size", f"{W},{H}",
                f"file://{html_path.resolve()}",
                str(out_path),
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
            timeout=30,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr or result.stdout)
        print(f"  썸네일 저장 (Playwright): {out_path}")
    except Exception as e:
        # Playwright 없을 경우 PIL 폴백
        print(f"  Playwright 실패 ({e}), PIL 폴백 사용")
        _pil_fallback(big, bottom, theme, out_path)
    finally:
        html_path.unlink(missing_ok=True)

    print(f"[{channel_id}] 썸네일 완료: {out_path}")
    return out_path


def _pil_fallback(big: str, bottom: str, theme: dict, out_path: Path):
    """Playwright 없을 때 PIL로 기본 썸네일 생성"""
    import math
    from PIL import Image, ImageDraw, ImageFont

    color_hex = theme["color"].lstrip("#")
    color = tuple(int(color_hex[i:i+2], 16) for i in (0, 2, 4))

    img = Image.new("RGB", (W, H), (0, 0, 0))
    draw = ImageDraw.Draw(img, "RGBA")
    cx, cy = W // 2, H // 2

    # 방사형 글로우
    for r in range(340, 0, -5):
        alpha = int(55 * (1 - r / 340) ** 2)
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(*color, alpha))

    # 에너지 아크
    rng = random.Random(hash(theme["name"]) % (2**32))
    for _ in range(55):
        angle = rng.uniform(0, 2 * math.pi)
        wobble = rng.uniform(-0.4, 0.4)
        length = rng.uniform(100, 430)
        alpha = rng.randint(40, 160)
        width = rng.randint(1, 3)
        x1 = cx + int(math.cos(angle) * 20)
        y1 = cy + int(math.sin(angle) * 20)
        x2 = cx + int(math.cos(angle + wobble) * length)
        y2 = cy + int(math.sin(angle + wobble) * length)
        draw.line([x1, y1, x2, y2], fill=(*color, alpha), width=width)

    # 텍스트
    font_paths = [
        str(ROOT / "fonts" / "BlackHanSans-Regular.ttf"),
        "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    ]

    def load_font(size):
        for p in font_paths:
            if Path(p).exists():
                try:
                    return ImageFont.truetype(p, size)
                except Exception:
                    continue
        return ImageFont.load_default()

    YELLOW = (255, 229, 0)
    WHITE = (255, 255, 255)
    BLACK = (10, 10, 10)

    big_size = 200 if len(big) <= 3 else (160 if len(big) <= 6 else 130)
    font_big = load_font(big_size)
    draw.text((60, 50), big, font=font_big, fill=YELLOW, stroke_width=14, stroke_fill=BLACK)

    bottom_size = 90 if len(bottom) <= 10 else 70
    font_bottom = load_font(bottom_size)
    draw.text((60, H - 130), bottom, font=font_bottom, fill=WHITE, stroke_width=10, stroke_fill=BLACK)

    img.save(str(out_path), "PNG")
    print(f"  PIL 폴백 썸네일 저장: {out_path}")


# ── 하위 호환 alias ──────────────────────────────────────────
def generate_thumbnail(
    channel_id: str,
    big: str | None = None,
    bottom: str | None = None,
    visual_prompt: str | None = None,
    no_regen: bool = False,
) -> Path:
    return generate_thumbnail_playwright(channel_id, big, bottom)


def main():
    parser = argparse.ArgumentParser(description="썸네일 생성 (Playwright)")
    parser.add_argument("--channel", required=True)
    parser.add_argument("--big",    help="큰 텍스트 (1~2단어)")
    parser.add_argument("--bottom", help="하단 문구")
    parser.add_argument("--emoji",  help="이모지")
    a = parser.parse_args()
    generate_thumbnail_playwright(a.channel, a.big, a.bottom, a.emoji)


if __name__ == "__main__":
    main()
