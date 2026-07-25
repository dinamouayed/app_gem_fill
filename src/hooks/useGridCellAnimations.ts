import { useEffect, useRef, useState } from "react";
import {
  MOTION,
  cellKey,
  type CellKey,
} from "../constants/motion";

export interface CellAnimationConfig {
  pulseToken: number;
  cascadeDelayMs: number;
  entryRotationDeg: number;
  isCorrectPlacement: boolean;
}

const computeEntryRotation = (
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number,
): number => {
  const deltaCol = toCol - fromCol;
  const deltaRow = toRow - fromRow;

  if (deltaCol === 0 && deltaRow === 0) {
    return 0;
  }

  const angleRad = Math.atan2(deltaCol, -deltaRow);
  const degrees = (angleRad * 180) / Math.PI;

  return Math.max(
    -MOTION.MOVE_ROTATION_MAX,
    Math.min(MOTION.MOVE_ROTATION_MAX, degrees * 0.12),
  );
};

/**
 * Détecte les changements de grille et produit des configs d'animation
 * par cellule (cascade, rotation d'entrée, pulse de pose correcte).
 * Couche purement visuelle — aucune logique de jeu.
 */
export function useGridCellAnimations(
  currentGrid: (string | null)[][],
  targetGrid: string[][],
  enabled = true,
): Map<CellKey, CellAnimationConfig> {
  const prevGridRef = useRef<(string | null)[][] | null>(null);
  const pulseCounterRef = useRef(0);
  const [animations, setAnimations] = useState<
    Map<CellKey, CellAnimationConfig>
  >(new Map());

  useEffect(() => {
    if (!enabled) {
      setAnimations(new Map());

      if (currentGrid.length > 0) {
        prevGridRef.current = currentGrid.map((row) => [...row]);
      }

      return;
    }

    const previousGrid = prevGridRef.current;

    prevGridRef.current = currentGrid.map((row) => [...row]);

    if (!previousGrid || previousGrid.length === 0) {
      return;
    }

    const removed: { row: number; col: number; color: string }[] = [];
    const added: { row: number; col: number; color: string }[] = [];

    for (let row = 0; row < currentGrid.length; row++) {
      for (let col = 0; col < (currentGrid[0]?.length ?? 0); col++) {
        const previousValue = previousGrid[row]?.[col] ?? null;
        const currentValue = currentGrid[row]?.[col] ?? null;

        if (previousValue === currentValue) {
          continue;
        }

        if (previousValue) {
          removed.push({ row, col, color: previousValue });
        }

        if (currentValue) {
          added.push({ row, col, color: currentValue });
        }
      }
    }

    if (added.length === 0) {
      return;
    }

    const totalCells = currentGrid.length * (currentGrid[0]?.length ?? 0);

    /*
     * Ignore les reshuffle / init : trop de changements simultanés.
     */
    if (
      totalCells > 0 &&
      (added.length > totalCells * 0.35 || removed.length > totalCells * 0.35)
    ) {
      return;
    }

    const usedRemovedIndices = new Set<number>();
    const nextAnimations = new Map<CellKey, CellAnimationConfig>();
    const correctPlacements: { row: number; col: number }[] = [];

    for (const addedCell of added) {
      let sourceIndex = -1;

      for (let index = 0; index < removed.length; index++) {
        if (
          !usedRemovedIndices.has(index) &&
          removed[index].color === addedCell.color
        ) {
          sourceIndex = index;
          break;
        }
      }

      let entryRotationDeg = 0;

      if (sourceIndex >= 0) {
        usedRemovedIndices.add(sourceIndex);

        const source = removed[sourceIndex];

        entryRotationDeg = computeEntryRotation(
          source.row,
          source.col,
          addedCell.row,
          addedCell.col,
        );
      }

      const isCorrectPlacement =
        targetGrid[addedCell.row]?.[addedCell.col] === addedCell.color;

      pulseCounterRef.current += 1;

      nextAnimations.set(cellKey(addedCell.row, addedCell.col), {
        pulseToken: pulseCounterRef.current,
        cascadeDelayMs: 0,
        entryRotationDeg,
        isCorrectPlacement,
      });

      if (isCorrectPlacement) {
        correctPlacements.push({
          row: addedCell.row,
          col: addedCell.col,
        });
      }
    }

    correctPlacements.forEach((cell, index) => {
      const key = cellKey(cell.row, cell.col);
      const config = nextAnimations.get(key);

      if (config) {
        config.cascadeDelayMs = index * MOTION.CASCADE_DELAY_MS;
      }
    });

    setAnimations(nextAnimations);

    const clearTimer = setTimeout(() => {
      setAnimations(new Map());
    }, 450);

    return () => clearTimeout(clearTimer);
  }, [currentGrid, targetGrid, enabled]);

  return animations;
}
