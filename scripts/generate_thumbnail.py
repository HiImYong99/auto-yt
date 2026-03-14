"""
썸네일 자동 생성 스크립트 (1280x720)

스타일:
  - 어두운 올리브 그린 배경
  - 좌측 정렬 2줄 텍스트 (흰색 + 라임그린)
  - 우측 상단 채널 배지 (라임그린)
  - 우측 이모지 + 글로우

사용법:
  python3 scripts/generate_thumbnail.py --channel vibe
  python3 scripts/generate_thumbnail.py --channel vibe \
    --line1 "2026년 AI" --line2 "생존전략 6가지" \
    --subtitle "지금 모르면 뒤처집니다" --emoji "🧠"
"""

import argparse
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

from config import ROOT, get_channel

# ─── 컬러 팔레트 ────────────────────────────────────────────────────────────
BG_TOP    = (12, 24, 8)
BG_BOTTOM = (6, 12, 4)
LIME      = (170, 255, 0)
WHITE     = (255, 255, 255)
GRAY      = (140, 155, 130)
BADGE_BG  = LIME
BADGE_FG  = (10, 20, 6)

W, H = 1280, 720
LEFT_MARGIN = 80

# ─── 폰트 ────────────────────────────────────────────────────────────────────
FONT_PATHS = [
    "/System/Library/Fonts/AppleSDGothicNeo.ttc",
    "/System/Library/Fonts/Supplemental/AppleGothic.ttf",
    "/Library/Fonts/NanumGothicBold.ttf",
]
EMOJI_FONT_PATHS = [
    "/System/Library/Fonts/Apple Color Emoji.ttc",
]


def find_font(size: int, index: int = 7) -> ImageFont.FreeTypeFont:
    for path in FONT_PATHS:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size, index=index)
            except Exception:
                try:
                    return ImageFont.truetype(str(p), size, index=0)
                except Exception:
                    continue
    return ImageFont.load_default()


def find_emoji_font(size: int) -> ImageFont.FreeTypeFont | None:
    for path in EMOJI_FONT_PATHS:
        p = Path(path)
        if p.exists():
            try:
                return ImageFont.truetype(str(p), size, index=0)
            except Exception:
                continue
    return None


def draw_gradient_bg(img: Image.Image) -> None:
    draw = ImageDraw.Draw(img)
    for y in range(H):
        t = y / H
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        draw.line([(0, y), (W, y)], fill=(r, g, b))


def draw_glow(img: Image.Image, cx: int, cy: int, color: tuple, radius: int = 200) -> None:
    """특정 위치에 방사형 글로우"""
    from PIL import Image as PILImage
    overlay = PILImage.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for i in range(10):
        alpha = max(0, 30 - i * 3)
        r = radius + i * 28
        od.ellipse([cx - r, cy - r, cx + r, cy + r],
                   fill=(color[0], color[1], color[2], alpha))
    base = img.convert("RGBA")
    merged = PILImage.alpha_composite(base, overlay)
    img.paste(merged.convert("RGB"), (0, 0))


def draw_channel_badge(draw: ImageDraw.ImageDraw, label: str) -> None:
    """우측 상단 채널 배지"""
    font = find_font(34, 6)
    bbox = draw.textbbox((0, 0), label, font=font)
    tw = bbox[2] - bbox[0]
    pad_x, pad_y = 24, 14
    bw = tw + pad_x * 2
    bh = (bbox[3] - bbox[1]) + pad_y * 2
    bx = W - bw - 50
    by = 44
    draw.rounded_rectangle([bx, by, bx + bw, by + bh], radius=10, fill=BADGE_BG)
    draw.text((bx + pad_x, by + pad_y), label, font=font, fill=BADGE_FG)


def draw_emoji(img: Image.Image, emoji: str, cx: int, cy: int, size: int = 220) -> None:
    """이모지 렌더링 (Apple Color Emoji 폰트 사용)
    Apple Color Emoji는 bitmap 폰트라 지원 크기: 20, 32, 40, 48, 64, 96, 160
    size보다 작거나 같은 최대 지원 크기로 렌더 후 원하는 크기로 리사이즈
    """
    supported = [160, 96, 64, 48, 40, 32, 20]
    render_size = next((s for s in supported if s <= size), 160)

    font = find_emoji_font(render_size)
    if font is None:
        return

    canvas_size = render_size * 3
    tmp = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((render_size // 2, render_size // 4), emoji, font=font, embedded_color=True)

    # 실제 이모지가 그려진 영역만 크롭
    bbox = tmp.getbbox()
    if bbox is None:
        return
    cropped = tmp.crop(bbox)

    # 원하는 size로 리사이즈
    cw, ch = cropped.size
    scale = size / max(cw, ch)
    new_w = int(cw * scale)
    new_h = int(ch * scale)
    resized = cropped.resize((new_w, new_h), Image.LANCZOS)

    paste_x = cx - new_w // 2
    paste_y = cy - new_h // 2
    img.paste(resized, (paste_x, paste_y), resized)


def text_height(draw: ImageDraw.ImageDraw, text: str, font) -> int:
    bbox = draw.textbbox((0, 0), text, font=font)
    return bbox[3] - bbox[1]


def generate_thumbnail(
    channel_id: str,
    line1: str | None = None,
    line2: str | None = None,
    subtitle: str | None = None,
    emoji: str = "🧠",
) -> Path:
    _, ch = get_channel(channel_id)
    out_dir = ROOT / ch["output_dir"]
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "thumbnail.png"

    # metadata.json에서 텍스트 파싱
    if line1 is None or line2 is None:
        meta_path = out_dir / "metadata.json"
        if meta_path.exists():
            meta = json.loads(meta_path.read_text(encoding="utf-8"))
            raw = meta.get("optimized_title", meta.get("title", ""))
            parts = [p.strip() for p in raw.split("|")]
            main = parts[0]
            # 공백 기준으로 앞/뒤 분리 (가운데 토큰 기준)
            tokens = main.split()
            mid = max(1, len(tokens) // 2)
            line1 = line1 or " ".join(tokens[:mid])
            line2 = line2 or " ".join(tokens[mid:])
            if subtitle is None and len(parts) > 1:
                subtitle = parts[1]
        else:
            line1 = line1 or "AI 생존전략"
            line2 = line2 or "6가지 핵심 무기"

    subtitle = subtitle or "지금 모르면 뒤처집니다"

    # ── 캔버스 ──────────────────────────────────────────────────────────────
    img = Image.new("RGB", (W, H))
    draw_gradient_bg(img)

    # 우측 글로우 (이모지 위치 기준)
    draw_glow(img, cx=980, cy=380, color=(100, 200, 0), radius=180)

    draw = ImageDraw.Draw(img)

    # ── 채널 배지 (우측 상단) ────────────────────────────────────────────────
    draw_channel_badge(draw, ch.get("display_name", channel_id))

    # ── 메인 텍스트 (좌측 정렬) ──────────────────────────────────────────────
    font_big = find_font(118, 7)
    font_sub = find_font(46, 4)

    # 텍스트 블록 전체 높이 계산 → 세로 중앙 정렬
    h1 = text_height(draw, line1, font_big)
    h2 = text_height(draw, line2, font_big)
    hs = text_height(draw, subtitle, font_sub)
    gap = 12
    gap_sub = 28
    total_h = h1 + gap + h2 + gap_sub + hs
    start_y = (H - total_h) // 2 - 20  # 살짝 위로

    draw.text((LEFT_MARGIN, start_y), line1, font=font_big, fill=WHITE)
    draw.text((LEFT_MARGIN, start_y + h1 + gap), line2, font=font_big, fill=LIME)
    draw.text(
        (LEFT_MARGIN + 4, start_y + h1 + gap + h2 + gap_sub),
        subtitle, font=font_sub, fill=GRAY
    )

    # ── 이모지 (우측) ────────────────────────────────────────────────────────
    draw_emoji(img, emoji, cx=990, cy=390, size=240)

    img.save(str(out_path), "PNG", optimize=True)
    print(f"[{channel_id}] 썸네일 저장: {out_path}")
    return out_path


def main():
    parser = argparse.ArgumentParser(description="썸네일 생성")
    parser.add_argument("--channel", required=True, help="채널 ID")
    parser.add_argument("--line1", help="첫 번째 줄 (흰색)")
    parser.add_argument("--line2", help="두 번째 줄 (라임그린)")
    parser.add_argument("--subtitle", help="서브타이틀 (회색)")
    parser.add_argument("--emoji", default="🧠", help="우측 이모지")
    a = parser.parse_args()
    generate_thumbnail(a.channel, a.line1, a.line2, a.subtitle, a.emoji)


if __name__ == "__main__":
    main()
