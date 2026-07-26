import { Level } from '../types/level';
import { SavedGameState } from '../types/game';
import { RESERVE_CAPACITY } from '../constants/game';
import { hasMatchingColorCounts } from './validateGrid';

export function isValidSavedGame(
  saved: SavedGameState,
  level: Level,
): boolean {
  if (saved.levelId !== level.id) {
    return false;
  }

  const { rows, columns } = level;

  if (saved.currentGrid.length !== rows) {
    return false;
  }

  if (!saved.currentGrid.every((row) => row.length === columns)) {
    return false;
  }

  if (saved.reserveGems.length > RESERVE_CAPACITY) {
    return false;
  }

  const paletteIds = new Set(level.palette.map((color) => color.id));

  for (const row of saved.currentGrid) {
    for (const cell of row) {
      if (cell !== null && !paletteIds.has(cell)) {
        return false;
      }
    }
  }

  for (const gemId of saved.reserveGems) {
    if (gemId !== null && !paletteIds.has(gemId)) {
      return false;
    }
  }

  if (!hasMatchingColorCounts(saved.currentGrid, level.targetGrid)) {
    return false;
  }

  if (
    typeof saved.moves !== 'number' ||
    saved.moves < 0 ||
    typeof saved.elapsedTimeSeconds !== 'number' ||
    saved.elapsedTimeSeconds < 0
  ) {
    return false;
  }

  return true;
}
