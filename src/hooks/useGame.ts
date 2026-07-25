import { useState, useEffect, useCallback, useRef } from "react";
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
  moveReserveGroupToBoard,
} from "../utils/floodFill";
import {
  hapticSelection,
  hapticImpactLight,
  hapticSuccess,
  hapticError,
} from "../utils/haptics";
import {
  buildPlacementSteps,
  usePlacementAnimator,
} from "./usePlacementAnimator";

export const RESERVE_CAPACITY = 12;

const createEmptyReserve = (): (string | null)[] =>
  Array(RESERVE_CAPACITY).fill(null);

/*
 * Range les gemmes selon l'ordre des couleurs
 * défini dans la palette du niveau.
 *
 * Les emplacements vides sont placés à la fin.
 */
const sortReserveByColor = (
  reserve: (string | null)[],
  paletteOrder: string[],
): (string | null)[] => {
  const orderMap = new Map(
    paletteOrder.map((colorId, index) => [colorId, index]),
  );

  const gems = reserve.filter((gemId): gemId is string => gemId !== null);

  gems.sort((firstGemId, secondGemId) => {
    const firstOrder = orderMap.get(firstGemId) ?? Number.MAX_SAFE_INTEGER;

    const secondOrder = orderMap.get(secondGemId) ?? Number.MAX_SAFE_INTEGER;

    return firstOrder - secondOrder;
  });

  return [...gems, ...Array(RESERVE_CAPACITY - gems.length).fill(null)];
};

export function useGame(
  level: Level,
  onVictoryCallback?: (moves: number, time: number, stars: number) => void,
) {
  const [grid, setGrid] = useState<(string | null)[][]>([]);

  const [reserve, setReserve] =
    useState<(string | null)[]>(createEmptyReserve());

  const [selectedPositions, setSelectedPositions] = useState<CellPosition[]>(
    [],
  );

  /*
   * Une couleur est sélectionnée au lieu d'un seul index.
   * Toutes les gemmes identiques de la réserve sont donc
   * sélectionnées en même temps.
   */
  const [selectedReserveColorId, setSelectedReserveColorId] = useState<
    string | null
  >(null);

  const [moves, setMoves] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isVictory, setIsVictory] = useState(false);
  const [percentage, setPercentage] = useState(0);
  const [stars, setStars] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const {
    displayGrid,
    displayReserve,
    isAnimating: isPlacementAnimating,
    activeFlights,
    waitingSourcePositions,
    waitingReserveIndices,
    settlingDestinations,
    handleFlightLand,
    handleFlightDismiss,
    handleFlightTakeoff,
    startSequence,
    cancelSequence,
  } = usePlacementAnimator();

  const paletteOrder = level.palette.map((color) => color.id);

  const triggerSelectionHaptic = useCallback(() => {
    hapticSelection();
  }, []);

  const triggerHaptic = useCallback(() => {
    hapticImpactLight();
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    hapticSuccess();
  }, []);

  const triggerErrorHaptic = useCallback(() => {
    hapticError();
  }, []);

  const initGame = useCallback(async () => {
    cancelSequence();
    setIsVictory(false);
    setSelectedPositions([]);
    setSelectedReserveColorId(null);

    const userProgress = await getUserProgress();
    const saved = userProgress.activeSavedGame;

    if (
      saved &&
      saved.levelId === level.id &&
      saved.currentGrid.length === level.rows
    ) {
      setGrid(saved.currentGrid);

      /*
       * Permet aussi de récupérer une ancienne sauvegarde
       * qui utilisait seulement 4 emplacements.
       */
      const restoredReserve = [
        ...saved.reserveGems.filter((gemId): gemId is string => gemId !== null),
        ...createEmptyReserve(),
      ].slice(0, RESERVE_CAPACITY);

      setReserve(sortReserveByColor(restoredReserve, paletteOrder));

      setMoves(saved.moves);
      setElapsedTime(saved.elapsedTimeSeconds);

      const check = checkGridState(saved.currentGrid, level.targetGrid);

      setPercentage(check.percentage);

      if (check.isComplete) {
        setIsVictory(true);
      }
    } else {
      const shuffled = shuffleTargetGrid(level.targetGrid);

      setGrid(shuffled);
      setReserve(createEmptyReserve());
      setMoves(0);
      setElapsedTime(0);

      const check = checkGridState(shuffled, level.targetGrid);

      setPercentage(check.percentage);
    }

    setIsInitialized(true);
  }, [level, paletteOrder.join("|"), cancelSequence]);

  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (!isInitialized || isVictory) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedTime((previousTime) => previousTime + 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isInitialized, isVictory]);

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

        onVictoryCallback?.(newMoves, elapsedTime, earnedStars);
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

  const handleCellTap = useCallback(
    (row: number, col: number) => {
      if (isVictory || isPlacementAnimating) {
        return;
      }

      const cellValue = grid[row]?.[col];

      /*
       * Cas 1 :
       * une couleur de la réserve est sélectionnée.
       */
      if (selectedReserveColorId !== null) {
        const isValidDestination =
          cellValue === null &&
          level.targetGrid[row]?.[col] === selectedReserveColorId;

        if (!isValidDestination) {
          setSelectedReserveColorId(null);
          setSelectedPositions([]);
          return;
        }

        const boardMove = moveReserveGroupToBoard(
          grid,
          level.targetGrid,
          reserve,
          { row, col },
          selectedReserveColorId,
        );

        if (boardMove.placedCount === 0) {
          setSelectedReserveColorId(null);
          setSelectedPositions([]);
          return;
        }

        const sortedReserve = sortReserveByColor(
          boardMove.nextReserve,
          paletteOrder,
        );

        const nextMoves = moves + 1;

        const stillHasSelectedColor = sortedReserve.some(
          (gemId) => gemId === selectedReserveColorId,
        );

        setMoves(nextMoves);

        startSequence({
          initialGrid: grid.map((gridRow) => [...gridRow]),
          initialReserve: [...reserve],
          steps: buildPlacementSteps(
            boardMove.placedPositions,
            [],
            selectedReserveColorId,
            level.targetGrid,
            boardMove.sourceReserveIndices,
          ),
          onComplete: () => {
            setGrid(boardMove.nextGrid);
            setReserve(sortedReserve);
            setSelectedPositions([]);
            setSelectedReserveColorId(
              stillHasSelectedColor ? selectedReserveColorId : null,
            );
            verifyStateAndSave(boardMove.nextGrid, sortedReserve, nextMoves);
          },
        });

        return;
      }

      /*
       * Cas 2 :
       * un groupe du plateau est sélectionné.
       */
      if (selectedPositions.length > 0) {
        const isAlreadySelected = selectedPositions.some(
          (position) => position.row === row && position.col === col,
        );

        if (isAlreadySelected) {
          setSelectedPositions([]);
          setSelectedReserveColorId(null);
          triggerSelectionHaptic();
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

        if (!isValidDestination) {
          setSelectedPositions([]);
          setSelectedReserveColorId(null);
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

          setMoves(nextMoves);

          startSequence({
            initialGrid: grid.map((gridRow) => [...gridRow]),
            steps: buildPlacementSteps(
              boardMove.placedPositions,
              boardMove.sourcePositions,
              selectedColor!,
              level.targetGrid,
            ),
            onComplete: () => {
              setGrid(boardMove.nextGrid);
              setSelectedPositions(boardMove.remainingSelectedPositions);
              setSelectedReserveColorId(null);
              verifyStateAndSave(boardMove.nextGrid, reserve, nextMoves);
            },
          });
        } else {
          setSelectedPositions([]);
          setSelectedReserveColorId(null);
        }

        return;
      }

      /*
       * Cas 3 :
       * aucune sélection et clic sur une gemme du plateau.
       */
      if (cellValue !== null) {
        const isGemCorrectlyPlaced = level.targetGrid[row]?.[col] === cellValue;

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
        setSelectedReserveColorId(null);
        triggerSelectionHaptic();

        return;
      }

      setSelectedPositions([]);
      setSelectedReserveColorId(null);
    },
    [
      grid,
      reserve,
      selectedPositions,
      selectedReserveColorId,
      isVictory,
      isPlacementAnimating,
      level.targetGrid,
      moves,
      paletteOrder,
      triggerSelectionHaptic,
      verifyStateAndSave,
      startSequence,
    ],
  );

  const handleReserveTap = useCallback(
    (index: number) => {
      if (isVictory || isPlacementAnimating) {
        return;
      }

      /*
       * Cas 1 :
       * un groupe du plateau est sélectionné.
       * Le groupe est envoyé dans la réserve.
       */
      if (selectedPositions.length > 0) {
        const reserveMove = moveGroupToReserve(
          grid,
          reserve,
          selectedPositions,
        );

        if (reserveMove.movedGemIds.length > 0) {
          const sortedReserve = sortReserveByColor(
            reserveMove.nextReserve,
            paletteOrder,
          );

          const nextMoves = moves + 1;

          setGrid(reserveMove.nextGrid);
          setReserve(sortedReserve);
          setMoves(nextMoves);
          setSelectedPositions(reserveMove.remainingSelectedPositions);
          setSelectedReserveColorId(null);

          if (reserveMove.remainingSelectedPositions.length > 0) {
            triggerErrorHaptic();
          } else {
            triggerHaptic();
          }

          verifyStateAndSave(reserveMove.nextGrid, sortedReserve, nextMoves);
        } else {
          triggerErrorHaptic();
        }

        return;
      }

      /*
       * Cas 2 :
       * sélection d'une couleur dans la réserve.
       */
      const selectedGemId = reserve[index];

      if (selectedGemId !== null) {
        if (selectedReserveColorId === selectedGemId) {
          setSelectedReserveColorId(null);
          triggerSelectionHaptic();
        } else {
          setSelectedReserveColorId(selectedGemId);
          setSelectedPositions([]);
          triggerSelectionHaptic();
        }
      } else {
        setSelectedReserveColorId(null);
        setSelectedPositions([]);
      }
    },
    [
      grid,
      reserve,
      selectedPositions,
      selectedReserveColorId,
      isVictory,
      isPlacementAnimating,
      moves,
      paletteOrder,
      triggerHaptic,
      triggerSelectionHaptic,
      triggerErrorHaptic,
      verifyStateAndSave,
    ],
  );

  const moveGemToReserveHandler = useCallback(
    (row: number, col: number) => {
      if (isVictory || isPlacementAnimating) {
        return;
      }

      const tappedGem = grid[row]?.[col];

      if (!tappedGem || level.targetGrid[row]?.[col] === tappedGem) {
        return;
      }

      const groupToMove =
        selectedPositions.length > 0 &&
        selectedPositions.some(
          (position) => position.row === row && position.col === col,
        )
          ? selectedPositions
          : getConnectedGemGroup(grid, { row, col }, level.targetGrid);

      if (groupToMove.length === 0) {
        return;
      }

      const reserveMove = moveGroupToReserve(grid, reserve, groupToMove);

      if (reserveMove.movedGemIds.length > 0) {
        const sortedReserve = sortReserveByColor(
          reserveMove.nextReserve,
          paletteOrder,
        );

        const nextMoves = moves + 1;

        setGrid(reserveMove.nextGrid);
        setReserve(sortedReserve);
        setMoves(nextMoves);
        setSelectedPositions(reserveMove.remainingSelectedPositions);
        setSelectedReserveColorId(null);

        triggerHaptic();

        verifyStateAndSave(reserveMove.nextGrid, sortedReserve, nextMoves);
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
      paletteOrder,
      triggerHaptic,
      triggerErrorHaptic,
      verifyStateAndSave,
    ],
  );

  const restartLevel = useCallback(() => {
    cancelSequence();
    clearActiveGameState();

    const shuffled = shuffleTargetGrid(level.targetGrid);

    const emptyReserve = createEmptyReserve();

    setGrid(shuffled);
    setReserve(emptyReserve);
    setMoves(0);
    setElapsedTime(0);
    setIsVictory(false);
    setSelectedPositions([]);
    setSelectedReserveColorId(null);

    const check = checkGridState(shuffled, level.targetGrid);

    setPercentage(check.percentage);
    triggerHaptic();
  }, [level, triggerHaptic, cancelSequence]);

  const renderGrid =
    isPlacementAnimating && displayGrid !== null ? displayGrid : grid;

  const renderReserve =
    isPlacementAnimating && displayReserve !== null ? displayReserve : reserve;

  const flyingReserveIndices = activeFlights
    .map(({ step }) => step.reserveSourceIndex)
    .filter((index): index is number => index !== undefined);

  return {
    grid: renderGrid,
    reserve: renderReserve,
    selectedPositions,
    selectedReserveColorId,
    isPlacementAnimating,
    activeFlights,
    waitingSourcePositions,
    waitingReserveIndices,
    settlingDestinations,
    flyingReserveIndices,
    handlePlacementFlightLand: handleFlightLand,
    handlePlacementFlightDismiss: handleFlightDismiss,
    handlePlacementFlightTakeoff: handleFlightTakeoff,
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
    setSelectedReserveColorId,
  };
}
