import { describe, expect, it } from "vitest";
import {
  getValidPlacementAnchors,
  pointToCell,
  resolveTapWithExtendedTargets,
} from "./placementHelpers";

describe("placementHelpers", () => {
  const targetGrid = [
    ["a", "a"],
    ["b", "b"],
  ];

  it("lists reserve placement anchors for matching empty cells", () => {
    const grid = [
      [null, "a"],
      ["b", null],
    ];

    const anchors = getValidPlacementAnchors(grid, targetGrid, [], "a");

    expect(anchors).toEqual([{ row: 0, col: 0 }]);
  });

  it("lists board group anchors using connected destination rules", () => {
    const grid = [
      ["b", "b"],
      ["a", null],
    ];

    const anchors = getValidPlacementAnchors(
      grid,
      targetGrid,
      [{ row: 0, col: 0 }, { row: 0, col: 1 }],
      null,
    );

    expect(anchors).toEqual([{ row: 1, col: 1 }]);
  });

  it("maps a touch point to the underlying cell", () => {
    expect(pointToCell(8, 8, 40, 2, 2)).toEqual({ row: 0, col: 0 });
    expect(pointToCell(49, 8, 40, 2, 2)).toEqual({ row: 0, col: 1 });
  });

  it("snaps to the nearest valid anchor inside its extended touch radius", () => {
    const validAnchors = [{ row: 0, col: 0 }];
    const cellSize = 24;

    const resolved = resolveTapWithExtendedTargets(
      8 + cellSize + 4,
      8 + cellSize / 2,
      cellSize,
      2,
      2,
      validAnchors,
    );

    expect(resolved).toEqual({ row: 0, col: 0 });
  });

  it("falls back to the cell under the finger when outside extended anchors", () => {
    const validAnchors = [{ row: 0, col: 0 }];
    const cellSize = 40;

    const resolved = resolveTapWithExtendedTargets(
      8 + cellSize + cellSize / 2,
      8 + cellSize / 2,
      cellSize,
      2,
      2,
      validAnchors,
    );

    expect(resolved).toEqual({ row: 0, col: 1 });
  });
});
