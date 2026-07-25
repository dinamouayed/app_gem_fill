import { useState, useEffect, useCallback, useRef } from "react";
import * as Haptics from "expo-haptics";
import { Level } from "../types/level";
import { CellPosition } from "../types/game";
import { shuffleTargetGrid } from "../utils/shuffleGrid";
import { checkGridState, calculateStars } from "../utils/validateGrid";
import {
  saveActiveGameState,
  clearActiveGameState,
  getUserProgress,
} from "../services/progressStorage";
import {
  getConnectedGemGroup,
  moveGroupToReserve,
  moveGroupToBoard,
} from "../utils/floodFill";

export const RESERVE_CAPACITY = 4;

export function useGame(
  level: Level,
  onVictoryCallback?: (moves: number, time: number, stars: number) => void,
) {
  const [grid, setGrid] = useState<(string | null)[][]>([]);
  const [reserve, setReserve] = useState<(string | null)[]>(
    Array(RESERVE_CAPACITY).fill(null),
  );
  const [selectedPositions, setSelectedPositions] = useState<CellPosition[]>(
    [],
  );
  const [selectedReserveIndex, setSelectedReserveIndex] = useState<
    number | null
  >(null);
  const [moves, setMoves] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [isVictory, setIsVictory] = useState<boolean>(false);
  const [percentage, setPercentage] = useState<number>(0);
  const [stars, setStars] = useState<number>(0);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  const timerRef = useRef<any>(null);

  // Helper to trigger haptics safely
  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  }, []);

  // Helper to trigger success haptics
  const triggerSuccessHaptic = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // ignore
    }
  }, []);

  const triggerErrorHaptic = useCallback(() => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // ignore
    }
  }, []);

  // Initialize or resume game
  const initGame = useCallback(async () => {
    setIsVictory(false);
    setSelectedPositions([]);
    setSelectedReserveIndex(null);

    const userProgress = await getUserProgress();
    const saved = userProgress.activeSavedGame;

    if (
      saved &&
      saved.levelId === level.id &&
      saved.currentGrid.length === level.rows
    ) {
      setGrid(saved.currentGrid);
      setReserve(
        saved.reserveGems.length === RESERVE_CAPACITY
          ? saved.reserveGems
          : Array(RESERVE_CAPACITY).fill(null),
      );
      setMoves(saved.moves);
      setElapsedTime(saved.elapsedTimeSeconds);

      const check = checkGridState(saved.currentGrid, level.targetGrid);
      setPercentage(check.percentage);
      if (check.isComplete) setIsVictory(true);
    } else {
      const shuffled = shuffleTargetGrid(level.targetGrid);
      const emptyReserve = Array(RESERVE_CAPACITY).fill(null);
      setGrid(shuffled);
      setReserve(emptyReserve);
      setMoves(0);
      setElapsedTime(0);

      const check = checkGridState(shuffled, level.targetGrid);
      setPercentage(check.percentage);
    }
    setIsInitialized(true);
  }, [level]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // Timer loop
  useEffect(() => {
    if (!isInitialized || isVictory) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isInitialized, isVictory]);

  // Check victory after state update
  const verifyStateAndSave = useCallback(
    (
      newGrid: (string | null)[][],
      newReserve: (string | null)[],
      newMoves: number,
    ) => {
      const check = checkGridState(newGrid, level.targetGrid);
      setPercentage(check.percentage);

      if (check.isComplete) {
        setIsVictory(true);
        triggerSuccessHaptic();
        const earnedStars = calculateStars(
          newMoves,
          level.rows * level.columns,
        );
        setStars(earnedStars);
        clearActiveGameState();
        if (onVictoryCallback) {
          onVictoryCallback(newMoves, elapsedTime, earnedStars);
        }
      } else {
        saveActiveGameState({
          levelId: level.id,
          currentGrid: newGrid,
          reserveGems: newReserve,
          moves: newMoves,
          elapsedTimeSeconds: elapsedTime,
          updatedAt: Date.now(),
        });
      }
    },
    [level, elapsedTime, onVictoryCallback, triggerSuccessHaptic],
  );

  // Tap handler for grid cell
  const handleCellTap = useCallback(
    (row: number, col: number) => {
      if (isVictory) return;

      const cellValue = grid[row]?.[col];

      // Case 1: A reserve gem is currently selected
      if (selectedReserveIndex !== null) {
        const reserveGem = reserve[selectedReserveIndex];
        if (!reserveGem) {
          setSelectedReserveIndex(null);
          return;
        }

        const isValidReserveDestination =
          cellValue === null && level.targetGrid[row]?.[col] === reserveGem;

        if (!isValidReserveDestination) {
          setSelectedReserveIndex(null);
          setSelectedPositions([]);
          return;
        }

        const nextGrid = grid.map((r) => [...r]);
        const nextReserve = [...reserve];

        // Move reserve gem to the empty grid cell
        nextGrid[row][col] = reserveGem;
        nextReserve[selectedReserveIndex] = null;

        const nextMoves = moves + 1;
        setGrid(nextGrid);
        setReserve(nextReserve);
        setMoves(nextMoves);
        setSelectedReserveIndex(null);
        setSelectedPositions([]);
        triggerHaptic();
        verifyStateAndSave(nextGrid, nextReserve, nextMoves);
        return;
      }

      // Case 2: A grid group is currently selected
      if (selectedPositions.length > 0) {
        const isAlreadySelected = selectedPositions.some(
          (position) => position.row === row && position.col === col,
        );

        // Tapping the selected group again deselects it
        if (isAlreadySelected) {
          setSelectedPositions([]);
          setSelectedReserveIndex(null);
          triggerHaptic();
          return;
        }

        const selectedFirstPosition = selectedPositions[0];
        const selectedColor =
          grid[selectedFirstPosition.row]?.[selectedFirstPosition.col];

        const isValidDestination =
          selectedColor !== null &&
          selectedColor !== undefined &&
          cellValue === null &&
          level.targetGrid[row]?.[col] === selectedColor;

        // Any invalid destination simply clears the selection
        if (!isValidDestination) {
          setSelectedPositions([]);
          setSelectedReserveIndex(null);
          return;
        }

        const boardMove = moveGroupToBoard(
          grid,
          level.targetGrid,
          selectedPositions,
          { row, col },
        );

        if (boardMove.movedGemIds.length > 0) {
          const nextMoves = moves + 1;

          setGrid(boardMove.nextGrid);
          setMoves(nextMoves);
          setSelectedPositions(boardMove.remainingSelectedPositions);
          setSelectedReserveIndex(null);

          triggerHaptic();
          verifyStateAndSave(boardMove.nextGrid, reserve, nextMoves);
        } else {
          setSelectedPositions([]);
          setSelectedReserveIndex(null);
        }

        return;
      }

      // Case 3: No group selected and user taps an occupied cell
      if (cellValue !== null) {
        const isGemCorrectlyPlaced = level.targetGrid[row]?.[col] === cellValue;

        // Correctly placed gems are locked and produce no effect
        if (isGemCorrectlyPlaced) {
          return;
        }

        const group = getConnectedGemGroup(
          grid,
          { row, col },
          level.targetGrid,
        );

        if (group.length === 0) {
          return;
        }

        setSelectedPositions(group);
        setSelectedReserveIndex(null);
        triggerHaptic();
        return;
      }

      // Case 4: Tap empty cell with no selection -> clear selection
      setSelectedPositions([]);
      setSelectedReserveIndex(null);
    },
    [
      grid,
      reserve,
      selectedPositions,
      selectedReserveIndex,
      isVictory,
      level.targetGrid,
      moves,
      triggerHaptic,
      verifyStateAndSave,
    ],
  );

  // Tap handler for reserve slot
  const handleReserveTap = useCallback(
    (index: number) => {
      if (isVictory) return;

      // Case 1: A grid group is selected -> move selected group to reserve
      if (selectedPositions.length > 0) {
        const resMove = moveGroupToReserve(grid, reserve, selectedPositions);

        if (resMove.movedGemIds.length > 0) {
          const nextMoves = moves + 1;
          setGrid(resMove.nextGrid);
          setReserve(resMove.nextReserve);
          setMoves(nextMoves);
          setSelectedPositions(resMove.remainingSelectedPositions);
          setSelectedReserveIndex(null);

          if (resMove.remainingSelectedPositions.length > 0) {
            triggerErrorHaptic(); // Partial move feedback if reserve filled up
          } else {
            triggerHaptic();
          }

          verifyStateAndSave(resMove.nextGrid, resMove.nextReserve, nextMoves);
        } else {
          triggerErrorHaptic(); // Reserve is full
        }
        return;
      }

      // Case 2: No grid group selected -> toggle reserve gem selection
      if (reserve[index] !== null) {
        if (selectedReserveIndex === index) {
          setSelectedReserveIndex(null);
        } else {
          setSelectedReserveIndex(index);
          setSelectedPositions([]);
          triggerHaptic();
        }
      } else {
        setSelectedReserveIndex(null);
        setSelectedPositions([]);
      }
    },
    [
      grid,
      reserve,
      selectedPositions,
      selectedReserveIndex,
      isVictory,
      moves,
      triggerHaptic,
      triggerErrorHaptic,
      verifyStateAndSave,
    ],
  );

  // Move gem / group to reserve via long press or direct trigger
  const moveGemToReserveHandler = useCallback(
    (row: number, col: number) => {
      if (isVictory) return;

      const tappedGem = grid[row]?.[col];

      if (!tappedGem || level.targetGrid[row]?.[col] === tappedGem) {
        return;
      }

      const groupToMove =
        selectedPositions.length > 0 &&
        selectedPositions.some((p) => p.row === row && p.col === col)
          ? selectedPositions
          : getConnectedGemGroup(grid, { row, col }, level.targetGrid);

      if (groupToMove.length === 0) return;

      const resMove = moveGroupToReserve(grid, reserve, groupToMove);

      if (resMove.movedGemIds.length > 0) {
        const nextMoves = moves + 1;
        setGrid(resMove.nextGrid);
        setReserve(resMove.nextReserve);
        setMoves(nextMoves);
        setSelectedPositions(resMove.remainingSelectedPositions);
        setSelectedReserveIndex(null);
        triggerHaptic();
        verifyStateAndSave(resMove.nextGrid, resMove.nextReserve, nextMoves);
      } else {
        triggerErrorHaptic();
      }
    },
    [
      grid,
      reserve,
      selectedPositions,
      isVictory,
      moves,
      level.targetGrid,
      triggerHaptic,
      triggerErrorHaptic,
      verifyStateAndSave,
    ],
  );

  // Restart level
  const restartLevel = useCallback(() => {
    clearActiveGameState();
    const shuffled = shuffleTargetGrid(level.targetGrid);
    const emptyReserve = Array(RESERVE_CAPACITY).fill(null);
    setGrid(shuffled);
    setReserve(emptyReserve);
    setMoves(0);
    setElapsedTime(0);
    setIsVictory(false);
    setSelectedPositions([]);
    setSelectedReserveIndex(null);
    const check = checkGridState(shuffled, level.targetGrid);
    setPercentage(check.percentage);
    triggerHaptic();
  }, [level, triggerHaptic]);

  return {
    grid,
    reserve,
    selectedPositions,
    selectedReserveIndex,
    moves,
    elapsedTime,
    isVictory,
    percentage,
    stars,
    isInitialized,
    handleCellTap,
    handleReserveTap,
    moveGemToReserve: moveGemToReserveHandler,
    restartLevel,
    setSelectedPositions,
    setSelectedReserveIndex,
  };
}
