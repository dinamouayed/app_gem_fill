import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface GemProps {
  colorHex: string;
  size: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  isCorrect?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

// Adjust hex color light/dark for gradients & bevels
function adjustColor(hex: string, percent: number): string {
  let num = parseInt(hex.replace('#', ''), 16);
  if (isNaN(num)) return hex;
  let r = (num >> 16) + percent;
  let g = ((num >> 8) & 0x00ff) + percent;
  let b = (num & 0x0000ff) + percent;

  r = Math.min(255, Math.max(0, r));
  g = Math.min(255, Math.max(0, g));
  b = Math.min(255, Math.max(0, b));

  return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export const Gem: React.FC<GemProps> = ({
  colorHex,
  size,
  isSelected = false,
  isDimmed = false,
  isCorrect = false,
  onPress,
  onLongPress,
}) => {
  const lightHex = adjustColor(colorHex, 45);
  const darkHex = adjustColor(colorHex, -40);

  const borderRadius = Math.max(4, Math.round(size * 0.22));

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.container,
        {
          width: size,
          height: size,
          transform: [{ scale: isSelected ? 1.12 : 1 }],
          zIndex: isSelected ? 99 : 1,
          opacity: isDimmed ? 0.5 : 1,
          shadowColor: isSelected ? '#FBBF24' : '#000',
          shadowRadius: isSelected ? 8 : 4,
          elevation: isSelected ? 10 : 5,
        },
      ]}
    >
      <LinearGradient
        colors={[lightHex, colorHex, darkHex]}
        start={{ x: 0.1, y: 0.1 }}
        end={{ x: 0.9, y: 0.9 }}
        style={[
          styles.gemBody,
          {
            borderRadius,
            borderColor: isSelected
              ? '#FBBF24'
              : isCorrect
              ? 'rgba(255,255,255,0.4)'
              : 'rgba(255,255,255,0.15)',
            borderWidth: isSelected ? 3.5 : 1.5,
          },
        ]}
      >
        {/* Gloss / Reflection Highlight */}
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

        {/* Selected Pulse Ring */}
        {isSelected && (
          <View
            style={[
              styles.selectedBadge,
              { borderRadius },
            ]}
          />
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  gemBody: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 2,
    overflow: 'hidden',
  },
  glossHighlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    marginTop: 2,
    marginLeft: 2,
    transform: [{ skewX: '-20deg' }],
  },
  selectedBadge: {
    ...StyleSheet.absoluteFill,
    borderWidth: 2,
    borderColor: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
});
