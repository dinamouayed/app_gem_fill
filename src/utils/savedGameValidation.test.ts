import { describe, expect, it } from "vitest";
import { level1 } from "../data/levels/level1";
import { isValidSavedGame } from "./savedGameValidation";

describe("isValidSavedGame", () => {
  it("accepts a consistent saved state", () => {
    const saved = {
      levelId: 1,
      currentGrid: level1.targetGrid.map((row) => [...row]),
      reserveGems: Array(12).fill(null),
      moves: 3,
      elapsedTimeSeconds: 42,
      updatedAt: Date.now(),
    };

    expect(isValidSavedGame(saved, level1)).toBe(true);
  });

  it("rejects mismatched grid dimensions", () => {
    const saved = {
      levelId: 1,
      currentGrid: level1.targetGrid.slice(0, 2),
      reserveGems: Array(12).fill(null),
      moves: 0,
      elapsedTimeSeconds: 0,
      updatedAt: Date.now(),
    };

    expect(isValidSavedGame(saved, level1)).toBe(false);
  });

  it("rejects invalid color ids", () => {
    const saved = {
      levelId: 1,
      currentGrid: level1.targetGrid.map((row, rowIndex) =>
        row.map((cell, colIndex) =>
          rowIndex === 0 && colIndex === 0 ? "invalid_color" : cell,
        ),
      ),
      reserveGems: Array(12).fill(null),
      moves: 0,
      elapsedTimeSeconds: 0,
      updatedAt: Date.now(),
    };

    expect(isValidSavedGame(saved, level1)).toBe(false);
  });
});
