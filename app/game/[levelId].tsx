import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lightbulb } from 'lucide-react-native';
import { getLevelById, ALL_LEVELS } from '../../src/data/levels';
import { GemColor } from '../../src/types/level';
import { useGame } from '../../src/hooks/useGame';
import { useProgress } from '../../src/hooks/useProgress';
import { HeaderBar } from '../../src/components/HeaderBar';
import { GemGrid } from '../../src/components/GemGrid';
import { ZoomableBoard } from '../../src/components/ZoomableBoard';
import { ReserveZone } from '../../src/components/ReserveZone';
import { VictoryModal } from '../../src/components/VictoryModal';
import { ReservePlacementFlightGem } from '../../src/components/ReservePlacementFlightGem';
import { cellKey } from '../../src/constants/motion';

export default function GameScreen() {
  const router = useRouter();
  const { levelId } = useLocalSearchParams<{ levelId: string }>();
  const parsedLevelId = parseInt(levelId || '1', 10);

  const level = getLevelById(parsedLevelId) || ALL_LEVELS[0];
  const { recordVictory } = useProgress();

  const [victoryModalVisible, setVictoryModalVisible] = useState(false);
  const [victoryStats, setVictoryStats] = useState({ moves: 0, time: 0, stars: 3 });
  const [gridCellSize, setGridCellSize] = useState(42);

  const overlayRef = useRef<View>(null);
  const reserveSlotRefs = useRef<Map<number, View>>(new Map());
  const cellRefs = useRef<Map<string, View>>(new Map());

  // Map palette IDs to GemColor objects
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
      }, 400);
    },
    [level.id, recordVictory]
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
    isPlacementAnimating,
    activeFlights,
    waitingSourcePositions,
    waitingReserveIndices,
    settlingDestinations,
    flyingReserveIndices,
    handlePlacementFlightLand,
    handlePlacementFlightDismiss,
    handlePlacementFlightTakeoff,
    handleCellTap,
    handleReserveTap,
    moveGemToReserve,
    restartLevel,
  } = useGame(level, handleVictory);

  const registerReserveSlotRef = useCallback((index: number, node: View | null) => {
    if (node) {
      reserveSlotRefs.current.set(index, node);
    } else {
      reserveSlotRefs.current.delete(index);
    }
  }, []);

  const registerCellRef = useCallback((row: number, col: number, node: View | null) => {
    const key = cellKey(row, col);

    if (node) {
      cellRefs.current.set(key, node);
    } else {
      cellRefs.current.delete(key);
    }
  }, []);

  const getReserveSlotRef = useCallback(
    (index: number) => reserveSlotRefs.current.get(index) ?? null,
    [],
  );

  const getCellRef = useCallback((row: number, col: number) => {
    return cellRefs.current.get(cellKey(row, col)) ?? null;
  }, []);

  const reserveFlights = activeFlights.filter(
    ({ step }) => step.reserveSourceIndex !== undefined,
  );

  // Hint logic: finds a misplaced gem and highlights or moves it
  const handleHint = () => {
    // Find first misplaced gem on grid
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
        `La case en position (${misplacedRow + 1}, ${misplacedCol + 1}) nécessite la gemme "${targetColorObj?.name || correctColorId}".`
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
      {/* Top Header Status Bar */}
      <HeaderBar
        levelId={level.id}
        levelName={level.name}
        moves={moves}
        elapsedTimeSeconds={elapsedTime}
        onBack={() => router.back()}
        onRestart={restartLevel}
      />

      {/* Progress Subheader */}
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

      <View ref={overlayRef} style={styles.playfield} collapsable={false}>
        {/* Central Puzzle Grid */}
        <View style={styles.gridArea}>
          <ZoomableBoard>
            <GemGrid
              rows={level.rows}
              columns={level.columns}
              targetGrid={level.targetGrid}
              currentGrid={grid}
              paletteMap={paletteMap}
              selectedPositions={selectedPositions}
              isPlacementAnimating={isPlacementAnimating}
              activeFlights={activeFlights}
              waitingSourcePositions={waitingSourcePositions}
              settlingDestinations={settlingDestinations}
              onPlacementFlightLand={handlePlacementFlightLand}
              onPlacementFlightDismiss={handlePlacementFlightDismiss}
              onCellRefRegister={registerCellRef}
              onCellSizeChange={setGridCellSize}
              onCellPress={(r, c) => handleCellTap(r, c)}
              onCellLongPress={(r, c) => moveGemToReserve(r, c)}
            />
          </ZoomableBoard>
        </View>

        {/* Bottom Temporary Reserve Holding Zone */}
        <ReserveZone
          reserve={reserve}
          paletteMap={paletteMap}
          selectedReserveColorId={selectedReserveColorId}
          waitingReserveIndices={waitingReserveIndices}
          flyingReserveIndices={flyingReserveIndices}
          onSlotRefRegister={registerReserveSlotRef}
          onSlotPress={(idx) => handleReserveTap(idx)}
        />

        {isPlacementAnimating &&
          reserveFlights.map(({ stepIndex, step }) => (
            <ReservePlacementFlightGem
              key={`reserve-flight-${stepIndex}`}
              step={step}
              stepIndex={stepIndex}
              colorHex={paletteMap[step.colorId]?.hex ?? '#64748B'}
              gemSize={Math.max(18, gridCellSize - 4)}
              overlayRef={overlayRef}
              getReserveSlotRef={getReserveSlotRef}
              getCellRef={getCellRef}
              onTakeoff={() => {
                if (step.reserveSourceIndex !== undefined) {
                  handlePlacementFlightTakeoff(step.reserveSourceIndex);
                }
              }}
              onLand={handlePlacementFlightLand}
              onDismiss={handlePlacementFlightDismiss}
            />
          ))}
      </View>

      {/* Victory Modal Overlay */}
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
    overflow: 'visible',
  },
  gridArea: {
    flex: 1,
    overflow: 'hidden',
  },
});
