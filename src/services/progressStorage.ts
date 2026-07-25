import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgressData, LevelProgress, SavedGameState } from '../types/game';
import { ALL_LEVELS, syncUnlockedLevel } from '../data/levels';

const STORAGE_KEY = '@gem_fill_user_progress_v1';

const DEFAULT_PROGRESS: UserProgressData = {
  currentUnlockedLevel: 1,
  completedLevels: {},
  activeSavedGame: null,
  soundEnabled: true,
  hapticsEnabled: true,
};

export async function getUserProgress(): Promise<UserProgressData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROGRESS;
    const parsed = JSON.parse(raw) as Partial<UserProgressData>;
    const progress: UserProgressData = {
      ...DEFAULT_PROGRESS,
      ...parsed,
    };

    const syncedUnlockedLevel = syncUnlockedLevel(
      progress.currentUnlockedLevel,
      progress.completedLevels,
    );

    if (syncedUnlockedLevel === progress.currentUnlockedLevel) {
      return progress;
    }

    const syncedProgress: UserProgressData = {
      ...progress,
      currentUnlockedLevel: syncedUnlockedLevel,
    };

    await saveUserProgress(syncedProgress);
    return syncedProgress;
  } catch (error) {
    console.error('Error reading user progress from AsyncStorage:', error);
    return DEFAULT_PROGRESS;
  }
}

export async function saveUserProgress(progress: UserProgressData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving user progress to AsyncStorage:', error);
  }
}

export async function markLevelCompleted(
  levelId: number,
  moves: number,
  timeSeconds: number,
  stars: number
): Promise<UserProgressData> {
  const current = await getUserProgress();

  const prevBest = current.completedLevels[levelId];
  const newBestMoves = prevBest?.bestMoves != null ? Math.min(prevBest.bestMoves, moves) : moves;
  const newBestTime = prevBest?.bestTimeSeconds != null ? Math.min(prevBest.bestTimeSeconds, timeSeconds) : timeSeconds;
  const newBestStars = prevBest?.stars != null ? Math.max(prevBest.stars, stars) : stars;

  const updatedCompleted: Record<number, LevelProgress> = {
    ...current.completedLevels,
    [levelId]: {
      levelId,
      completed: true,
      bestMoves: newBestMoves,
      bestTimeSeconds: newBestTime,
      stars: newBestStars,
      lastPlayedAt: Date.now(),
    },
  };

  const levelIndex = ALL_LEVELS.findIndex((level) => level.id === levelId);
  const nextLevel = levelIndex >= 0 ? ALL_LEVELS[levelIndex + 1] : undefined;
  const nextUnlocked = nextLevel
    ? Math.max(current.currentUnlockedLevel, nextLevel.id)
    : Math.max(current.currentUnlockedLevel, levelId + 1);

  // Clear saved game for this level if completed
  let updatedSavedGame = current.activeSavedGame;
  if (updatedSavedGame?.levelId === levelId) {
    updatedSavedGame = null;
  }

  const updatedProgress: UserProgressData = {
    ...current,
    currentUnlockedLevel: nextUnlocked,
    completedLevels: updatedCompleted,
    activeSavedGame: updatedSavedGame,
  };

  await saveUserProgress(updatedProgress);
  return updatedProgress;
}

export async function saveActiveGameState(savedGame: SavedGameState): Promise<void> {
  const current = await getUserProgress();
  const updatedProgress: UserProgressData = {
    ...current,
    activeSavedGame: savedGame,
  };
  await saveUserProgress(updatedProgress);
}

export async function clearActiveGameState(): Promise<void> {
  const current = await getUserProgress();
  const updatedProgress: UserProgressData = {
    ...current,
    activeSavedGame: null,
  };
  await saveUserProgress(updatedProgress);
}

export async function resetAllProgress(): Promise<UserProgressData> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_PROGRESS;
}
