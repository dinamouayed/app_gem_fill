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

/**
 * Calculates 1-3 star rating based on moves vs optimal target moves (rows * cols * 1.5).
 */
export function calculateStars(moves: number, totalCells: number): number {
  const targetMoves = Math.ceil(totalCells * 1.5);
  if (moves <= targetMoves) return 3;
  if (moves <= targetMoves * 2) return 2;
  return 1;
}
