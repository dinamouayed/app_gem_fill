import React, { useEffect } from 'react';
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
import { Gem } from 'lucide-react-native';
import * as SplashScreen from 'expo-splash-screen';
import { MOTION } from '../constants/motion';
import { theme } from '../constants/theme';

const GEM_COLORS = [...theme.mosaic];

const MOSAIC_PATTERN = [
  [0, 1, 2, 3, 4, 5, 4, 3],
  [1, 2, 3, 4, 5, 0, 3, 2],
  [2, 3, 4, 5, 0, 1, 2, 1],
  [3, 4, 5, 0, 1, 2, 1, 0],
  [4, 5, 0, 1, 2, 3, 0, 5],
  [5, 0, 1, 2, 3, 4, 5, 4],
];

function MosaicCell({ colorIndex, delayMs }: { colorIndex: number; delayMs: number }) {
  const opacity = useSharedValue(0.12);

  useEffect(() => {
    opacity.value = withDelay(
      delayMs,
      withRepeat(
        withSequence(
          withTiming(0.45, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.12, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      ),
    );
  }, [delayMs, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[styles.mosaicCell, { backgroundColor: GEM_COLORS[colorIndex] }, animatedStyle]}
    />
  );
}

function BackgroundMosaic() {
  return (
    <View style={styles.mosaicContainer} pointerEvents="none">
      {MOSAIC_PATTERN.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.mosaicRow}>
          {row.map((colorIndex, colIndex) => (
            <MosaicCell
              key={`${rowIndex}-${colIndex}`}
              colorIndex={colorIndex}
              delayMs={(rowIndex + colIndex) * 80}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

function LoadingGemDot({ index }: { index: number }) {
  const scale = useSharedValue(0.6);
  const opacity = useSharedValue(0.35);

  useEffect(() => {
    const delay = index * 180;

    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withSpring(1.15, MOTION.SPRING_FLOAT),
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

export function LoadingScreen() {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.88);
  const floatY = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const glowOpacity = useSharedValue(0.3);

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    logoOpacity.value = withTiming(1, { duration: 500 });
    logoScale.value = withSpring(1, MOTION.SPRING_FLOAT);
    textOpacity.value = withDelay(200, withTiming(1, { duration: 450 }));

    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.65, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
        withTiming(0.3, { duration: 1300, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      true,
    );
  }, [floatY, glowOpacity, logoOpacity, logoScale, textOpacity]);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }, { translateY: floatY.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface, theme.colors.background]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />

      <BackgroundMosaic />

      <View style={styles.content}>
        <Animated.View style={[styles.logoGlow, glowAnimatedStyle]} />

        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <LinearGradient colors={[theme.colors.accent, theme.colors.accentDark, theme.colors.indigo]} style={styles.logoBadge}>
            <Gem size={52} color={theme.colors.white} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.titleBlock, textAnimatedStyle]}>
          <Text style={styles.appTitle}>GEM FILL</Text>
          <Text style={styles.appSubtitle}>Pixel Art Mosaic Puzzle</Text>
        </Animated.View>

        <Animated.View style={[styles.loaderRow, textAnimatedStyle]}>
          {GEM_COLORS.slice(0, 5).map((_, index) => (
            <LoadingGemDot key={index} index={index} />
          ))}
        </Animated.View>

        <Animated.Text style={[styles.loadingLabel, textAnimatedStyle]}>
          Chargement…
        </Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mosaicContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.7,
  },
  mosaicRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  mosaicCell: {
    width: 22,
    height: 22,
    borderRadius: 6,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoGlow: {
    position: 'absolute',
    top: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.accent,
  },
  logoWrapper: {
    marginBottom: 20,
  },
  logoBadge: {
    width: 96,
    height: 96,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 36,
  },
  appTitle: {
    color: theme.colors.text,
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 3,
  },
  appSubtitle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 6,
    letterSpacing: 0.6,
  },
  loaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  loadingDot: {
    width: 12,
    height: 12,
    borderRadius: 4,
  },
  loadingLabel: {
    color: theme.colors.textDim,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
