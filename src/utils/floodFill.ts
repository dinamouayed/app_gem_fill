import type { CellPosition } from "../types/game";

/**
 * Perform an 8-directional BFS Flood Fill to find all connected gems of the same color.
 * Orthogonal and diagonal neighbors are included.
 * Empty cells (null) are ignored.
 * Returns positions in deterministic BFS order.
 */
export function getConnectedGemGroup(
  grid: (string | null)[][],
  startPos: CellPosition,
  targetGrid?: string[][],
): CellPosition[] {
  if (!grid || grid.length === 0 || grid[0].length === 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;

  const { row, col } = startPos;
  if (row < 0 || row >= rows || col < 0 || col >= cols) return [];

  const targetColor = grid[row][col];
  if (!targetColor) return [];

  // A correctly placed gem is locked
  if (targetGrid && targetGrid[row]?.[col] === targetColor) {
    return [];
  }

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );
  const result: CellPosition[] = [];
  const queue: CellPosition[] = [startPos];

  visited[row][col] = true;

  // 8 directions: orthogonal and diagonal
  const directions = [
    // Orthogonal directions
    { r: -1, c: 0 }, // Up
    { r: 1, c: 0 }, // Down
    { r: 0, c: -1 }, // Left
    { r: 0, c: 1 }, // Right

    // Diagonal directions
    { r: -1, c: -1 }, // Top-left
    { r: -1, c: 1 }, // Top-right
    { r: 1, c: -1 }, // Bottom-left
    { r: 1, c: 1 }, // Bottom-right
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    result.push(current);

    for (const dir of directions) {
      const nr = current.row + dir.r;
      const nc = current.col + dir.c;

      if (
        nr >= 0 &&
        nr < rows &&
        nc >= 0 &&
        nc < cols &&
        !visited[nr][nc] &&
        grid[nr][nc] === targetColor &&
        (!targetGrid || targetGrid[nr]?.[nc] !== targetColor)
      ) {
        visited[nr][nc] = true;
        queue.push({ row: nr, col: nc });
      }
    }
  }

  return result;
}

/**
 * Move a selected group of gems to the reserve area up to reserve capacity.
 * Remaining unmoved gems stay in their initial position on the grid and remain selected.
 */
export function moveGroupToReserve(
  grid: (string | null)[][],
  reserve: (string | null)[],
  selectedPositions: CellPosition[],
): {
  nextGrid: (string | null)[][];
  nextReserve: (string | null)[];
  movedGemIds: string[];
  remainingSelectedPositions: CellPosition[];
} {
  const nextGrid = grid.map((r) => [...r]);
  const nextReserve = [...reserve];
  const movedGemIds: string[] = [];
  const remainingSelectedPositions: CellPosition[] = [];

  for (const pos of selectedPositions) {
    const gemColor = nextGrid[pos.row]?.[pos.col];
    if (!gemColor) continue;

    // Find first empty slot in reserve
    const emptyIdx = nextReserve.findIndex((slot) => slot === null);
    if (emptyIdx !== -1) {
      nextReserve[emptyIdx] = gemColor;
      nextGrid[pos.row][pos.col] = null;
      movedGemIds.push(gemColor);
    } else {
      // Reserve full: gem remains at current position on grid
      remainingSelectedPositions.push(pos);
    }
  }

  return {
    nextGrid,
    nextReserve,
    movedGemIds,
    remainingSelectedPositions,
  };
}

/**
 * Find valid destination slots on the grid starting from a destination position using BFS.
 */
export function findBoardDestinationSlots(
  grid: (string | null)[][],
  targetGrid: string[][],
  destination: CellPosition,
  groupColor: string,
  selectedSet: Set<string>,
): CellPosition[] {
  if (!grid || grid.length === 0 || grid[0].length === 0) return [];

  const rows = grid.length;
  const cols = grid[0].length;
  const { row: destRow, col: destCol } = destination;

  if (destRow < 0 || destRow >= rows || destCol < 0 || destCol >= cols) {
    return [];
  }

  // Refuse immediately a destination of the wrong color
  if (targetGrid[destRow]?.[destCol] !== groupColor) {
    return [];
  }

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );

  const queue: CellPosition[] = [destination];
  visited[destRow][destCol] = true;

  const candidateSlots: CellPosition[] = [];

  const directions = [
    { r: -1, c: 0 },
    { r: 1, c: 0 },
    { r: 0, c: -1 },
    { r: 0, c: 1 },
    { r: -1, c: -1 },
    { r: -1, c: 1 },
    { r: 1, c: -1 },
    { r: 1, c: 1 },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const posKey = `${current.row},${current.col}`;
    const cellValue = grid[current.row][current.col];
    const isSelectedCell = selectedSet.has(posKey);
    const cellTargetColor = targetGrid[current.row]?.[current.col];

    // Cell is candidate if it's empty (or part of selected group being moved) AND matches target color rule
    const isSlotAvailable = cellValue === null || isSelectedCell;
    const isColorCompatible = cellTargetColor === groupColor;

    if (isSlotAvailable && isColorCompatible) {
      candidateSlots.push(current);
    }

    for (const dir of directions) {
      const nr = current.row + dir.r;
      const nc = current.col + dir.c;

      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !visited[nr][nc]) {
        visited[nr][nc] = true;
        const nextTargetColor = targetGrid[nr]?.[nc];
        const nextValue = grid[nr][nc];
        const nextIsSelected = selectedSet.has(`${nr},${nc}`);
        const nextAvailable = nextValue === null || nextIsSelected;
        const nextCompatible = nextTargetColor === groupColor;

        // Traverse only adjacent valid target areas or empty slots
        if (nextAvailable && nextCompatible) {
          queue.push({ row: nr, col: nc });
        }
      }
    }
  }

  return candidateSlots;
}

/**
 * Move a selected group of gems to target slots on the board starting from destination.
 */
export function moveGroupToBoard(
  grid: (string | null)[][],
  targetGrid: string[][],
  selectedPositions: CellPosition[],
  destination: CellPosition,
): {
  nextGrid: (string | null)[][];
  movedGemIds: string[];
  remainingSelectedPositions: CellPosition[];
} {
  if (selectedPositions.length === 0) {
    return { nextGrid: grid, movedGemIds: [], remainingSelectedPositions: [] };
  }

  const firstPos = selectedPositions[0];
  const groupColor = grid[firstPos.row]?.[firstPos.col];

  if (!groupColor) {
    return { nextGrid: grid, movedGemIds: [], remainingSelectedPositions: [] };
  }

  const selectedSet = new Set(
    selectedPositions.map((p) => `${p.row},${p.col}`),
  );
  const candidateSlots = findBoardDestinationSlots(
    grid,
    targetGrid,
    destination,
    groupColor,
    selectedSet,
  );

  if (candidateSlots.length === 0) {
    return {
      nextGrid: grid,
      movedGemIds: [],
      remainingSelectedPositions: selectedPositions,
    };
  }

  const nextGrid = grid.map((r) => [...r]);

  // First, temporarily remove all selected gems from nextGrid to avoid overwriting issues
  for (const pos of selectedPositions) {
    nextGrid[pos.row][pos.col] = null;
  }

  const movedGemIds: string[] = [];
  const remainingSelectedPositions: CellPosition[] = [];

  const movesCount = Math.min(selectedPositions.length, candidateSlots.length);

  // Place gems into candidate slots
  for (let i = 0; i < movesCount; i++) {
    const destSlot = candidateSlots[i];
    nextGrid[destSlot.row][destSlot.col] = groupColor;
    movedGemIds.push(groupColor);
  }

  // Any gems beyond candidateSlots count stay at their initial positions
  for (let i = movesCount; i < selectedPositions.length; i++) {
    const origPos = selectedPositions[i];
    nextGrid[origPos.row][origPos.col] = groupColor;
    remainingSelectedPositions.push(origPos);
  }

  return {
    nextGrid,
    movedGemIds,
    remainingSelectedPositions,
  };
}

/**
 * Place gems from the reserve onto connected valid board slots
 * starting from a destination position (8-directional BFS).
 */
export function moveReserveGroupToBoard(
  grid: (string | null)[][],
  targetGrid: string[][],
  reserve: (string | null)[],
  destination: CellPosition,
  colorId: string,
): {
  nextGrid: (string | null)[][];
  nextReserve: (string | null)[];
  placedCount: number;
} {
  const candidateSlots = findBoardDestinationSlots(
    grid,
    targetGrid,
    destination,
    colorId,
    new Set<string>(),
  );

  if (candidateSlots.length === 0) {
    return { nextGrid: grid, nextReserve: reserve, placedCount: 0 };
  }

  const availableInReserve = reserve.filter(
    (gemId) => gemId === colorId,
  ).length;

  const placeCount = Math.min(candidateSlots.length, availableInReserve);

  if (placeCount === 0) {
    return { nextGrid: grid, nextReserve: reserve, placedCount: 0 };
  }

  const nextGrid = grid.map((row) => [...row]);
  const nextReserve = [...reserve];

  for (let index = 0; index < placeCount; index++) {
    const slot = candidateSlots[index];
    nextGrid[slot.row][slot.col] = colorId;
  }

  let removed = 0;

  for (
    let index = 0;
    index < nextReserve.length && removed < placeCount;
    index++
  ) {
    if (nextReserve[index] === colorId) {
      nextReserve[index] = null;
      removed++;
    }
  }

  return { nextGrid, nextReserve, placedCount: placeCount };
}
