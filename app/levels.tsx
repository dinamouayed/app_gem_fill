import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Layers } from 'lucide-react-native';
import { useProgress } from '../src/hooks/useProgress';
import { ALL_LEVELS, isLevelUnlocked } from '../src/data/levels';
import { LevelCard } from '../src/components/LevelCard';

export default function LevelsScreen() {
  const router = useRouter();
  const { progress, reloadProgress } = useProgress();

  useFocusEffect(
    React.useCallback(() => {
      reloadProgress({ silent: true });
    }, [reloadProgress])
  );

  if (!progress) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color="#F8FAFC" />
        </TouchableOpacity>
        <View style={styles.headerTitleRow}>
          <Layers size={20} color="#38BDF8" style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Sélection des Niveaux</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Résolvez chaque grille pour débloquer le niveau suivant !
        </Text>

        <View style={styles.cardsGrid}>
          {ALL_LEVELS.map((level) => {
            const levelProgress = progress.completedLevels[level.id];
            const isCompleted = !!levelProgress?.completed;
            const isUnlocked = isLevelUnlocked(level.id, progress.currentUnlockedLevel);
            const isInProgress =
              !isCompleted &&
              isUnlocked &&
              progress.activeSavedGame?.levelId === level.id;

            let status: 'completed' | 'available' | 'in_progress' | 'locked' = 'locked';
            if (isCompleted) status = 'completed';
            else if (isInProgress) status = 'in_progress';
            else if (isUnlocked) status = 'available';

            return (
              <LevelCard
                key={`level-card-${level.id}`}
                level={level}
                status={status}
                progress={levelProgress}
                onPress={() => router.push(`/game/${level.id}`)}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  subtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});
