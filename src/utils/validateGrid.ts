/**
 * Checks grid completion status and metrics.
 */
export function checkGridState(
  currentGrid: (string | null)[][],
  targetGrid: string[][]
): {
  isComplete: boolean;
  correctCount: number;
  totalCount: number;
  percentage: number;
} {
  const rows = targetGrid.length;
  const cols = targetGrid[0].length;
  const totalCount = rows * cols;
  let correctCount = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (currentGrid[r][c] === targetGrid[r][c]) {
        correctCount++;
      }
    }
  }

  const percentage = Math.round((correctCount / totalCount) * 100);
  const isComplete = correctCount === totalCount;

  return {
    isComplete,
    correctCount,
    totalCount,
    percentage,
  };
}

/** Counts gem colors in a grid (null cells are ignored). */
export function getColorCounts(
  grid: (string | null)[][],
): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of grid) {
    for (const cell of row) {
      if (!cell) {
        continue;
      }

      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
  }

  return counts;
}

/** True when both grids contain exactly the same number of gems per color. */
export function hasMatchingColorCounts(
  currentGrid: (string | null)[][],
  targetGrid: string[][],
): boolean {
  const currentCounts = getColorCounts(currentGrid);
  const targetCounts = getColorCounts(targetGrid);

  if (currentCounts.size !== targetCounts.size) {
    return false;
  }

  for (const [color, count] of targetCounts) {
    if (currentCounts.get(color) !== count) {
      return false;
    }
  }

  return true;
}

/** Move budget multipliers for the 1–3 star rating. Lower = harder. */
const THREE_STAR_MOVE_FACTOR = 0.85;
const TWO_STAR_MOVE_FACTOR = 1.4;
const MIN_THREE_STAR_MOVES = 3;
const MIN_TWO_STAR_MOVES = 5;

/**
 * Calculates 1-3 star rating based on move efficiency vs grid size.
 * 3★ requires finishing within ~85% of the cell count (minimum 3 moves).
 */
export function calculateStars(moves: number, totalCells: number): number {
  const threeStarLimit = Math.max(
    MIN_THREE_STAR_MOVES,
    Math.ceil(totalCells * THREE_STAR_MOVE_FACTOR),
  );
  const twoStarLimit = Math.max(
    MIN_TWO_STAR_MOVES,
    Math.ceil(totalCells * TWO_STAR_MOVE_FACTOR),
  );

  if (moves <= threeStarLimit) return 3;
  if (moves <= twoStarLimit) return 2;
  return 1;
}
