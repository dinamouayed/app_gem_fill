import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  clamp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import { BOARD_ZOOM } from "../constants/motion";

interface ZoomableBoardProps {
  children: React.ReactNode;
}

function clampPan(
  translateX: SharedValue<number>,
  translateY: SharedValue<number>,
  scale: SharedValue<number>,
  containerWidth: number,
  containerHeight: number,
  contentWidth: number,
  contentHeight: number,
) {
  "worklet";

  if (scale.value <= BOARD_ZOOM.MIN) {
    translateX.value = withSpring(0, BOARD_ZOOM.SPRING);
    translateY.value = withSpring(0, BOARD_ZOOM.SPRING);
    return;
  }

  const scaledWidth = contentWidth * scale.value;
  const scaledHeight = contentHeight * scale.value;

  const maxTranslateX = Math.max(0, (scaledWidth - containerWidth) / 2);
  const maxTranslateY = Math.max(0, (scaledHeight - containerHeight) / 2);

  translateX.value = withSpring(
    clamp(translateX.value, -maxTranslateX, maxTranslateX),
    BOARD_ZOOM.SPRING,
  );
  translateY.value = withSpring(
    clamp(translateY.value, -maxTranslateY, maxTranslateY),
    BOARD_ZOOM.SPRING,
  );
}

export const ZoomableBoard: React.FC<ZoomableBoardProps> = ({ children }) => {
  const scale = useSharedValue<number>(BOARD_ZOOM.MIN);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const containerWidth = useSharedValue(0);
  const containerHeight = useSharedValue(0);
  const contentWidth = useSharedValue(0);
  const contentHeight = useSharedValue(0);

  const savedScale = useSharedValue<number>(BOARD_ZOOM.MIN);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const applyPanBounds = () => {
    "worklet";

    clampPan(
      translateX,
      translateY,
      scale,
      containerWidth.value,
      containerHeight.value,
      contentWidth.value,
      contentHeight.value,
    );
  };

  const onViewportLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
    containerHeight.value = event.nativeEvent.layout.height;
  };

  const onContentLayout = (event: LayoutChangeEvent) => {
    contentWidth.value = event.nativeEvent.layout.width;
    contentHeight.value = event.nativeEvent.layout.height;
  };

  const pinchGesture = Gesture.Pinch()
    .onBegin(() => {
      savedScale.value = scale.value;
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      const nextScale = clamp(
        savedScale.value * event.scale,
        BOARD_ZOOM.MIN,
        BOARD_ZOOM.MAX,
      );

      const scaleRatio = nextScale / savedScale.value;

      const focalOffsetX = event.focalX - containerWidth.value / 2;
      const focalOffsetY = event.focalY - containerHeight.value / 2;

      translateX.value =
        savedTranslateX.value + (1 - scaleRatio) * focalOffsetX;
      translateY.value =
        savedTranslateY.value + (1 - scaleRatio) * focalOffsetY;
      scale.value = nextScale;
    })
    .onEnd(() => {
      if (scale.value <= BOARD_ZOOM.MIN + 0.02) {
        scale.value = withSpring(BOARD_ZOOM.MIN, BOARD_ZOOM.SPRING);
        translateX.value = withSpring(0, BOARD_ZOOM.SPRING);
        translateY.value = withSpring(0, BOARD_ZOOM.SPRING);
        return;
      }

      applyPanBounds();
    });

  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(2)
    .activeOffsetX([
      -BOARD_ZOOM.PAN_ACTIVE_OFFSET,
      BOARD_ZOOM.PAN_ACTIVE_OFFSET,
    ])
    .activeOffsetY([
      -BOARD_ZOOM.PAN_ACTIVE_OFFSET,
      BOARD_ZOOM.PAN_ACTIVE_OFFSET,
    ])
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((event) => {
      if (scale.value <= BOARD_ZOOM.MIN) {
        return;
      }

      translateX.value = savedTranslateX.value + event.translationX;
      translateY.value = savedTranslateY.value + event.translationY;
    })
    .onEnd(() => {
      applyPanBounds();
    });

  const composedGesture = Gesture.Simultaneous(pinchGesture, panGesture);

  const boardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <View style={styles.viewport} onLayout={onViewportLayout}>
      <GestureDetector gesture={composedGesture}>
        <View style={styles.gestureSurface}>
          <Animated.View
            style={[styles.board, boardStyle]}
            onLayout={onContentLayout}
          >
            {children}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  viewport: {
    flex: 1,
    overflow: "hidden",
  },

  gestureSurface: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  board: {
    overflow: "visible",
  },
});
