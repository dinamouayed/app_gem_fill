import { describe, expect, it } from "vitest";

import {
  calculateStars,
  checkGridState,
  getColorCounts,
  hasMatchingColorCounts,
} from "./validateGrid";

describe("checkGridState", () => {
  const targetGrid = [
    ["a", "b"],
    ["b", "a"],
  ];

  it("returns 100% when the grid matches the target", () => {
    const result = checkGridState(targetGrid, targetGrid);

    expect(result.isComplete).toBe(true);
    expect(result.percentage).toBe(100);
    expect(result.correctCount).toBe(4);
  });

  it("counts partially correct cells", () => {
    const currentGrid = [
      ["a", "b"],
      ["b", "b"],
    ];

    const result = checkGridState(currentGrid, targetGrid);

    expect(result.isComplete).toBe(false);
    expect(result.percentage).toBe(75);
    expect(result.correctCount).toBe(3);
  });
});

describe("getColorCounts", () => {
  it("ignores empty cells", () => {
    const grid = [
      ["a", null],
      [null, "b"],
    ];

    expect(getColorCounts(grid)).toEqual(
      new Map([
        ["a", 1],
        ["b", 1],
      ]),
    );
  });
});

describe("hasMatchingColorCounts", () => {
  it("returns true when both grids have the same gem counts", () => {
    const currentGrid = [
      ["b", "a"],
      ["a", "b"],
    ];
    const targetGrid = [
      ["a", "b"],
      ["b", "a"],
    ];

    expect(hasMatchingColorCounts(currentGrid, targetGrid)).toBe(true);
  });

  it("returns false when a color is missing", () => {
    const currentGrid = [
      ["a", "a"],
      ["a", "a"],
    ];
    const targetGrid = [
      ["a", "b"],
      ["b", "a"],
    ];

    expect(hasMatchingColorCounts(currentGrid, targetGrid)).toBe(false);
  });
});

describe("calculateStars", () => {
  it("awards 3 stars at or below the optimal move target", () => {
    // 4 cells → targetMoves = ceil(4 * 1.5) = 6
    expect(calculateStars(1, 4)).toBe(3);
    expect(calculateStars(6, 4)).toBe(3);
  });

  it("awards 2 stars within twice the optimal move target", () => {
    expect(calculateStars(7, 4)).toBe(2);
    expect(calculateStars(12, 4)).toBe(2);
  });

  it("awards 1 star above twice the optimal move target", () => {
    expect(calculateStars(13, 4)).toBe(1);
  });

  it("scales with larger grids", () => {
    // 16 cells → targetMoves = ceil(16 * 1.5) = 24
    expect(calculateStars(24, 16)).toBe(3);
    expect(calculateStars(25, 16)).toBe(2);
    expect(calculateStars(49, 16)).toBe(1);
  });
});
