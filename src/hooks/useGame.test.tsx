/**
 * @vitest-environment jsdom
 */
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useGame } from "./useGame";
import {
  emptyProgress,
  emptyReserve,
  hookTestLevel,
} from "./__tests__/testLevel";

vi.mock("../utils/savedGameValidation", () => ({
  isValidSavedGame: vi.fn(
    (saved: { levelId: number }, level: { id: number }) =>
      saved.levelId === level.id,
  ),
}));

const mockGetUserProgress = vi.fn();
const mockSaveActiveGameState = vi.fn();
const mockClearActiveGameState = vi.fn();
const mockFlushPendingProgressSave = vi.fn().mockResolvedValue(undefined);
const mockShuffleTargetGrid = vi.fn();

vi.mock("../services/progressStorage", () => ({
  getUserProgress: (...args: unknown[]) => mockGetUserProgress(...args),
  saveActiveGameState: (...args: unknown[]) =>
    mockSaveActiveGameState(...args),
  clearActiveGameState: (...args: unknown[]) =>
    mockClearActiveGameState(...args),
  flushPendingProgressSave: (...args: unknown[]) =>
    mockFlushPendingProgressSave(...args),
}));

vi.mock("../utils/shuffleGrid", () => ({
  shuffleTargetGrid: (...args: unknown[]) => mockShuffleTargetGrid(...args),
}));

vi.mock("../utils/feedback", () => ({
  feedbackSelection: vi.fn(),
  feedbackPlacement: vi.fn(),
  feedbackSuccess: vi.fn(),
  feedbackError: vi.fn(),
  feedbackCorrectPlacement: vi.fn(),
}));

describe("useGame", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserProgress.mockResolvedValue(emptyProgress);
    mockSaveActiveGameState.mockResolvedValue(undefined);
    mockClearActiveGameState.mockResolvedValue(undefined);
    mockShuffleTargetGrid.mockReturnValue([
      ["b", "b"],
      ["a", "a"],
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("initializes with a shuffled grid when no save exists", async () => {
    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.grid).toEqual([
      ["b", "b"],
      ["a", "a"],
    ]);
    expect(result.current.moves).toBe(0);
    expect(result.current.elapsedTime).toBe(0);
    expect(result.current.isVictory).toBe(false);
    expect(mockShuffleTargetGrid).toHaveBeenCalledWith(
      hookTestLevel.targetGrid,
      hookTestLevel.id,
    );
  });

  it("restores a valid saved game", async () => {
    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: [
          ["a", "b"],
          ["b", "a"],
        ],
        reserveGems: emptyReserve(),
        moves: 7,
        elapsedTimeSeconds: 33,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.grid).toEqual(hookTestLevel.targetGrid);
    expect(result.current.moves).toBe(7);
    expect(result.current.elapsedTime).toBe(33);
    expect(mockShuffleTargetGrid).not.toHaveBeenCalled();
  });

  it("ignores a saved game for another level", async () => {
    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: 42,
        currentGrid: hookTestLevel.targetGrid.map((row) => [...row]),
        reserveGems: emptyReserve(),
        moves: 9,
        elapsedTimeSeconds: 12,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.moves).toBe(0);
    expect(mockShuffleTargetGrid).toHaveBeenCalled();
  });

  it("selects a misplaced board gem group on tap", async () => {
    mockShuffleTargetGrid.mockReturnValue([
      ["b", "b"],
      ["a", "a"],
    ]);

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.handleCellTap(0, 0);
    });

    expect(result.current.selectedPositions).toEqual([{ row: 0, col: 0 }]);
    expect(result.current.selectedReserveColorId).toBeNull();
  });

  it("does not select a correctly placed gem", async () => {
    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: hookTestLevel.targetGrid.map((row) => [...row]),
        reserveGems: emptyReserve(),
        moves: 0,
        elapsedTimeSeconds: 0,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.handleCellTap(0, 0);
    });

    expect(result.current.selectedPositions).toEqual([]);
  });

  it("selects a reserve color on tap", async () => {
    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: [
          ["a", "b"],
          ["b", null],
        ],
        reserveGems: ["a", ...emptyReserve().slice(1)],
        moves: 1,
        elapsedTimeSeconds: 0,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.handleReserveTap(0);
    });

    expect(result.current.selectedReserveColorId).toBe("a");
  });

  it("persists game state after a non-winning move", async () => {
    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.handleCellTap(0, 0);
      result.current.handleReserveTap(0);
    });

    expect(mockSaveActiveGameState).toHaveBeenCalledWith(
      expect.objectContaining({
        levelId: hookTestLevel.id,
        moves: 1,
      }),
    );
    expect(result.current.isVictory).toBe(false);
  });

  it("calls onVictoryCallback and clears the active save on victory", async () => {
    const onVictory = vi.fn();

    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: [
          ["a", "b"],
          ["b", null],
        ],
        reserveGems: ["a", ...emptyReserve().slice(1)],
        moves: 1,
        elapsedTimeSeconds: 5,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() =>
      useGame(hookTestLevel, onVictory),
    );

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.handleReserveTap(0);
      result.current.handleCellTap(1, 1);
    });

    await waitFor(() => {
      expect(result.current.isVictory).toBe(true);
    });

    expect(onVictory).toHaveBeenCalledWith(
      2,
      5,
      expect.any(Number),
    );
    expect(mockClearActiveGameState).toHaveBeenCalled();
    expect(mockSaveActiveGameState).not.toHaveBeenCalled();
  });

  it("restartLevel clears the save and resets stats", async () => {
    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: [
          ["a", "b"],
          ["b", null],
        ],
        reserveGems: ["a", ...emptyReserve().slice(1)],
        moves: 4,
        elapsedTimeSeconds: 20,
        updatedAt: Date.now(),
      },
    });

    mockShuffleTargetGrid.mockReturnValue([
      ["a", "a"],
      ["b", "b"],
    ]);

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    act(() => {
      result.current.restartLevel();
    });

    expect(mockClearActiveGameState).toHaveBeenCalled();
    expect(result.current.moves).toBe(0);
    expect(result.current.elapsedTime).toBe(0);
    expect(result.current.isVictory).toBe(false);
    expect(result.current.grid).toEqual([
      ["a", "a"],
      ["b", "b"],
    ]);
  });

  it("ignores input after victory", async () => {
    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: hookTestLevel.targetGrid.map((row) => [...row]),
        reserveGems: emptyReserve(),
        moves: 2,
        elapsedTimeSeconds: 0,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() => useGame(hookTestLevel));

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.isVictory).toBe(true);

    act(() => {
      result.current.handleCellTap(0, 0);
      result.current.handleReserveTap(0);
    });

    expect(result.current.selectedPositions).toEqual([]);
    expect(result.current.selectedReserveColorId).toBeNull();
  });

  it("marks a restored completed save as victory without calling onVictoryCallback", async () => {
    const onVictory = vi.fn();

    mockGetUserProgress.mockResolvedValue({
      ...emptyProgress,
      activeSavedGame: {
        levelId: hookTestLevel.id,
        currentGrid: hookTestLevel.targetGrid.map((row) => [...row]),
        reserveGems: emptyReserve(),
        moves: 2,
        elapsedTimeSeconds: 8,
        updatedAt: Date.now(),
      },
    });

    const { result } = renderHook(() =>
      useGame(hookTestLevel, onVictory),
    );

    await waitFor(() => {
      expect(result.current.isInitialized).toBe(true);
    });

    expect(result.current.isVictory).toBe(true);
    expect(result.current.percentage).toBe(100);
    expect(onVictory).not.toHaveBeenCalled();
  });
});
