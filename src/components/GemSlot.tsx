import React, { memo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Gem } from "./Gem";
import { GemVisual } from "./GemVisual";
import { TutorialFinger } from "./TutorialFinger";
import { GemColor } from "../types/level";
import { theme } from '../constants/theme';

interface GemSlotProps {
  size: number;
  targetColor: GemColor;
  currentColor: GemColor | null;
  isSelected?: boolean;
  isDimmed?: boolean;
  isTutorialTarget?: boolean;
  suppressTouch?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const GemSlot: React.FC<GemSlotProps> = memo(({
  size,
  targetColor,
  currentColor,
  isSelected = false,
  isDimmed = false,
  isTutorialTarget = false,
  suppressTouch = false,
  onPress,
  onLongPress,
}) => {
  const pressableProps = suppressTouch
    ? { pointerEvents: "none" as const }
    : {};
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
          zIndex: isSelected || isTutorialTarget ? 10 : 0,
        },
      ]}
    >
      {isTutorialTarget && (
        <View
          pointerEvents="none"
          style={[
            styles.tutorialRing,
            {
              width: size + 6,
              height: size + 6,
              borderRadius: 4,
            },
          ]}
        />
      )}
      {!currentColor && (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          hitSlop={6}
          style={styles.fullHitArea}
          {...pressableProps}
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
          {...pressableProps}
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
          {...pressableProps}
        >
          <GemVisual colorHex={currentColor.hex} size={settledGemSize} variant="correct" />
        </Pressable>
      )}

      {isTutorialTarget && (
        <View style={styles.fingerOverlay} pointerEvents="none">
          <TutorialFinger size={Math.min(32, Math.max(22, size * 0.55))} />
        </View>
      )}
    </View>
  );
});

GemSlot.displayName = "GemSlot";

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

  tutorialRing: {
    position: "absolute",
    borderWidth: 3,
    borderColor: theme.colors.accent,
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 8,
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
    borderTopColor: theme.colors.holeShadowDark,
    borderLeftColor: theme.colors.holeShadowDark,
    borderBottomWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomColor: theme.colors.holeHighlight,
    borderRightColor: theme.colors.holeHighlight,
  },

  holeInner: {
    width: "82%",
    height: "82%",
    opacity: 0.9,
  },

  fingerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
});
