import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProgressData, LevelProgress, SavedGameState } from '../types/game';
import { ALL_LEVELS, syncUnlockedLevel } from '../data/levels';

const STORAGE_KEY = '@gem_fill_user_progress_v1';
const SAVE_DEBOUNCE_MS = 400;

const DEFAULT_PROGRESS: UserProgressData = {
  currentUnlockedLevel: 1,
  completedLevels: {},
  activeSavedGame: null,
  soundEnabled: true,
  hapticsEnabled: true,
};

let cachedProgress: UserProgressData | null = null;
let pendingSaveTimer: ReturnType<typeof setTimeout> | null = null;
let persistChain: Promise<void> = Promise.resolve();

async function writeToStorage(progress: UserProgressData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch (error) {
    console.error('Error saving user progress to AsyncStorage:', error);
  }
}

function schedulePersist(
  progress: UserProgressData,
  immediate = false,
): Promise<void> {
  cachedProgress = progress;

  if (immediate) {
    if (pendingSaveTimer) {
      clearTimeout(pendingSaveTimer);
      pendingSaveTimer = null;
    }
    persistChain = persistChain.then(() => writeToStorage(progress));
    return persistChain;
  }

  if (pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
  }

  return new Promise((resolve) => {
    pendingSaveTimer = setTimeout(() => {
      pendingSaveTimer = null;
      persistChain = persistChain
        .then(() => writeToStorage(progress))
        .then(resolve);
    }, SAVE_DEBOUNCE_MS);
  });
}

async function loadProgressFromStorage(): Promise<UserProgressData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cachedProgress = DEFAULT_PROGRESS;
      return DEFAULT_PROGRESS;
    }

    const parsed = JSON.parse(raw) as Partial<UserProgressData>;
    const progress: UserProgressData = {
      ...DEFAULT_PROGRESS,
      ...parsed,
    };

    const syncedUnlockedLevel = syncUnlockedLevel(
      progress.currentUnlockedLevel,
      progress.completedLevels,
    );

    const syncedProgress: UserProgressData =
      syncedUnlockedLevel === progress.currentUnlockedLevel
        ? progress
        : {
            ...progress,
            currentUnlockedLevel: syncedUnlockedLevel,
          };

    cachedProgress = syncedProgress;

    if (syncedProgress !== progress) {
      await schedulePersist(syncedProgress, true);
    }

    return syncedProgress;
  } catch (error) {
    console.error('Error reading user progress from AsyncStorage:', error);
    cachedProgress = DEFAULT_PROGRESS;
    return DEFAULT_PROGRESS;
  }
}

async function getCachedOrLoadProgress(): Promise<UserProgressData> {
  if (cachedProgress) {
    return cachedProgress;
  }

  return loadProgressFromStorage();
}

export async function flushPendingProgressSave(): Promise<void> {
  if (pendingSaveTimer && cachedProgress) {
    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
    persistChain = persistChain.then(() => writeToStorage(cachedProgress!));
  }

  await persistChain;
}

export function invalidateProgressCache(): void {
  cachedProgress = null;
}

export async function getUserProgress(): Promise<UserProgressData> {
  return getCachedOrLoadProgress();
}

export async function saveUserProgress(progress: UserProgressData): Promise<void> {
  await schedulePersist(progress, true);
}

export async function markLevelCompleted(
  levelId: number,
  moves: number,
  timeSeconds: number,
  stars: number,
): Promise<UserProgressData> {
  const current = await getCachedOrLoadProgress();

  const prevBest = current.completedLevels[levelId];
  const newBestMoves =
    prevBest?.bestMoves != null ? Math.min(prevBest.bestMoves, moves) : moves;
  const newBestTime =
    prevBest?.bestTimeSeconds != null
      ? Math.min(prevBest.bestTimeSeconds, timeSeconds)
      : timeSeconds;
  const newBestStars =
    prevBest?.stars != null ? Math.max(prevBest.stars, stars) : stars;

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

  await schedulePersist(updatedProgress, true);
  return updatedProgress;
}

export async function saveActiveGameState(
  savedGame: SavedGameState,
): Promise<void> {
  const current = await getCachedOrLoadProgress();
  await schedulePersist({
    ...current,
    activeSavedGame: savedGame,
  });
}

export async function clearActiveGameState(): Promise<void> {
  const current = await getCachedOrLoadProgress();
  await schedulePersist(
    {
      ...current,
      activeSavedGame: null,
    },
    true,
  );
}

export async function resetAllProgress(): Promise<UserProgressData> {
  if (pendingSaveTimer) {
    clearTimeout(pendingSaveTimer);
    pendingSaveTimer = null;
  }

  await persistChain;
  cachedProgress = null;

  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error resetting user progress:', error);
  }

  cachedProgress = DEFAULT_PROGRESS;
  return DEFAULT_PROGRESS;
}
