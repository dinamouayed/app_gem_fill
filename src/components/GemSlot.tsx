import React, { useEffect, memo } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Gem } from "./Gem";
import { GemVisual } from "./GemVisual";
import { GemColor } from "../types/level";
import { MOTION } from "../constants/motion";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface GemSlotProps {
  size: number;
  targetColor: GemColor;
  currentColor: GemColor | null;
  isSelected?: boolean;
  isDimmed?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  placementPulseToken?: number;
  cascadeDelayMs?: number;
  entryRotationDeg?: number;
  isCorrectPlacement?: boolean;
  isSettling?: boolean;
  cellRef?: (node: View | null) => void;
}

interface AnimatedCorrectGemProps {
  size: number;
  colorHex: string;
  isDimmed: boolean;
  onPress: () => void;
  onLongPress?: () => void;
  placementPulseToken?: number;
  cascadeDelayMs?: number;
}

const AnimatedCorrectGem: React.FC<AnimatedCorrectGemProps> = ({
  size,
  colorHex,
  isDimmed,
  onPress,
  onLongPress,
  placementPulseToken = 0,
  cascadeDelayMs = 0,
}) => {
  const scale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(isDimmed ? 0.45 : 1, {
      duration: MOTION.DIM_DURATION_MS,
    });
  }, [isDimmed]);

  useEffect(() => {
    if (placementPulseToken <= 0) {
      return;
    }

    const spring = MOTION.SPRING_PLACEMENT;

    const snapAnimation = () => {
      scale.value = withSequence(
        withSpring(MOTION.PLACEMENT_COMPRESS, spring),
        withSpring(MOTION.PLACEMENT_SCALE_PEAK, spring),
        withSpring(1, spring),
      );

      flashOpacity.value = withSequence(
        withTiming(0.45, { duration: 70 }),
        withTiming(0, { duration: 130 }),
      );
    };

    if (cascadeDelayMs > 0) {
      scale.value = withDelay(
        cascadeDelayMs,
        withSequence(
          withSpring(MOTION.PLACEMENT_COMPRESS, spring),
          withSpring(MOTION.PLACEMENT_SCALE_PEAK, spring),
          withSpring(1, spring),
        ),
      );

      flashOpacity.value = withDelay(
        cascadeDelayMs,
        withSequence(
          withTiming(0.45, { duration: 70 }),
          withTiming(0, { duration: 130 }),
        ),
      );
    } else {
      snapAnimation();
    }
  }, [placementPulseToken]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      hitSlop={6}
      style={styles.fullHitArea}
    >
      <Animated.View style={animatedStyle}>
        <View style={styles.correctGemWrapper}>
          <GemVisual colorHex={colorHex} size={size} variant="correct" />

          <Animated.View
            pointerEvents="none"
            style={[
              styles.correctFlash,
              {
                width: size,
                height: size,
                borderRadius: Math.max(4, Math.round(size * 0.22)),
              },
              flashStyle,
            ]}
          />
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
};

export const GemSlot: React.FC<GemSlotProps> = memo(({
  size,
  targetColor,
  currentColor,
  isSelected = false,
  isDimmed = false,
  onPress,
  onLongPress,
  placementPulseToken = 0,
  cascadeDelayMs = 0,
  entryRotationDeg = 0,
  isCorrectPlacement = false,
  isSettling = false,
  cellRef,
}) => {
  const isMatch = currentColor?.id === targetColor.id;
  const showAsMovableGem = !!currentColor && (!isMatch || isSettling);

  const movableGemSize = Math.max(12, size - 2);
  const settledGemSize = Math.max(12, size);

  const showEntryOnMovable =
    placementPulseToken > 0 && !isCorrectPlacement && !isMatch;

  return (
    <View
      ref={cellRef}
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

      {showAsMovableGem && (
        <Pressable
          onPress={onPress}
          onLongPress={onLongPress}
          hitSlop={6}
          style={styles.fullHitArea}
        >
          <Gem
            colorHex={currentColor!.hex}
            size={movableGemSize}
            isSelected={isSelected}
            isDimmed={isDimmed}
            isCorrect={false}
            interactive={false}
            settleInstant={isSettling}
            placementPulseToken={showEntryOnMovable ? placementPulseToken : 0}
            cascadeDelayMs={0}
            entryRotationDeg={entryRotationDeg}
          />
        </Pressable>
      )}

      {currentColor && isMatch && !isSettling && (
        <AnimatedCorrectGem
          size={settledGemSize}
          colorHex={currentColor.hex}
          isDimmed={isDimmed}
          onPress={onPress}
          onLongPress={onLongPress}
          placementPulseToken={
            isCorrectPlacement ? placementPulseToken : 0
          }
          cascadeDelayMs={cascadeDelayMs}
        />
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

  correctGemWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  correctFlash: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.5)",
  },
});
