import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Play, Grid, Settings, Gem as GemIcon, Award, Sparkles, RefreshCw } from 'lucide-react-native';
import { useProgress } from '../src/hooks/useProgress';
import { ALL_LEVELS, getLevelById, getTotalLevelsCount } from '../src/data/levels';
import { LinearGradient } from 'expo-linear-gradient';

export default function HomeScreen() {
  const router = useRouter();
  const { progress, loading, reloadProgress } = useProgress();

  useFocusEffect(
    React.useCallback(() => {
      reloadProgress();
    }, [reloadProgress])
  );

  if (loading || !progress) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
      </View>
    );
  }

  const currentLevelId = Math.min(progress.currentUnlockedLevel, getTotalLevelsCount());
  const currentLevel = getLevelById(currentLevelId) || ALL_LEVELS[0];

  const totalLevels = getTotalLevelsCount();
  const completedCount = Object.values(progress.completedLevels).filter((l) => l.completed).length;
  const overallPercentage = Math.round((completedCount / totalLevels) * 100);

  const hasActiveSave =
    progress.activeSavedGame && progress.activeSavedGame.levelId === currentLevelId;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Logo */}
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={['#38BDF8', '#0284C7', '#6366F1']}
            style={styles.logoBadge}
          >
            <GemIcon size={44} color="#FFF" />
          </LinearGradient>
          <Text style={styles.appTitle}>GEM FILL</Text>
          <Text style={styles.appSubtitle}>Pixel Art Mosaic Puzzle</Text>
        </View>

        {/* Current Level Feature Card */}
        <View style={styles.currentLevelCard}>
          <View style={styles.cardHeader}>
            <View style={styles.levelBadge}>
              <Sparkles size={14} color="#F59E0B" style={{ marginRight: 4 }} />
              <Text style={styles.levelBadgeText}>PROCHAIN DÉFI</Text>
            </View>
            {hasActiveSave && (
              <View style={styles.resumeBadge}>
                <RefreshCw size={12} color="#38BDF8" style={{ marginRight: 4 }} />
                <Text style={styles.resumeText}>Reprendre</Text>
              </View>
            )}
          </View>

          <Text style={styles.currentLevelNum}>Niveau {currentLevel.id}</Text>
          <Text style={styles.currentLevelName}>{currentLevel.name}</Text>
          <Text style={styles.currentLevelMeta}>
            Grille {currentLevel.rows} × {currentLevel.columns} • {currentLevel.palette.length} Couleurs de gemmes
          </Text>

          {/* Main Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/game/${currentLevel.id}`)}
            style={styles.mainContinueBtn}
          >
            <LinearGradient
              colors={['#0284C7', '#0369A1']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mainContinueGradient}
            >
              <Play size={24} color="#FFF" fill="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.mainContinueText}>
                {hasActiveSave ? `Reprendre — Niveau ${currentLevel.id}` : `Continuer — Niveau ${currentLevel.id}`}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Overall Progress Widget */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.progressTitleRow}>
              <Award size={20} color="#F59E0B" style={{ marginRight: 6 }} />
              <Text style={styles.progressTitle}>Progression Globale</Text>
            </View>
            <Text style={styles.progressPercentageText}>{overallPercentage}%</Text>
          </View>

          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${overallPercentage}%` }]} />
          </View>

          <View style={styles.progressStatsRow}>
            <Text style={styles.progressSubtext}>
              {completedCount} sur {totalLevels} niveaux terminés
            </Text>
            <Text style={styles.progressSubtext}>
              Débloqué : Niveau {progress.currentUnlockedLevel}
            </Text>
          </View>
        </View>

        {/* Secondary Navigation Buttons */}
        <View style={styles.menuGrid}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/levels')}
            style={styles.menuCard}
          >
            <Grid size={28} color="#38BDF8" />
            <Text style={styles.menuCardTitle}>Tous les Niveaux</Text>
            <Text style={styles.menuCardSub}>Parcourir la liste</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/settings')}
            style={styles.menuCard}
          >
            <Settings size={28} color="#94A3B8" />
            <Text style={styles.menuCardTitle}>Paramètres</Text>
            <Text style={styles.menuCardSub}>Options & Sons</Text>
          </TouchableOpacity>
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
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  logoBadge: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  appTitle: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  appSubtitle: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
    letterSpacing: 0.5,
  },
  currentLevelCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    shadowColor: '#38BDF8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelBadgeText: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '800',
  },
  resumeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  resumeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  currentLevelNum: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 4,
  },
  currentLevelName: {
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
    marginVertical: 4,
  },
  currentLevelMeta: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 18,
  },
  mainContinueBtn: {
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  mainContinueGradient: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  mainContinueText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  progressCard: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  progressPercentageText: {
    color: '#F59E0B',
    fontSize: 18,
    fontWeight: '900',
  },
  progressBarTrack: {
    height: 10,
    backgroundColor: '#0F172A',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 5,
  },
  progressStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressSubtext: {
    color: '#94A3B8',
    fontSize: 12,
  },
  menuGrid: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  menuCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  menuCardTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 8,
  },
  menuCardSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
});
