import { useEffect, useMemo, useRef, useState } from "react";
import { CellPosition } from "../types/game";
import {
  findBestTutorialSelectCell,
  findEmptyCells,
  findFirstEmptyReserveSlot,
  findMisplacedGemForEmptyTargets,
  findValidPlacementInCells,
} from "../utils/tutorialHelpers";

export type Level1TutorialStep =
  | "select"
  | "reserve"
  | "selectAgain"
  | "place"
  | "done";

const MESSAGES: Record<Exclude<Level1TutorialStep, "done">, string> = {
  select: "Appuyez sur une gemme mal placée",
  reserve: "Envoyez-la dans la zone de réserve",
  selectAgain: "Sélectionnez une autre gemme mal placée",
  place: "Placez-la sur les cases libérées",
};

export function useLevel1Tutorial(
  levelId: number,
  grid: (string | null)[][],
  targetGrid: string[][],
  selectedPositions: CellPosition[],
  reserve: (string | null)[],
  moves: number,
  isInitialized: boolean,
) {
  const [step, setStep] = useState<Level1TutorialStep>("select");
  const prevStepRef = useRef<Level1TutorialStep>("select");
  const movesAtReserveStartRef = useRef(0);
  const reserveCountAtStartRef = useRef(0);
  const movesAtPlaceStartRef = useRef(0);
  const emptiedCellsRef = useRef<CellPosition[]>([]);

  const isActive = levelId === 1 && isInitialized && step !== "done";

  useEffect(() => {
    if (prevStepRef.current === step) {
      return;
    }

    if (step === "reserve") {
      movesAtReserveStartRef.current = moves;
      reserveCountAtStartRef.current = reserve.filter((gemId) => gemId !== null).length;
    } else if (step === "place") {
      movesAtPlaceStartRef.current = moves;
    }

    prevStepRef.current = step;
  }, [step, moves, reserve]);

  useEffect(() => {
    if (levelId !== 1 || !isInitialized) {
      return;
    }

    const isFreshGame =
      moves === 0 &&
      reserve.every((gemId) => gemId === null) &&
      selectedPositions.length === 0;

    if (isFreshGame && step !== "select") {
      emptiedCellsRef.current = [];
      movesAtReserveStartRef.current = 0;
      reserveCountAtStartRef.current = 0;
      movesAtPlaceStartRef.current = 0;
      prevStepRef.current = "select";
      setStep("select");
    }
  }, [
    levelId,
    isInitialized,
    moves,
    reserve,
    selectedPositions.length,
    step,
  ]);

  useEffect(() => {
    if (!isActive || step !== "select") {
      return;
    }

    if (selectedPositions.length > 0) {
      setStep("reserve");
    }
  }, [isActive, selectedPositions.length, step]);

  useEffect(() => {
    if (!isActive || step !== "reserve") {
      return;
    }

    const reserveCount = reserve.filter((gemId) => gemId !== null).length;

    if (
      moves > movesAtReserveStartRef.current ||
      reserveCount > reserveCountAtStartRef.current
    ) {
      emptiedCellsRef.current = findEmptyCells(grid);
      setStep("selectAgain");
    }
  }, [isActive, moves, reserve, step, grid]);

  useEffect(() => {
    if (!isActive || step !== "selectAgain") {
      return;
    }

    if (selectedPositions.length > 0) {
      setStep("place");
    }
  }, [isActive, selectedPositions.length, step]);

  useEffect(() => {
    if (!isActive || step !== "place") {
      return;
    }

    if (moves > movesAtPlaceStartRef.current) {
      setStep("done");
    }
  }, [isActive, moves, step]);

  const targetCell = useMemo((): CellPosition | null => {
    if (!isActive) {
      return null;
    }

    if (step === "select") {
      return findBestTutorialSelectCell(grid, targetGrid);
    }

    if (step === "selectAgain") {
      return findMisplacedGemForEmptyTargets(
        grid,
        targetGrid,
        emptiedCellsRef.current,
      );
    }

    if (step === "place") {
      return findValidPlacementInCells(
        grid,
        targetGrid,
        selectedPositions,
        emptiedCellsRef.current,
      );
    }

    return null;
  }, [isActive, step, grid, targetGrid, selectedPositions]);

  const targetReserveSlot = useMemo((): number | null => {
    if (!isActive || step !== "reserve") {
      return null;
    }

    return findFirstEmptyReserveSlot(reserve);
  }, [isActive, step, reserve]);

  const message =
    step === "done" ? "" : MESSAGES[step as Exclude<Level1TutorialStep, "done">];

  const stepIndex =
    step === "select"
      ? 1
      : step === "reserve"
        ? 2
        : step === "selectAgain"
          ? 3
          : step === "place"
            ? 4
            : 0;

  return {
    isActive,
    step,
    targetCell,
    targetReserveSlot,
    message,
    stepIndex,
    totalSteps: 4,
  };
}
