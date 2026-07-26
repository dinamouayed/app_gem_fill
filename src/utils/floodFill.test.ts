import { describe, expect, it } from "vitest";

import {
  getConnectedGemGroup,
  moveGroupToBoard,
  moveGroupToReserve,
  moveReserveGroupToBoard,
} from "./floodFill";

describe("getConnectedGemGroup", () => {
  it("returns a single-gem group for an isolated gem", () => {
    const grid = [
      ["R", null, "B"],
      [null, "G", null],
      ["Y", null, "R"],
    ];

    expect(getConnectedGemGroup(grid, { row: 1, col: 1 })).toEqual([
      { row: 1, col: 1 },
    ]);
  });

  it("selects adjacent gems of the same color", () => {
    const grid = [
      ["R", "R", "B"],
      [null, "G", null],
    ];

    expect(getConnectedGemGroup(grid, { row: 0, col: 0 })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it("selects an entire connected chain", () => {
    const grid = [
      ["R", "R", "R"],
      [null, null, "R"],
      ["B", "R", "R"],
    ];

    expect(getConnectedGemGroup(grid, { row: 0, col: 0 })).toHaveLength(6);
  });

  it("does not merge separated groups of the same color", () => {
    const grid = [
      ["Y", "Y", "W", "Y", "Y"],
      ["W", "W", "W", "W", "W"],
    ];

    expect(getConnectedGemGroup(grid, { row: 0, col: 0 })).toEqual([
      { row: 0, col: 0 },
      { row: 0, col: 1 },
    ]);
  });

  it("includes diagonally connected gems", () => {
    const grid = [
      ["R", "B", "R"],
      ["B", "R", "B"],
      ["R", "B", "R"],
    ];

    expect(getConnectedGemGroup(grid, { row: 1, col: 1 })).toEqual([
      { row: 1, col: 1 },
      { row: 0, col: 0 },
      { row: 0, col: 2 },
      { row: 2, col: 0 },
      { row: 2, col: 2 },
    ]);
  });

  it("handles groups on grid edges without errors", () => {
    const grid = [
      ["G", "G"],
      ["G", "B"],
    ];

    expect(getConnectedGemGroup(grid, { row: 0, col: 0 })).toHaveLength(3);
  });
});

describe("moveGroupToReserve", () => {
  it("moves only as many gems as the reserve can hold", () => {
    const grid = [
      ["R", "R", "R"],
      ["R", "R", "R"],
      [null, null, null],
    ];
    const reserve = [null, null, null, null];

    const selectedPositions = getConnectedGemGroup(grid, { row: 0, col: 0 });

    expect(selectedPositions).toHaveLength(6);

    const result = moveGroupToReserve(grid, reserve, selectedPositions);

    expect(result.movedGemIds).toHaveLength(4);
    expect(result.nextReserve.filter((slot) => slot === "R")).toHaveLength(4);
    expect(result.remainingSelectedPositions).toEqual([
      { row: 0, col: 2 },
      { row: 1, col: 2 },
    ]);
    expect(result.nextGrid[0][2]).toBe("R");
    expect(result.nextGrid[1][2]).toBe("R");

    const reserveCount = result.nextReserve.filter((slot) => slot === "R").length;
    const gridCount = result.nextGrid.flat().filter((slot) => slot === "R").length;

    expect(reserveCount + gridCount).toBe(6);
  });
});

describe("moveGroupToBoard", () => {
  it("places a selected group onto valid empty cells", () => {
    const grid = [
      ["B", "B", null],
      [null, null, null],
    ];
    const targetGrid = [
      ["B", "B", "B"],
      ["B", "B", "B"],
    ];

    const result = moveGroupToBoard(
      grid,
      targetGrid,
      [
        { row: 0, col: 0 },
        { row: 0, col: 1 },
      ],
      { row: 0, col: 2 },
    );

    expect(result.movedGemIds).toHaveLength(2);
    expect(result.remainingSelectedPositions).toHaveLength(0);
    expect(result.nextGrid[0][2]).toBe("B");
    expect(result.nextGrid[1][2]).toBe("B");
  });
});

describe("moveReserveGroupToBoard", () => {
  it("places all matching reserve gems onto the board", () => {
    const grid = [[null, null, null]];
    const targetGrid = [["B", "B", "B"]];
    const reserve = ["B", "B", "B", "R", null, null, null, null, null, null];

    const result = moveReserveGroupToBoard(
      grid,
      targetGrid,
      reserve,
      { row: 0, col: 0 },
      "B",
    );

    expect(result.placedCount).toBe(3);
    expect(result.nextGrid.flat().filter((gemId) => gemId === "B")).toHaveLength(3);
    expect(result.nextReserve.filter((gemId) => gemId === "B")).toHaveLength(0);
  });
});
