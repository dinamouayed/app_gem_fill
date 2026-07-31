import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Sparkles } from 'lucide-react-native';
import { Level } from '../types/level';
import { theme } from '../constants/theme';

const LOADING_MESSAGES = [
  'Préparation du niveau…',
  'Mélange des gemmes…',
  'Chargement de la grille…',
] as const;

const DIFFICULTY_LABELS: Record<NonNullable<Level['difficulty']>, string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
};

const GEM_COLORS = [...theme.mosaic];

const GENERIC_GRID_SIZE = 7;
const GENERIC_CELL_SIZE = 14;

function LoadingGemDot({ index }: { index: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const delay = index * 180;

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1.15, { damping: 14, stiffness: 260 }),
          withTiming(0.6, { duration: 350, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );

    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 350 }),
          withTiming(0.35, { duration: 350 }),
        ),
        -1,
        false,
      ),
    );
  }, [index, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.loadingDot,
        { backgroundColor: GEM_COLORS[index % GEM_COLORS.length] },
        animatedStyle,
      ]}
    />
  );
}

function GenericGemCell({
  colorIndex,
  delayMs,
}: {
  colorIndex: number;
  delayMs: number;
}) {
  const opacity = useSharedValue(0.25);
  const scale = useSharedValue(0.7);

  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 600, easing: Easing.inOut(Easing.quad) }),
          withTiming(0.25, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );

    scale.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withSpring(1, { damping: 16, stiffness: 280 }),
          withTiming(0.7, { duration: 600, easing: Easing.inOut(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [delayMs, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.genericCell,
        { backgroundColor: GEM_COLORS[colorIndex % GEM_COLORS.length] },
        animatedStyle,
      ]}
    />
  );
}

function GenericLoadingGrid() {
  const frameSize = GENERIC_GRID_SIZE * GENERIC_CELL_SIZE + (GENERIC_GRID_SIZE - 1) * 2 + 16;

  return (
    <View style={[styles.genericFrame, { width: frameSize, height: frameSize }]}>
      <View style={styles.genericGrid}>
        {Array.from({ length: GENERIC_GRID_SIZE }, (_, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.genericRow}>
            {Array.from({ length: GENERIC_GRID_SIZE }, (_, colIndex) => (
              <GenericGemCell
                key={`${rowIndex}-${colIndex}`}
                colorIndex={(rowIndex * 3 + colIndex * 2) % GEM_COLORS.length}
                delayMs={(rowIndex + colIndex) * 55}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

interface LevelLoadingScreenProps {
  level: Level;
}

export function LevelLoadingScreen({ level }: LevelLoadingScreenProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const cardOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(18);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 420 });
    cardTranslateY.value = withSpring(0, { damping: 18, stiffness: 220 });
  }, [cardOpacity, cardTranslateY]);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1400);

    return () => clearInterval(interval);
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardTranslateY.value }],
  }));

  const difficultyLabel = level.difficulty
    ? DIFFICULTY_LABELS[level.difficulty]
    : 'Moyen';

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface, theme.colors.background]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View style={[styles.card, cardAnimatedStyle]}>
        <View style={styles.levelBadge}>
          <Sparkles size={14} color={theme.colors.accent} style={{ marginRight: 6 }} />
          <Text style={styles.levelBadgeText}>Niveau {level.id}</Text>
        </View>

        <Text style={styles.levelName} numberOfLines={2}>
          {level.name}
        </Text>

        <Text style={styles.levelMeta}>
          {level.rows} × {level.columns} • {difficultyLabel}
          {level.category ? ` • ${level.category}` : ''}
        </Text>

        <GenericLoadingGrid />

        <View style={styles.loaderRow}>
          {GEM_COLORS.slice(0, 5).map((_, index) => (
            <LoadingGemDot key={index} index={index} />
          ))}
        </View>

        <Text style={styles.loadingLabel}>{LOADING_MESSAGES[messageIndex]}</Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceTranslucent,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.gridBorder,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 18,
    elevation: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.accentSoft,
    borderWidth: 1,
    borderColor: theme.colors.accentSoftBorder,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 14,
  },
  levelBadgeText: {
    color: theme.colors.accent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  levelName: {
    color: theme.colors.text,
    fontSize: 26,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 8,
  },
  levelMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 22,
  },
  genericFrame: {
    backgroundColor: theme.colors.gridBackdrop,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.gridBorder,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    overflow: 'hidden',
  },
  genericGrid: {
    gap: 2,
  },
  genericRow: {
    flexDirection: 'row',
    gap: 2,
  },
  genericCell: {
    width: GENERIC_CELL_SIZE,
    height: GENERIC_CELL_SIZE,
    borderRadius: 4,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  loadingDot: {
    width: 11,
    height: 11,
    borderRadius: 4,
  },
  loadingLabel: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.3,
    textAlign: 'center',
    minHeight: 18,
  },
});
