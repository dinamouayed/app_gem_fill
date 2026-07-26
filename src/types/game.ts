export type CellPosition = {
  row: number;
  col: number;
};

export type GemLocation =
  | { type: 'grid'; row: number; col: number }
  | { type: 'reserve'; index: number };

export type LevelProgress = {
  levelId: number;
  completed: boolean;
  bestTimeSeconds: number | null;
  bestMoves: number | null;
  stars: number; // 1, 2, or 3
  lastPlayedAt?: number;
};

export type SavedGameState = {
  levelId: number;
  currentGrid: (string | null)[][];
  reserveGems: (string | null)[];
  moves: number;
  elapsedTimeSeconds: number;
  updatedAt: number;
};

export type UserProgressData = {
  currentUnlockedLevel: number;
  completedLevels: Record<number, LevelProgress>;
  activeSavedGame: SavedGameState | null;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
};
