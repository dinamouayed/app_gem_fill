import { describe, expect, it } from "vitest";

import { level57 } from "../data/levels/level57";
import { isShuffledGridSolvable } from "./levelValidation";
import { shuffleTargetGrid } from "./shuffleGrid";
import { hasMatchingColorCounts } from "./validateGrid";

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
});
