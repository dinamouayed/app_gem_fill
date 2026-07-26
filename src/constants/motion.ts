/**
 * Constantes de motion partagées — identité visuelle cohérente
 * pour les micro-interactions du jeu.
 */
export const MOTION = {
  SPRING_SELECTION: {
    damping: 16,
    stiffness: 420,
    mass: 0.55,
  },

  SPRING_DESELECT: {
    damping: 18,
    stiffness: 380,
    mass: 0.55,
  },

  SELECTED_SCALE: 1,
  SELECTED_TRANSLATE_Y: -6,
  DIM_DURATION_MS: 100,
} as const;

/** Padding interne de la grille (aligné avec GemGrid) */
export const GRID_PADDING = 8;

/** Zoom du plateau — pinch & pan */
export const BOARD_ZOOM = {
  MIN: 1,
  MAX: 2.5,
  SPRING: {
    damping: 20,
    stiffness: 220,
    mass: 0.9,
  },
  PAN_ACTIVE_OFFSET: 10,
} as const;

export type CellKey = `${number},${number}`;

export const cellKey = (row: number, col: number): CellKey =>
  `${row},${col}`;
