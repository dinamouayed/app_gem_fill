import * as Haptics from "expo-haptics";

const safe = (fn: () => Promise<void>) => {
  try {
    void fn();
  } catch {
    // Ignore les erreurs haptiques (simulateur, web…).
  }
};

/** Sélection / désélection — très discret */
export const hapticSelection = () => {
  safe(() => Haptics.selectionAsync());
};

/** Placement correct, déplacement réussi */
export const hapticImpactLight = () => {
  safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
};

/** Fin de niveau */
export const hapticSuccess = () => {
  safe(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  );
};

/** Erreur (réserve pleine, action invalide…) */
export const hapticError = () => {
  safe(() =>
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  );
};
