import React, { memo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Gem } from "./Gem";
import { GemVisual } from "./GemVisual";
import { GemColor } from "../types/level";

interface GemSlotProps {
  size: number;
  targetColor: GemColor;
  currentColor: GemColor | null;
  isSelected?: boolean;
  isDimmed?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const GemSlot: React.FC<GemSlotProps> = memo(({
  size,
  targetColor,
  currentColor,
  isSelected = false,
  isDimmed = false,
  onPress,
  onLongPress,
}) => {
  const isMatch = currentColor?.id === targetColor.id;
  const movableGemSize = Math.max(12, size - 2);
  const settledGemSize = Math.max(12, size);

  return (
    <View
      style={[
        styles.slot,
        {
          width: size,
          height: size,
          backgroundColor: targetColor.hex,
          zIndex: isSelected ? 10 : 0,
        },
      ]}
    >
      {!currentColor && (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          hitSlop={6}
          style={styles.fullHitArea}
        >
          <View
            style={[
              styles.hole,
              {
                width: movableGemSize,
                height: movableGemSize,
                borderRadius: Math.max(3, Math.round(movableGemSize * 0.16)),
                backgroundColor: darkenHex(targetColor.hex, 0.3),
              },
            ]}
          >
            <View
              style={[
                styles.holeInner,
                {
                  borderRadius: Math.max(2, Math.round(movableGemSize * 0.12)),
                  backgroundColor: darkenHex(targetColor.hex, 0.18),
                },
              ]}
            />
          </View>
        </Pressable>
      )}

      {currentColor && !isMatch && (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          hitSlop={6}
          style={styles.fullHitArea}
        >
          <Gem
            colorHex={currentColor.hex}
            size={movableGemSize}
            isSelected={isSelected}
            isDimmed={isDimmed}
            isCorrect={false}
            interactive={false}
          />
        </Pressable>
      )}

      {currentColor && isMatch && (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          hitSlop={6}
          style={styles.fullHitArea}
        >
          <GemVisual colorHex={currentColor.hex} size={settledGemSize} variant="correct" />
        </Pressable>
      )}
    </View>
  );
});

const darkenHex = (hex: string, amount: number): string => {
  const normalizedHex = hex.replace("#", "");

  if (normalizedHex.length !== 6) {
    return hex;
  }

  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);

  const factor = 1 - amount;

  return `rgb(
    ${Math.round(red * factor)},
    ${Math.round(green * factor)},
    ${Math.round(blue * factor)}
  )`;
};

const styles = StyleSheet.create({
  slot: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
    margin: 0,
    borderRadius: 0,
    overflow: "visible",
  },

  fullHitArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  hole: {
    justifyContent: "center",
    alignItems: "center",
    borderTopWidth: 2,
    borderLeftWidth: 2,
    borderTopColor: "rgba(0, 0, 0, 0.4)",
    borderLeftColor: "rgba(0, 0, 0, 0.4)",
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomColor: "rgba(255, 255, 255, 0.22)",
    borderRightColor: "rgba(255, 255, 255, 0.22)",
  },

  holeInner: {
    width: "82%",
    height: "82%",
    opacity: 0.9,
  },
});
