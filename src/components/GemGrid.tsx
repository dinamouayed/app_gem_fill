import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS } from "react-native-reanimated";
import { GemSlot } from "./GemSlot";
import { GemColor } from "../types/level";
import { CellPosition } from "../types/game";
import { theme } from "../constants/theme";
import {
  getValidPlacementAnchors,
  pointToCell,
  resolveTapWithExtendedTargets,
} from "../utils/placementHelpers";

interface GemGridProps {
  rows: number;
  columns: number;
  targetGrid: string[][];
  currentGrid: (string | null)[][];
  paletteMap: Record<string, GemColor>;
  selectedPositions: CellPosition[];
  selectedReserveColorId: string | null;
  tutorialTargetCell?: CellPosition | null;
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
  selectedReserveColorId,
  tutorialTargetCell = null,
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

  const hasActiveSelection =
    selectedPositions.length > 0 || selectedReserveColorId !== null;

  const validPlacementAnchors = useMemo(
    () =>
      hasActiveSelection
        ? getValidPlacementAnchors(
            currentGrid,
            targetGrid,
            selectedPositions,
            selectedReserveColorId,
          )
        : [],
    [
      hasActiveSelection,
      currentGrid,
      targetGrid,
      selectedPositions,
      selectedReserveColorId,
    ],
  );

  const handleSelectionTap = useCallback(
    (x: number, y: number) => {
      const cell = resolveTapWithExtendedTargets(
        x,
        y,
        cellSize,
        rows,
        columns,
        validPlacementAnchors,
      );

      if (cell) {
        onCellPress(cell.row, cell.col);
      }
    },
    [cellSize, columns, onCellPress, rows, validPlacementAnchors],
  );

  const handleSelectionLongPress = useCallback(
    (x: number, y: number) => {
      const cell = pointToCell(x, y, cellSize, rows, columns);

      if (cell) {
        onCellLongPress?.(cell.row, cell.col);
      }
    },
    [cellSize, columns, onCellLongPress, rows],
  );

  const selectionTapGesture = useMemo(
    () =>
      Gesture.Tap()
        .enabled(hasActiveSelection)
        .onEnd((event) => {
          runOnJS(handleSelectionTap)(event.x, event.y);
        }),
    [hasActiveSelection, handleSelectionTap],
  );

  const selectionLongPressGesture = useMemo(
    () =>
      Gesture.LongPress()
        .enabled(hasActiveSelection)
        .minDuration(500)
        .onStart((event) => {
          runOnJS(handleSelectionLongPress)(event.x, event.y);
        }),
    [hasActiveSelection, handleSelectionLongPress],
  );

  const selectionGestures = useMemo(
    () => Gesture.Exclusive(selectionLongPressGesture, selectionTapGesture),
    [selectionLongPressGesture, selectionTapGesture],
  );

  const gridContent = (
    <View style={styles.gridContainer}>
      {targetGrid.map((rowArray, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {rowArray.map((targetColorId, columnIndex) => {
            const targetColor = paletteMap[targetColorId] ?? {
              id: targetColorId,
              hex: theme.colors.unknownGem,
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

            const isTutorialTarget =
              tutorialTargetCell?.row === rowIndex &&
              tutorialTargetCell?.col === columnIndex;

            return (
              <GemSlot
                key={`slot-${rowIndex}-${columnIndex}`}
                size={cellSize}
                targetColor={targetColor}
                currentColor={currentColor}
                isSelected={isSelected}
                isTutorialTarget={isTutorialTarget}
                suppressTouch={hasActiveSelection}
                onPress={() => onCellPress(rowIndex, columnIndex)}
                onLongPress={() => onCellLongPress?.(rowIndex, columnIndex)}
              />
            );
          })}
        </View>
      ))}
    </View>
  );

  return (
    <View style={styles.gridWrapper}>
      <GestureDetector gesture={selectionGestures}>
        {gridContent}
      </GestureDetector>
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
    backgroundColor: theme.colors.gridBackdrop,
    borderWidth: 1,
    borderColor: theme.colors.gridBorder,
  },

  row: {
    flexDirection: "row",
  },
});
