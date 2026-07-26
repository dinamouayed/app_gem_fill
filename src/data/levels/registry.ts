import { Level } from '../../types/level';
import { ALL_LEVELS } from './levels.generated';

export function getLevelById(id: number): Level | undefined {
  return ALL_LEVELS.find((lvl) => lvl.id === id);
}

/** Resolves a route param to a level, defaulting to level 1 when omitted. */
export function resolveLevelFromRouteParam(
  levelIdParam: string | string[] | undefined,
): Level | undefined {
  const raw = Array.isArray(levelIdParam) ? levelIdParam[0] : levelIdParam;
  const parsed = raw ? Number.parseInt(raw, 10) : 1;

  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined;
  }

  return getLevelById(parsed);
}

export function getTotalLevelsCount(): number {
  return ALL_LEVELS.length;
}

/** Highest index in ALL_LEVELS reachable with the saved unlock progress. */
export function getUnlockedLevelIndex(currentUnlockedLevel: number): number {
  let maxIndex = 0;

  for (let index = 0; index < ALL_LEVELS.length; index++) {
    if (ALL_LEVELS[index].id <= currentUnlockedLevel) {
      maxIndex = index;
    }
  }

  return maxIndex;
}

export function isLevelUnlocked(levelId: number, currentUnlockedLevel: number): boolean {
  const levelIndex = ALL_LEVELS.findIndex((level) => level.id === levelId);
  if (levelIndex === -1) {
    return false;
  }

  return levelIndex <= getUnlockedLevelIndex(currentUnlockedLevel);
}

export function getCurrentLevel(currentUnlockedLevel: number): Level {
  return ALL_LEVELS[getUnlockedLevelIndex(currentUnlockedLevel)] ?? ALL_LEVELS[0];
}

/** Sync unlock state when levels were added or removed from ALL_LEVELS. */
export function syncUnlockedLevel(
  currentUnlockedLevel: number,
  completedLevels: Record<number, { completed?: boolean }>,
): number {
  let syncedLevel = currentUnlockedLevel;

  for (let index = 0; index < ALL_LEVELS.length - 1; index++) {
    const level = ALL_LEVELS[index];
    if (!completedLevels[level.id]?.completed) {
      continue;
    }

    const nextLevel = ALL_LEVELS[index + 1];
    syncedLevel = Math.max(syncedLevel, nextLevel.id);
  }

  return syncedLevel;
}
