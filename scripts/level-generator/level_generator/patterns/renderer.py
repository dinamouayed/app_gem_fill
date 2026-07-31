"""Procedural pixel-art pattern renderer."""

from __future__ import annotations

import math
import random

import numpy as np
from PIL import Image, ImageDraw

from ..config import DEFAULT_UNIT_FACTOR

def _canvas(width: int, height: int, bg: tuple[int, int, int]) -> Image.Image:
    return Image.new("RGB", (width, height), bg)


def _draw_sky_and_ground(
    draw: ImageDraw.ImageDraw,
    width: int,
    height: int,
    sky: tuple[int, int, int],
    ground: tuple[int, int, int],
) -> None:
    """Simple sky / ground split — no checkerboard pattern."""
    horizon = int(height * 0.68)
    draw.rectangle((0, 0, width, horizon), fill=sky)
    draw.rectangle((0, horizon, width, height), fill=ground)


def _draw_pattern(
    kind: str,
    seed: int,
    width: int,
    height: int,
    *,
    unit_factor: float = DEFAULT_UNIT_FACTOR,
) -> Image.Image:
    rng = random.Random(seed)
    palettes = [
        ((15, 23, 42), (56, 189, 248), (244, 63, 94), (250, 204, 21)),
        ((30, 41, 59), (16, 185, 129), (59, 130, 246), (248, 250, 252)),
        ((67, 20, 90), (192, 38, 211), (236, 72, 153), (253, 224, 71)),
        ((23, 37, 84), (99, 102, 241), (45, 212, 191), (251, 146, 60)),
        ((24, 24, 27), (239, 68, 68), (34, 197, 94), (250, 250, 250)),
        ((6, 78, 59), (52, 211, 153), (190, 242, 100), (254, 249, 195)),
        ((76, 29, 149), (167, 139, 250), (244, 114, 182), (255, 255, 255)),
        ((127, 29, 29), (248, 113, 113), (254, 215, 170), (254, 243, 199)),
    ]
    bg, c1, c2, c3 = rng.choice(palettes)
    img = _canvas(width, height, bg)
    draw = ImageDraw.Draw(img)
    _draw_sky_and_ground(draw, width, height, bg, c2)
    cx, cy = width // 2, height // 2
    unit = int(min(width, height) * unit_factor)

    def poly(points: list[tuple[float, float]], color: tuple[int, int, int]) -> None:
        draw.polygon([(cx + x * unit, cy + y * unit) for x, y in points], fill=color)

    if kind == "heart":
        draw.ellipse((cx - unit, cy - unit, cx, cy + unit * 0.2), fill=c1)
        draw.ellipse((cx, cy - unit, cx + unit, cy + unit * 0.2), fill=c1)
        poly([(0, 0.1), (-0.9, -0.8), (0.9, -0.8)], c2)
        draw.ellipse((cx - unit * 0.18, cy - unit * 0.12, cx + unit * 0.18, cy + unit * 0.18), fill=c3)
    elif kind == "star":
        points = []
        for i in range(10):
            angle = math.pi / 2 + i * math.pi / 5
            radius = 0.9 if i % 2 == 0 else 0.35
            points.append((math.cos(angle) * radius, math.sin(angle) * radius))
        poly(points, c2)
    elif kind == "sun":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.55, cx + unit * 0.55, cy + unit * 0.55), fill=c2)
        for i in range(12):
            angle = i * math.pi / 6
            draw.line(
                (cx + math.cos(angle) * unit * 0.65, cy + math.sin(angle) * unit * 0.65,
                 cx + math.cos(angle) * unit * 0.95, cy + math.sin(angle) * unit * 0.95),
                fill=c3,
                width=max(2, unit // 12),
            )
    elif kind == "moon":
        draw.ellipse((cx - unit * 0.8, cy - unit * 0.8, cx + unit * 0.8, cy + unit * 0.8), fill=c3)
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.85, cx + unit * 0.95, cy + unit * 0.75), fill=c2)
    elif kind == "flower":
        for i in range(8):
            angle = i * math.pi / 4
            x = cx + math.cos(angle) * unit * 0.45
            y = cy + math.sin(angle) * unit * 0.45
            draw.ellipse((x - unit * 0.25, y - unit * 0.25, x + unit * 0.25, y + unit * 0.25), fill=c1)
        draw.ellipse((cx - unit * 0.18, cy - unit * 0.18, cx + unit * 0.18, cy + unit * 0.18), fill=c3)
    elif kind == "tree":
        draw.rectangle((cx - unit * 0.12, cy, cx + unit * 0.12, cy + unit * 0.85), fill=(120, 72, 35))
        poly([(0, -0.2), (-0.75, 0.55), (0.75, 0.55)], c2)
        poly([(0, -0.55), (-0.55, 0.05), (0.55, 0.05)], c1)
    elif kind == "house":
        draw.rectangle((cx - unit * 0.65, cy - unit * 0.05, cx + unit * 0.65, cy + unit * 0.75), fill=c1)
        poly([(-0.8, -0.05), (0, -0.75), (0.8, -0.05)], c2)
        draw.rectangle((cx - unit * 0.15, cy + unit * 0.25, cx + unit * 0.15, cy + unit * 0.75), fill=c3)
    elif kind == "fish":
        draw.ellipse((cx - unit * 0.75, cy - unit * 0.35, cx + unit * 0.45, cy + unit * 0.35), fill=c1)
        poly([(0.45, 0), (0.95, -0.35), (0.95, 0.35)], c2)
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.08, cx - unit * 0.15, cy + unit * 0.08), fill=bg)
    elif kind == "cat":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.35, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
        poly([(-0.45, -0.35), (-0.65, -0.85), (-0.15, -0.45)], c1)
        poly([(0.45, -0.35), (0.65, -0.85), (0.15, -0.45)], c1)
        draw.ellipse((cx - unit * 0.2, cy - unit * 0.05, cx - unit * 0.05, cy + unit * 0.1), fill=bg)
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.05, cx + unit * 0.2, cy + unit * 0.1), fill=bg)
    elif kind == "mushroom":
        draw.rectangle((cx - unit * 0.15, cy + unit * 0.05, cx + unit * 0.15, cy + unit * 0.75), fill=c3)
        draw.ellipse((cx - unit * 0.65, cy - unit * 0.55, cx + unit * 0.65, cy + unit * 0.25), fill=c1)
        for dx in (-0.35, 0.0, 0.35):
            draw.ellipse(
                (cx + dx * unit - unit * 0.12, cy - unit * 0.25, cx + dx * unit + unit * 0.12, cy - unit * 0.01),
                fill=c2,
            )
    elif kind == "diamond":
        poly([(0, -0.9), (-0.65, 0), (0, 0.9), (0.65, 0)], c2)
        poly([(0, -0.9), (-0.65, 0), (0, 0), (0.65, 0)], c1)
    elif kind == "smiley":
        draw.ellipse((cx - unit * 0.8, cy - unit * 0.8, cx + unit * 0.8, cy + unit * 0.8), fill=c3)
        draw.ellipse((cx - unit * 0.25, cy - unit * 0.15, cx - unit * 0.05, cy + unit * 0.05), fill=bg)
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.15, cx + unit * 0.25, cy + unit * 0.05), fill=bg)
        draw.arc((cx - unit * 0.35, cy - unit * 0.05, cx + unit * 0.35, cy + unit * 0.45), 20, 160, fill=bg, width=max(2, unit // 10))
    elif kind == "arrow":
        draw.rectangle((cx - unit * 0.15, cy - unit * 0.65, cx + unit * 0.15, cy + unit * 0.65), fill=c2)
        poly([(0, -0.95), (-0.45, -0.35), (0.45, -0.35)], c1)
    elif kind == "spiral":
        px, py = cx, cy
        angle = 0.0
        for step in range(120):
            radius = step * unit * 0.012
            angle += 0.35
            x = cx + math.cos(angle) * radius
            y = cy + math.sin(angle) * radius
            draw.line((px, py, x, y), fill=c1 if step % 2 == 0 else c2, width=max(2, unit // 18))
            px, py = x, y
    elif kind == "waves":
        for row in range(5):
            y = cy - unit * 0.7 + row * unit * 0.35
            color = (c1, c2, c3)[row % 3]
            draw.arc((cx - unit, y, cx + unit, y + unit * 0.7), 0, 180, fill=color, width=max(3, unit // 8))
    elif kind == "mountain":
        poly([(-0.95, 0.85), (-0.2, -0.55), (0.35, 0.85)], c1)
        poly([(-0.15, 0.85), (0.35, -0.75), (0.95, 0.85)], c2)
        draw.rectangle((cx - unit, cy + unit * 0.55, cx + unit, cy + unit), fill=c3)
    elif kind == "cloud":
        draw.ellipse((cx - unit * 0.75, cy - unit * 0.15, cx - unit * 0.05, cy + unit * 0.35), fill=c3)
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.35, cx + unit * 0.35, cy + unit * 0.35), fill=c3)
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.15, cx + unit * 0.75, cy + unit * 0.35), fill=c3)
    elif kind == "bolt":
        poly([(-0.05, -0.9), (-0.45, -0.05), (-0.05, -0.05), (-0.25, 0.9), (0.45, 0.05), (0.05, 0.05), (0.25, -0.9)], c2)
    elif kind == "crown":
        draw.rectangle((cx - unit * 0.7, cy + unit * 0.05, cx + unit * 0.7, cy + unit * 0.45), fill=c2)
        for dx in (-0.55, -0.18, 0.18, 0.55):
            poly([(dx, 0.05), (dx - 0.12, -0.55), (dx + 0.12, 0.05)], c1)
    elif kind == "butterfly":
        draw.ellipse((cx - unit * 0.08, cy - unit * 0.45, cx + unit * 0.08, cy + unit * 0.45), fill=bg)
        draw.ellipse((cx - unit * 0.75, cy - unit * 0.55, cx - unit * 0.05, cy + unit * 0.05), fill=c1)
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.55, cx + unit * 0.75, cy + unit * 0.05), fill=c2)
        draw.ellipse((cx - unit * 0.55, cy + unit * 0.05, cx - unit * 0.05, cy + unit * 0.55), fill=c2)
        draw.ellipse((cx + unit * 0.05, cy + unit * 0.05, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
    elif kind == "cherry":
        draw.line((cx - unit * 0.15, cy - unit * 0.75, cx + unit * 0.15, cy - unit * 0.95), fill=c3, width=max(2, unit // 12))
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.05, cx - unit * 0.05, cy + unit * 0.45), fill=c1)
        draw.ellipse((cx + unit * 0.05, cy + unit * 0.05, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
    elif kind == "lemon":
        draw.ellipse((cx - unit * 0.65, cy - unit * 0.45, cx + unit * 0.65, cy + unit * 0.45), fill=c3)
        draw.line((cx - unit * 0.65, cy, cx + unit * 0.65, cy), fill=c2, width=max(2, unit // 14))
    elif kind == "icecream":
        poly([(-0.35, 0.85), (0, -0.15), (0.35, 0.85)], c3)
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.55, cx + unit * 0.45, cy + unit * 0.05), fill=c1)
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.75, cx + unit * 0.35, cy - unit * 0.15), fill=c2)
    elif kind == "cupcake":
        draw.rectangle((cx - unit * 0.45, cy + unit * 0.05, cx + unit * 0.45, cy + unit * 0.75), fill=c3)
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.35, cx + unit * 0.55, cy + unit * 0.25), fill=c1)
        draw.ellipse((cx - unit * 0.15, cy - unit * 0.55, cx + unit * 0.15, cy - unit * 0.15), fill=c2)
    elif kind == "rocket":
        draw.polygon([(cx, cy - unit * 0.95), (cx - unit * 0.25, cy + unit * 0.35), (cx + unit * 0.25, cy + unit * 0.35)], fill=c2)
        draw.ellipse((cx - unit * 0.18, cy - unit * 0.15, cx + unit * 0.18, cy + unit * 0.2), fill=c3)
        poly([(-0.25, 0.35), (-0.65, 0.75), (-0.25, 0.55)], c1)
        poly([(0.25, 0.35), (0.65, 0.75), (0.25, 0.55)], c1)
    elif kind == "planet":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.55, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
        draw.ellipse((cx - unit * 0.85, cy - unit * 0.1, cx + unit * 0.85, cy + unit * 0.1), outline=c2, width=max(2, unit // 10))
    elif kind == "ring_planet":
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.45, cx + unit * 0.45, cy + unit * 0.45), fill=c2)
        draw.ellipse((cx - unit * 0.95, cy + unit * 0.05, cx + unit * 0.95, cy + unit * 0.35), outline=c1, width=max(3, unit // 8))
    elif kind == "cactus":
        draw.rectangle((cx - unit * 0.12, cy - unit * 0.55, cx + unit * 0.12, cy + unit * 0.85), fill=c2)
        draw.rectangle((cx - unit * 0.45, cy - unit * 0.15, cx - unit * 0.12, cy + unit * 0.05), fill=c2)
        draw.rectangle((cx + unit * 0.12, cy - unit * 0.35, cx + unit * 0.45, cy - unit * 0.15), fill=c2)
    elif kind == "snake":
        px, py = cx - unit * 0.75, cy + unit * 0.55
        for step in range(8):
            nx = cx - unit * 0.75 + step * unit * 0.22
            ny = cy + math.sin(step * 0.9) * unit * 0.35
            draw.line((px, py, nx, ny), fill=c1 if step % 2 == 0 else c2, width=max(4, unit // 6))
            px, py = nx, ny
        draw.ellipse((px - unit * 0.12, py - unit * 0.12, px + unit * 0.12, py + unit * 0.12), fill=c3)
    elif kind == "turtle":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.35, cx + unit * 0.55, cy + unit * 0.45), fill=c2)
        draw.ellipse((cx - unit * 0.25, cy - unit * 0.65, cx + unit * 0.25, cy - unit * 0.15), fill=c1)
        for dx, dy in ((-0.55, 0.35), (0.55, 0.35), (-0.75, -0.05), (0.75, -0.05)):
            draw.ellipse((cx + dx * unit - unit * 0.12, cy + dy * unit - unit * 0.12, cx + dx * unit + unit * 0.12, cy + dy * unit + unit * 0.12), fill=c3)
    elif kind == "owl":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.45, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.15, cx - unit * 0.05, cy + unit * 0.15), fill=bg)
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.15, cx + unit * 0.35, cy + unit * 0.15), fill=bg)
        draw.polygon([(cx, cy + unit * 0.05), (cx - unit * 0.08, cy + unit * 0.18), (cx + unit * 0.08, cy + unit * 0.18)], fill=c3)
    elif kind == "fox":
        poly([(-0.55, 0.55), (0, -0.75), (0.55, 0.55)], c1)
        poly([(-0.25, 0.55), (0, -0.15), (0.25, 0.55)], c2)
        draw.ellipse((cx - unit * 0.08, cy + unit * 0.05, cx + unit * 0.08, cy + unit * 0.18), fill=bg)
    elif kind == "penguin":
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.55, cx + unit * 0.45, cy + unit * 0.75), fill=bg)
        draw.ellipse((cx - unit * 0.3, cy - unit * 0.35, cx + unit * 0.3, cy + unit * 0.55), fill=(30, 41, 59))
        draw.polygon([(cx, cy - unit * 0.05), (cx - unit * 0.08, cy + unit * 0.12), (cx + unit * 0.08, cy + unit * 0.12)], fill=c3)
    elif kind == "crab":
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.2, cx + unit * 0.35, cy + unit * 0.3), fill=c1)
        for dx in (-0.55, 0.55):
            draw.line((cx + dx * unit * 0.35, cy, cx + dx * unit * 0.95, cy - unit * 0.25), fill=c1, width=max(3, unit // 8))
            draw.line((cx + dx * unit * 0.35, cy + unit * 0.05, cx + dx * unit * 0.85, cy + unit * 0.35), fill=c1, width=max(3, unit // 8))
    elif kind == "octopus":
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.55, cx + unit * 0.45, cy + unit * 0.05), fill=c2)
        for i in range(6):
            angle = math.pi * 0.15 + i * math.pi / 5
            draw.line((cx, cy, cx + math.cos(angle) * unit * 0.85, cy + math.sin(angle) * unit * 0.85), fill=c1, width=max(3, unit // 8))
    elif kind == "whale":
        draw.ellipse((cx - unit * 0.85, cy - unit * 0.25, cx + unit * 0.55, cy + unit * 0.35), fill=c1)
        poly([(0.55, -0.05), (0.95, -0.35), (0.95, 0.25)], c2)
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.08, cx - unit * 0.25, cy + unit * 0.08), fill=bg)
    elif kind == "anchor":
        draw.line((cx, cy - unit * 0.85, cx, cy + unit * 0.75), fill=c2, width=max(3, unit // 10))
        draw.arc((cx - unit * 0.45, cy + unit * 0.05, cx + unit * 0.45, cy + unit * 0.85), 0, 180, fill=c2, width=max(3, unit // 10))
        draw.line((cx - unit * 0.45, cy - unit * 0.45, cx + unit * 0.45, cy - unit * 0.45), fill=c2, width=max(3, unit // 10))
    elif kind == "sailboat":
        draw.polygon([(cx, cy - unit * 0.85), (cx + unit * 0.05, cy + unit * 0.55), (cx - unit * 0.05, cy + unit * 0.55)], fill=c3)
        poly([(0, 0.55), (-0.55, 0.15), (0.55, 0.15)], c1)
        draw.rectangle((cx - unit * 0.95, cy + unit * 0.55, cx + unit * 0.95, cy + unit * 0.75), fill=c2)
    elif kind == "plane":
        draw.polygon([(cx - unit * 0.85, cy), (cx + unit * 0.85, cy), (cx, cy - unit * 0.15)], fill=c2)
        draw.polygon([(cx - unit * 0.05, cy - unit * 0.05), (cx + unit * 0.35, cy - unit * 0.45), (cx + unit * 0.05, cy - unit * 0.05)], fill=c1)
        draw.polygon([(cx - unit * 0.05, cy + unit * 0.05), (cx + unit * 0.35, cy + unit * 0.45), (cx + unit * 0.05, cy + unit * 0.05)], fill=c1)
    elif kind == "balloon":
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.85, cx + unit * 0.35, cy - unit * 0.05), fill=c1)
        draw.line((cx, cy - unit * 0.05, cx, cy + unit * 0.75), fill=c3, width=max(2, unit // 12))
        draw.rectangle((cx - unit * 0.12, cy + unit * 0.75, cx + unit * 0.12, cy + unit * 0.9), fill=c2)
    elif kind == "gift":
        draw.rectangle((cx - unit * 0.45, cy - unit * 0.05, cx + unit * 0.45, cy + unit * 0.75), fill=c1)
        draw.rectangle((cx - unit * 0.55, cy - unit * 0.35, cx + unit * 0.55, cy + unit * 0.05), fill=c2)
        draw.rectangle((cx - unit * 0.08, cy - unit * 0.35, cx + unit * 0.08, cy + unit * 0.75), fill=c3)
    elif kind == "bell":
        poly([(-0.45, -0.15), (0.45, -0.15), (0.25, 0.55), (-0.25, 0.55)], c2)
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.45, cx + unit * 0.55, cy + unit * 0.05), fill=c1)
        draw.ellipse((cx - unit * 0.08, cy + unit * 0.55, cx + unit * 0.08, cy + unit * 0.68), fill=c3)
    elif kind == "music":
        draw.ellipse((cx - unit * 0.55, cy + unit * 0.15, cx - unit * 0.15, cy + unit * 0.55), fill=c1)
        draw.ellipse((cx + unit * 0.15, cy - unit * 0.05, cx + unit * 0.55, cy + unit * 0.35), fill=c2)
        draw.line((cx - unit * 0.15, cy + unit * 0.25, cx - unit * 0.15, cy - unit * 0.65), fill=c3, width=max(3, unit // 10))
        draw.line((cx - unit * 0.15, cy - unit * 0.65, cx + unit * 0.55, cy - unit * 0.35), fill=c3, width=max(3, unit // 10))
    elif kind == "gamepad":
        draw.rounded_rectangle((cx - unit * 0.75, cy - unit * 0.25, cx + unit * 0.75, cy + unit * 0.45), radius=unit // 5, fill=c1)
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.05, cx - unit * 0.15, cy + unit * 0.25), fill=bg)
        draw.ellipse((cx + unit * 0.35, cy - unit * 0.05, cx + unit * 0.55, cy + unit * 0.15), fill=c2)
        draw.ellipse((cx + unit * 0.25, cy + unit * 0.05, cx + unit * 0.45, cy + unit * 0.25), fill=c2)
    elif kind == "puzzle":
        draw.rectangle((cx - unit * 0.55, cy - unit * 0.55, cx, cy), fill=c1)
        draw.rectangle((cx, cy - unit * 0.55, cx + unit * 0.55, cy), fill=c2)
        draw.rectangle((cx - unit * 0.55, cy, cx, cy + unit * 0.55), fill=c3)
        draw.rectangle((cx, cy, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
    elif kind == "target":
        for radius, color in ((0.85, c1), (0.6, c3), (0.35, c2), (0.12, c1)):
            draw.ellipse((cx - unit * radius, cy - unit * radius, cx + unit * radius, cy + unit * radius), fill=color)
    elif kind == "dice":
        draw.rounded_rectangle((cx - unit * 0.55, cy - unit * 0.55, cx + unit * 0.55, cy + unit * 0.55), radius=unit // 6, fill=c3)
        for dx, dy in ((-0.2, -0.2), (0.2, 0.2), (-0.2, 0.2), (0.2, -0.2), (0, 0)):
            draw.ellipse((cx + dx * unit - unit * 0.07, cy + dy * unit - unit * 0.07, cx + dx * unit + unit * 0.07, cy + dy * unit + unit * 0.07), fill=bg)
    elif kind == "clover":
        for dx, dy in ((-0.22, -0.22), (0.22, -0.22), (-0.22, 0.22), (0.22, 0.22)):
            draw.ellipse((cx + dx * unit - unit * 0.22, cy + dy * unit - unit * 0.22, cx + dx * unit + unit * 0.22, cy + dy * unit + unit * 0.22), fill=c2)
        draw.line((cx, cy, cx, cy + unit * 0.75), fill=c1, width=max(3, unit // 10))
    elif kind == "snowflake":
        for angle in np.linspace(0, 2 * math.pi, 7, endpoint=False):
            draw.line((cx, cy, cx + math.cos(angle) * unit * 0.85, cy + math.sin(angle) * unit * 0.85), fill=c3, width=max(2, unit // 12))
    elif kind == "campfire":
        poly([(0, 0.75), (-0.25, 0.15), (0.25, 0.15)], (120, 72, 35))
        poly([(0, 0.15), (-0.35, 0.75), (0.35, 0.75)], c1)
        poly([(0, -0.05), (-0.18, 0.55), (0.18, 0.55)], c3)
        poly([(0, -0.35), (-0.12, 0.25), (0.12, 0.25)], c2)
    elif kind == "lamp_post":
        draw.rectangle((cx - unit * 0.08, cy - unit * 0.85, cx + unit * 0.08, cy + unit * 0.85), fill=c3)
        draw.rectangle((cx - unit * 0.35, cy - unit * 0.95, cx + unit * 0.35, cy - unit * 0.75), fill=c2)
        draw.ellipse((cx - unit * 0.25, cy - unit * 1.05, cx + unit * 0.25, cy - unit * 0.55), fill=c1)
    elif kind == "orange_fruit":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.35, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
        draw.line((cx, cy - unit * 0.35, cx, cy - unit * 0.65), fill=c3, width=max(2, unit // 12))
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.72, cx + unit * 0.35, cy - unit * 0.42), fill=c2)
    elif kind == "apple":
        draw.ellipse((cx - unit * 0.5, cy - unit * 0.35, cx + unit * 0.5, cy + unit * 0.55), fill=c1)
        poly([(0, -0.35), (-0.08, -0.75), (0.08, -0.75)], c3)
        draw.ellipse((cx + unit * 0.05, cy - unit * 0.75, cx + unit * 0.35, cy - unit * 0.45), fill=c2)
    elif kind == "banana":
        draw.arc((cx - unit * 0.75, cy - unit * 0.55, cx + unit * 0.75, cy + unit * 0.55), 30, 210, fill=c1, width=max(6, unit // 5))
        draw.arc((cx - unit * 0.55, cy - unit * 0.35, cx + unit * 0.55, cy + unit * 0.35), 35, 205, fill=c2, width=max(3, unit // 8))
    elif kind == "carrot":
        poly([(0, -0.75), (-0.25, 0.75), (0.25, 0.75)], c1)
        for dx in (-0.12, 0.0, 0.12):
            draw.line((cx + dx * unit, cy - unit * 0.75, cx + dx * unit * 1.5, cy - unit * 0.95), fill=c2, width=max(2, unit // 12))
    elif kind == "bread":
        draw.ellipse((cx - unit * 0.85, cy - unit * 0.25, cx + unit * 0.85, cy + unit * 0.25), fill=c1)
        for i in range(-3, 4):
            draw.line((cx + i * unit * 0.18, cy - unit * 0.22, cx + i * unit * 0.18, cy + unit * 0.22), fill=c2, width=max(1, unit // 16))
    elif kind == "umbrella":
        draw.arc((cx - unit * 0.75, cy - unit * 0.55, cx + unit * 0.75, cy + unit * 0.35), 180, 360, fill=c1, width=max(4, unit // 6))
        draw.line((cx, cy - unit * 0.15, cx, cy + unit * 0.85), fill=c3, width=max(2, unit // 12))
        draw.line((cx - unit * 0.75, cy - unit * 0.15, cx + unit * 0.75, cy - unit * 0.15), fill=c2, width=max(2, unit // 14))
    elif kind == "clock":
        draw.ellipse((cx - unit * 0.65, cy - unit * 0.65, cx + unit * 0.65, cy + unit * 0.65), fill=c3)
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.55, cx + unit * 0.55, cy + unit * 0.55), fill=c1)
        draw.line((cx, cy, cx, cy - unit * 0.35), fill=bg, width=max(2, unit // 10))
        draw.line((cx, cy, cx + unit * 0.25, cy + unit * 0.05), fill=bg, width=max(2, unit // 10))
    elif kind == "key":
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.55, cx + unit * 0.05, cy - unit * 0.05), outline=c1, width=max(3, unit // 8))
        draw.rectangle((cx - unit * 0.05, cy - unit * 0.25, cx + unit * 0.65, cy - unit * 0.05), fill=c1)
        draw.rectangle((cx + unit * 0.45, cy - unit * 0.05, cx + unit * 0.65, cy + unit * 0.05), fill=c1)
        draw.rectangle((cx + unit * 0.55, cy + unit * 0.05, cx + unit * 0.65, cy + unit * 0.15), fill=c1)
    elif kind == "scissors":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.45, cx - unit * 0.15, cy - unit * 0.05), outline=c1, width=max(3, unit // 8))
        draw.ellipse((cx + unit * 0.15, cy - unit * 0.45, cx + unit * 0.55, cy - unit * 0.05), outline=c1, width=max(3, unit // 8))
        draw.line((cx - unit * 0.15, cy - unit * 0.05, cx + unit * 0.55, cy + unit * 0.75), fill=c2, width=max(3, unit // 10))
        draw.line((cx + unit * 0.15, cy - unit * 0.05, cx - unit * 0.55, cy + unit * 0.75), fill=c2, width=max(3, unit // 10))
    elif kind == "pencil":
        draw.polygon([(cx - unit * 0.12, cy - unit * 0.75), (cx + unit * 0.12, cy - unit * 0.75), (cx + unit * 0.12, cy + unit * 0.45), (cx - unit * 0.12, cy + unit * 0.45)], fill=c1)
        poly([(0, 0.45), (-0.12, 0.75), (0.12, 0.75)], c3)
        draw.rectangle((cx - unit * 0.12, cy - unit * 0.85, cx + unit * 0.12, cy - unit * 0.75), fill=c2)
    elif kind == "lightbulb":
        draw.ellipse((cx - unit * 0.35, cy - unit * 0.65, cx + unit * 0.35, cy + unit * 0.15), fill=c3)
        draw.rectangle((cx - unit * 0.18, cy + unit * 0.15, cx + unit * 0.18, cy + unit * 0.45), fill=c2)
        draw.rectangle((cx - unit * 0.25, cy + unit * 0.45, cx + unit * 0.25, cy + unit * 0.55), fill=c1)
    elif kind == "chair":
        draw.rectangle((cx - unit * 0.45, cy - unit * 0.05, cx + unit * 0.45, cy + unit * 0.15), fill=c1)
        draw.rectangle((cx - unit * 0.45, cy - unit * 0.65, cx - unit * 0.25, cy - unit * 0.05), fill=c2)
        draw.rectangle((cx - unit * 0.12, cy + unit * 0.15, cx - unit * 0.04, cy + unit * 0.75), fill=c3)
        draw.rectangle((cx + unit * 0.04, cy + unit * 0.15, cx + unit * 0.12, cy + unit * 0.75), fill=c3)
        draw.rectangle((cx + unit * 0.25, cy + unit * 0.15, cx + unit * 0.45, cy + unit * 0.75), fill=c3)
    elif kind == "bicycle":
        draw.ellipse((cx - unit * 0.75, cy + unit * 0.05, cx - unit * 0.25, cy + unit * 0.55), outline=c1, width=max(3, unit // 8))
        draw.ellipse((cx + unit * 0.25, cy + unit * 0.05, cx + unit * 0.75, cy + unit * 0.55), outline=c1, width=max(3, unit // 8))
        draw.line((cx - unit * 0.5, cy + unit * 0.3, cx, cy - unit * 0.25), fill=c2, width=max(3, unit // 10))
        draw.line((cx, cy - unit * 0.25, cx + unit * 0.5, cy + unit * 0.3), fill=c2, width=max(3, unit // 10))
        draw.line((cx - unit * 0.15, cy - unit * 0.45, cx + unit * 0.15, cy - unit * 0.45), fill=c3, width=max(2, unit // 12))
    elif kind == "car":
        draw.rounded_rectangle((cx - unit * 0.75, cy - unit * 0.05, cx + unit * 0.75, cy + unit * 0.35), radius=unit // 8, fill=c1)
        poly([(-0.35, -0.05), (0, -0.45), (0.35, -0.05)], c2)
        draw.ellipse((cx - unit * 0.55, cy + unit * 0.25, cx - unit * 0.25, cy + unit * 0.55), fill=bg)
        draw.ellipse((cx + unit * 0.25, cy + unit * 0.25, cx + unit * 0.55, cy + unit * 0.55), fill=bg)
    elif kind == "phone":
        draw.rounded_rectangle((cx - unit * 0.35, cy - unit * 0.75, cx + unit * 0.35, cy + unit * 0.75), radius=unit // 6, fill=c1)
        draw.rounded_rectangle((cx - unit * 0.25, cy - unit * 0.55, cx + unit * 0.25, cy + unit * 0.45), radius=unit // 10, fill=c2)
        draw.ellipse((cx - unit * 0.06, cy + unit * 0.55, cx + unit * 0.06, cy + unit * 0.67), fill=c3)
    elif kind == "watch":
        draw.rounded_rectangle((cx - unit * 0.85, cy - unit * 0.15, cx - unit * 0.55, cy + unit * 0.15), radius=unit // 10, fill=c2)
        draw.rounded_rectangle((cx + unit * 0.55, cy - unit * 0.15, cx + unit * 0.85, cy + unit * 0.15), radius=unit // 10, fill=c2)
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.45, cx + unit * 0.45, cy + unit * 0.45), fill=c1)
        draw.line((cx, cy, cx, cy - unit * 0.2), fill=bg, width=max(2, unit // 12))
        draw.line((cx, cy, cx + unit * 0.18, cy + unit * 0.05), fill=bg, width=max(2, unit // 12))
    elif kind == "hat":
        draw.ellipse((cx - unit * 0.75, cy + unit * 0.05, cx + unit * 0.75, cy + unit * 0.25), fill=c2)
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.55, cx + unit * 0.45, cy + unit * 0.15), fill=c1)
        draw.rectangle((cx - unit * 0.45, cy + unit * 0.05, cx + unit * 0.45, cy + unit * 0.15), fill=c1)
    elif kind == "shoe":
        draw.ellipse((cx - unit * 0.65, cy - unit * 0.15, cx + unit * 0.45, cy + unit * 0.35), fill=c1)
        draw.rounded_rectangle((cx - unit * 0.15, cy - unit * 0.45, cx + unit * 0.35, cy - unit * 0.05), radius=unit // 8, fill=c2)
    elif kind == "glasses":
        draw.ellipse((cx - unit * 0.75, cy - unit * 0.25, cx - unit * 0.15, cy + unit * 0.35), outline=c1, width=max(3, unit // 8))
        draw.ellipse((cx + unit * 0.15, cy - unit * 0.25, cx + unit * 0.75, cy + unit * 0.35), outline=c1, width=max(3, unit // 8))
        draw.line((cx - unit * 0.15, cy + unit * 0.05, cx + unit * 0.15, cy + unit * 0.05), fill=c1, width=max(2, unit // 12))
        draw.line((cx - unit * 0.75, cy + unit * 0.05, cx - unit * 0.95, cy + unit * 0.05), fill=c1, width=max(2, unit // 12))
        draw.line((cx + unit * 0.75, cy + unit * 0.05, cx + unit * 0.95, cy + unit * 0.05), fill=c1, width=max(2, unit // 12))
    elif kind == "bottle":
        draw.rectangle((cx - unit * 0.35, cy - unit * 0.15, cx + unit * 0.35, cy + unit * 0.75), fill=c1)
        draw.rectangle((cx - unit * 0.12, cy - unit * 0.55, cx + unit * 0.12, cy - unit * 0.15), fill=c2)
        draw.ellipse((cx - unit * 0.12, cy - unit * 0.65, cx + unit * 0.12, cy - unit * 0.45), fill=c3)
    elif kind == "teapot":
        draw.ellipse((cx - unit * 0.45, cy - unit * 0.15, cx + unit * 0.45, cy + unit * 0.45), fill=c1)
        draw.arc((cx - unit * 0.25, cy - unit * 0.55, cx + unit * 0.25, cy - unit * 0.05), 180, 360, fill=c2, width=max(3, unit // 8))
        draw.line((cx + unit * 0.45, cy + unit * 0.05, cx + unit * 0.85, cy - unit * 0.05), fill=c2, width=max(3, unit // 10))
        draw.arc((cx - unit * 0.75, cy - unit * 0.05, cx - unit * 0.35, cy + unit * 0.35), 90, 270, fill=c3, width=max(3, unit // 10))
    elif kind == "fork":
        draw.rectangle((cx - unit * 0.08, cy - unit * 0.15, cx + unit * 0.08, cy + unit * 0.85), fill=c3)
        for dx in (-0.18, 0.0, 0.18):
            draw.rectangle((cx + dx * unit - unit * 0.04, cy - unit * 0.75, cx + dx * unit + unit * 0.04, cy - unit * 0.15), fill=c1)
    elif kind == "plate":
        draw.ellipse((cx - unit * 0.75, cy - unit * 0.25, cx + unit * 0.75, cy + unit * 0.55), fill=c1)
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.05, cx + unit * 0.55, cy + unit * 0.35), fill=c2)
    elif kind == "toaster":
        draw.rounded_rectangle((cx - unit * 0.65, cy - unit * 0.25, cx + unit * 0.65, cy + unit * 0.45), radius=unit // 8, fill=c1)
        for dx in (-0.25, 0.0, 0.25):
            draw.rectangle((cx + dx * unit - unit * 0.08, cy - unit * 0.45, cx + dx * unit + unit * 0.08, cy - unit * 0.25), fill=bg)
        draw.rectangle((cx - unit * 0.55, cy + unit * 0.25, cx + unit * 0.55, cy + unit * 0.45), fill=c2)
    elif kind == "hammer":
        draw.rectangle((cx - unit * 0.08, cy - unit * 0.15, cx + unit * 0.08, cy + unit * 0.85), fill=c3)
        draw.rectangle((cx - unit * 0.45, cy - unit * 0.55, cx + unit * 0.45, cy - unit * 0.15), fill=c1)
    elif kind == "envelope":
        draw.rectangle((cx - unit * 0.75, cy - unit * 0.25, cx + unit * 0.75, cy + unit * 0.55), fill=c1)
        poly([(-0.75, -0.25), (0, 0.15), (0.75, -0.25)], c2)
        draw.line((cx - unit * 0.75, cy - unit * 0.25, cx, cy + unit * 0.15), fill=c3, width=max(2, unit // 14))
        draw.line((cx + unit * 0.75, cy - unit * 0.25, cx, cy + unit * 0.15), fill=c3, width=max(2, unit // 14))
    elif kind == "camera":
        draw.rounded_rectangle((cx - unit * 0.65, cy - unit * 0.25, cx + unit * 0.65, cy + unit * 0.45), radius=unit // 8, fill=c1)
        draw.ellipse((cx - unit * 0.25, cy - unit * 0.05, cx + unit * 0.25, cy + unit * 0.25), fill=bg)
        draw.ellipse((cx - unit * 0.15, cy + unit * 0.05, cx + unit * 0.15, cy + unit * 0.35), outline=c2, width=max(2, unit // 10))
        draw.rectangle((cx - unit * 0.15, cy - unit * 0.45, cx + unit * 0.15, cy - unit * 0.25), fill=c3)
    elif kind == "toothbrush":
        draw.rectangle((cx - unit * 0.08, cy - unit * 0.45, cx + unit * 0.08, cy + unit * 0.75), fill=c2)
        draw.rectangle((cx - unit * 0.18, cy - unit * 0.75, cx + unit * 0.18, cy - unit * 0.45), fill=c1)
        for i in range(5):
            draw.line((cx - unit * 0.15 + i * unit * 0.07, cy - unit * 0.75, cx - unit * 0.15 + i * unit * 0.07, cy - unit * 0.85), fill=c3, width=max(1, unit // 16))
    elif kind == "watermelon":
        draw.ellipse((cx - unit * 0.65, cy - unit * 0.45, cx + unit * 0.65, cy + unit * 0.55), fill=c1)
        for i in range(-2, 3):
            draw.arc((cx - unit * 0.55 + i * unit * 0.15, cy - unit * 0.35, cx + unit * 0.55 + i * unit * 0.15, cy + unit * 0.45), 0, 180, fill=c2, width=max(2, unit // 12))
        draw.ellipse((cx - unit * 0.08, cy - unit * 0.55, cx + unit * 0.08, cy - unit * 0.39), fill=c3)
    elif kind == "goldfish":
        draw.ellipse((cx - unit * 0.55, cy - unit * 0.25, cx + unit * 0.35, cy + unit * 0.35), fill=c1)
        poly([(0.35, 0.05), (0.85, -0.25), (0.85, 0.35)], c2)
        draw.ellipse((cx - unit * 0.25, cy - unit * 0.05, cx - unit * 0.05, cy + unit * 0.15), fill=bg)
        draw.polygon([(cx + unit * 0.55, cy - unit * 0.15), (cx + unit * 0.75, cy - unit * 0.35), (cx + unit * 0.65, cy - unit * 0.05)], fill=c2)
    else:
        draw.rectangle((cx - unit, cy - unit, cx + unit, cy + unit), fill=c1)
        draw.ellipse((cx - unit * 0.5, cy - unit * 0.5, cx + unit * 0.5, cy + unit * 0.5), fill=c2)

    # Add slight noise for richer quantization
    arr = np.array(img, dtype=np.int16)
    arr += np.random.default_rng(seed).integers(-8, 10, arr.shape)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)



PATTERN_KINDS: list[str] = [
    'heart', 'star', 'sun', 'moon', 'flower', 'tree', 'house', 'fish', 'cat', 'mushroom',
    'diamond', 'smiley', 'arrow', 'spiral', 'waves', 'mountain', 'cloud', 'bolt', 'crown',
    'butterfly', 'cherry', 'lemon', 'icecream', 'cupcake', 'rocket', 'planet', 'ring_planet',
    'cactus', 'snake', 'turtle', 'owl', 'fox', 'penguin', 'crab', 'octopus', 'whale', 'anchor',
    'sailboat', 'plane', 'balloon', 'gift', 'bell', 'music', 'gamepad', 'puzzle', 'target',
    'dice', 'clover', 'snowflake', 'campfire',
    'lamp_post', 'orange_fruit', 'apple', 'banana', 'carrot', 'bread', 'umbrella', 'clock',
    'key', 'scissors', 'pencil', 'lightbulb', 'chair', 'bicycle', 'car', 'phone', 'watch',
    'hat', 'shoe', 'glasses', 'bottle', 'teapot', 'fork', 'plate', 'toaster', 'hammer',
    'envelope', 'camera', 'toothbrush', 'watermelon', 'goldfish',
]


def list_patterns() -> list[str]:
    """Return all registered pattern identifiers."""
    return sorted(PATTERN_KINDS)


def draw_pattern(
    kind: str,
    seed: int,
    width: int,
    height: int,
    *,
    unit_factor: float = DEFAULT_UNIT_FACTOR,
) -> Image.Image:
    if kind not in PATTERN_KINDS:
        known = ", ".join(PATTERN_KINDS[:8])
        raise ValueError(f"Motif inconnu: {kind!r}. Exemples: {known}…")

    return _draw_pattern(kind, seed, width, height, unit_factor=unit_factor)
