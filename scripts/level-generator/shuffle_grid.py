"""Port of src/utils/shuffleGrid.ts for level validation during generation."""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Callable

Grid = list[list[str]]
MAX_START_CORRECT_PERCENT = 20


@dataclass
class Cell:
    row: int
    col: int


def create_seeded_random(seed: int) -> Callable[[], float]:
    state = seed & 0xFFFFFFFF

    def random() -> float:
        nonlocal state
        state = (state * 1664525 + 1013904223) & 0xFFFFFFFF
        return state / 0x100000000

    return random


def shuffle_with_random(items: list, random: Callable[[], float]) -> list:
    copy = list(items)
    for index in range(len(copy) - 1, 0, -1):
        swap_index = int(random() * (index + 1))
        copy[index], copy[swap_index] = copy[swap_index], copy[index]
    return copy


def count_colors(grid: Grid) -> dict[str, int]:
    counts: dict[str, int] = {}
    for row in grid:
        for cell in row:
            counts[cell] = counts.get(cell, 0) + 1
    return counts


def grids_are_identical(first: Grid, second: Grid) -> bool:
    return all(
        first[row][col] == second[row][col]
        for row in range(len(first))
        for col in range(len(first[row]))
    )


def find_connected_components(grid: Grid) -> list[tuple[str, list[Cell]]]:
    rows = len(grid)
    cols = len(grid[0]) if rows else 0
    visited = [[False] * cols for _ in range(rows)]
    components: list[tuple[str, list[Cell]]] = []
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
            queue = [Cell(row, col)]
            cells: list[Cell] = []
            visited[row][col] = True

            while queue:
                current = queue.pop(0)
                cells.append(current)
                for dr, dc in directions:
                    nr, nc = current.row + dr, current.col + dc
                    if (
                        0 <= nr < rows
                        and 0 <= nc < cols
                        and not visited[nr][nc]
                        and grid[nr][nc] == color
                    ):
                        visited[nr][nc] = True
                        queue.append(Cell(nr, nc))

            components.append((color, cells))

    return components


def flatten_grid(grid: Grid) -> tuple[list[Cell], list[str], dict[str, int]]:
    positions: list[Cell] = []
    target_colors: list[str] = []
    index_by_cell: dict[str, int] = {}

    for row in range(len(grid)):
        for col in range(len(grid[row])):
            index = len(positions)
            positions.append(Cell(row, col))
            target_colors.append(grid[row][col])
            index_by_cell[f"{row},{col}"] = index

    return positions, target_colors, index_by_cell


def rebuild_grid(
    positions: list[Cell],
    assigned_colors: list[str],
    rows: int,
    cols: int,
) -> Grid:
    grid: Grid = [["" for _ in range(cols)] for _ in range(rows)]
    for position, color in zip(positions, assigned_colors):
        grid[position.row][position.col] = color
    return grid


def count_correct_assignments(target_colors: list[str], assigned: list[str]) -> int:
    return sum(1 for index, color in enumerate(assigned) if color == target_colors[index])


def build_anti_match_assignment(target_grid: Grid, random: Callable[[], float]) -> list[str]:
    positions, target_colors, _ = flatten_grid(target_grid)
    counts_by_target = Counter(target_colors)

    shuffled_positions = shuffle_with_random(
        list(enumerate(positions)),
        random,
    )
    shuffled_positions.sort(
        key=lambda item: counts_by_target[target_colors[item[0]]],
    )

    remaining = count_colors(target_grid)
    assigned = [""] * len(target_colors)

    for index, _ in shuffled_positions:
        target_color = target_colors[index]
        available = [(color, count) for color, count in remaining.items() if count > 0]
        wrong_options = [(color, count) for color, count in available if color != target_color]
        wrong_options.sort(key=lambda item: item[1], reverse=True)
        chosen_color = wrong_options[0][0] if wrong_options else available[0][0]

        assigned[index] = chosen_color
        remaining[chosen_color] -= 1

    return assigned


def swap_equal_component_assignments(
    target_grid: Grid,
    assigned: list[str],
    index_by_cell: dict[str, int],
    target_colors: list[str],
    random: Callable[[], float],
) -> list[str]:
    next_assigned = list(assigned)
    groups_by_size: dict[int, list[list[int]]] = {}

    for _, cells in find_connected_components(target_grid):
        indices = [index_by_cell[f"{cell.row},{cell.col}"] for cell in cells]
        size = len(indices)
        groups_by_size.setdefault(size, []).append(indices)

    for groups in groups_by_size.values():
        if len(groups) < 2:
            continue

        shuffled_groups = shuffle_with_random(groups, random)
        for index in range(0, len(shuffled_groups) - 1, 2):
            indices_a = shuffled_groups[index]
            indices_b = shuffled_groups[index + 1]
            colors_a = [next_assigned[i] for i in indices_a]
            colors_b = [next_assigned[i] for i in indices_b]
            before_correct = count_correct_assignments(target_colors, next_assigned)

            for offset, cell_index in enumerate(indices_a):
                next_assigned[cell_index] = colors_b[offset]
            for offset, cell_index in enumerate(indices_b):
                next_assigned[cell_index] = colors_a[offset]

            after_correct = count_correct_assignments(target_colors, next_assigned)
            if after_correct >= before_correct:
                for offset, cell_index in enumerate(indices_a):
                    next_assigned[cell_index] = colors_a[offset]
                for offset, cell_index in enumerate(indices_b):
                    next_assigned[cell_index] = colors_b[offset]

    return next_assigned


def reduce_correct_assignments(
    target_colors: list[str],
    assigned: list[str],
    random: Callable[[], float],
    max_correct: int,
) -> list[str]:
    next_assigned = list(assigned)
    attempts = 0

    while count_correct_assignments(target_colors, next_assigned) > max_correct and attempts < 1000:
        attempts += 1
        correct_indices = [
            index
            for index, color in enumerate(next_assigned)
            if color == target_colors[index]
        ]
        incorrect_indices = [
            index
            for index, color in enumerate(next_assigned)
            if color != target_colors[index]
        ]

        if not correct_indices or len(incorrect_indices) < 2:
            break

        first_index = correct_indices[int(random() * len(correct_indices))]
        second_index = incorrect_indices[int(random() * len(incorrect_indices))]

        for _ in range(8):
            candidate = incorrect_indices[int(random() * len(incorrect_indices))]
            first_color = next_assigned[first_index]
            second_color = next_assigned[candidate]
            if (
                candidate != first_index
                and first_color != second_color
                and second_color != target_colors[first_index]
                and first_color != target_colors[candidate]
            ):
                second_index = candidate
                break

        first_color = next_assigned[first_index]
        next_assigned[first_index] = next_assigned[second_index]
        next_assigned[second_index] = first_color

    return next_assigned


def check_grid_state(shuffled: Grid, target: Grid) -> tuple[int, float]:
    correct = sum(
        1
        for row in range(len(target))
        for col in range(len(target[row]))
        if shuffled[row][col] == target[row][col]
    )
    total = sum(len(row) for row in target)
    percentage = (correct / total * 100) if total else 0.0
    return correct, percentage


def has_matching_color_counts(shuffled: Grid, target: Grid) -> bool:
    return count_colors(shuffled) == count_colors(target)


def create_shuffled_grid(target_grid: Grid, seed: int) -> Grid:
    rows = len(target_grid)
    cols = len(target_grid[0]) if rows else 0
    random = create_seeded_random(seed)
    positions, target_colors, index_by_cell = flatten_grid(target_grid)
    total_cells = len(target_colors)
    max_correct = int(total_cells * MAX_START_CORRECT_PERCENT / 100)

    assigned = build_anti_match_assignment(target_grid, random)
    for _ in range(3):
        assigned = swap_equal_component_assignments(
            target_grid,
            assigned,
            index_by_cell,
            target_colors,
            random,
        )
    assigned = reduce_correct_assignments(target_colors, assigned, random, max_correct)
    return rebuild_grid(positions, assigned, rows, cols)


def shuffle_target_grid(target_grid: Grid, seed: int | None = None) -> Grid:
    if not target_grid or not target_grid[0]:
        return target_grid

    base_seed = 0 if seed is None else int(seed)
    total_cells = len(target_grid) * len(target_grid[0])
    max_correct = int(total_cells * MAX_START_CORRECT_PERCENT / 100)

    best_grid: Grid | None = None
    best_correct = total_cells

    for attempt in range(24):
        shuffled = create_shuffled_grid(target_grid, base_seed + attempt)
        if not has_matching_color_counts(shuffled, target_grid):
            continue
        if grids_are_identical(shuffled, target_grid):
            continue

        correct_count, percentage = check_grid_state(shuffled, target_grid)
        if correct_count <= max_correct or percentage <= MAX_START_CORRECT_PERCENT:
            return shuffled

        if correct_count < best_correct:
            best_correct = correct_count
            best_grid = shuffled

    fallback = best_grid or create_shuffled_grid(target_grid, base_seed + 999)
    if not has_matching_color_counts(fallback, target_grid):
        raise RuntimeError("Shuffle failed to preserve color counts")
    return fallback


def get_initial_correct_percent(target_grid: Grid, seed: int | None = None) -> float:
    shuffled = shuffle_target_grid(target_grid, seed)
    _, percentage = check_grid_state(shuffled, target_grid)
    return percentage
