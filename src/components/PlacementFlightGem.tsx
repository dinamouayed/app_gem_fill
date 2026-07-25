import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Gem } from "./Gem";
import { GRID_PADDING, MOTION } from "../constants/motion";
import type { PlacementStep } from "../types/game";

const FLIGHT_EASING = Easing.bezier(0.22, 1, 0.36, 1);

interface PlacementFlightGemProps {
  step: PlacementStep;
  stepIndex: number;
  colorHex: string;
  cellSize: number;
  onLand: (stepIndex: number) => void;
  onDismiss: (stepIndex: number) => void;
}

const getCellCenter = (
  row: number,
  col: number,
  cellSize: number,
): { x: number; y: number } => ({
  x: GRID_PADDING + col * cellSize + cellSize / 2,
  y: GRID_PADDING + row * cellSize + cellSize / 2,
});

export const PlacementFlightGem: React.FC<PlacementFlightGemProps> = ({
  step,
  stepIndex,
  colorHex,
  cellSize,
  onLand,
  onDismiss,
}) => {
  const gemSize = cellSize - 4;
  const progress = useSharedValue(0);
  const opacity = useSharedValue(1);
  const hasLanded = useSharedValue(0);
  const onLandRef = useRef(onLand);
  const onDismissRef = useRef(onDismiss);
  onLandRef.current = onLand;
  onDismissRef.current = onDismiss;

  const destination = getCellCenter(step.dest.row, step.dest.col, cellSize);
  const origin = getCellCenter(step.source!.row, step.source!.col, cellSize);

  const originX = useSharedValue(origin.x);
  const originY = useSharedValue(origin.y);
  const destX = useSharedValue(destination.x);
  const destY = useSharedValue(destination.y);

  useAnimatedReaction(
    () => progress.value,
    (value) => {
      if (
        value >= MOTION.FLIGHT_LAND_AT_PROGRESS &&
        hasLanded.value === 0
      ) {
        hasLanded.value = 1;
        runOnJS(onLandRef.current)(stepIndex);
      }
    },
  );

  useEffect(() => {
    originX.value = origin.x;
    originY.value = origin.y;
    destX.value = destination.x;
    destY.value = destination.y;
    hasLanded.value = 0;
    opacity.value = 1;

    progress.value = 0;
    progress.value = withTiming(
      1,
      {
        duration: MOTION.FLIGHT_DURATION_MS,
        easing: FLIGHT_EASING,
      },
      (finished) => {
        if (finished) {
          runOnJS(onDismissRef.current)(stepIndex);
        }
      },
    );
  }, [
    step.dest.row,
    step.dest.col,
    step.source?.row,
    step.source?.col,
    stepIndex,
    origin.x,
    origin.y,
    destination.x,
    destination.y,
    originX,
    originY,
    destX,
    destY,
    hasLanded,
    opacity,
    progress,
  ]);

  const wrapperStyle = useAnimatedStyle(() => {
    const travelX =
      originX.value + (destX.value - originX.value) * progress.value;
    const travelY =
      originY.value + (destY.value - originY.value) * progress.value;
    const lift = MOTION.SELECTED_TRANSLATE_Y * (1 - progress.value);
    const scale = interpolate(
      progress.value,
      [0, MOTION.FLIGHT_LAND_AT_PROGRESS, 0.94, 1],
      [1.04, 1.04, 0.93, 1],
      Extrapolation.CLAMP,
    );
    const fadeOut = interpolate(
      progress.value,
      [MOTION.FLIGHT_LAND_AT_PROGRESS, 1],
      [1, 0],
      Extrapolation.CLAMP,
    );

    return {
      position: "absolute",
      left: 0,
      top: 0,
      width: gemSize,
      height: gemSize,
      zIndex: 200,
      opacity: opacity.value * fadeOut,
      transform: [
        { translateX: travelX - gemSize / 2 },
        { translateY: travelY - gemSize / 2 + lift },
        { scale },
      ],
    };
  });

  return (
    <Animated.View style={wrapperStyle} pointerEvents="none">
      <View style={styles.elevatedShadow}>
        <Gem colorHex={colorHex} size={gemSize} interactive={false} />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  elevatedShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: MOTION.SHADOW_SELECTED.offsetY },
    shadowOpacity: MOTION.SHADOW_SELECTED.opacity,
    shadowRadius: MOTION.SHADOW_SELECTED.radius,
    elevation: MOTION.SELECTED_ELEVATION,
  },
});
