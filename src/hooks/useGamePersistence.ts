import { useCallback, useEffect, type MutableRefObject } from "react";
import { Level } from "../types/level";
import { calculateStars, checkGridState } from "../utils/validateGrid";
import {
  clearActiveGameState,
  flushPendingProgressSave,
  saveActiveGameState,
} from "../services/progressStorage";

interface UseGamePersistenceParams {
  level: Level;
  elapsedTimeRef: MutableRefObject<number>;
  onVictoryCallback?: (moves: number, time: number, stars: number) => void;
  setPercentage: (value: number) => void;
  setIsVictory: (value: boolean) => void;
  setStars: (value: number) => void;
  onVictoryHaptic: () => void;
}

export function useGamePersistence({
  level,
  elapsedTimeRef,
  onVictoryCallback,
  setPercentage,
  setIsVictory,
  setStars,
  onVictoryHaptic,
}: UseGamePersistenceParams) {
  useEffect(() => {
    return () => {
      void flushPendingProgressSave();
    };
  }, []);

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
        onVictoryHaptic();

        const earnedStars = calculateStars(
          newMoves,
          level.rows * level.columns,
        );

        setStars(earnedStars);
        clearActiveGameState();

        onVictoryCallback?.(
          newMoves,
          elapsedTimeRef.current,
          earnedStars,
        );
      } else {
        saveActiveGameState({
          levelId: level.id,
          currentGrid: newGrid,
          reserveGems: newReserve,
          moves: newMoves,
          elapsedTimeSeconds: elapsedTimeRef.current,
          updatedAt: Date.now(),
        });
      }
    },
    [
      level,
      elapsedTimeRef,
      onVictoryCallback,
      onVictoryHaptic,
      setPercentage,
      setIsVictory,
      setStars,
    ],
  );

  return { verifyStateAndSave };
}
