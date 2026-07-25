"""Perceptual color distance helpers for palette validation."""

from __future__ import annotations

import math
import re
from typing import Iterable

# CIE76 ΔE in LAB — below ~12 pairs look too similar on a phone screen.
MIN_PALETTE_DELTA_E = 15.0


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    normalized = hex_color.strip().lstrip("#")
    if len(normalized) != 6:
        raise ValueError(f"Invalid hex color: {hex_color}")
    return (
        int(normalized[0:2], 16),
        int(normalized[2:4], 16),
        int(normalized[4:6], 16),
    )


def _srgb_to_linear(channel: float) -> float:
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4


def rgb_to_lab(red: int, green: int, blue: int) -> tuple[float, float, float]:
    red_l = _srgb_to_linear(red / 255.0)
    green_l = _srgb_to_linear(green / 255.0)
    blue_l = _srgb_to_linear(blue / 255.0)

    x = red_l * 0.4124564 + green_l * 0.3575761 + blue_l * 0.1804375
    y = red_l * 0.2126729 + green_l * 0.7151522 + blue_l * 0.0721750
    z = red_l * 0.0193339 + green_l * 0.1191920 + blue_l * 0.9503041

    x /= 0.95047
    y /= 1.0
    z /= 1.08883

    def f(value: float) -> float:
        return value ** (1 / 3) if value > 0.008856 else (7.787 * value) + (16 / 116)

    fx, fy, fz = f(x), f(y), f(z)
    lightness = (116 * fy) - 16
    a = 500 * (fx - fy)
    b = 200 * (fy - fz)
    return lightness, a, b


def delta_e_cie76(
    first: tuple[float, float, float],
    second: tuple[float, float, float],
) -> float:
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(first, second)))


def min_palette_delta_e(hex_colors: Iterable[str]) -> tuple[float, tuple[str, str] | None]:
    colors = list(hex_colors)
    if len(colors) < 2:
        return float("inf"), None

    labs = [rgb_to_lab(*_hex_to_rgb(color)) for color in colors]
    minimum = float("inf")
    closest: tuple[str, str] | None = None

    for left in range(len(colors)):
        for right in range(left + 1, len(colors)):
            distance = delta_e_cie76(labs[left], labs[right])
            if distance < minimum:
                minimum = distance
                closest = (colors[left], colors[right])

    return minimum, closest


def validate_palette_separation(
    palette: list[dict],
    min_delta_e: float = MIN_PALETTE_DELTA_E,
) -> float:
    hex_colors = [entry["hex"] for entry in palette]
    minimum, closest = min_palette_delta_e(hex_colors)
    if minimum < min_delta_e:
        pair = closest or ("?", "?")
        raise PaletteContrastError(minimum, pair[0], pair[1], min_delta_e=min_delta_e)
    return minimum


class PaletteContrastError(ValueError):
    """Raised when two gem colors are too similar for comfortable play."""

    def __init__(
        self,
        delta_e: float,
        first_hex: str,
        second_hex: str,
        *,
        min_delta_e: float = MIN_PALETTE_DELTA_E,
    ) -> None:
        self.delta_e = delta_e
        self.first_hex = first_hex
        self.second_hex = second_hex
        self.min_delta_e = min_delta_e
        super().__init__(
            f"Couleurs trop proches {first_hex} / {second_hex}: "
            f"ΔE={delta_e:.1f} (< {min_delta_e:.1f} min)."
        )
