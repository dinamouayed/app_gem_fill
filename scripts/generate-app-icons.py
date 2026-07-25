#!/usr/bin/env python3
"""Generate Expo app icon assets from a 1024x1024 source image."""

from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
SOURCE = Path(sys.argv[1]) if len(sys.argv) > 1 else ASSETS / "icon-source.png"
BG_COLOR = (15, 23, 42)  # #0F172A


def save_png(image: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, format="PNG", optimize=True)
    print(f"  wrote {path.relative_to(ROOT)} ({path.stat().st_size // 1024} KB)")


def main() -> None:
    if not SOURCE.exists():
        raise SystemExit(f"Source image not found: {SOURCE}")

    source = Image.open(SOURCE).convert("RGBA")
    source = source.resize((1024, 1024), Image.Resampling.LANCZOS)

    print("Generating app icons…")

    save_png(source.convert("RGB"), ASSETS / "icon.png")

    splash_size = 512
    splash = source.resize((splash_size, splash_size), Image.Resampling.LANCZOS)
    save_png(splash, ASSETS / "splash-icon.png")

    save_png(source.convert("RGB"), ASSETS / "android-icon-foreground.png")

    background = Image.new("RGB", (1024, 1024), BG_COLOR)
    save_png(background, ASSETS / "android-icon-background.png")

    gray = ImageOps.grayscale(source.convert("RGB"))
    gray = ImageEnhance.Contrast(gray).enhance(2.2)
    mono = Image.new("RGBA", (1024, 1024), (0, 0, 0, 0))
    mono.paste(gray, mask=gray.point(lambda value: 255 if value > 90 else 0))
    save_png(mono, ASSETS / "android-icon-monochrome.png")

    favicon = source.resize((48, 48), Image.Resampling.LANCZOS)
    save_png(favicon.convert("RGB"), ASSETS / "favicon.png")

    print("Done.")


if __name__ == "__main__":
    main()
