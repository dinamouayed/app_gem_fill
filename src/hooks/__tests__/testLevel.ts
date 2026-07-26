import { Level } from "../../types/level";

/** Minimal 2×2 level used by hook tests — not part of ALL_LEVELS. */
export const hookTestLevel: Level = {
  id: 9001,
  name: "Hook Test",
  rows: 2,
  columns: 2,
  difficulty: "easy",
  category: "Test",
  palette: [
    { id: "a", hex: "#111111", name: "A" },
    { id: "b", hex: "#222222", name: "B" },
  ],
  targetGrid: [
    ["a", "b"],
    ["b", "a"],
  ],
};

export const emptyProgress = {
  currentUnlockedLevel: 1,
  completedLevels: {},
  activeSavedGame: null,
  soundEnabled: true,
  hapticsEnabled: true,
};

export function emptyReserve(): (string | null)[] {
  return Array(12).fill(null);
}
