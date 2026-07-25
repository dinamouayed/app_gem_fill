#!/usr/bin/env python3
"""Generate many procedural levels for Gem Fill."""

from __future__ import annotations

import argparse
import math
import random
import re
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

from color_distance import PaletteContrastError
from generate_level import (
    DominantColorError,
    ShuffleDifficultyError,
    export_level_typescript,
    generate_level_from_image,
    register_level_in_index,
)

REPO_ROOT = Path(__file__).resolve().parents[2]
GENERATED_DIR = REPO_ROOT / "assets/source/generated"
DEFAULT_UNIT_FACTOR = 0.62
MAX_GENERATION_ATTEMPTS = 150
# Themes from index 32 onward match the style the user preferred (levels 42+).
PREFERRED_THEME_OFFSET = 32

THEMES: list[tuple[str, str]] = [
    ("Cœur Rubis", "heart"),
    ("Étoile d'Or", "star"),
    ("Soleil Levant", "sun"),
    ("Lune Argent", "moon"),
    ("Fleur Rose", "flower"),
    ("Arbre Vert", "tree"),
    ("Maison Bleue", "house"),
    ("Poisson Ciel", "fish"),
    ("Chat Mignon", "cat"),
    ("Champignon", "mushroom"),
    ("Diamant", "diamond"),
    ("Smiley", "smiley"),
    ("Flèche", "arrow"),
    ("Spirale", "spiral"),
    ("Vague Océan", "waves"),
    ("Montagne", "mountain"),
    ("Nuage", "cloud"),
    ("Éclair", "bolt"),
    ("Couronne", "crown"),
    ("Papillon", "butterfly"),
    ("Cerise", "cherry"),
    ("Citron", "lemon"),
    ("Glace", "icecream"),
    ("Cupcake", "cupcake"),
    ("Rocket", "rocket"),
    ("Planète", "planet"),
    ("Saturne", "ring_planet"),
    ("Cactus", "cactus"),
    ("Snake", "snake"),
    ("Tortue", "turtle"),
    ("Hibou", "owl"),
    ("Renard", "fox"),
    ("Pingouin", "penguin"),
    ("Crabe", "crab"),
    ("Pieuvre", "octopus"),
    ("Baleine", "whale"),
    ("Ancre", "anchor"),
    ("Voile", "sailboat"),
    ("Avion", "plane"),
    ("Ballon", "balloon"),
    ("Cadeau", "gift"),
    ("Cloche", "bell"),
    ("Note Musique", "music"),
    ("Manette", "gamepad"),
    ("Puzzle", "puzzle"),
    ("Cible", "target"),
    ("Dé", "dice"),
    ("Trèfle", "clover"),
    ("Flocon", "snowflake"),
    ("Feu de Camp", "campfire"),
]


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
    else:
        draw.rectangle((cx - unit, cy - unit, cx + unit, cy + unit), fill=c1)
        draw.ellipse((cx - unit * 0.5, cy - unit * 0.5, cx + unit * 0.5, cy + unit * 0.5), fill=c2)

    # Add slight noise for richer quantization
    arr = np.array(img, dtype=np.int16)
    arr += np.random.default_rng(seed).integers(-8, 10, arr.shape)
    arr = np.clip(arr, 0, 255).astype(np.uint8)
    return Image.fromarray(arr)


def next_available_level_id(levels_dir: Path) -> int:
    existing = [
        int(match.group(1))
        for file in levels_dir.glob("level*.ts")
        if (match := __import__("re").match(r"level(\d+)\.ts", file.name))
    ]
    return max(existing, default=0) + 1


def read_existing_level_name(level_id: int, levels_dir: Path) -> str | None:
    level_file = levels_dir / f"level{level_id}.ts"
    if not level_file.exists():
        return None
    match = re.search(r'"name":\s*"([^"]+)"', level_file.read_text(encoding="utf-8"))
    return match.group(1) if match else None


def generate_balanced_level(
    image_path: Path,
    *,
    level_id: int,
    name: str,
    kind: str,
    base_seed: int,
    colors: int,
    grid_size: int = 14,
):
    """Try several seeds / scales until color balance and shuffle difficulty pass."""
    from collections import Counter

    last_ratio = 1.0
    last_shuffle = 100.0
    last_delta_e = 0.0

    for attempt in range(MAX_GENERATION_ATTEMPTS):
        attempt_seed = base_seed + attempt * 131
        unit_factor = min(0.88, DEFAULT_UNIT_FACTOR + (attempt // 15) * 0.05)
        color_count = max(4, min(7, colors + (attempt % 3) - 1))

        image = _draw_pattern(
            kind,
            attempt_seed,
            512,
            512,
            unit_factor=unit_factor,
        )
        image.save(image_path)

        try:
            level = generate_level_from_image(
                image_path,
                level_id=level_id,
                name=name,
                color_count=color_count,
                max_colors=color_count,
                rows=grid_size,
                cols=grid_size,
                category="Généré",
                crop=False,
                trim_edges=False,
            )
            counts = Counter(cell for row in level.target_grid for cell in row)
            ratio = max(counts.values()) / sum(counts.values())
            from shuffle_grid import get_initial_correct_percent

            shuffle_pct = get_initial_correct_percent(level.target_grid, level_id)
            from color_distance import min_palette_delta_e

            delta_e, _ = min_palette_delta_e(color["hex"] for color in level.palette)
            return level, attempt_seed, ratio, shuffle_pct, delta_e
        except DominantColorError as exc:
            last_ratio = exc.ratio
            continue
        except ShuffleDifficultyError as exc:
            last_shuffle = exc.percent
            continue
        except PaletteContrastError as exc:
            last_delta_e = exc.delta_e
            continue

    raise RuntimeError(
        f"Impossible de générer {name} (niveau {level_id}, motif {kind}) — "
        f"meilleur essai: couleur max {last_ratio * 100:.1f}%, "
        f"départ correct {last_shuffle:.1f}%, ΔE min {last_delta_e:.1f}."
    )


def generate_batch(
    count: int,
    start_id: int | None = None,
    *,
    regenerate: bool = False,
) -> list[int]:
    levels_dir = REPO_ROOT / "src/data/levels"
    index_path = levels_dir / "index.ts"
    GENERATED_DIR.mkdir(parents=True, exist_ok=True)

    first_id = start_id or next_available_level_id(levels_dir)
    created_ids: list[int] = []

    for offset in range(count):
        level_id = first_id + offset
        theme_index = (PREFERRED_THEME_OFFSET + offset) % len(THEMES)
        existing_name = read_existing_level_name(level_id, levels_dir) if regenerate else None

        seed = level_id * 997 + offset
        rng = random.Random(seed)
        colors = rng.randint(4, 7)
        grid_size = 14
        image_path = GENERATED_DIR / f"level_{level_id:02d}.png"

        level = None
        dominant_ratio = 1.0
        shuffle_percent = 100.0
        min_delta_e = 0.0
        used_name = ""
        used_kind = ""

        for theme_shift in range(len(THEMES)):
            candidate_index = (theme_index + theme_shift) % len(THEMES)
            candidate_name, candidate_kind = THEMES[candidate_index]
            name = candidate_name
            if existing_name and theme_shift == 0:
                name = existing_name

            try:
                level, _, dominant_ratio, shuffle_percent, min_delta_e = generate_balanced_level(
                    image_path,
                    level_id=level_id,
                    name=name,
                    kind=candidate_kind,
                    base_seed=seed + theme_shift * 509,
                    colors=colors,
                    grid_size=grid_size,
                )
                used_name = name
                used_kind = candidate_kind
                break
            except RuntimeError:
                continue

        if level is None:
            raise RuntimeError(
                f"Aucun motif valide trouvé pour le niveau {level_id} "
                f"(couleur dominante > 50% ou départ > 20%)."
            )

        output_path = levels_dir / f"level{level_id}.ts"
        export_level_typescript(level, output_path)
        created_ids.append(level_id)
        print(
            f"✓ Niveau {level_id:02d} — {used_name} "
            f"({level.rows}x{level.columns}, {len(level.palette)} couleurs, "
            f"max couleur {dominant_ratio * 100:.1f}%, "
            f"départ {shuffle_percent:.1f}%, ΔE min {min_delta_e:.1f}, motif {used_kind})"
        )

    register_level_in_index(created_ids[-1], index_path, levels_dir)
    return created_ids


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Génère plusieurs niveaux procéduraux.")
    parser.add_argument("--count", type=int, default=50, help="Nombre de niveaux à générer")
    parser.add_argument("--start-id", type=int, default=None, help="ID de départ")
    parser.add_argument(
        "--regenerate",
        action="store_true",
        help="Regénère des niveaux existants en conservant leur nom",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    print("----------------------------------------------------")
    action = "Regénération" if args.regenerate else "Génération"
    print(f"💎 {action} de {args.count} niveaux procéduraux")
    print("----------------------------------------------------")
    created = generate_batch(args.count, args.start_id, regenerate=args.regenerate)
    print("----------------------------------------------------")
    print(f"✅ {len(created)} niveaux créés ({created[0]} → {created[-1]})")
    print(f"   Index mis à jour : src/data/levels/index.ts")
    print("----------------------------------------------------")
    return 0


if __name__ == "__main__":
    sys.exit(main())
