import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { buildGemPalette, hexToRgba } from "../utils/gemColors";

export interface GemVisualProps {
  colorHex: string;
  size: number;
  variant?: "default" | "correct" | "selected";
  style?: ViewStyle;
}

export const GemVisual: React.FC<GemVisualProps> = ({
  colorHex,
  size,
  variant = "default",
  style,
}) => {
  const isCorrect = variant === "correct";
  const isSelected = variant === "selected";
  const palette = buildGemPalette(colorHex);
  const outerRadius = isCorrect
    ? Math.max(2, Math.round(size * 0.1))
    : Math.max(4, Math.round(size * 0.2));
  const bevel = isCorrect ? 0 : Math.max(2, Math.round(size * 0.15));
  const innerSize = size - bevel * 2;
  const innerRadius = Math.max(2, Math.round(outerRadius * 0.62));
  const glowOpacity = isSelected ? 0.7 : isCorrect ? 0 : 0.38;
  const glowRadius = isCorrect ? 0 : Math.max(3, Math.round(size * 0.22));

  return (
    <View
      style={[
        styles.outer,
        {
          width: size,
          height: size,
          borderRadius: outerRadius,
          shadowColor: colorHex,
          shadowOpacity: glowOpacity,
          shadowRadius: glowRadius,
          shadowOffset: { width: 0, height: 0 },
          elevation: isSelected ? 7 : isCorrect ? 0 : 4,
        },
        style,
      ]}
    >
      <View style={[styles.body, { borderRadius: outerRadius }]}>
        <LinearGradient
          colors={
            isCorrect
              ? [palette.base, palette.base, palette.dark]
              : [palette.light, palette.base, palette.dark]
          }
          start={{ x: 0.05, y: 0.05 }}
          end={{ x: 0.95, y: 0.95 }}
          style={[StyleSheet.absoluteFill, { borderRadius: outerRadius }]}
        />

        {!isCorrect && (
          <View
            style={[
              styles.table,
              {
                top: bevel,
                left: bevel,
                width: innerSize,
                height: innerSize,
                borderRadius: innerRadius,
              },
            ]}
          >
            <LinearGradient
              colors={[palette.highlight, palette.light, palette.base]}
              start={{ x: 0.1, y: 0.08 }}
              end={{ x: 0.85, y: 0.9 }}
              style={[StyleSheet.absoluteFill, { borderRadius: innerRadius }]}
            />

            <LinearGradient
              colors={["rgba(255,255,255,0.5)", "rgba(255,255,255,0.08)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.specular,
                {
                  width: Math.round(innerSize * 0.45),
                  height: Math.round(innerSize * 0.42),
                  borderTopLeftRadius: innerRadius,
                },
              ]}
            />

            <View
              style={[
                styles.tableRim,
                {
                  borderRadius: innerRadius,
                  borderTopColor: "rgba(255,255,255,0.35)",
                  borderLeftColor: "rgba(255,255,255,0.22)",
                  borderBottomColor: hexToRgba(palette.shadow, 0.28),
                  borderRightColor: hexToRgba(palette.shadow, 0.2),
                },
              ]}
            />
          </View>
        )}

        {isCorrect && (
          <View
            pointerEvents="none"
            style={[
              styles.settledInnerRim,
              {
                borderRadius: Math.max(1, outerRadius - 1),
                borderColor: hexToRgba(palette.light, 0.18),
              },
            ]}
          />
        )}

        <View
          pointerEvents="none"
          style={[
            styles.outerRim,
            {
              borderRadius: outerRadius,
              borderTopColor: isCorrect
                ? hexToRgba(palette.light, 0.12)
                : "rgba(255,255,255,0.28)",
              borderLeftColor: isCorrect
                ? hexToRgba(palette.light, 0.08)
                : "rgba(255,255,255,0.18)",
              borderBottomColor: isCorrect
                ? hexToRgba(palette.shadow, 0.22)
                : hexToRgba(palette.shadow, 0.5),
              borderRightColor: isCorrect
                ? hexToRgba(palette.shadow, 0.16)
                : hexToRgba(palette.shadow, 0.4),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outer: {
    justifyContent: "center",
    alignItems: "center",
  },

  body: {
    width: "100%",
    height: "100%",
    overflow: "hidden",
  },

  table: {
    position: "absolute",
    overflow: "hidden",
  },

  specular: {
    position: "absolute",
    top: 0,
    left: 0,
  },

  tableRim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },

  outerRim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
  },

  settledInnerRim: {
    position: "absolute",
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderWidth: 1,
  },
});
