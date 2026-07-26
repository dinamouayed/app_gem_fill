"""Load procedural level themes from JSON catalog files."""

from __future__ import annotations

import json
from dataclasses import dataclass
from pathlib import Path

from .config import THEMES_DIR


@dataclass(frozen=True)
class Theme:
    name: str
    pattern: str


def load_themes(path: Path | str) -> list[Theme]:
    theme_path = Path(path)
    if not theme_path.is_absolute():
        theme_path = THEMES_DIR / theme_path

    if not theme_path.exists():
        raise FileNotFoundError(f"Fichier de thèmes introuvable: {theme_path}")

    payload = json.loads(theme_path.read_text(encoding="utf-8"))
    raw_themes = payload.get("themes", payload)

    themes: list[Theme] = []
    for entry in raw_themes:
        if isinstance(entry, str):
            themes.append(Theme(name=entry.replace("_", " ").title(), pattern=entry))
            continue

        name = entry.get("name")
        pattern = entry.get("pattern")
        if not name or not pattern:
            raise ValueError(f"Entrée de thème invalide dans {theme_path}: {entry}")
        themes.append(Theme(name=name, pattern=pattern))

    return themes


def default_catalog_path() -> Path:
    return THEMES_DIR / "catalog.json"
