import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { GemSlot } from "./GemSlot";
import { PlacementFlightGem } from "./PlacementFlightGem";
import { GemColor } from "../types/level";
import { CellPosition } from "../types/game";
import { cellKey } from "../constants/motion";
import { useGridCellAnimations } from "../hooks/useGridCellAnimations";
import type { ActivePlacementFlight } from "../hooks/usePlacementAnimator";

interface GemGridProps {
  rows: number;
  columns: number;
  targetGrid: string[][];
  currentGrid: (string | null)[][];
  paletteMap: Record<string, GemColor>;
  selectedPositions: CellPosition[];
  onCellRefRegister?: (row: number, col: number, node: View | null) => void;
  onCellSizeChange?: (cellSize: number) => void;
  onCellPress: (row: number, col: number) => void;
  onCellLongPress?: (row: number, col: number) => void;
  interactionsDisabled?: boolean;
  settlingDestinations?: CellPosition[];
  activeFlights?: ActivePlacementFlight[];
  onFlightLand?: (stepIndex: number) => void;
  onFlightDismiss?: (stepIndex: number) => void;
}

export const GemGrid: React.FC<GemGridProps> = ({
  rows,
  columns,
  targetGrid,
  currentGrid,
  paletteMap,
  selectedPositions,
  onCellRefRegister,
  onCellSizeChange,
  onCellPress,
  onCellLongPress,
  interactionsDisabled = false,
  settlingDestinations = [],
  activeFlights = [],
  onFlightLand,
  onFlightDismiss,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cellRefs = useRef<Map<string, View>>(new Map());

  const cellAnimations = useGridCellAnimations(currentGrid, targetGrid);

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

  const isSettlingCell = useCallback(
    (row: number, col: number) =>
      settlingDestinations.some(
        (position) => position.row === row && position.col === col,
      ),
    [settlingDestinations],
  );

  const handleCellPress = useCallback(
    (row: number, col: number) => {
      if (interactionsDisabled) {
        return;
      }

      onCellPress(row, col);
    },
    [interactionsDisabled, onCellPress],
  );

  const handleCellLongPress = useCallback(
    (row: number, col: number) => {
      if (interactionsDisabled) {
        return;
      }

      onCellLongPress?.(row, col);
    },
    [interactionsDisabled, onCellLongPress],
  );

  const boardFlights = activeFlights.filter(
    (flight) => flight.step.source !== undefined,
  );

  return (
    <View style={styles.gridWrapper} pointerEvents={interactionsDisabled ? "none" : "auto"}>
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

              const isSelected = selectedPositions.some(
                (position) =>
                  position.row === rowIndex && position.col === columnIndex,
              );

              const animationConfig = cellAnimations.get(
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
                  placementPulseToken={animationConfig?.pulseToken ?? 0}
                  cascadeDelayMs={animationConfig?.cascadeDelayMs ?? 0}
                  entryRotationDeg={animationConfig?.entryRotationDeg ?? 0}
                  isCorrectPlacement={
                    animationConfig?.isCorrectPlacement ?? false
                  }
                  isSettling={isSettlingCell(rowIndex, columnIndex)}
                  cellRef={(node) =>
                    registerCellRef(rowIndex, columnIndex, node)
                  }
                  onPress={() => handleCellPress(rowIndex, columnIndex)}
                  onLongPress={() =>
                    handleCellLongPress(rowIndex, columnIndex)
                  }
                />
              );
            })}
          </View>
        ))}

        {boardFlights.map(({ step, stepIndex }) => {
          const colorHex = paletteMap[step.colorId]?.hex ?? "#64748B";

          return (
            <PlacementFlightGem
              key={`board-flight-${stepIndex}-${step.dest.row}-${step.dest.col}`}
              step={step}
              stepIndex={stepIndex}
              colorHex={colorHex}
              cellSize={cellSize}
              onLand={onFlightLand ?? (() => {})}
              onDismiss={onFlightDismiss ?? (() => {})}
            />
          );
        })}
      </View>
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

    borderRadius: 8,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderWidth: 1,
    borderColor: "rgba(148, 163, 184, 0.15)",
  },

  row: {
    flexDirection: "row",
  },
});
