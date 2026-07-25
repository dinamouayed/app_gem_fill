import { Level } from "../types/level";
import { getColorCounts, hasMatchingColorCounts } from "./validateGrid";

/** Validates that a level target grid is internally consistent. */
export function isTargetGridValid(level: Level): boolean {
  const { rows, columns, palette, targetGrid } = level;

  if (targetGrid.length !== rows) {
    return false;
  }

  if (targetGrid.some((row) => row.length !== columns)) {
    return false;
  }

  const paletteIds = new Set(palette.map((color) => color.id));
  const gridCounts = getColorCounts(targetGrid);
  const totalCells = rows * columns;

  if ([...gridCounts.values()].reduce((sum, count) => sum + count, 0) !== totalCells) {
    return false;
  }

  for (const colorId of gridCounts.keys()) {
    if (!paletteIds.has(colorId)) {
      return false;
    }
  }

  for (const color of palette) {
    if (!gridCounts.has(color.id)) {
      return false;
    }
  }

  return true;
}

/** A shuffled grid is playable when every color count matches the solved grid. */
export function isShuffledGridSolvable(
  shuffledGrid: string[][],
  level: Level,
): boolean {
  return hasMatchingColorCounts(shuffledGrid, level.targetGrid);
}
