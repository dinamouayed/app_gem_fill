/** Cible tactile minimale recommandée (iOS HIG / Material). */
export const MIN_TOUCH_TARGET = 44;

export const BASE_HIT_SLOP = 6;

/**
 * Rayon supplémentaire autour d'une case valide lors d'une sélection active.
 * Permet d'atteindre ~MIN_TOUCH_TARGET px sans modifier le rendu visuel.
 */
export function computeExtendedTouchRadius(cellSize: number): number {
  const desiredExtra = Math.ceil((MIN_TOUCH_TARGET - cellSize) / 2);

  return Math.max(
    BASE_HIT_SLOP,
    Math.min(desiredExtra, Math.floor(cellSize * 0.5)),
  );
}
