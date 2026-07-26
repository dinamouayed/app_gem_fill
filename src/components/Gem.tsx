import React, { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { MOTION } from "../constants/motion";
import { theme } from "../constants/theme";
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
}) => {
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (isSelected) {
      translateY.value = withSpring(
        MOTION.SELECTED_TRANSLATE_Y,
        MOTION.SPRING_SELECTION,
      );
    } else {
      cancelAnimation(translateY);
      scale.value = withSpring(1, MOTION.SPRING_DESELECT);
      translateY.value = withSpring(0, MOTION.SPRING_DESELECT);
    }
  }, [isSelected]);

  useEffect(() => {
    opacity.value = withTiming(isDimmed ? 0.5 : 1, {
      duration: MOTION.DIM_DURATION_MS,
    });
  }, [isDimmed]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
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
    backgroundColor: theme.colors.gemFlash,
  },
});
