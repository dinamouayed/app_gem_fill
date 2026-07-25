import { describe, expect, it } from "vitest";

import { level8 } from "../data/levels/level8";
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

  it("keeps generated levels solvable after shuffle", () => {
    const shuffled = shuffleTargetGrid(level8.targetGrid, 8);
    expect(isShuffledGridSolvable(shuffled, level8)).toBe(true);
  });
});
