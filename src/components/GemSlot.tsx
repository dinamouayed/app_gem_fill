import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Gem } from './Gem';
import { GemColor } from '../types/level';

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
  const isMatch = currentColor ? currentColor.id === targetColor.id : false;
  const borderRadius = Math.max(4, Math.round(size * 0.22));

  return (
    <View
      style={[
        styles.slotBase,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: targetColor.hex + '35', // 20% opacity background of target color
          borderColor: targetColor.hex + '99', // 60% opacity border of target color
        },
      ]}
    >
      {/* Target Color Hint Ring / Center Dot */}
      {!currentColor && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onPress}
          style={styles.emptyHitArea}
        >
          <View
            style={[
              styles.targetHintDot,
              {
                width: size * 0.35,
                height: size * 0.35,
                borderRadius: (size * 0.35) / 2,
                backgroundColor: targetColor.hex,
              },
            ]}
          />
        </TouchableOpacity>
      )}

      {/* Gem Component if cell is occupied */}
      {currentColor && (
        <Gem
          colorHex={currentColor.hex}
          size={size - 4}
          isSelected={isSelected}
          isDimmed={isDimmed}
          isCorrect={isMatch}
          onPress={onPress}
          onLongPress={onLongPress}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  slotBase: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    margin: 2,
    position: 'relative',
    overflow: 'visible',
  },
  emptyHitArea: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  targetHintDot: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
});
