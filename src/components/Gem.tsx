import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MOTION } from "../constants/motion";
import { GemVisual } from "./GemVisual";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface GemProps {
  colorHex: string;
  size: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  isCorrect?: boolean;
  interactive?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
  placementPulseToken?: number;
  cascadeDelayMs?: number;
  entryRotationDeg?: number;
  settleInstant?: boolean;
}

export const Gem: React.FC<GemProps> = ({
  colorHex,
  size,
  isSelected = false,
  isDimmed = false,
  isCorrect = false,
  interactive = true,
  onPress,
  onLongPress,
  placementPulseToken = 0,
  cascadeDelayMs = 0,
  entryRotationDeg = 0,
  settleInstant = false,
}) => {
  const scale = useSharedValue(settleInstant ? 1 : 1);
  const translateY = useSharedValue(settleInstant ? 0 : 0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (settleInstant) {
      scale.value = 1;
      translateY.value = isSelected ? MOTION.SELECTED_TRANSLATE_Y : 0;
      rotate.value = 0;
      return;
    }

    if (isSelected) {
      translateY.value = withSpring(
        MOTION.SELECTED_TRANSLATE_Y,
        MOTION.SPRING_SELECTION,
      );
    } else {
      cancelAnimation(translateY);

      scale.value = withSpring(1, MOTION.SPRING_DESELECT);
      translateY.value = withSpring(0, MOTION.SPRING_DESELECT);
      rotate.value = withSpring(0, MOTION.SPRING_DESELECT);
    }
  }, [isSelected, settleInstant]);

  useEffect(() => {
    opacity.value = withTiming(isDimmed ? 0.5 : 1, {
      duration: MOTION.DIM_DURATION_MS,
    });
  }, [isDimmed]);

  useEffect(() => {
    if (placementPulseToken <= 0) {
      return;
    }

    const restScale = 1;
    const spring = MOTION.SPRING_PLACEMENT;

    const entryAnimation = () => {
      "worklet";

      rotate.value = withSequence(
        withTiming(entryRotationDeg, { duration: 70 }),
        withSpring(0, spring),
      );

      scale.value = withSequence(
        withSpring(0.9, spring),
        withSpring(restScale, spring),
      );
    };

    const delayedEntry = () => {
      rotate.value = withDelay(
        cascadeDelayMs,
        withSequence(
          withTiming(entryRotationDeg, { duration: 70 }),
          withSpring(0, spring),
        ),
      );

      scale.value = withDelay(
        cascadeDelayMs,
        withSequence(
          withSpring(0.9, spring),
          withSpring(restScale, spring),
        ),
      );
    };

    if (cascadeDelayMs > 0) {
      delayedEntry();
    } else {
      entryAnimation();
    }
  }, [placementPulseToken]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
    zIndex: isSelected ? 99 : 1,
  }));

  const flashStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  const gemVariant = isSelected
    ? "selected"
    : isCorrect
      ? "correct"
      : "default";

  const gemContent = (
    <View style={styles.gemWrapper}>
      <GemVisual colorHex={colorHex} size={size} variant={gemVariant} />

      <Animated.View
        pointerEvents="none"
        style={[
          styles.flashOverlay,
          {
            width: size,
            height: size,
            borderRadius: Math.max(4, Math.round(size * 0.22)),
          },
          flashStyle,
        ]}
      />
    </View>
  );

  if (!interactive) {
    return (
      <Animated.View
        style={[styles.container, { width: size, height: size }, containerStyle]}
      >
        {gemContent}
      </Animated.View>
    );
  }

  return (
    <AnimatedPressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.container, { width: size, height: size }, containerStyle]}
    >
      {gemContent}
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },

  gemWrapper: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },

  flashOverlay: {
    position: "absolute",
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
});
