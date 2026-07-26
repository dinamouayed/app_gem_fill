import type { CellPosition } from "../types/game";
import { GRID_PADDING } from "../constants/motion";
import { computeExtendedTouchRadius } from "../constants/touch";
import { findBoardDestinationSlots } from "./floodFill";

export function getValidPlacementAnchors(
  grid: (string | null)[][],
  targetGrid: string[][],
  selectedPositions: CellPosition[],
  selectedReserveColorId: string | null,
): CellPosition[] {
  if (grid.length === 0) {
    return [];
  }

  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const anchors: CellPosition[] = [];

  if (selectedReserveColorId !== null) {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (grid[row][col] !== null) {
          continue;
        }

        if (targetGrid[row]?.[col] !== selectedReserveColorId) {
          continue;
        }

        const slots = findBoardDestinationSlots(
          grid,
          targetGrid,
          { row, col },
          selectedReserveColorId,
          new Set<string>(),
        );

        if (slots.length > 0) {
          anchors.push({ row, col });
        }
      }
    }

    return anchors;
  }

  if (selectedPositions.length === 0) {
    return [];
  }

  const first = selectedPositions[0];
  const groupColor = grid[first.row]?.[first.col];

  if (!groupColor) {
    return [];
  }

  const selectedSet = new Set(
    selectedPositions.map((position) => `${position.row},${position.col}`),
  );

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (grid[row][col] !== null) {
        continue;
      }

      if (targetGrid[row]?.[col] !== groupColor) {
        continue;
      }

      const slots = findBoardDestinationSlots(
        grid,
        targetGrid,
        { row, col },
        groupColor,
        selectedSet,
      );

      if (slots.length > 0) {
        anchors.push({ row, col });
      }
    }
  }

  return anchors;
}

export function pointToCell(
  x: number,
  y: number,
  cellSize: number,
  rows: number,
  columns: number,
): CellPosition | null {
  const innerX = x - GRID_PADDING;
  const innerY = y - GRID_PADDING;

  if (innerX < 0 || innerY < 0) {
    return null;
  }

  const col = Math.floor(innerX / cellSize);
  const row = Math.floor(innerY / cellSize);

  if (row < 0 || row >= rows || col < 0 || col >= columns) {
    return null;
  }

  return { row, col };
}

/**
 * Résout un tap en priorisant la case valide la plus proche
 * dans sa zone tactile étendue, sinon la case sous le doigt.
 */
export function resolveTapWithExtendedTargets(
  x: number,
  y: number,
  cellSize: number,
  rows: number,
  columns: number,
  validAnchors: CellPosition[],
): CellPosition | null {
  if (validAnchors.length > 0) {
    const extendedRadius = computeExtendedTouchRadius(cellSize);
    let nearestAnchor: CellPosition | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const anchor of validAnchors) {
      const centerX = GRID_PADDING + anchor.col * cellSize + cellSize / 2;
      const centerY = GRID_PADDING + anchor.row * cellSize + cellSize / 2;
      const distance = Math.hypot(x - centerX, y - centerY);
      const threshold = cellSize / 2 + extendedRadius;

      if (distance <= threshold && distance < nearestDistance) {
        nearestDistance = distance;
        nearestAnchor = anchor;
      }
    }

    if (nearestAnchor) {
      return nearestAnchor;
    }
  }

  return pointToCell(x, y, cellSize, rows, columns);
}
