"""Shared data models for level generation."""

from __future__ import annotations

from dataclasses import dataclass

MAX_DOMINANT_COLOR_RATIO = 0.5
MAX_START_CORRECT_PERCENT = 20


class DominantColorError(ValueError):
    """Raised when one quantized color occupies too much of the grid."""

    def __init__(
        self,
        ratio: float,
        *,
        max_ratio: float = MAX_DOMINANT_COLOR_RATIO,
        color_index: int | None = None,
    ) -> None:
        self.ratio = ratio
        self.max_ratio = max_ratio
        self.color_index = color_index
        pct = ratio * 100
        limit = max_ratio * 100
        detail = f" (index {color_index})" if color_index is not None else ""
        super().__init__(
            f"Couleur dominante{detail}: {pct:.1f}% de la grille (> {limit:.0f}% max)."
        )


class ShuffleDifficultyError(ValueError):
    """Raised when the shuffled start state has too many gems already correct."""

    def __init__(
        self,
        percent: float,
        *,
        max_percent: float = MAX_START_CORRECT_PERCENT,
    ) -> None:
        self.percent = percent
        self.max_percent = max_percent
        super().__init__(
            f"Trop de gemmes déjà bien placées au départ: {percent:.1f}% "
            f"(> {max_percent:.0f}% max)."
        )


@dataclass
class LevelData:
    id: int
    name: str
    rows: int
    columns: int
    difficulty: str
    category: str
    palette: list[dict]
    target_grid: list[list[str]]
