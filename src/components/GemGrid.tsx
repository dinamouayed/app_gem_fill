import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
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
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
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
                  isDimmed={false}
                  onPress={() => onCellPress(rowIndex, columnIndex)}
                  onLongPress={() => onCellLongPress?.(rowIndex, columnIndex)}
                />
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
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

    overflow: "hidden",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
