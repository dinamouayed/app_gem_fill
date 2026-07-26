import 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ProgressProvider, useProgress } from '../src/context/ProgressContext';
import { theme } from '../src/constants/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

const MIN_SPLASH_MS = 1400;

function AppNavigation() {
  const { loading } = useProgress();
  const [minTimeElapsed, setMinTimeElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minTimeElapsed) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="levels" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="game/[levelId]" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <ErrorBoundary>
        <ProgressProvider>
          <AppNavigation />
        </ProgressProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
});
