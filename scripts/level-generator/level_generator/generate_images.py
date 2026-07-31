"""Generate preview PNG images from procedural patterns (no level TS files)."""

from __future__ import annotations

import json
import re
from hashlib import md5
from pathlib import Path

from .config import DEFAULT_UNIT_FACTOR, GENERATED_IMAGES_DIR, LEVELS_DIR
from .export import list_level_ids
from .patterns import draw_pattern


def _slugify(value: str) -> str:
    slug = value.lower().strip()
    slug = slug.replace("é", "e").replace("è", "e").replace("ê", "e")
    slug = slug.replace("à", "a").replace("â", "a")
    slug = slug.replace("ù", "u").replace("û", "u")
    slug = slug.replace("ô", "o").replace("î", "i").replace("ç", "c")
    slug = re.sub(r"[^a-z0-9]+", "_", slug)
    return slug.strip("_")


def _seed_for(pattern: str, index: int) -> int:
    digest = md5(f"{pattern}:{index}".encode()).hexdigest()
    return int(digest[:8], 16)


def _next_image_index() -> int:
    ids = list_level_ids(LEVELS_DIR)
    max_level = ids[-1] if ids else 0

    max_from_files = 0
    if GENERATED_IMAGES_DIR.exists():
        for file in GENERATED_IMAGES_DIR.glob("level_*.png"):
            match = re.match(r"level_(\d+)_", file.name)
            if match:
                max_from_files = max(max_from_files, int(match.group(1)))

    return max(max_level, max_from_files) + 1


def generate_images_from_catalog(
    themes_path: Path | str,
    *,
    start_index: int | None = None,
    output_dir: Path | None = None,
    width: int = 512,
    height: int = 512,
) -> list[Path]:
    """Render PNG previews for each theme entry. Does not create level files."""
    path = Path(themes_path)
    payload = json.loads(path.read_text(encoding="utf-8"))
    raw_themes = payload.get("themes", payload)

    target_dir = output_dir or GENERATED_IMAGES_DIR
    target_dir.mkdir(parents=True, exist_ok=True)

    index = start_index or _next_image_index()
    created: list[Path] = []

    for entry in raw_themes:
        if isinstance(entry, str):
            name = entry.replace("_", " ").title()
            pattern = entry
            slug = _slugify(entry)
        else:
            name = entry["name"]
            pattern = entry["pattern"]
            slug = entry.get("slug") or _slugify(name)

        seed = _seed_for(pattern, index)
        image = draw_pattern(pattern, seed, width, height, unit_factor=DEFAULT_UNIT_FACTOR)
        output_path = target_dir / f"level_{index:02d}_{slug}.png"
        image.save(output_path)
        created.append(output_path)
        print(f"  #{index:02d} {name:20s} → {output_path.name}")
        index += 1

    return created
