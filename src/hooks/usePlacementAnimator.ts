import { useCallback, useReducer, useRef } from "react";
import type { CellPosition, PlacementStep } from "../types/game";
import { hapticSelection } from "../utils/haptics";

export interface PlacementSequenceConfig {
  initialGrid: (string | null)[][];
  initialReserve?: (string | null)[];
  steps: PlacementStep[];
  onComplete: () => void;
}

export type ActivePlacementFlight = {
  stepIndex: number;
  step: PlacementStep;
};

type AnimatorState = {
  displayGrid: (string | null)[][] | null;
  displayReserve: (string | null)[] | null;
  isAnimating: boolean;
  activeFlights: ActivePlacementFlight[];
  waitingSourcePositions: CellPosition[];
  waitingReserveIndices: number[];
  settlingDestinations: CellPosition[];
};

const initialState: AnimatorState = {
  displayGrid: null,
  displayReserve: null,
  isAnimating: false,
  activeFlights: [],
  waitingSourcePositions: [],
  waitingReserveIndices: [],
  settlingDestinations: [],
};

const cloneGrid = (source: (string | null)[][]) =>
  source.map((row) => [...row]);

const extractWaitingSources = (steps: PlacementStep[]): CellPosition[] =>
  steps
    .map((step) => step.source)
    .filter((source): source is CellPosition => source !== undefined);

const extractWaitingReserveIndices = (steps: PlacementStep[]): number[] =>
  steps
    .map((step) => step.reserveSourceIndex)
    .filter((index): index is number => index !== undefined);

const isSameCell = (a: CellPosition, b: CellPosition): boolean =>
  a.row === b.row && a.col === b.col;

type AnimatorAction =
  | { type: "start"; config: PlacementSequenceConfig }
  | {
      type: "launch";
      step: PlacementStep;
      stepIndex: number;
      initialGrid: (string | null)[][];
      initialReserve?: (string | null)[];
    }
  | { type: "clearReserveSlot"; index: number }
  | {
      type: "land";
      steps: PlacementStep[];
      initialGrid: (string | null)[][];
    }
  | { type: "dismissFlights"; removeStepIndices: number[]; dests: CellPosition[] }
  | { type: "finish" }
  | { type: "cancel" };

const animatorReducer = (
  current: AnimatorState,
  action: AnimatorAction,
): AnimatorState => {
  switch (action.type) {
    case "start":
      return {
        displayGrid: cloneGrid(action.config.initialGrid),
        displayReserve: action.config.initialReserve
          ? [...action.config.initialReserve]
          : null,
        isAnimating: true,
        activeFlights: [],
        waitingSourcePositions: extractWaitingSources(action.config.steps),
        waitingReserveIndices: extractWaitingReserveIndices(
          action.config.steps,
        ),
        settlingDestinations: [],
      };

    case "launch": {
      const { step, stepIndex, initialGrid, initialReserve } = action;
      const displayGrid = current.displayGrid
        ? cloneGrid(current.displayGrid)
        : cloneGrid(initialGrid);
      const displayReserve =
        current.displayReserve !== null
          ? [...current.displayReserve]
          : initialReserve
            ? [...initialReserve]
            : null;

      if (step.source) {
        displayGrid[step.source.row][step.source.col] = null;
      }

      return {
        ...current,
        displayGrid,
        displayReserve,
        activeFlights: [...current.activeFlights, { stepIndex, step }],
        waitingSourcePositions: step.source
          ? current.waitingSourcePositions.filter(
              (position) =>
                position.row !== step.source!.row ||
                position.col !== step.source!.col,
            )
          : current.waitingSourcePositions,
        waitingReserveIndices:
          step.reserveSourceIndex !== undefined
            ? current.waitingReserveIndices.filter(
                (index) => index !== step.reserveSourceIndex,
              )
            : current.waitingReserveIndices,
      };
    }

    case "clearReserveSlot": {
      if (current.displayReserve === null) {
        return current;
      }

      const displayReserve = [...current.displayReserve];
      displayReserve[action.index] = null;

      return {
        ...current,
        displayReserve,
      };
    }

    case "land": {
      const displayGrid = current.displayGrid
        ? cloneGrid(current.displayGrid)
        : cloneGrid(action.initialGrid);

      for (const step of action.steps) {
        displayGrid[step.dest.row][step.dest.col] = step.colorId;
      }

      return {
        ...current,
        displayGrid,
        settlingDestinations: [
          ...current.settlingDestinations,
          ...action.steps
            .map((step) => step.dest)
            .filter(
              (dest) =>
                !current.settlingDestinations.some((existing) =>
                  isSameCell(existing, dest),
                ),
            ),
        ],
      };
    }

    case "dismissFlights":
      return {
        ...current,
        activeFlights: current.activeFlights.filter(
          (flight) => !action.removeStepIndices.includes(flight.stepIndex),
        ),
        settlingDestinations: current.settlingDestinations.filter(
          (dest) => !action.dests.some((removed) => isSameCell(dest, removed)),
        ),
      };

    case "finish":
    case "cancel":
      return { ...initialState };

    default:
      return current;
  }
};

export function usePlacementAnimator() {
  const [state, dispatch] = useReducer(animatorReducer, initialState);

  const sequenceRef = useRef<PlacementSequenceConfig | null>(null);
  const completedCountRef = useRef(0);

  const finishSequence = useCallback(() => {
    const sequence = sequenceRef.current;

    if (!sequence) {
      return;
    }

    sequence.onComplete();
    sequenceRef.current = null;
    completedCountRef.current = 0;

    dispatch({ type: "finish" });
  }, []);

  const handleFlightLand = useCallback((stepIndex: number) => {
    const sequence = sequenceRef.current;

    if (!sequence) {
      return;
    }

    const step = sequence.steps[stepIndex];

    dispatch({
      type: "land",
      steps: [step],
      initialGrid: sequence.initialGrid,
    });

    if (step.isCorrect) {
      const isFirst = stepIndex === 0;
      const isLast = stepIndex === sequence.steps.length - 1;

      if (isFirst || (isLast && sequence.steps.length > 1)) {
        hapticSelection();
      }
    }
  }, []);

  const handleFlightDismiss = useCallback(
    (stepIndex: number) => {
      const sequence = sequenceRef.current;

      if (!sequence) {
        return;
      }

      dispatch({
        type: "dismissFlights",
        removeStepIndices: [stepIndex],
        dests: [sequence.steps[stepIndex].dest],
      });

      completedCountRef.current += 1;

      if (completedCountRef.current >= sequence.steps.length) {
        finishSequence();
      }
    },
    [finishSequence],
  );

  const launchFlight = useCallback((stepIndex: number) => {
    const sequence = sequenceRef.current;

    if (!sequence || stepIndex >= sequence.steps.length) {
      return;
    }

    dispatch({
      type: "launch",
      step: sequence.steps[stepIndex],
      stepIndex,
      initialGrid: sequence.initialGrid,
      initialReserve: sequence.initialReserve,
    });
  }, []);

  const handleFlightTakeoff = useCallback((reserveIndex: number) => {
    dispatch({ type: "clearReserveSlot", index: reserveIndex });
  }, []);

  const startSequence = useCallback(
    (config: PlacementSequenceConfig) => {
      if (config.steps.length === 0) {
        config.onComplete();
        return;
      }

      sequenceRef.current = config;
      completedCountRef.current = 0;

      dispatch({ type: "start", config });

      config.steps.forEach((_, index) => {
        launchFlight(index);
      });
    },
    [launchFlight],
  );

  const cancelSequence = useCallback(() => {
    sequenceRef.current = null;
    completedCountRef.current = 0;
    dispatch({ type: "cancel" });
  }, []);

  return {
    displayGrid: state.displayGrid,
    displayReserve: state.displayReserve,
    isAnimating: state.isAnimating,
    activeFlights: state.activeFlights,
    waitingSourcePositions: state.waitingSourcePositions,
    waitingReserveIndices: state.waitingReserveIndices,
    settlingDestinations: state.settlingDestinations,
    handleFlightLand,
    handleFlightDismiss,
    handleFlightTakeoff,
    startSequence,
    cancelSequence,
  };
}

export function buildPlacementSteps(
  placedPositions: CellPosition[],
  sourcePositions: CellPosition[],
  colorId: string,
  targetGrid: string[][],
  reserveSourceIndices: number[] = [],
): PlacementStep[] {
  return placedPositions.map((dest, index) => ({
    dest,
    source: sourcePositions[index],
    reserveSourceIndex: reserveSourceIndices[index],
    colorId,
    isCorrect: targetGrid[dest.row]?.[dest.col] === colorId,
  }));
}
