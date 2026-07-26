import React, { useEffect } from "react";
import { StyleSheet, Text } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface TutorialFingerProps {
  size?: number;
}

export const TutorialFinger: React.FC<TutorialFingerProps> = ({ size = 34 }) => {
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(6, { duration: 550, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 550, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );

    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 550, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: 550, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      false,
    );
  }, [scale, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]} pointerEvents="none">
      <Text style={[styles.finger, { fontSize: size }]}>👆</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  finger: {
    lineHeight: 38,
  },
});
