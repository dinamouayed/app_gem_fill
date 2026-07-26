import { CellPosition } from "../types/game";
import { getConnectedGemGroup } from "./floodFill";

/** Première gemme mal placée sur le plateau. */
export function findMisplacedGemCell(
  grid: (string | null)[][],
  targetGrid: string[][],
): CellPosition | null {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      const cell = grid[row][col];
      if (cell !== null && cell !== targetGrid[row]?.[col]) {
        return { row, col };
      }
    }
  }
  return null;
}

/** Premier emplacement libre dans la zone de réserve. */
export function findFirstEmptyReserveSlot(
  reserve: (string | null)[],
): number | null {
  const index = reserve.findIndex((gemId) => gemId === null);
  return index === -1 ? null : index;
}

/** Toutes les cases vides du plateau. */
export function findEmptyCells(
  grid: (string | null)[][],
): CellPosition[] {
  const cells: CellPosition[] = [];

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      if (grid[row][col] === null) {
        cells.push({ row, col });
      }
    }
  }

  return cells;
}

/** Gemme mal placée déplaçable vers une des cases vidées récemment. */
export function findMisplacedGemForEmptyTargets(
  grid: (string | null)[][],
  targetGrid: string[][],
  emptyCells: CellPosition[],
): CellPosition | null {
  if (emptyCells.length === 0) {
    return findBestTutorialSelectCell(grid, targetGrid);
  }

  const emptyTargetColors = new Set(
    emptyCells.map((cell) => targetGrid[cell.row]?.[cell.col]),
  );

  let best: CellPosition | null = null;
  let bestGroupSize = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      const cell = grid[row][col];
      if (cell === null || cell === targetGrid[row]?.[col]) {
        continue;
      }

      if (!emptyTargetColors.has(cell)) {
        continue;
      }

      const group = getConnectedGemGroup(grid, { row, col }, targetGrid);
      if (group.length > bestGroupSize) {
        bestGroupSize = group.length;
        best = { row, col };
      }
    }
  }

  return best ?? findBestTutorialSelectCell(grid, targetGrid);
}

/** Case vide valide parmi un sous-ensemble de cases candidates. */
export function findValidPlacementInCells(
  grid: (string | null)[][],
  targetGrid: string[][],
  selectedPositions: CellPosition[],
  candidateCells: CellPosition[],
): CellPosition | null {
  if (selectedPositions.length === 0 || candidateCells.length === 0) {
    return findValidPlacementCell(grid, targetGrid, selectedPositions);
  }

  const first = selectedPositions[0];
  const colorId = grid[first.row]?.[first.col];
  if (!colorId) {
    return null;
  }

  for (const cell of candidateCells) {
    if (
      grid[cell.row]?.[cell.col] === null &&
      targetGrid[cell.row]?.[cell.col] === colorId
    ) {
      return cell;
    }
  }

  return findValidPlacementCell(grid, targetGrid, selectedPositions);
}

/** Case vide valide pour placer le groupe sélectionné. */
export function findValidPlacementCell(
  grid: (string | null)[][],
  targetGrid: string[][],
  selectedPositions: CellPosition[],
): CellPosition | null {
  if (selectedPositions.length === 0) {
    return null;
  }

  const first = selectedPositions[0];
  const colorId = grid[first.row]?.[first.col];
  if (!colorId) {
    return null;
  }

  for (let row = 0; row < targetGrid.length; row++) {
    for (let col = 0; col < (targetGrid[row]?.length ?? 0); col++) {
      if (grid[row][col] === null && targetGrid[row][col] === colorId) {
        return { row, col };
      }
    }
  }

  return null;
}

/** Gemme mal placée avec le plus grand groupe connecté (meilleur candidat pour le tutoriel). */
export function findBestTutorialSelectCell(
  grid: (string | null)[][],
  targetGrid: string[][],
): CellPosition | null {
  let best: CellPosition | null = null;
  let bestGroupSize = 0;

  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      const cell = grid[row][col];
      if (cell === null || cell === targetGrid[row]?.[col]) {
        continue;
      }

      const group = getConnectedGemGroup(grid, { row, col }, targetGrid);
      if (group.length > bestGroupSize) {
        bestGroupSize = group.length;
        best = { row, col };
      }
    }
  }

  return best;
}
