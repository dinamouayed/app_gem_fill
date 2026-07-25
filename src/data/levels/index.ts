import { Level } from '../../types/level';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';
import { level6 } from './level6';
import { level7 } from './level7';
import { level8 } from './level8';
import { level9 } from './level9';
import { level10 } from './level10';

export const ALL_LEVELS: Level[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
  level6,
  level7,
  level8,
  level9,
  level10,
];

export function getLevelById(id: number): Level | undefined {
  return ALL_LEVELS.find((lvl) => lvl.id === id);
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
  // DEBUG — tous les niveaux déverrouillés pour les tests
  return ALL_LEVELS.some((level) => level.id === levelId);

  // const levelIndex = ALL_LEVELS.findIndex((level) => level.id === levelId);
  // if (levelIndex === -1) {
  //   return false;
  // }
  //
  // return levelIndex <= getUnlockedLevelIndex(currentUnlockedLevel);
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
