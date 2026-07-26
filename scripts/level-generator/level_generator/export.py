"""Export TypeScript level files and sync the generated levels registry."""

from __future__ import annotations

import json
import re
from pathlib import Path

from level_generator.models import LevelData

from .config import LEVELS_DIR, LEVELS_GENERATED_FILE


def list_level_ids(levels_dir: Path | None = None) -> list[int]:
    directory = levels_dir or LEVELS_DIR
    ids: list[int] = []

    for file in directory.glob("level*.ts"):
        match = re.match(r"level(\d+)\.ts", file.name)
        if match:
            ids.append(int(match.group(1)))

    return sorted(ids)


def next_level_id(levels_dir: Path | None = None) -> int:
    ids = list_level_ids(levels_dir)
    return (ids[-1] if ids else 0) + 1


def export_level_typescript(level: LevelData, output_path: str | Path) -> Path:
    output = Path(output_path)
    output.parent.mkdir(parents=True, exist_ok=True)

    payload = {
        "id": level.id,
        "name": level.name,
        "rows": level.rows,
        "columns": level.columns,
        "difficulty": level.difficulty,
        "category": level.category,
        "palette": level.palette,
        "targetGrid": level.target_grid,
    }

    content = (
        "import { Level } from '../../types/level';\n\n"
        f"export const level{level.id}: Level = "
        f"{json.dumps(payload, indent=2, ensure_ascii=False)};\n"
    )
    output.write_text(content, encoding="utf-8")
    return output


def sync_levels_index(
    levels_dir: Path | None = None,
    generated_file: Path | None = None,
) -> Path:
    """Regenerate src/data/levels/levels.generated.ts from level*.ts files."""
    directory = levels_dir or LEVELS_DIR
    target = generated_file or LEVELS_GENERATED_FILE
    level_ids = list_level_ids(directory)

    imports = "\n".join(
        f"import {{ level{level_id} }} from './level{level_id}';"
        for level_id in level_ids
    )
    array_body = "\n".join(f"  level{level_id}," for level_id in level_ids)

    content = f"""// AUTO-GENERATED — do not edit manually.
// Run: npm run sync-levels-index

import {{ Level }} from '../../types/level';
{imports}

export const ALL_LEVELS: Level[] = [
{array_body}
];
"""

    target.write_text(content, encoding="utf-8")
    return target


def read_existing_level_name(level_id: int, levels_dir: Path | None = None) -> str | None:
    directory = levels_dir or LEVELS_DIR
    level_file = directory / f"level{level_id}.ts"
    if not level_file.exists():
        return None

    match = re.search(r'"name":\s*"([^"]+)"', level_file.read_text(encoding="utf-8"))
    return match.group(1) if match else None
