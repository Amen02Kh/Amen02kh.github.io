#!/usr/bin/env python3
"""
Generates the 1200x630 share cards (Open Graph images) for every post,
plus a default card for the other pages.

    pip install pillow pyyaml
    python scripts/make_cards.py

Cards are written to assets/cards/<post-slug>.jpg and assets/cards/default.jpg.
The GitHub Actions workflow runs this before every build, so you never need to
commit the generated images.
"""
import random
import re
import sys
from pathlib import Path

import yaml
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = Path(__file__).resolve().parent / "fonts"
OUT = ROOT / "assets" / "cards"
W, H = 1200, 630

WALL = (34, 42, 35)
CHALK = (223, 226, 212)
CHALK_DIM = (185, 192, 174)
ACCENT = (200, 207, 138)
DEEP = (26, 32, 27)
LINE = (90, 104, 91)


def load_yaml(path):
    with open(path, encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


def front_matter(path):
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\s*\n(.*?)\n---", text, re.S)
    return yaml.safe_load(m.group(1)) if m else {}


def hand_font(cfg, size):
    name = (cfg.get("hand_font") or "Covered By Your Grace").replace(" ", "")
    for candidate in (FONTS / f"{name}.ttf", FONTS / f"{name}-Regular.ttf", FONTS / "CoveredByYourGrace.ttf"):
        if candidate.exists():
            return ImageFont.truetype(str(candidate), size)
    return ImageFont.load_default(size)


def sans(size, bold=False):
    f = FONTS / ("Barlow-Bold.ttf" if bold else "Barlow-SemiBold.ttf")
    return ImageFont.truetype(str(f), size) if f.exists() else ImageFont.load_default(size)


def wall_background(seed):
    """Concrete: base colour, grain, a dim spotlight and a vignette."""
    img = Image.new("RGB", (W, H), WALL)

    grain = Image.effect_noise((W, H), 38).convert("RGB")
    img = Image.blend(img, grain, 0.10)

    spot = Image.radial_gradient("L").resize((int(W * 1.3), int(H * 1.6)))
    spot = Image.eval(spot, lambda v: max(0, 255 - v * 1.6))
    layer = Image.new("RGB", (W, H), (196, 206, 140))
    mask = Image.new("L", (W, H), 0)
    mask.paste(spot, (int(W * 0.3) - spot.width // 2, int(H * 0.35) - spot.height // 2))
    mask = Image.eval(mask, lambda v: int(v * 0.26))
    img = Image.composite(layer, img, mask)

    vig = Image.radial_gradient("L").resize((int(W * 1.5), int(H * 1.9)))
    vmask = Image.new("L", (W, H), 255)
    vmask.paste(vig, (W // 2 - vig.width // 2, H // 2 - vig.height // 2))
    vmask = Image.eval(vmask, lambda v: int(min(255, v) * 0.55))
    img = Image.composite(Image.new("RGB", (W, H), (0, 0, 0)), img, vmask)

    # a few hairline cracks
    rnd = random.Random(seed)
    d = ImageDraw.Draw(img)
    for _ in range(2):
        x, y = rnd.randint(900, 1150), 0
        pts = [(x, y)]
        for _ in range(4):
            x += rnd.randint(-28, 28)
            y += rnd.randint(40, 80)
            pts.append((x, y))
        d.line(pts, fill=(15, 20, 16), width=2)
    return img


def rotated_text(img, xy, text, font, fill, angle):
    """Draw text on its own layer, rotate it slightly like chalk, paste it."""
    tmp = Image.new("L", (1, 1))
    box = ImageDraw.Draw(tmp).multiline_textbbox((0, 0), text, font=font, spacing=4)
    w, h = box[2] + 40, box[3] + 40
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    ImageDraw.Draw(layer).multiline_text((20, 20), text, font=font, fill=fill, spacing=4)
    layer = layer.rotate(angle, resample=Image.BICUBIC, expand=True)
    img.paste(layer, (xy[0] - 20, xy[1] - 20), layer)


def wrap(text, font, max_w):
    words, lines, cur = text.split(), [], ""
    d = ImageDraw.Draw(Image.new("L", (1, 1)))
    for w in words:
        trial = (cur + " " + w).strip()
        if d.textlength(trial, font=font) <= max_w:
            cur = trial
        else:
            if cur:
                lines.append(cur)
            cur = w
    if cur:
        lines.append(cur)
    return lines


def chip(draw, x, y, text, font, filled):
    pad_x, pad_y = 14, 6
    tw = draw.textlength(text, font=font)
    box = (x, y, x + tw + pad_x * 2, y + font.size + pad_y * 2 + 4)
    if filled:
        draw.rectangle(box, fill=ACCENT)
        draw.text((x + pad_x, y + pad_y), text, font=font, fill=DEEP)
    else:
        draw.rectangle(box, outline=LINE, width=2)
        draw.text((x + pad_x, y + pad_y), text, font=font, fill=CHALK)
    return box[2] + 10


def card(cfg, title, kicker, chips, seed):
    img = wall_background(seed)
    d = ImageDraw.Draw(img)
    alias = (cfg.get("author") or {}).get("alias") or cfg.get("title", "")
    url = re.sub(r"^https?://", "", cfg.get("url", "")).rstrip("/")

    rotated_text(img, (72, 50), alias, hand_font(cfg, 52), CHALK, 3)
    if kicker:
        kf = hand_font(cfg, 40)
        kw = d.textlength(kicker, font=kf)
        rotated_text(img, (int(W - 72 - kw), 56), kicker, kf, ACCENT, 2)

    # biggest title size that fits in three lines
    for size in (96, 86, 76, 66, 58):
        f = hand_font(cfg, size)
        lines = wrap(title, f, 900)
        if len(lines) <= 3:
            break
    block = "\n".join(lines[:3])
    bh = ImageDraw.Draw(Image.new("L", (1, 1))).multiline_textbbox((0, 0), block, font=f, spacing=4)[3]
    rotated_text(img, (72, int(H / 2 - bh / 2) + 10), block, f, (255, 255, 255), 1)

    cf = sans(22)
    x = 72
    for i, c in enumerate(chips[:3]):
        x = chip(d, x, H - 56 - 40, c, cf, filled=(i == 0))
    uf = sans(24)
    d.text((W - 72 - d.textlength(url, font=uf), H - 56 - 32), url, font=uf, fill=CHALK_DIM)
    return img


def main():
    cfg = load_yaml(ROOT / "_config.yml")
    districts = {d["key"]: d for d in load_yaml(ROOT / "_data" / "districts.yml") or []}
    OUT.mkdir(parents=True, exist_ok=True)

    count = 0
    for path in sorted((ROOT / "_posts").glob("*.md")):
        fm = front_matter(path)
        if fm.get("published") is False:
            continue
        slug = re.sub(r"^\d{4}-\d{2}-\d{2}-", "", path.stem)
        cats = fm.get("categories") or []
        if isinstance(cats, str):
            cats = cats.split()
        district = districts.get(cats[0]) if cats else None
        chips = ([district["name"]] if district else ([cats[0]] if cats else [])) + list(fm.get("tags") or [])[:2]
        kicker = f"#{fm['rank']}, crossed off" if fm.get("rank") else ""
        card(cfg, str(fm.get("title", slug)), kicker, chips, slug).save(OUT / f"{slug}.jpg", quality=86, optimize=True)
        count += 1

    author = cfg.get("author") or {}
    tagline = author.get("tagline", "")
    short = tagline.split(",")[0] if tagline else cfg.get("description", "")
    card(cfg, "Writeups, cheat sheets and pink slips", "", [short], "default").save(OUT / "default.jpg", quality=86, optimize=True)
    print(f"share cards: {count} posts + default -> {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    sys.exit(main())
