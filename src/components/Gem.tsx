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
import { LinearGradient } from "expo-linear-gradient";
import { MOTION } from "../constants/motion";

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

function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);

  if (Number.isNaN(num)) {
    return hex;
  }

  let red = (num >> 16) + percent;
  let green = ((num >> 8) & 0x00ff) + percent;
  let blue = (num & 0x0000ff) + percent;

  red = Math.min(255, Math.max(0, red));
  green = Math.min(255, Math.max(0, green));
  blue = Math.min(255, Math.max(0, blue));

  return (
    "#" +
    ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)
  );
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

  const lightHex = adjustColor(colorHex, 45);
  const darkHex = adjustColor(colorHex, -40);
  const borderRadius = Math.max(4, Math.round(size * 0.22));

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

  const defaultBorderColor = isCorrect
    ? "rgba(255,255,255,0.4)"
    : "rgba(255,255,255,0.15)";

  const gemContent = (
    <View
      style={[
        styles.gemBody,
        { borderRadius, borderColor: defaultBorderColor },
      ]}
    >
      <LinearGradient
        colors={[lightHex, colorHex, darkHex]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[StyleSheet.absoluteFill, { borderRadius }]}
      />

      <View
        style={[
          styles.glossHighlight,
          {
            width: size * 0.45,
            height: size * 0.25,
            borderRadius: borderRadius * 0.8,
          },
        ]}
      />

      <Animated.View
        pointerEvents="none"
        style={[styles.flashOverlay, { borderRadius }, flashStyle]}
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

  gemBody: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-start",
    alignItems: "flex-start",
    padding: 2,
    overflow: "hidden",
    borderWidth: 1.5,
  },

  glossHighlight: {
    backgroundColor: "rgba(255, 255, 255, 0.45)",
    marginTop: 2,
    marginLeft: 2,
    transform: [{ skewX: "-20deg" }],
  },

  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.55)",
  },
});
