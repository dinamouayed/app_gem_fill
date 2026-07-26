import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lightbulb } from 'lucide-react-native';
import { getLevelById, ALL_LEVELS } from '../../src/data/levels';
import { GemColor } from '../../src/types/level';
import { useGame } from '../../src/hooks/useGame';
import { useLevel1Tutorial } from '../../src/hooks/useLevel1Tutorial';
import { useProgress } from '../../src/hooks/useProgress';
import { HeaderBar } from '../../src/components/HeaderBar';
import { GemGrid } from '../../src/components/GemGrid';
import { ZoomableBoard } from '../../src/components/ZoomableBoard';
import { ReserveZone } from '../../src/components/ReserveZone';
import { VictoryModal } from '../../src/components/VictoryModal';
import { Level1TutorialBanner } from '../../src/components/Level1TutorialBanner';

export default function GameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const parsedLevelId = parseInt(levelId || '1', 10);

  const level = getLevelById(parsedLevelId) || ALL_LEVELS[0];
  const { recordVictory } = useProgress();

  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [victoryStats, setVictoryStats] = useState({ moves: 0, time: 0, stars: 3 });

  const paletteMap = useMemo(() => {
    const map: Record<string, GemColor> = {};
    level.palette.forEach((c) => {
      map[c.id] = c;
    });
    return map;
  }, [level]);

  const handleVictory = React.useCallback(
    async (moves: number, time: number, stars: number) => {
      setVictoryStats({ moves, time, stars });
      await recordVictory(level.id, moves, time, stars);
      setTimeout(() => {
        setVictoryModalVisible(true);
      }, 250);
    },
    [level.id, recordVictory],
  );

  const {
    grid,
    reserve,
    selectedPositions,
    selectedReserveColorId,
    moves,
    elapsedTime,
    isVictory,
    percentage,
    stars,
    isInitialized,
    handleCellTap,
    handleReserveTap,
    moveGemToReserve,
    restartLevel,
  } = useGame(level, handleVictory);

  const {
    isActive: isTutorialActive,
    targetCell: tutorialTargetCell,
    targetReserveSlot: tutorialTargetReserveSlot,
    message: tutorialMessage,
    stepIndex: tutorialStepIndex,
    totalSteps: tutorialTotalSteps,
  } = useLevel1Tutorial(
    level.id,
    grid,
    level.targetGrid,
    selectedPositions,
    reserve,
    moves,
    isInitialized,
  );

  const handleHint = () => {
    let misplacedRow = -1;
    let misplacedCol = -1;
    for (let r = 0; r < level.rows; r++) {
      for (let c = 0; c < level.columns; c++) {
        if (grid[r][c] !== null && grid[r][c] !== level.targetGrid[r][c]) {
          misplacedRow = r;
          misplacedCol = c;
          break;
        }
      }
      if (misplacedRow !== -1) break;
    }

    if (misplacedRow !== -1) {
      const correctColorId = level.targetGrid[misplacedRow][misplacedCol];
      const targetColorObj = paletteMap[correctColorId];
      Alert.alert(
        'Indice Gemme',
        `La case en position (${misplacedRow + 1}, ${misplacedCol + 1}) nécessite la gemme "${targetColorObj?.name || correctColorId}".`,
      );
    } else {
      Alert.alert('Indice', 'Toutes les gemmes actuellement placées sont correctes !');
    }
  };

  if (!isInitialized || grid.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>Chargement du niveau...</Text>
      </View>
    );
  }

  const nextLevel = getLevelById(level.id + 1);

  return (
    <SafeAreaView style={styles.container}>
      <HeaderBar
        levelId={level.id}
        levelName={level.name}
        moves={moves}
        elapsedTimeSeconds={elapsedTime}
        onBack={() => router.back()}
        onRestart={restartLevel}
      />

      <View style={styles.subHeader}>
        <View style={styles.percentageBarContainer}>
          <View style={[styles.percentageBarFill, { width: `${percentage}%` }]} />
        </View>
        <View style={styles.percentageRow}>
          <Text style={styles.percentageText}>{percentage}% Placé</Text>
          <TouchableOpacity activeOpacity={0.7} onPress={handleHint} style={styles.hintBtn}>
            <Lightbulb size={16} color="#F59E0B" style={{ marginRight: 4 }} />
            <Text style={styles.hintBtnText}>Indice</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.playfield}>
        {isTutorialActive && tutorialMessage ? (
          <Level1TutorialBanner
            message={tutorialMessage}
            stepIndex={tutorialStepIndex}
            totalSteps={tutorialTotalSteps}
          />
        ) : null}

        <View style={styles.gridArea}>
          <ZoomableBoard>
            <GemGrid
              rows={level.rows}
              columns={level.columns}
              targetGrid={level.targetGrid}
              currentGrid={grid}
              paletteMap={paletteMap}
              selectedPositions={selectedPositions}
              tutorialTargetCell={isTutorialActive ? tutorialTargetCell : null}
              onCellPress={(r, c) => handleCellTap(r, c)}
              onCellLongPress={(r, c) => moveGemToReserve(r, c)}
            />
          </ZoomableBoard>
        </View>

        <ReserveZone
          reserve={reserve}
          paletteMap={paletteMap}
          selectedReserveColorId={selectedReserveColorId}
          tutorialTargetSlotIndex={isTutorialActive ? tutorialTargetReserveSlot : null}
          onSlotPress={(idx) => handleReserveTap(idx)}
        />
      </View>

      <VictoryModal
        visible={victoryModalVisible}
        level={level}
        moves={victoryStats.moves}
        timeSeconds={victoryStats.time}
        stars={victoryStats.stars}
        hasNextLevel={!!nextLevel}
        onNextLevel={() => {
          setVictoryModalVisible(false);
          if (nextLevel) {
            router.replace(`/game/${nextLevel.id}`);
          }
        }}
        onReplay={() => {
          setVictoryModalVisible(false);
          restartLevel();
        }}
        onHome={() => {
          setVictoryModalVisible(false);
          router.replace('/');
        }}
      />
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
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  subHeader: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#0F172A',
  },
  percentageBarContainer: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  percentageBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  percentageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  percentageText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  hintBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  hintBtnText: {
    color: '#F59E0B',
    fontSize: 12,
    fontWeight: '700',
  },
  playfield: {
    flex: 1,
    position: 'relative',
  },
  gridArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
