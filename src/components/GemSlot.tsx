import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Gem } from "./Gem";
import { GemColor } from "../types/level";

interface GemSlotProps {
  size: number;
  targetColor: GemColor;
  currentColor: GemColor | null;
  isSelected?: boolean;
  isDimmed?: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export const GemSlot: React.FC<GemSlotProps> = ({
  size,
  targetColor,
  currentColor,
  isSelected = false,
  isDimmed = false,
  onPress,
  onLongPress,
}) => {
  const isMatch = currentColor?.id === targetColor.id;

  /*
   * La gemme incorrecte garde quasiment toute sa taille.
   * La gemme correcte remplit davantage sa case afin de
   * sembler intégrée au plateau.
   */
  const movableGemSize = size - 4;
  const correctGemSize = size - 1;

  return (
    <View
      style={[
        styles.slot,
        {
          width: size,
          height: size,
          backgroundColor: targetColor.hex,
        },
      ]}
    >
      {!currentColor && (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={onPress}
          onLongPress={onLongPress}
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
        </TouchableOpacity>
      )}

      {currentColor && !isMatch && (
        <Gem
          colorHex={currentColor.hex}
          size={movableGemSize}
          isSelected={isSelected}
          isDimmed={isDimmed}
          isCorrect={false}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      )}

      {currentColor && isMatch && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={onPress}
          onLongPress={onLongPress}
          style={styles.fullHitArea}
        >
          <View
            style={[
              styles.correctGem,
              {
                width: correctGemSize,
                height: correctGemSize,
                backgroundColor: currentColor.hex,
              },
              isDimmed && styles.dimmed,
            ]}
          >
            <View style={styles.correctGemHighlight} />
            <View style={styles.correctGemInnerBorder} />
          </View>
        </TouchableOpacity>
      )}
    </View>
  );
};

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

    /*
     * Important :
     * aucun margin et aucun arrondi.
     * La couleur cible remplit donc toute la grille.
     */
    margin: 0,
    borderRadius: 0,
    overflow: "hidden",
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

  correctGem: {
    position: "relative",
    justifyContent: "center",
    alignItems: "center",

    /*
     * Beaucoup moins arrondi qu'une gemme déplaçable.
     * Elle paraît intégrée à la zone de couleur.
     */
    borderRadius: 3,

    /*
     * Pas d'ombre extérieure : cela évite l'effet
     * de pièce encore posée au-dessus du plateau.
     */
    shadowOpacity: 0,
    elevation: 0,

    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.18)",
  },

  correctGemHighlight: {
    position: "absolute",
    top: "8%",
    left: "12%",
    width: "42%",
    height: "14%",
    borderRadius: 999,
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },

  correctGemInnerBorder: {
    position: "absolute",
    top: 2,
    right: 2,
    bottom: 2,
    left: 2,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },

  dimmed: {
    opacity: 0.45,
  },
});
