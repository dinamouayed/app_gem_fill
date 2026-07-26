"""Shared paths and generation constants."""

from __future__ import annotations

from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
GENERATOR_DIR = PACKAGE_DIR.parent
REPO_ROOT = GENERATOR_DIR.parents[1]

LEVELS_DIR = REPO_ROOT / "src/data/levels"
LEVELS_GENERATED_FILE = LEVELS_DIR / "levels.generated.ts"
THEMES_DIR = GENERATOR_DIR / "themes"
GENERATED_IMAGES_DIR = REPO_ROOT / "assets/source/generated"

DEFAULT_UNIT_FACTOR = 0.62
MAX_GENERATION_ATTEMPTS = 150
PREFERRED_THEME_OFFSET = 32
DEFAULT_GRID_SIZE = 14
