import { checkGridState, hasMatchingColorCounts } from "./validateGrid";

type Grid = string[][];
type Cell = { row: number; col: number };

const MAX_START_CORRECT_PERCENT = 35;

function createSeededRandom(seed: number): () => number {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function shuffleWithRandom<T>(items: T[], random: () => number): T[] {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

function countColors(grid: Grid): Map<string, number> {
  const counts = new Map<string, number>();

  for (const row of grid) {
    for (const cell of row) {
      counts.set(cell, (counts.get(cell) ?? 0) + 1);
    }
  }

  return counts;
}

function gridsAreIdentical(first: Grid, second: Grid): boolean {
  return first.every((row, rowIndex) =>
    row.every((cell, colIndex) => cell === second[rowIndex][colIndex]),
  );
}

function findConnectedComponents(
  grid: Grid,
): Array<{ color: string; cells: Cell[] }> {
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const visited = Array.from({ length: rows }, () => Array(cols).fill(false));
  const components: Array<{ color: string; cells: Cell[] }> = [];
  const directions: Cell[] = [
    { row: -1, col: 0 },
    { row: 1, col: 0 },
    { row: 0, col: -1 },
    { row: 0, col: 1 },
    { row: -1, col: -1 },
    { row: -1, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 1 },
  ];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (visited[row][col]) {
        continue;
      }

      const color = grid[row][col];
      const queue: Cell[] = [{ row, col }];
      const cells: Cell[] = [];
      visited[row][col] = true;

      while (queue.length > 0) {
        const current = queue.shift()!;
        cells.push(current);

        for (const direction of directions) {
          const nextRow = current.row + direction.row;
          const nextCol = current.col + direction.col;

          if (
            nextRow >= 0 &&
            nextRow < rows &&
            nextCol >= 0 &&
            nextCol < cols &&
            !visited[nextRow][nextCol] &&
            grid[nextRow][nextCol] === color
          ) {
            visited[nextRow][nextCol] = true;
            queue.push({ row: nextRow, col: nextCol });
          }
        }
      }

      components.push({ color, cells });
    }
  }

  return components;
}

function flattenGrid(grid: Grid): {
  positions: Cell[];
  targetColors: string[];
  indexByCell: Map<string, number>;
} {
  const positions: Cell[] = [];
  const targetColors: string[] = [];
  const indexByCell = new Map<string, number>();

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < grid[row].length; col++) {
      const index = positions.length;
      positions.push({ row, col });
      targetColors.push(grid[row][col]);
      indexByCell.set(`${row},${col}`, index);
    }
  }

  return { positions, targetColors, indexByCell };
}

function rebuildGrid(
  positions: Cell[],
  assignedColors: string[],
  rows: number,
  cols: number,
): Grid {
  const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(""));

  positions.forEach((position, index) => {
    grid[position.row][position.col] = assignedColors[index];
  });

  return grid;
}

function buildAntiMatchAssignment(
  targetGrid: Grid,
  random: () => number,
): string[] {
  const { positions, targetColors } = flattenGrid(targetGrid);
  const countsByTarget = new Map<string, number>();

  for (const color of targetColors) {
    countsByTarget.set(color, (countsByTarget.get(color) ?? 0) + 1);
  }

  const shuffledPositions = shuffleWithRandom(
    positions.map((position, index) => ({ position, index })),
    random,
  ).sort(
    (first, second) =>
      (countsByTarget.get(targetColors[first.index]) ?? 0) -
      (countsByTarget.get(targetColors[second.index]) ?? 0),
  );

  const remaining = countColors(targetGrid);
  const assigned = Array<string>(targetColors.length);

  for (const { index } of shuffledPositions) {
    const targetColor = targetColors[index];
    const available = [...remaining.entries()].filter(([, count]) => count > 0);
    const wrongOptions = available.filter(([color]) => color !== targetColor);
    const chosenEntry = wrongOptions.sort((first, second) => second[1] - first[1])[0]
      ?? available[0];

    if (!chosenEntry) {
      throw new Error("Unable to assign shuffled colors");
    }

    const [chosenColor] = chosenEntry;
    assigned[index] = chosenColor;
    remaining.set(chosenColor, (remaining.get(chosenColor) ?? 1) - 1);
  }

  return assigned;
}

function swapEqualComponentAssignments(
  targetGrid: Grid,
  assigned: string[],
  indexByCell: Map<string, number>,
  targetColors: string[],
  random: () => number,
): string[] {
  const nextAssigned = [...assigned];
  const components = findConnectedComponents(targetGrid);
  const groupsBySize = new Map<number, number[][]>();

  for (const component of components) {
    const indices = component.cells.map(
      (cell) => indexByCell.get(`${cell.row},${cell.col}`)!,
    );
    const size = indices.length;
    const bucket = groupsBySize.get(size) ?? [];
    bucket.push(indices);
    groupsBySize.set(size, bucket);
  }

  for (const [, groups] of groupsBySize) {
    if (groups.length < 2) {
      continue;
    }

    const shuffledGroups = shuffleWithRandom(groups, random);

    for (let index = 0; index + 1 < shuffledGroups.length; index += 2) {
      const indicesA = shuffledGroups[index];
      const indicesB = shuffledGroups[index + 1];
      const colorsA = indicesA.map((cellIndex) => nextAssigned[cellIndex]);
      const colorsB = indicesB.map((cellIndex) => nextAssigned[cellIndex]);
      const beforeCorrect = countCorrectAssignments(targetColors, nextAssigned);

      indicesA.forEach((cellIndex, offset) => {
        nextAssigned[cellIndex] = colorsB[offset];
      });
      indicesB.forEach((cellIndex, offset) => {
        nextAssigned[cellIndex] = colorsA[offset];
      });

      const afterCorrect = countCorrectAssignments(targetColors, nextAssigned);

      if (afterCorrect >= beforeCorrect) {
        indicesA.forEach((cellIndex, offset) => {
          nextAssigned[cellIndex] = colorsA[offset];
        });
        indicesB.forEach((cellIndex, offset) => {
          nextAssigned[cellIndex] = colorsB[offset];
        });
      }
    }
  }

  return nextAssigned;
}

function countCorrectAssignments(targetColors: string[], assigned: string[]): number {
  return assigned.reduce(
    (total, color, index) => (color === targetColors[index] ? total + 1 : total),
    0,
  );
}

function reduceCorrectAssignments(
  targetColors: string[],
  assigned: string[],
  random: () => number,
  maxCorrect: number,
): string[] {
  const nextAssigned = [...assigned];
  let attempts = 0;

  while (
    countCorrectAssignments(targetColors, nextAssigned) > maxCorrect &&
    attempts < 1000
  ) {
    attempts += 1;

    const correctIndices = nextAssigned
      .map((color, index) => (color === targetColors[index] ? index : -1))
      .filter((index) => index >= 0);
    const incorrectIndices = nextAssigned
      .map((color, index) => (color !== targetColors[index] ? index : -1))
      .filter((index) => index >= 0);

    if (correctIndices.length === 0 || incorrectIndices.length < 2) {
      break;
    }

    const firstIndex = correctIndices[Math.floor(random() * correctIndices.length)];
    let secondIndex = incorrectIndices[Math.floor(random() * incorrectIndices.length)];

    for (let tries = 0; tries < 8; tries++) {
      const candidate = incorrectIndices[Math.floor(random() * incorrectIndices.length)];
      const firstColor = nextAssigned[firstIndex];
      const secondColor = nextAssigned[candidate];

      if (
        candidate !== firstIndex &&
        firstColor !== secondColor &&
        secondColor !== targetColors[firstIndex] &&
        firstColor !== targetColors[candidate]
      ) {
        secondIndex = candidate;
        break;
      }
    }

    const firstColor = nextAssigned[firstIndex];
    nextAssigned[firstIndex] = nextAssigned[secondIndex];
    nextAssigned[secondIndex] = firstColor;
  }

  return nextAssigned;
}

function createShuffledGrid(targetGrid: Grid, seed: number): Grid {
  const rows = targetGrid.length;
  const cols = targetGrid[0]?.length ?? 0;
  const random = createSeededRandom(seed);
  const { positions, targetColors, indexByCell } = flattenGrid(targetGrid);
  const totalCells = targetColors.length;
  const maxCorrect = Math.floor((totalCells * MAX_START_CORRECT_PERCENT) / 100);

  let assigned = buildAntiMatchAssignment(targetGrid, random);

  for (let round = 0; round < 3; round++) {
    assigned = swapEqualComponentAssignments(
      targetGrid,
      assigned,
      indexByCell,
      targetColors,
      random,
    );
  }

  assigned = reduceCorrectAssignments(targetColors, assigned, random, maxCorrect);

  return rebuildGrid(positions, assigned, rows, cols);
}

/**
 * Shuffles the target grid into a playable starting state.
 * Color counts are always preserved so the puzzle stays solvable.
 */
export function shuffleTargetGrid(targetGrid: Grid, seed?: number): Grid {
  if (targetGrid.length === 0 || (targetGrid[0]?.length ?? 0) === 0) {
    return targetGrid;
  }

  const baseSeed = seed ?? Date.now();
  const totalCells = targetGrid.length * (targetGrid[0]?.length ?? 0);
  const maxCorrect = Math.floor((totalCells * MAX_START_CORRECT_PERCENT) / 100);

  let bestGrid: Grid | null = null;
  let bestCorrect = totalCells;

  for (let attempt = 0; attempt < 24; attempt++) {
    const shuffled = createShuffledGrid(targetGrid, baseSeed + attempt);

    if (!hasMatchingColorCounts(shuffled, targetGrid)) {
      continue;
    }

    if (gridsAreIdentical(shuffled, targetGrid)) {
      continue;
    }

    const { correctCount, percentage } = checkGridState(shuffled, targetGrid);

    if (correctCount <= maxCorrect || percentage <= MAX_START_CORRECT_PERCENT) {
      return shuffled;
    }

    if (correctCount < bestCorrect) {
      bestCorrect = correctCount;
      bestGrid = shuffled;
    }
  }

  const fallback = bestGrid ?? createShuffledGrid(targetGrid, baseSeed + 999);

  if (!hasMatchingColorCounts(fallback, targetGrid)) {
    throw new Error("Shuffle failed to preserve color counts");
  }

  return fallback;
}

/** @deprecated Use shuffleTargetGrid. Kept for tooling/tests. */
export function createClusteredInitialGrid(
  targetGrid: Grid,
  seed: number = Date.now(),
): Grid {
  return shuffleTargetGrid(targetGrid, seed);
}

export function getInitialCorrectPercent(
  targetGrid: Grid,
  seed?: number,
): number {
  const shuffled = shuffleTargetGrid(targetGrid, seed);
  return checkGridState(shuffled, targetGrid).percentage;
}
