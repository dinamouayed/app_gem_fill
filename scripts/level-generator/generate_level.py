#!/usr/bin/env python3
"""
Generate a Gem Fill level from a source image.

Usage:
    python -m generate_level assets/source/perroquet.jpg
    python -m generate_level assets/source/perroquet.jpg --id 7 --name "Perroquet"
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, deque
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image
from sklearn.cluster import KMeans

from color_distance import (
    MIN_PALETTE_DELTA_E,
    PaletteContrastError,
    validate_palette_separation,
)

from level_generator.export import (
    export_level_typescript,
    next_level_id,
    sync_levels_index,
)
from level_generator.models import (
    DominantColorError,
    LevelData,
    MAX_DOMINANT_COLOR_RATIO,
    MAX_START_CORRECT_PERCENT,
    ShuffleDifficultyError,
)

MIN_COLORS = 2
MAX_COLORS = 10
DEFAULT_MAX_COLS = 14
DEFAULT_MAX_ROWS = 18
MIN_GRID = 4
MAX_GRID_CELLS = 196
CROP_COLOR_TOLERANCE = 35
UNIFORM_EDGE_THRESHOLD = 0.9


def color_distance_sq(c1: np.ndarray, c2: np.ndarray) -> float:
    diff = c1.astype(float) - c2.astype(float)
    return float(np.dot(diff, diff))


def rgb_to_hex(r: int, g: int, b: int) -> str:
    return f"#{r:02X}{g:02X}{b:02X}"


def slugify(text: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9]+", "_", text.strip().lower())
    return normalized.strip("_") or "color"


def hue_name(r: int, g: int, b: int) -> str:
    """Rough French color name from RGB."""
    rn, gn, bn = r / 255, g / 255, b / 255
    mx, mn = max(rn, gn, bn), min(rn, gn, bn)
    delta = mx - mn

    if delta < 0.06:
        if mx < 0.25:
            return "Noir"
        if mx > 0.85:
            return "Blanc"
        return "Gris"

    if mx == rn:
        hue = ((gn - bn) / delta) % 6
    elif mx == gn:
        hue = (bn - rn) / delta + 2
    else:
        hue = (rn - gn) / delta + 4

    hue *= 60
    if hue < 15 or hue >= 345:
        return "Rouge"
    if hue < 45:
        return "Orange"
    if hue < 75:
        return "Jaune"
    if hue < 165:
        return "Vert"
    if hue < 195:
        return "Cyan"
    if hue < 255:
        return "Bleu"
    if hue < 315:
        return "Violet"
    return "Rose"


def compute_grid_size(
    image_width: int,
    image_height: int,
    max_cols: int = DEFAULT_MAX_COLS,
    max_rows: int = DEFAULT_MAX_ROWS,
) -> tuple[int, int]:
    aspect = image_width / image_height

    if aspect >= 1:
        cols = max_cols
        rows = max(MIN_GRID, round(cols / aspect))
    else:
        rows = max_rows
        cols = max(MIN_GRID, round(rows * aspect))

    while rows * cols > MAX_GRID_CELLS:
        if rows >= cols and rows > MIN_GRID:
            rows -= 1
        elif cols > MIN_GRID:
            cols -= 1
        else:
            break

    return rows, cols


def crop_to_content(image: Image.Image, tolerance: int = CROP_COLOR_TOLERANCE) -> Image.Image:
    """Remove large empty margins so backgrounds occupy fewer cells."""
    rgb = image.convert("RGB")
    arr = np.array(rgb, dtype=np.int16)
    height, width = arr.shape[:2]

    if height <= MIN_GRID or width <= MIN_GRID:
        return rgb

    edge_pixels = np.concatenate(
        [arr[0, :], arr[-1, :], arr[:, 0], arr[:, -1]], axis=0
    )
    background = Counter(map(tuple, edge_pixels)).most_common(1)[0][0]
    background_arr = np.array(background, dtype=np.int16)
    diff = np.sum((arr - background_arr) ** 2, axis=2)
    content_mask = diff > tolerance * tolerance

    if not content_mask.any():
        return rgb

    content_rows = np.where(content_mask.any(axis=1))[0]
    content_cols = np.where(content_mask.any(axis=0))[0]
    padding = max(1, min(height, width) // 30)

    top = max(0, int(content_rows[0]) - padding)
    bottom = min(height, int(content_rows[-1]) + 1 + padding)
    left = max(0, int(content_cols[0]) - padding)
    right = min(width, int(content_cols[-1]) + 1 + padding)

    cropped = rgb.crop((left, top, right, bottom))
    if cropped.width < 8 or cropped.height < 8:
        return rgb
    return cropped


def trim_uniform_edges(label_grid: np.ndarray, threshold: float = UNIFORM_EDGE_THRESHOLD) -> np.ndarray:
    """Drop border rows/columns that are mostly a single background color."""
    grid = label_grid.copy()

    def row_dominance(row: np.ndarray) -> float:
        values, counts = np.unique(row, return_counts=True)
        return float(counts.max()) / len(row)

    def col_dominance(column: np.ndarray) -> float:
        values, counts = np.unique(column, return_counts=True)
        return float(counts.max()) / len(column)

    changed = True
    while changed and grid.shape[0] > MIN_GRID and grid.shape[1] > MIN_GRID:
        changed = False

        if row_dominance(grid[0]) >= threshold:
            grid = grid[1:]
            changed = True
        if grid.shape[0] > MIN_GRID and row_dominance(grid[-1]) >= threshold:
            grid = grid[:-1]
            changed = True
        if grid.shape[1] > MIN_GRID and col_dominance(grid[:, 0]) >= threshold:
            grid = grid[:, 1:]
            changed = True
        if grid.shape[1] > MIN_GRID and col_dominance(grid[:, -1]) >= threshold:
            grid = grid[:, :-1]
            changed = True

    return grid


def get_max_color_ratio(label_grid: np.ndarray) -> tuple[float, int]:
    """Return the highest color share and its label index."""
    counts = Counter(int(label) for label in label_grid.flatten())
    total = label_grid.size
    color_index, count = counts.most_common(1)[0]
    return count / total, color_index


def validate_color_balance(
    label_grid: np.ndarray,
    max_ratio: float = MAX_DOMINANT_COLOR_RATIO,
) -> None:
    """Reject grids where a single color covers more than max_ratio of cells."""
    ratio, color_index = get_max_color_ratio(label_grid)
    if ratio > max_ratio:
        raise DominantColorError(ratio, max_ratio=max_ratio, color_index=color_index)


def validate_shuffle_difficulty(
    target_grid: list[list[str]],
    level_id: int,
    max_percent: float = MAX_START_CORRECT_PERCENT,
) -> float:
    """Reject grids whose shuffled start exceeds the max correct gem percentage."""
    from shuffle_grid import get_initial_correct_percent

    percent = get_initial_correct_percent(target_grid, level_id)
    if percent > max_percent:
        raise ShuffleDifficultyError(percent, max_percent=max_percent)
    return percent


def prepare_image_for_level(image: Image.Image, *, crop: bool = True) -> Image.Image:
    prepared = image.convert("RGB")
    if crop:
        prepared = crop_to_content(prepared)
    return prepared


def pick_color_count(pixels: np.ndarray, max_colors: int = MAX_COLORS) -> int:
    """Pick k in [MIN_COLORS, max_colors] using image complexity + KMeans elbow."""
    max_k = min(max_colors, len(pixels), 10)
    if max_k <= MIN_COLORS:
        return MIN_COLORS

    unique_colors = len(np.unique(pixels, axis=0))
    # More distinct pixels in the downsampled image => more gem colors.
    complexity_hint = int(np.clip(round(np.sqrt(unique_colors)), MIN_COLORS, max_colors))

    inertias: list[float] = []
    k_values = list(range(MIN_COLORS, max_k + 1))

    for k in k_values:
        model = KMeans(n_clusters=k, n_init=3, random_state=42)
        model.fit(pixels)
        inertias.append(float(model.inertia_))

    if len(inertias) <= 1:
        return complexity_hint

    improvements = [
        (inertias[i - 1] - inertias[i]) / max(inertias[i - 1], 1.0)
        for i in range(1, len(inertias))
    ]

    best_idx = 0
    best_score = -1.0
    for idx, gain in enumerate(improvements):
        remaining = improvements[idx + 1 :]
        avg_future = sum(remaining) / len(remaining) if remaining else 0.0
        score = gain - avg_future
        if score > best_score:
            best_score = score
            best_idx = idx

    elbow_k = k_values[best_idx + 1]
    return int(np.clip(max(complexity_hint, elbow_k), MIN_COLORS, max_colors))


def quantize_image(
    image: Image.Image,
    rows: int,
    cols: int,
    color_count: int | None = None,
    max_colors: int = MAX_COLORS,
    *,
    trim_edges: bool = True,
) -> tuple[np.ndarray, list[tuple[int, int, int]]]:
    resized = image.convert("RGB").resize((cols, rows), Image.Resampling.LANCZOS)
    pixels = np.array(resized, dtype=np.uint8).reshape(-1, 3)

    k = color_count or pick_color_count(pixels, max_colors=max_colors)
    k = max(MIN_COLORS, min(max_colors, k))

    model = KMeans(n_clusters=k, n_init=10, random_state=42)
    labels = model.fit_predict(pixels)
    centroids = np.round(model.cluster_centers_).astype(int)
    centroids = np.clip(centroids, 0, 255)

    label_grid = labels.reshape(rows, cols)
    if trim_edges:
        label_grid = trim_uniform_edges(label_grid)
    present_labels = sorted(int(label) for label in np.unique(label_grid))
    remapped = np.vectorize({label: index for index, label in enumerate(present_labels)}.get)(label_grid)
    compact_centroids = [tuple(map(int, centroids[label])) for label in present_labels]
    return remapped.astype(int), compact_centroids


def build_palette(centroids: list[tuple[int, int, int]]) -> list[dict]:
    used_ids: set[str] = set()
    palette: list[dict] = []

    for index, (r, g, b) in enumerate(centroids):
        base_id = f"c_{slugify(hue_name(r, g, b))}"
        color_id = base_id
        suffix = 2
        while color_id in used_ids:
            color_id = f"{base_id}_{suffix}"
            suffix += 1
        used_ids.add(color_id)

        palette.append(
            {
                "id": color_id,
                "hex": rgb_to_hex(r, g, b),
                "name": hue_name(r, g, b),
            }
        )

    return palette


def build_target_grid(label_grid: np.ndarray) -> list[list[str]]:
    palette_size = int(label_grid.max()) + 1
    color_ids = [f"c_{i}" for i in range(palette_size)]
    rows, cols = label_grid.shape
    return [[color_ids[int(label_grid[r, c])] for c in range(cols)] for r in range(rows)]


def remap_palette_ids(
    target_grid: list[list[str]], palette: list[dict]
) -> tuple[list[list[str]], list[dict]]:
    """Replace temporary c_0..c_n ids with final palette ids."""
    temp_to_final = {f"c_{i}": palette[i]["id"] for i in range(len(palette))}
    remapped_grid = [[temp_to_final[cell] for cell in row] for row in target_grid]
    return remapped_grid, palette


def infer_difficulty(rows: int, cols: int, color_count: int) -> str:
    cells = rows * cols
    score = cells * color_count
    if score <= 80:
        return "easy"
    if score <= 200:
        return "medium"
    return "hard"


def infer_level_name(image_path: Path) -> str:
    return image_path.stem.replace("_", " ").replace("-", " ").title()


def find_connected_components(grid: list[list[str]]) -> list[tuple[str, list[tuple[int, int]]]]:
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    visited = [[False] * cols for _ in range(rows)]
    components: list[tuple[str, list[tuple[int, int]]]] = []

    directions = [
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1),
        (-1, -1),
        (-1, 1),
        (1, -1),
        (1, 1),
    ]

    for row in range(rows):
        for col in range(cols):
            if visited[row][col]:
                continue

            color = grid[row][col]
            queue: deque[tuple[int, int]] = deque([(row, col)])
            visited[row][col] = True
            cells: list[tuple[int, int]] = []

            while queue:
                r, c = queue.popleft()
                cells.append((r, c))
                for dr, dc in directions:
                    nr, nc = r + dr, c + dc
                    if (
                        0 <= nr < rows
                        and 0 <= nc < cols
                        and not visited[nr][nc]
                        and grid[nr][nc] == color
                    ):
                        visited[nr][nc] = True
                        queue.append((nr, nc))

            components.append((color, cells))

    return components


def split_into_cluster_sizes(total: int, cluster_count: int) -> list[int]:
    if cluster_count <= 1:
        return [total]

    cluster_count = max(1, min(cluster_count, total))
    base = total // cluster_count
    remainder = total % cluster_count
    sizes = [base + (1 if i < remainder else 0) for i in range(cluster_count)]
    return [size for size in sizes if size > 0]


def grow_cluster(
    anchor: tuple[int, int],
    size: int,
    occupied: set[tuple[int, int]],
    rows: int,
    cols: int,
) -> list[tuple[int, int]]:
    directions = [
        (-1, 0),
        (1, 0),
        (0, -1),
        (0, 1),
        (-1, -1),
        (-1, 1),
        (1, -1),
        (1, 1),
    ]

    start_row, start_col = anchor
    if (start_row, start_col) in occupied:
        for radius in range(1, max(rows, cols)):
            found = False
            for dr in range(-radius, radius + 1):
                for dc in range(-radius, radius + 1):
                    nr, nc = start_row + dr, start_col + dc
                    if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in occupied:
                        start_row, start_col = nr, nc
                        found = True
                        break
                if found:
                    break
            if found:
                break

    cluster: list[tuple[int, int]] = []
    queue: deque[tuple[int, int]] = deque([(start_row, start_col)])
    seen = {(start_row, start_col)}

    while queue and len(cluster) < size:
        r, c = queue.popleft()
        if (r, c) in occupied:
            continue
        cluster.append((r, c))
        if len(cluster) >= size:
            break

        for dr, dc in directions:
            nr, nc = r + dr, c + dc
            if (
                0 <= nr < rows
                and 0 <= nc < cols
                and (nr, nc) not in seen
                and (nr, nc) not in occupied
            ):
                seen.add((nr, nc))
                queue.append((nr, nc))

    if len(cluster) < size:
        for r in range(rows):
            for c in range(cols):
                if len(cluster) >= size:
                    break
                if (r, c) not in occupied and (r, c) not in cluster:
                    cluster.append((r, c))
            if len(cluster) >= size:
                break

    return cluster[:size]


def create_clustered_initial_grid(
    target_grid: list[list[str]],
    seed: int | None = None,
) -> list[list[str]]:
    """
    Build an unsolved grid where gems of the same color form clusters
    in wrong areas — similar to the reference sorting game.
    """
    rng = np.random.default_rng(seed)
    rows = len(target_grid)
    cols = len(target_grid[0]) if rows else 0

    color_counts = Counter(cell for row in target_grid for cell in row)
    components = find_connected_components(target_grid)

    components_by_color: dict[str, list[list[tuple[int, int]]]] = {}
    for color, cells in components:
        components_by_color.setdefault(color, []).append(cells)

    initial: list[list[str | None]] = [[None for _ in range(cols)] for _ in range(rows)]
    occupied: set[tuple[int, int]] = set()

    colors = sorted(color_counts.keys(), key=lambda c: color_counts[c], reverse=True)
    rng.shuffle(colors)

    for color in colors:
        count = color_counts[color]
        cluster_count = len(components_by_color.get(color, []))
        cluster_count = max(1, min(cluster_count, count))
        cluster_sizes = split_into_cluster_sizes(count, cluster_count)

        wrong_positions = [
            (r, c)
            for r in range(rows)
            for c in range(cols)
            if target_grid[r][c] != color and (r, c) not in occupied
        ]
        rng.shuffle(wrong_positions)

        anchor_index = 0
        for size in cluster_sizes:
            anchor = wrong_positions[anchor_index] if anchor_index < len(wrong_positions) else None
            if anchor is None:
                anchor = next(
                    (
                        (r, c)
                        for r in range(rows)
                        for c in range(cols)
                        if (r, c) not in occupied
                    ),
                    (0, 0),
                )
            else:
                anchor_index += 1

            cells = grow_cluster(anchor, size, occupied, rows, cols)
            for r, c in cells:
                initial[r][c] = color
                occupied.add((r, c))

    for r in range(rows):
        for c in range(cols):
            if initial[r][c] is None:
                for color in colors:
                    if color_counts[color] > 0:
                        initial[r][c] = color
                        color_counts[color] -= 1
                        break

    return [[cell if cell is not None else target_grid[r][c] for c, cell in enumerate(row)] for r, row in enumerate(initial)]


def resolve_image_path(path: Path) -> Path:
    if path.exists():
        return path

    if path.suffix:
        stem_matches = sorted(path.parent.glob(f"{path.stem}.*"))
        if stem_matches:
            suggestions = ", ".join(str(match.relative_to(path.parent)) for match in stem_matches)
            raise FileNotFoundError(
                f"Image introuvable: {path}\n"
                f"Fichiers similaires dans {path.parent}: {suggestions}"
            )

    if path.parent.is_dir():
        available = ", ".join(
            sorted(item.name for item in path.parent.iterdir() if item.is_file())
        )
        raise FileNotFoundError(
            f"Image introuvable: {path}\n"
            f"Fichiers disponibles dans {path.parent}: {available or '(aucun)'}"
        )

    raise FileNotFoundError(f"Image introuvable: {path}")


def generate_level_from_image(
    image_path: str | Path,
    *,
    level_id: int = 7,
    name: str | None = None,
    rows: int | None = None,
    cols: int | None = None,
    color_count: int | None = None,
    max_colors: int = MAX_COLORS,
    category: str = "Généré",
    difficulty: str | None = None,
    crop: bool = True,
    trim_edges: bool = False,
    max_dominant_ratio: float | None = MAX_DOMINANT_COLOR_RATIO,
    max_start_correct_percent: float | None = MAX_START_CORRECT_PERCENT,
    min_palette_delta_e: float | None = MIN_PALETTE_DELTA_E,
) -> LevelData:
    path = resolve_image_path(Path(image_path))

    with Image.open(path) as img:
        prepared = prepare_image_for_level(img, crop=crop)
        auto_rows, auto_cols = compute_grid_size(prepared.width, prepared.height)
        final_rows = rows or auto_rows
        final_cols = cols or auto_cols

        label_grid, centroids = quantize_image(
            prepared,
            final_rows,
            final_cols,
            color_count=color_count,
            max_colors=max_colors,
            trim_edges=trim_edges,
        )

    final_rows, final_cols = label_grid.shape

    if max_dominant_ratio is not None:
        validate_color_balance(label_grid, max_ratio=max_dominant_ratio)

    palette = build_palette(centroids)
    target_grid = build_target_grid(label_grid)
    target_grid, palette = remap_palette_ids(target_grid, palette)

    if max_start_correct_percent is not None:
        validate_shuffle_difficulty(
            target_grid,
            level_id,
            max_percent=max_start_correct_percent,
        )

    if min_palette_delta_e is not None:
        validate_palette_separation(palette, min_delta_e=min_palette_delta_e)

    final_difficulty = difficulty or infer_difficulty(
        final_rows, final_cols, len(palette)
    )

    return LevelData(
        id=level_id,
        name=name or infer_level_name(path),
        rows=final_rows,
        columns=final_cols,
        difficulty=final_difficulty,
        category=category,
        palette=palette,
        target_grid=target_grid,
    )


def parse_args(argv: Iterable[str] | None = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Génère un niveau Gem Fill à partir d'une image."
    )
    parser.add_argument("image", help="Chemin vers l'image source")
    parser.add_argument("--id", type=int, default=None, help="ID du niveau")
    parser.add_argument("--name", default=None, help="Nom du niveau")
    parser.add_argument("--rows", type=int, default=None, help="Nombre de lignes")
    parser.add_argument("--cols", type=int, default=None, help="Nombre de colonnes")
    parser.add_argument(
        "--colors",
        type=int,
        default=None,
        help=f"Nombre de couleurs ({MIN_COLORS}-{MAX_COLORS}, auto si omis)",
    )
    parser.add_argument(
        "--max-colors",
        type=int,
        default=MAX_COLORS,
        help=f"Maximum de couleurs (défaut: {MAX_COLORS})",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Fichier de sortie (.ts). Défaut: src/data/levels/level<ID>.ts",
    )
    parser.add_argument(
        "--preview-shuffle",
        action="store_true",
        help="Affiche un aperçu ASCII du mélange groupé",
    )
    parser.add_argument(
        "--max-dominant-ratio",
        type=float,
        default=MAX_DOMINANT_COLOR_RATIO,
        help=(
            "Part maximale d'une couleur dans la grille (0-1). "
            f"Défaut: {MAX_DOMINANT_COLOR_RATIO}. Utiliser 1 pour désactiver."
        ),
    )
    parser.add_argument(
        "--max-start-correct",
        type=float,
        default=MAX_START_CORRECT_PERCENT,
        help=(
            "Pourcentage max de gemmes déjà bien placées au départ. "
            f"Défaut: {MAX_START_CORRECT_PERCENT}. Utiliser 100 pour désactiver."
        ),
    )
    parser.add_argument(
        "--min-palette-delta-e",
        type=float,
        default=MIN_PALETTE_DELTA_E,
        help=(
            "Distance minimale ΔE (CIE76) entre chaque paire de couleurs. "
            f"Défaut: {MIN_PALETTE_DELTA_E}. Utiliser 0 pour désactiver."
        ),
    )
    return parser.parse_args(list(argv) if argv is not None else None)


def preview_grid(grid: list[list[str]], palette: list[dict]) -> str:
    symbols = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    color_to_symbol = {
        color["id"]: symbols[i % len(symbols)] for i, color in enumerate(palette)
    }
    lines = []
    for row in grid:
        lines.append("".join(color_to_symbol.get(cell, "?") for cell in row))
    return "\n".join(lines)


def main(argv: Iterable[str] | None = None) -> int:
    args = parse_args(argv)
    repo_root = Path(__file__).resolve().parents[2]
    image_path = Path(args.image)
    if not image_path.is_absolute():
        image_path = repo_root / image_path

    level_id = args.id
    if level_id is None:
        level_id = next_level_id(repo_root / "src/data/levels")

    max_dominant_ratio = args.max_dominant_ratio
    if max_dominant_ratio >= 1:
        max_dominant_ratio = None

    max_start_correct = args.max_start_correct
    if max_start_correct >= 100:
        max_start_correct = None

    min_palette_delta_e = args.min_palette_delta_e
    if min_palette_delta_e <= 0:
        min_palette_delta_e = None

    level = generate_level_from_image(
        image_path,
        level_id=level_id,
        name=args.name,
        rows=args.rows,
        cols=args.cols,
        color_count=args.colors,
        max_colors=args.max_colors,
        max_dominant_ratio=max_dominant_ratio,
        max_start_correct_percent=max_start_correct,
        min_palette_delta_e=min_palette_delta_e,
    )

    output_path = Path(args.output) if args.output else repo_root / f"src/data/levels/level{level.id}.ts"
    if not output_path.is_absolute():
        output_path = repo_root / output_path

    export_level_typescript(level, output_path)
    synced = sync_levels_index()

    print("----------------------------------------------------")
    print("💎 GEM FILL — Générateur de niveau")
    print("----------------------------------------------------")
    print(f" Image     : {image_path}")
    print(f" ID        : {level.id}")
    print(f" Nom       : {level.name}")
    print(f" Grille    : {level.rows}x{level.columns}")
    print(f" Couleurs  : {len(level.palette)}")
    for color in level.palette:
        print(f"   - {color['id']}: {color['hex']} ({color.get('name', '')})")
    print(f" Sortie    : {output_path}")
    print(f" Index     : {synced.relative_to(repo_root)}")
    print("----------------------------------------------------")

    if args.preview_shuffle:
        shuffled = create_clustered_initial_grid(level.target_grid, seed=42)
        print("\nAperçu cible (résolu):")
        print(preview_grid(level.target_grid, level.palette))
        print("\nAperçu mélange groupé (départ):")
        print(preview_grid(shuffled, level.palette))

    return 0


if __name__ == "__main__":
    sys.exit(main())
