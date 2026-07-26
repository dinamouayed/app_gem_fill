/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { level1 } from "../data/levels/level1";
import { useLevel1Tutorial } from "./useLevel1Tutorial";
import { emptyReserve } from "./__tests__/testLevel";

const shuffledLevel1Grid = [
  ["red", "bg", "red", "bg"],
  ["bg", "red", "pink", "red"],
  ["red", "red", "bg", "red"],
  ["bg", "red", "red", "bg"],
];

function renderTutorial(
  overrides: Partial<{
    levelId: number;
    grid: (string | null)[][];
    selectedPositions: { row: number; col: number }[];
    reserve: (string | null)[];
    moves: number;
    isInitialized: boolean;
  }> = {},
) {
  const props = {
    levelId: 1,
    grid: shuffledLevel1Grid,
    targetGrid: level1.targetGrid,
    selectedPositions: [] as { row: number; col: number }[],
    reserve: emptyReserve(),
    moves: 0,
    isInitialized: true,
    ...overrides,
  };

  return renderHook(
    ({ levelId, grid, targetGrid, selectedPositions, reserve, moves, isInitialized }) =>
      useLevel1Tutorial(
        levelId,
        grid,
        targetGrid,
        selectedPositions,
        reserve,
        moves,
        isInitialized,
      ),
    { initialProps: props },
  );
}

describe("useLevel1Tutorial", () => {
  it("is inactive on levels other than level 1", () => {
    const { result } = renderTutorial({ levelId: 2 });

    expect(result.current.isActive).toBe(false);
    expect(result.current.targetCell).toBeNull();
    expect(result.current.targetReserveSlot).toBeNull();
  });

  it("starts on the select step with the first tutorial message", () => {
    const { result } = renderTutorial();

    expect(result.current.isActive).toBe(true);
    expect(result.current.step).toBe("select");
    expect(result.current.message).toBe("Appuyez sur une gemme mal placée");
    expect(result.current.stepIndex).toBe(1);
    expect(result.current.totalSteps).toBe(4);
  });

  it("advances to reserve when a board group is selected", () => {
    const { result, rerender } = renderTutorial();

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [{ row: 0, col: 0 }],
      reserve: emptyReserve(),
      moves: 0,
      isInitialized: true,
    });

    expect(result.current.step).toBe("reserve");
    expect(result.current.message).toBe("Envoyez-la dans la zone de réserve");
    expect(result.current.targetReserveSlot).not.toBeNull();
  });

  it("advances to selectAgain after a gem is sent to the reserve", () => {
    const { result, rerender } = renderTutorial({
      selectedPositions: [{ row: 0, col: 0 }],
    });

    expect(result.current.step).toBe("reserve");

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [],
      reserve: ["red", ...emptyReserve().slice(1)],
      moves: 1,
      isInitialized: true,
    });

    expect(result.current.step).toBe("selectAgain");
    expect(result.current.message).toBe(
      "Sélectionnez une autre gemme mal placée",
    );
  });

  it("advances to place when a second group is selected", () => {
    const reserveWithGem = ["red", ...emptyReserve().slice(1)];

    const { result, rerender } = renderTutorial({
      selectedPositions: [{ row: 0, col: 0 }],
    });

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [],
      reserve: reserveWithGem,
      moves: 1,
      isInitialized: true,
    });

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [{ row: 0, col: 2 }],
      reserve: reserveWithGem,
      moves: 1,
      isInitialized: true,
    });

    expect(result.current.step).toBe("place");
    expect(result.current.message).toBe("Placez-la sur les cases libérées");
  });

  it("completes the tutorial after a placement move", () => {
    const reserveWithGem = ["red", ...emptyReserve().slice(1)];

    const { result, rerender } = renderTutorial({
      selectedPositions: [{ row: 0, col: 0 }],
    });

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [],
      reserve: reserveWithGem,
      moves: 1,
      isInitialized: true,
    });

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [{ row: 0, col: 2 }],
      reserve: reserveWithGem,
      moves: 1,
      isInitialized: true,
    });

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [],
      reserve: reserveWithGem,
      moves: 2,
      isInitialized: true,
    });

    expect(result.current.step).toBe("done");
    expect(result.current.isActive).toBe(false);
    expect(result.current.message).toBe("");
  });

  it("resets to select when the level is restarted", () => {
    const reserveWithGem = ["red", ...emptyReserve().slice(1)];

    const { result, rerender } = renderTutorial({
      selectedPositions: [{ row: 0, col: 0 }],
    });

    rerender({
      levelId: 1,
      grid: shuffledLevel1Grid,
      targetGrid: level1.targetGrid,
      selectedPositions: [],
      reserve: reserveWithGem,
      moves: 1,
      isInitialized: true,
    });

    act(() => {
      rerender({
        levelId: 1,
        grid: shuffledLevel1Grid,
        targetGrid: level1.targetGrid,
        selectedPositions: [],
        reserve: emptyReserve(),
        moves: 0,
        isInitialized: true,
      });
    });

    expect(result.current.step).toBe("select");
    expect(result.current.isActive).toBe(true);
  });
});
