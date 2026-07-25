import React, { useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { GemSlot } from "./GemSlot";
import { GemColor } from "../types/level";
import { CellPosition } from "../types/game";

interface GemGridProps {
  rows: number;
  columns: number;
  targetGrid: string[][];
  currentGrid: (string | null)[][];
  paletteMap: Record<string, GemColor>;
  selectedPositions: CellPosition[];
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
  onCellPress,
  onCellLongPress,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

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

              const isSelected = selectedPositions.some(
                (position) =>
                  position.row === rowIndex && position.col === columnIndex,
              );

              return (
                <GemSlot
                  key={`slot-${rowIndex}-${columnIndex}`}
                  size={cellSize}
                  targetColor={targetColor}
                  currentColor={currentColor}
                  isSelected={isSelected}
                  onPress={() => onCellPress(rowIndex, columnIndex)}
                  onLongPress={() => onCellLongPress?.(rowIndex, columnIndex)}
                />
              );
            })}
          </View>
        ))}
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
