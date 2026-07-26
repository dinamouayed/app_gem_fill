import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface Level1TutorialBannerProps {
  message: string;
  stepIndex: number;
  totalSteps: number;
}

export const Level1TutorialBanner: React.FC<Level1TutorialBannerProps> = ({
  message,
  stepIndex,
  totalSteps,
}) => {
  return (
    <View style={styles.container} pointerEvents="none">
      <View style={styles.bubble}>
        <Text style={styles.stepLabel}>
          Tutoriel {stepIndex}/{totalSteps}
        </Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 8,
    left: 16,
    right: 16,
    zIndex: 100,
    alignItems: "center",
  },
  bubble: {
    backgroundColor: "rgba(15, 23, 42, 0.92)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 1.5,
    borderColor: "rgba(56, 189, 248, 0.45)",
    maxWidth: 320,
    shadowColor: "#38BDF8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  stepLabel: {
    color: "#38BDF8",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  message: {
    color: "#F8FAFC",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 20,
  },
});
