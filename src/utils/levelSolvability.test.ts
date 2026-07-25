import { describe, expect, it } from "vitest";

import { ALL_LEVELS } from "../data/levels";
import { level8 } from "../data/levels/level8";
import { level57 } from "../data/levels/level57";
import { isShuffledGridSolvable, isTargetGridValid } from "./levelValidation";
import { getInitialCorrectPercent, shuffleTargetGrid } from "./shuffleGrid";
import { checkGridState, hasMatchingColorCounts } from "./validateGrid";

describe("shuffleTargetGrid", () => {
  const targetGrid = [
    ["a", "a", "b", "b"],
    ["a", "a", "b", "b"],
    ["c", "c", "d", "d"],
    ["c", "c", "d", "d"],
  ];

  it("preserves color counts", () => {
    const shuffled = shuffleTargetGrid(targetGrid, 42);
    expect(hasMatchingColorCounts(shuffled, targetGrid)).toBe(true);
  });

  it("does not return the solved grid", () => {
    const shuffled = shuffleTargetGrid(targetGrid, 42);
    const isIdentical = shuffled.every(
      (row, rowIndex) =>
        row.every((cell, colIndex) => cell === targetGrid[rowIndex][colIndex]),
    );

    expect(isIdentical).toBe(false);
  });

  it("keeps mushroom levels solvable after shuffle", () => {
    const shuffled = shuffleTargetGrid(level57.targetGrid, 57);
    expect(isShuffledGridSolvable(shuffled, level57)).toBe(true);
  });

  it("starts with at most 35% correct gems on balanced two-zone grids", () => {
    const imbalancedGrid = [
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
    ];

    const shuffled = shuffleTargetGrid(imbalancedGrid, 48);
    const { percentage } = checkGridState(shuffled, imbalancedGrid);
    expect(percentage).toBeLessThanOrEqual(35);
  });

  it("starts with at most 35% correct gems on generated heart levels", () => {
    expect(getInitialCorrectPercent(level8.targetGrid, 8)).toBeLessThanOrEqual(35);
  });
});

describe("all levels solvability", () => {
  it.each(ALL_LEVELS.map((level) => [level.id, level] as const))(
    "level %i has a valid target grid",
    (_id, level) => {
      expect(isTargetGridValid(level)).toBe(true);
    },
  );

  it.each(ALL_LEVELS.map((level) => [level.id, level] as const))(
    "level %i preserves color counts after shuffle",
    (id, level) => {
      const shuffled = shuffleTargetGrid(level.targetGrid, id);
      expect(isShuffledGridSolvable(shuffled, level)).toBe(true);
    },
  );
});
