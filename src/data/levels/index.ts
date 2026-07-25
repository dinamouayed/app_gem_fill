import { Level } from '../../types/level';
import { level1 } from './level1';
import { level2 } from './level2';
import { level3 } from './level3';
import { level4 } from './level4';
import { level5 } from './level5';

export const ALL_LEVELS: Level[] = [
  level1,
  level2,
  level3,
  level4,
  level5,
];

export function getLevelById(id: number): Level | undefined {
  return ALL_LEVELS.find((lvl) => lvl.id === id);
}

export function getTotalLevelsCount(): number {
  return ALL_LEVELS.length;
}
