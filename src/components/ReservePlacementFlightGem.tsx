import React, { useEffect, useRef } from "react";
import { StyleSheet, View, type View as ViewType } from "react-native";
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
import { MOTION } from "../constants/motion";
import type { PlacementStep } from "../types/game";

const FLIGHT_EASING = Easing.bezier(0.22, 1, 0.36, 1);

interface ReservePlacementFlightGemProps {
  step: PlacementStep;
  stepIndex: number;
  colorHex: string;
  gemSize: number;
  overlayRef: React.RefObject<ViewType | null>;
  getReserveSlotRef: (index: number) => ViewType | null;
  getCellRef: (row: number, col: number) => ViewType | null;
  onTakeoff?: () => void;
  onLand: (stepIndex: number) => void;
  onDismiss: (stepIndex: number) => void;
}

const measureCenterInOverlay = (
  node: ViewType | null,
  overlay: ViewType | null,
): Promise<{ x: number; y: number } | null> =>
  new Promise((resolve) => {
    if (!node || !overlay) {
      resolve(null);
      return;
    }

    requestAnimationFrame(() => {
      node.measureLayout(
        overlay,
        (left, top, width, height) => {
          resolve({ x: left + width / 2, y: top + height / 2 });
        },
        () => resolve(null),
      );
    });
  });

export const ReservePlacementFlightGem: React.FC<
  ReservePlacementFlightGemProps
> = ({
  step,
  stepIndex,
  colorHex,
  gemSize,
  overlayRef,
  getReserveSlotRef,
  getCellRef,
  onTakeoff,
  onLand,
  onDismiss,
}) => {
  const progress = useSharedValue(0);
  const opacity = useSharedValue(0);
  const hasLanded = useSharedValue(0);
  const isReady = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const destX = useSharedValue(0);
  const destY = useSharedValue(0);
  const onTakeoffRef = useRef(onTakeoff);
  const onLandRef = useRef(onLand);
  const onDismissRef = useRef(onDismiss);
  onTakeoffRef.current = onTakeoff;
  onLandRef.current = onLand;
  onDismissRef.current = onDismiss;

  useAnimatedReaction(
    () => progress.value,
    (value) => {
      if (
        isReady.value === 1 &&
        value >= MOTION.FLIGHT_LAND_AT_PROGRESS &&
        hasLanded.value === 0
      ) {
        hasLanded.value = 1;
        runOnJS(onLandRef.current)(stepIndex);
      }
    },
  );

  useEffect(() => {
    let cancelled = false;

    const startFlight = async () => {
      const reserveIndex = step.reserveSourceIndex;

      if (reserveIndex === undefined) {
        return;
      }

      const [originPoint, destinationPoint] = await Promise.all([
        measureCenterInOverlay(
          getReserveSlotRef(reserveIndex),
          overlayRef.current,
        ),
        measureCenterInOverlay(
          getCellRef(step.dest.row, step.dest.col),
          overlayRef.current,
        ),
      ]);

      if (cancelled || !originPoint || !destinationPoint) {
        return;
      }

      originX.value = originPoint.x;
      originY.value = originPoint.y;
      destX.value = destinationPoint.x;
      destY.value = destinationPoint.y;
      hasLanded.value = 0;
      isReady.value = 1;

      if (onTakeoffRef.current) {
        onTakeoffRef.current();
      }

      opacity.value = withTiming(1, { duration: 60 });
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
    };

    startFlight();

    return () => {
      cancelled = true;
    };
  }, [
    step.dest.row,
    step.dest.col,
    step.reserveSourceIndex,
    stepIndex,
    getReserveSlotRef,
    getCellRef,
    overlayRef,
    originX,
    originY,
    destX,
    destY,
    hasLanded,
    isReady,
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
      zIndex: 200 + (step.reserveSourceIndex ?? 0),
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
