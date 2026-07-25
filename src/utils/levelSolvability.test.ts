import { describe, expect, it } from "vitest";

import { ALL_LEVELS } from "../data/levels";
import { level7 } from "../data/levels/level7";
import { level8 } from "../data/levels/level8";
import { isShuffledGridSolvable, isTargetGridValid } from "./levelValidation";
import {
  MIN_PALETTE_DELTA_E,
  deltaECie76,
  hasDistinguishablePalette,
  minPaletteDeltaE,
  rgbToLab,
} from "./colorDistance";
import { getInitialCorrectPercent, shuffleTargetGrid } from "./shuffleGrid";
import { checkGridState, hasMatchingColorCounts } from "./validateGrid";

const MAX_START_CORRECT_PERCENT = 20;

describe("colorDistance", () => {
  it("detects very similar colors", () => {
    const first = rgbToLab(200, 200, 200);
    const second = rgbToLab(210, 210, 210);
    expect(deltaECie76(first, second)).toBeLessThan(MIN_PALETTE_DELTA_E);
  });

  it("accepts clearly different colors", () => {
    const red = rgbToLab(220, 40, 60);
    const blue = rgbToLab(40, 80, 220);
    expect(deltaECie76(red, blue)).toBeGreaterThanOrEqual(MIN_PALETTE_DELTA_E);
  });
});

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

  it("keeps image levels solvable after shuffle", () => {
    const shuffled = shuffleTargetGrid(level7.targetGrid, 7);
    expect(isShuffledGridSolvable(shuffled, level7)).toBe(true);
  });

  it("starts with at most 20% correct gems on balanced two-zone grids", () => {
    const imbalancedGrid = [
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
      ["bg", "bg", "bg", "bg", "heart", "heart", "heart", "heart"],
    ];

    const shuffled = shuffleTargetGrid(imbalancedGrid, 48);
    const { percentage } = checkGridState(shuffled, imbalancedGrid);
    expect(percentage).toBeLessThanOrEqual(MAX_START_CORRECT_PERCENT);
  });

  it("starts with at most 20% correct gems on generated levels", () => {
    expect(getInitialCorrectPercent(level8.targetGrid, 8)).toBeLessThanOrEqual(
      MAX_START_CORRECT_PERCENT,
    );
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

  it.each(
    ALL_LEVELS.filter((level) => level.id > 6).map(
      (level) => [level.id, level] as const,
    ),
  )(
    "level %i starts with at most 20% correct gems",
    (id, level) => {
      expect(getInitialCorrectPercent(level.targetGrid, id)).toBeLessThanOrEqual(
        MAX_START_CORRECT_PERCENT,
      );
    },
  );

  it.each(
    ALL_LEVELS.filter((level) => level.id >= 8).map(
      (level) => [level.id, level] as const,
    ),
  )(
    "level %i has distinguishable palette colors",
    (_id, level) => {
      expect(hasDistinguishablePalette(level)).toBe(true);
      const { minimum } = minPaletteDeltaE(level.palette.map((color) => color.hex));
      expect(minimum).toBeGreaterThanOrEqual(MIN_PALETTE_DELTA_E);
    },
  );
});
