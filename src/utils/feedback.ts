import {
  hapticError,
  hapticImpactLight,
  hapticSelection,
  hapticSuccess,
} from "./haptics";
import { soundError, soundPlace, soundSelect, soundSuccess } from "./sounds";

export const feedbackSelection = () => {
  hapticSelection();
  soundSelect();
};

export const feedbackPlacement = () => {
  hapticImpactLight();
  soundPlace();
};

export const feedbackSuccess = () => {
  hapticSuccess();
  soundSuccess();
};

export const feedbackError = () => {
  hapticError();
  soundError();
};

export const feedbackCorrectPlacement = () => {
  hapticSelection();
  soundPlace();
};
