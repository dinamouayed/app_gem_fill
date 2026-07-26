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
  const gridRef = useRef<(string | null)[][]>([]);
  const reserveRef = useRef<(string | null)[]>(createEmptyReserve());
  const selectedPositionsRef = useRef<CellPosition[]>([]);
  const selectedReserveColorIdRef = useRef<string | null>(null);
  const movesRef = useRef(0);

  gridRef.current = grid;
  reserveRef.current = reserve;
  selectedPositionsRef.current = selectedPositions;
  selectedReserveColorIdRef.current = selectedReserveColorId;
  movesRef.current = moves;

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

  const triggerPlacementHaptic = useCallback(
    (placedPositions: CellPosition[], colorId: string) => {
      const placedCorrectly = placedPositions.some(
        (position) =>
          level.targetGrid[position.row]?.[position.col] === colorId,
      );

      if (placedCorrectly) {
        hapticSelection();
      }
    },
    [level.targetGrid],
  );

  const trySelectBoardGemGroup = useCallback(
    (row: number, col: number): boolean => {
      const currentGrid = gridRef.current;
      const cellValue = currentGrid[row]?.[col];

      if (cellValue === null || cellValue === undefined) {
        return false;
      }

      if (level.targetGrid[row]?.[col] === cellValue) {
        return false;
      }

      const group = getConnectedGemGroup(
        currentGrid,
        { row, col },
        level.targetGrid,
      );

      if (group.length === 0) {
        return false;
      }

      selectedPositionsRef.current = group;
      selectedReserveColorIdRef.current = null;
      setSelectedPositions(group);
      setSelectedReserveColorId(null);
      triggerSelectionHaptic();

      return true;
    },
    [level.targetGrid, triggerSelectionHaptic],
  );

  const initGame = useCallback(async () => {
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
  }, [level, paletteOrder.join("|")]);

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
      if (isVictory) {
        return;
      }

      const currentGrid = gridRef.current;
      const currentReserve = reserveRef.current;
      const currentSelectedPositions = selectedPositionsRef.current;
      const currentSelectedReserveColorId = selectedReserveColorIdRef.current;
      const currentMoves = movesRef.current;
      const cellValue = currentGrid[row]?.[col];

      /*
       * Cas 1 :
       * une couleur de la réserve est sélectionnée.
       */
      if (currentSelectedReserveColorId !== null) {
        const isValidDestination =
          cellValue === null &&
          level.targetGrid[row]?.[col] === currentSelectedReserveColorId;

        if (!isValidDestination) {
          if (trySelectBoardGemGroup(row, col)) {
            return;
          }

          setSelectedReserveColorId(null);
          setSelectedPositions([]);
          return;
        }

        const boardMove = moveReserveGroupToBoard(
          currentGrid,
          level.targetGrid,
          currentReserve,
          { row, col },
          currentSelectedReserveColorId,
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

        const nextMoves = currentMoves + 1;

        const stillHasSelectedColor = sortedReserve.some(
          (gemId) => gemId === currentSelectedReserveColorId,
        );

        const nextSelectedReserveColorId = stillHasSelectedColor
          ? currentSelectedReserveColorId
          : null;

        triggerHaptic();

        gridRef.current = boardMove.nextGrid;
        reserveRef.current = sortedReserve;
        selectedPositionsRef.current = [];
        selectedReserveColorIdRef.current = nextSelectedReserveColorId;
        movesRef.current = nextMoves;

        setMoves(nextMoves);
        setGrid(boardMove.nextGrid);
        setReserve(sortedReserve);
        setSelectedPositions([]);
        setSelectedReserveColorId(nextSelectedReserveColorId);
        triggerPlacementHaptic(
          boardMove.placedPositions,
          currentSelectedReserveColorId,
        );
        verifyStateAndSave(boardMove.nextGrid, sortedReserve, nextMoves);

        return;
      }

      /*
       * Cas 2 :
       * un groupe du plateau est sélectionné.
       */
      if (currentSelectedPositions.length > 0) {
        const isAlreadySelected = currentSelectedPositions.some(
          (position) => position.row === row && position.col === col,
        );

        if (isAlreadySelected) {
          setSelectedPositions([]);
          setSelectedReserveColorId(null);
          triggerSelectionHaptic();
          return;
        }

        const selectedFirstPosition = currentSelectedPositions[0];

        const selectedColor =
          currentGrid[selectedFirstPosition.row]?.[selectedFirstPosition.col];

        const isValidDestination =
          selectedColor !== null &&
          selectedColor !== undefined &&
          cellValue === null &&
          level.targetGrid[row]?.[col] === selectedColor;

        if (!isValidDestination) {
          if (trySelectBoardGemGroup(row, col)) {
            return;
          }

          setSelectedPositions([]);
          setSelectedReserveColorId(null);
          return;
        }

        const boardMove = moveGroupToBoard(
          currentGrid,
          level.targetGrid,
          currentSelectedPositions,
          { row, col },
        );

        if (boardMove.movedGemIds.length > 0) {
          const nextMoves = currentMoves + 1;

          triggerHaptic();

          gridRef.current = boardMove.nextGrid;
          selectedPositionsRef.current = boardMove.remainingSelectedPositions;
          selectedReserveColorIdRef.current = null;
          movesRef.current = nextMoves;

          setMoves(nextMoves);
          setGrid(boardMove.nextGrid);
          setSelectedPositions(boardMove.remainingSelectedPositions);
          setSelectedReserveColorId(null);
          triggerPlacementHaptic(boardMove.placedPositions, selectedColor!);
          verifyStateAndSave(boardMove.nextGrid, currentReserve, nextMoves);
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
        trySelectBoardGemGroup(row, col);
        return;
      }

      setSelectedPositions([]);
      setSelectedReserveColorId(null);
    },
    [
      isVictory,
      level.targetGrid,
      paletteOrder,
      triggerSelectionHaptic,
      triggerPlacementHaptic,
      trySelectBoardGemGroup,
      verifyStateAndSave,
      triggerHaptic,
    ],
  );

  const handleReserveTap = useCallback(
    (index: number) => {
      if (isVictory) {
        return;
      }

      const selectedGemId = reserveRef.current[index];
      const currentSelectedReserveColorId = selectedReserveColorIdRef.current;

      /*
       * Cas 1 :
       * un groupe du plateau est sélectionné.
       * Tap sur une gemme occupée → bascule la sélection vers la réserve.
       * Tap sur un emplacement vide → envoie le groupe dans la réserve.
       */
      if (selectedPositionsRef.current.length > 0) {
        if (selectedGemId !== null) {
          if (currentSelectedReserveColorId === selectedGemId) {
            selectedReserveColorIdRef.current = null;
            selectedPositionsRef.current = [];
            setSelectedReserveColorId(null);
            setSelectedPositions([]);
            triggerSelectionHaptic();
          } else {
            selectedReserveColorIdRef.current = selectedGemId;
            selectedPositionsRef.current = [];
            setSelectedReserveColorId(selectedGemId);
            setSelectedPositions([]);
            triggerSelectionHaptic();
          }

          return;
        }

        const currentGrid = gridRef.current;
        const currentReserve = reserveRef.current;
        const currentSelectedPositions = selectedPositionsRef.current;
        const currentMoves = movesRef.current;

        const reserveMove = moveGroupToReserve(
          currentGrid,
          currentReserve,
          currentSelectedPositions,
        );

        if (reserveMove.movedGemIds.length > 0) {
          const sortedReserve = sortReserveByColor(
            reserveMove.nextReserve,
            paletteOrder,
          );

          const nextMoves = currentMoves + 1;

          gridRef.current = reserveMove.nextGrid;
          reserveRef.current = sortedReserve;
          selectedPositionsRef.current = reserveMove.remainingSelectedPositions;
          selectedReserveColorIdRef.current = null;
          movesRef.current = nextMoves;

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
      if (selectedGemId !== null) {
        if (currentSelectedReserveColorId === selectedGemId) {
          selectedReserveColorIdRef.current = null;
          setSelectedReserveColorId(null);
          triggerSelectionHaptic();
        } else {
          selectedReserveColorIdRef.current = selectedGemId;
          selectedPositionsRef.current = [];
          setSelectedReserveColorId(selectedGemId);
          setSelectedPositions([]);
          triggerSelectionHaptic();
        }
      } else {
        selectedReserveColorIdRef.current = null;
        selectedPositionsRef.current = [];
        setSelectedReserveColorId(null);
        setSelectedPositions([]);
      }
    },
    [
      isVictory,
      paletteOrder,
      triggerHaptic,
      triggerSelectionHaptic,
      triggerErrorHaptic,
      verifyStateAndSave,
    ],
  );

  const moveGemToReserveHandler = useCallback(
    (row: number, col: number) => {
      if (isVictory) {
        return;
      }

      const currentGrid = gridRef.current;
      const currentReserve = reserveRef.current;
      const currentSelectedPositions = selectedPositionsRef.current;
      const currentMoves = movesRef.current;
      const tappedGem = currentGrid[row]?.[col];

      if (!tappedGem || level.targetGrid[row]?.[col] === tappedGem) {
        return;
      }

      const groupToMove =
        currentSelectedPositions.length > 0 &&
        currentSelectedPositions.some(
          (position) => position.row === row && position.col === col,
        )
          ? currentSelectedPositions
          : getConnectedGemGroup(currentGrid, { row, col }, level.targetGrid);

      if (groupToMove.length === 0) {
        return;
      }

      const reserveMove = moveGroupToReserve(
        currentGrid,
        currentReserve,
        groupToMove,
      );

      if (reserveMove.movedGemIds.length > 0) {
        const sortedReserve = sortReserveByColor(
          reserveMove.nextReserve,
          paletteOrder,
        );

        const nextMoves = currentMoves + 1;

        gridRef.current = reserveMove.nextGrid;
        reserveRef.current = sortedReserve;
        selectedPositionsRef.current = reserveMove.remainingSelectedPositions;
        selectedReserveColorIdRef.current = null;
        movesRef.current = nextMoves;

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
      isVictory,
      level.targetGrid,
      paletteOrder,
      triggerHaptic,
      triggerErrorHaptic,
      verifyStateAndSave,
    ],
  );

  const restartLevel = useCallback(() => {
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
    gridRef.current = shuffled;
    reserveRef.current = emptyReserve;
    selectedPositionsRef.current = [];
    selectedReserveColorIdRef.current = null;
    movesRef.current = 0;

    const check = checkGridState(shuffled, level.targetGrid);

    setPercentage(check.percentage);
    triggerHaptic();
  }, [level, triggerHaptic]);

  return {
    grid,
    reserve,
    selectedPositions,
    selectedReserveColorId,
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
