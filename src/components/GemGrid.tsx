import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, ScrollView } from 'react-native';
import { GemSlot } from './GemSlot';
import { GemColor } from '../types/level';
import { CellPosition } from '../types/game';

interface GemGridProps {
  rows: number;
  columns: number;
  targetGrid: string[][];
  currentGrid: (string | null)[][];
  paletteMap: Record<string, GemColor>;
  selectedPositions: CellPosition[];
  hasSelection?: boolean;
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
  hasSelection = false,
  onCellPress,
  onCellLongPress,
}) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  // Calculate dynamic gem cell size based on available screen space
  const cellSize = useMemo(() => {
    const horizontalMargin = 32; // Screen margins
    const availableWidth = windowWidth - horizontalMargin;
    const availableHeight = windowHeight * 0.52; // Give ~52% height to grid

    const sizeBasedOnWidth = Math.floor((availableWidth - columns * 4) / columns);
    const sizeBasedOnHeight = Math.floor((availableHeight - rows * 4) / rows);

    const computed = Math.min(sizeBasedOnWidth, sizeBasedOnHeight);
    return Math.max(18, Math.min(computed, 68)); // Clamp between 18px and 68px
  }, [windowWidth, windowHeight, rows, columns]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View
        style={[
          styles.gridContainer,
          {
            padding: 8,
          },
        ]}
      >
        {targetGrid.map((rowArray, r) => (
          <View key={`row-${r}`} style={styles.row}>
            {rowArray.map((targetColorId, c) => {
              const targetColor = paletteMap[targetColorId] || {
                id: targetColorId,
                hex: '#64748B',
                name: 'Inconnu',
              };

              const currentColorId = currentGrid[r]?.[c] ?? null;
              const currentColor = currentColorId ? paletteMap[currentColorId] ?? null : null;

              const isSelected = selectedPositions.some(
                (p) => p.row === r && p.col === c
              );
              const isDimmed = hasSelection && !isSelected && currentColor !== null;

              return (
                <GemSlot
                  key={`slot-${r}-${c}`}
                  size={cellSize}
                  targetColor={targetColor}
                  currentColor={currentColor}
                  isSelected={isSelected}
                  isDimmed={isDimmed}
                  onPress={() => onCellPress(r, c)}
                  onLongPress={() => onCellLongPress && onCellLongPress(r, c)}
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  gridContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
