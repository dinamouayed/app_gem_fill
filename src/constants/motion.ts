/**
 * Constantes de motion partagées — identité visuelle cohérente
 * pour toutes les micro-interactions du jeu.
 */
export const MOTION = {
  /** ~80-120 ms ressenti via spring */
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

  /** Rebond à la pose (~100-150 ms) */
  SPRING_PLACEMENT: {
    damping: 11,
    stiffness: 420,
    mass: 0.55,
  },

  SPRING_FLOAT: {
    damping: 22,
    stiffness: 180,
    mass: 0.6,
  },

  /** Vol d'une gem vers sa case (~120–180 ms) */
  FLIGHT_DURATION_MS: 150,

  /** Progression (0–1) à laquelle la gem est posée sous le vol en fondu */
  FLIGHT_LAND_AT_PROGRESS: 0.88,

  SPRING_FLIGHT: {
    damping: 28,
    stiffness: 420,
    mass: 0.6,
  },

  /** Pas de scale à la sélection — évite le flou au zoom (transforms imbriqués). */
  SELECTED_SCALE: 1,
  SELECTED_TRANSLATE_Y: -6,

  PLACEMENT_SCALE_PEAK: 1.08,
  PLACEMENT_COMPRESS: 0.94,

  CASCADE_DELAY_MS: 40,
  PLACEMENT_FLASH_MS: 120,
  DIM_DURATION_MS: 100,

  /** Décalage entre le départ de chaque gem (vols en parallèle) */
  PLACEMENT_CASCADE: {
    MIN_STEP_MS: 30,
    MAX_STEP_MS: 50,
    MAX_TOTAL_MS: 220,
  },

  FLOAT_AMPLITUDE: 1.5,
  MOVE_ROTATION_MAX: 4,

  SHADOW_DEFAULT: {
    offsetY: 3,
    radius: 4,
    opacity: 0.35,
  },

  SHADOW_SELECTED: {
    offsetY: 3,
    radius: 4,
    opacity: 0.35,
  },

  SELECTED_ELEVATION: 0,
  DEFAULT_ELEVATION: 0,
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

/** Délai entre chaque départ de vol lors d'un dépôt groupé. */
export const computeCascadeStepDelay = (gemCount: number): number => {
  if (gemCount <= 1) {
    return 0;
  }

  const { MIN_STEP_MS, MAX_STEP_MS, MAX_TOTAL_MS } = MOTION.PLACEMENT_CASCADE;
  const ideal = MAX_TOTAL_MS / (gemCount - 1);

  return Math.round(Math.min(MAX_STEP_MS, Math.max(MIN_STEP_MS, ideal)));
};
