import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { GemSlot } from "./GemSlot";
import { GemColor } from "../types/level";
import { CellPosition } from "../types/game";
import { useGridCellAnimations } from "../hooks/useGridCellAnimations";
import { cellKey } from "../constants/motion";
import { PlacementFlightGem } from "./PlacementFlightGem";
import type { ActivePlacementFlight } from "../hooks/usePlacementAnimator";

interface GemGridProps {
  rows: number;
  columns: number;
  targetGrid: string[][];
  currentGrid: (string | null)[][];
  paletteMap: Record<string, GemColor>;
  selectedPositions: CellPosition[];
  isPlacementAnimating?: boolean;
  activeFlights?: ActivePlacementFlight[];
  waitingSourcePositions?: CellPosition[];
  settlingDestinations?: CellPosition[];
  onPlacementFlightLand?: (stepIndex: number) => void;
  onPlacementFlightDismiss?: (stepIndex: number) => void;
  onCellRefRegister?: (row: number, col: number, node: View | null) => void;
  onCellSizeChange?: (cellSize: number) => void;
  onCellPress: (row: number, col: number) => void;
  onCellLongPress?: (row: number, col: number) => void;
}

export const GemGrid: React.FC<GemGridProps> = ({
  rows,
  columns,
  targetGrid,
  currentGrid,
  paletteMap,
  selectedPositions,
  isPlacementAnimating = false,
  activeFlights = [],
  waitingSourcePositions = [],
  settlingDestinations = [],
  onPlacementFlightLand,
  onPlacementFlightDismiss,
  onCellRefRegister,
  onCellSizeChange,
  onCellPress,
  onCellLongPress,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cellRefs = useRef<Map<string, View>>(new Map());

  const diffAnimations = useGridCellAnimations(
    currentGrid,
    targetGrid,
    !isPlacementAnimating,
  );

  const cellSize = useMemo(() => {
    const horizontalMargin = 32;
    const availableWidth = windowWidth - horizontalMargin;
    const availableHeight = windowHeight * 0.52;

    const sizeBasedOnWidth = Math.floor(
      (availableWidth - columns * 4) / columns,
    );

    const sizeBasedOnHeight = Math.floor((availableHeight - rows * 4) / rows);

    const computed = Math.min(sizeBasedOnWidth, sizeBasedOnHeight);

    return Math.max(18, Math.min(computed, 68));
  }, [windowWidth, windowHeight, rows, columns]);

  useEffect(() => {
    onCellSizeChange?.(cellSize);
  }, [cellSize, onCellSizeChange]);

  const registerCellRef = useCallback(
    (row: number, col: number, node: View | null) => {
      const key = cellKey(row, col);

      if (node) {
        cellRefs.current.set(key, node);
      } else {
        cellRefs.current.delete(key);
      }

      onCellRefRegister?.(row, col, node);
    },
    [onCellRefRegister],
  );

  const boardFlights = activeFlights.filter(
    ({ step }) => step.reserveSourceIndex === undefined,
  );

  return (
    <View style={styles.gridWrapper}>
      <View style={styles.gridContainer}>
        {targetGrid.map((rowArray, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {rowArray.map((targetColorId, columnIndex) => {
              const targetColor = paletteMap[targetColorId] ?? {
                id: targetColorId,
                hex: "#64748B",
                name: "Inconnu",
              };

              const currentColorId =
                currentGrid[rowIndex]?.[columnIndex] ?? null;

              const currentColor = currentColorId
                ? (paletteMap[currentColorId] ?? null)
                : null;

              const isSelected =
                selectedPositions.some(
                  (position) =>
                    position.row === rowIndex && position.col === columnIndex,
                ) ||
                waitingSourcePositions.some(
                  (position) =>
                    position.row === rowIndex && position.col === columnIndex,
                );

              const isSettling = settlingDestinations.some(
                (position) =>
                  position.row === rowIndex && position.col === columnIndex,
              );

              const animation = diffAnimations.get(
                cellKey(rowIndex, columnIndex),
              );

              return (
                <GemSlot
                  key={`slot-${rowIndex}-${columnIndex}`}
                  size={cellSize}
                  targetColor={targetColor}
                  currentColor={currentColor}
                  isSelected={isSelected}
                  isDimmed={false}
                  placementPulseToken={animation?.pulseToken ?? 0}
                  cascadeDelayMs={animation?.cascadeDelayMs ?? 0}
                  entryRotationDeg={animation?.entryRotationDeg ?? 0}
                  isCorrectPlacement={animation?.isCorrectPlacement ?? false}
                  isSettling={isSettling}
                  cellRef={(node) =>
                    registerCellRef(rowIndex, columnIndex, node)
                  }
                  onPress={() => onCellPress(rowIndex, columnIndex)}
                  onLongPress={() => onCellLongPress?.(rowIndex, columnIndex)}
                />
              );
            })}
          </View>
        ))}
      </View>

      {onPlacementFlightLand &&
        onPlacementFlightDismiss &&
        boardFlights.map(({ stepIndex, step }) => (
          <PlacementFlightGem
            key={`flight-${stepIndex}`}
            step={step}
            stepIndex={stepIndex}
            colorHex={paletteMap[step.colorId]?.hex ?? "#64748B"}
            cellSize={cellSize}
            onLand={onPlacementFlightLand}
            onDismiss={onPlacementFlightDismiss}
          />
        ))}
    </View>
  );
};

const styles = StyleSheet.create({
  gridWrapper: {
    position: "relative",
    overflow: "visible",
  },

  gridContainer: {
    padding: 8,

    backgroundColor: "#0F172A",

    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#334155",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,

    overflow: "visible",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
});
