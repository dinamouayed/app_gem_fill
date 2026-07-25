/**
 * Shuffles all gem color IDs from target grid ensuring the starting state is unsolved.
 */
export function shuffleTargetGrid(targetGrid: string[][]): string[][] {
  const rows = targetGrid.length;
  const cols = targetGrid[0].length;

  // Flatten target colors
  const allGems: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      allGems.push(targetGrid[r][c]);
    }
  }

  // Fisher-Yates Shuffle
  const shuffledGems = [...allGems];
  for (let i = shuffledGems.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffledGems[i], shuffledGems[j]] = [shuffledGems[j], shuffledGems[i]];
  }

  // Ensure it's not already 100% solved at launch
  let isIdentical = true;
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (shuffledGems[idx] !== targetGrid[r][c]) {
        isIdentical = false;
        break;
      }
      idx++;
    }
    if (!isIdentical) break;
  }

  // If identical by chance and grid size > 1, swap two elements with different colors
  if (isIdentical && shuffledGems.length > 1) {
    for (let i = 0; i < shuffledGems.length - 1; i++) {
      if (shuffledGems[i] !== shuffledGems[i + 1]) {
        [shuffledGems[i], shuffledGems[i + 1]] = [shuffledGems[i + 1], shuffledGems[i]];
        break;
      }
    }
  }

  // Reconstruct 2D array
  const result: string[][] = [];
  idx = 0;
  for (let r = 0; r < rows; r++) {
    const row: string[] = [];
    for (let c = 0; c < cols; c++) {
      row.push(shuffledGems[idx++]);
    }
    result.push(row);
  }

  return result;
}
