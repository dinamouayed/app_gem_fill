"""Procedural level generation pipeline."""

from __future__ import annotations

import random
from collections import Counter
from pathlib import Path

from color_distance import PaletteContrastError, min_palette_delta_e
from generate_level import generate_level_from_image
from level_generator.models import DominantColorError, ShuffleDifficultyError
from shuffle_grid import get_initial_correct_percent

from .config import (
    DEFAULT_GRID_SIZE,
    DEFAULT_UNIT_FACTOR,
    GENERATED_IMAGES_DIR,
    LEVELS_DIR,
    MAX_GENERATION_ATTEMPTS,
    PREFERRED_THEME_OFFSET,
)
from .export import export_level_typescript, read_existing_level_name, sync_levels_index
from .patterns import draw_pattern
from .themes import Theme, load_themes


def generate_balanced_level(
    image_path: Path,
    *,
    level_id: int,
    name: str,
    pattern: str,
    base_seed: int,
    colors: int,
    grid_size: int = DEFAULT_GRID_SIZE,
):
    """Try several seeds/scales until color balance and shuffle difficulty pass."""
    last_ratio = 1.0
    last_shuffle = 100.0
    last_delta_e = 0.0

    for attempt in range(MAX_GENERATION_ATTEMPTS):
        attempt_seed = base_seed + attempt * 131
        unit_factor = min(0.88, DEFAULT_UNIT_FACTOR + (attempt // 15) * 0.05)
        color_count = max(4, min(7, colors + (attempt % 3) - 1))

        image = draw_pattern(
            pattern,
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
            shuffle_pct = get_initial_correct_percent(level.target_grid, level_id)
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
        f"Impossible de générer {name} (niveau {level_id}, motif {pattern}) — "
        f"meilleur essai: couleur max {last_ratio * 100:.1f}%, "
        f"départ correct {last_shuffle:.1f}%, ΔE min {last_delta_e:.1f}."
    )


def generate_from_themes(
    themes: list[Theme],
    *,
    start_id: int | None = None,
    regenerate: bool = False,
) -> list[int]:
    GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    first_id = start_id or _next_level_id()
    created_ids: list[int] = []

    for offset, theme in enumerate(themes):
        level_id = first_id + offset
        existing_name = read_existing_level_name(level_id) if regenerate else None
        name = existing_name or theme.name

        seed = level_id * 997 + offset
        rng = random.Random(seed)
        colors = rng.randint(4, 7)
        image_path = GENERATED_IMAGES_DIR / f"level_{level_id:02d}_{theme.pattern}.png"

        level, _, dominant_ratio, shuffle_percent, min_delta_e = generate_balanced_level(
            image_path,
            level_id=level_id,
            name=name,
            pattern=theme.pattern,
            base_seed=seed,
            colors=colors,
            grid_size=DEFAULT_GRID_SIZE,
        )

        export_level_typescript(level, LEVELS_DIR / f"level{level_id}.ts")
        created_ids.append(level_id)
        print(
            f"✓ Niveau {level_id:02d} — {name} "
            f"({level.rows}x{level.columns}, {len(level.palette)} couleurs, "
            f"max couleur {dominant_ratio * 100:.1f}%, "
            f"départ {shuffle_percent:.1f}%, ΔE min {min_delta_e:.1f}, motif {theme.pattern})"
        )

    sync_levels_index()
    return created_ids


def generate_batch_from_catalog(
    count: int,
    *,
    themes_path: Path | str,
    start_id: int | None = None,
    regenerate: bool = False,
) -> list[int]:
    catalog = load_themes(themes_path)
    if not catalog:
        raise ValueError("Le catalogue de thèmes est vide.")

    GENERATED_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    first_id = start_id or _next_level_id()
    created_ids: list[int] = []

    for offset in range(count):
        level_id = first_id + offset
        theme_index = (PREFERRED_THEME_OFFSET + offset) % len(catalog)
        existing_name = read_existing_level_name(level_id) if regenerate else None

        seed = level_id * 997 + offset
        rng = random.Random(seed)
        colors = rng.randint(4, 7)
        image_path = GENERATED_IMAGES_DIR / f"level_{level_id:02d}.png"

        level = None
        dominant_ratio = 1.0
        shuffle_percent = 100.0
        min_delta_e = 0.0
        used_name = ""
        used_pattern = ""

        for theme_shift in range(len(catalog)):
            candidate = catalog[(theme_index + theme_shift) % len(catalog)]
            name = existing_name if existing_name and theme_shift == 0 else candidate.name

            try:
                level, _, dominant_ratio, shuffle_percent, min_delta_e = generate_balanced_level(
                    image_path,
                    level_id=level_id,
                    name=name,
                    pattern=candidate.pattern,
                    base_seed=seed + theme_shift * 509,
                    colors=colors,
                )
                used_name = name
                used_pattern = candidate.pattern
                break
            except RuntimeError:
                continue

        if level is None:
            raise RuntimeError(
                f"Aucun motif valide trouvé pour le niveau {level_id} "
                f"(couleur dominante > 50% ou départ > 20%)."
            )

        export_level_typescript(level, LEVELS_DIR / f"level{level_id}.ts")
        created_ids.append(level_id)
        print(
            f"✓ Niveau {level_id:02d} — {used_name} "
            f"({level.rows}x{level.columns}, {len(level.palette)} couleurs, "
            f"max couleur {dominant_ratio * 100:.1f}%, "
            f"départ {shuffle_percent:.1f}%, ΔE min {min_delta_e:.1f}, motif {used_pattern})"
        )

    sync_levels_index()
    return created_ids


def _next_level_id() -> int:
    from .export import next_level_id

    return next_level_id()
