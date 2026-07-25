import type { Level } from "../types/level";

/** CIE76 ΔE in LAB — aligned with scripts/level-generator/color_distance.py */
export const MIN_PALETTE_DELTA_E = 15;

type Lab = [number, number, number];

function srgbToLinear(channel: number): number {
  if (channel <= 0.04045) {
    return channel / 12.92;
  }

  return ((channel + 0.055) / 1.055) ** 2.4;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.trim().replace("#", "");
  if (normalized.length !== 6) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}

export function rgbToLab(red: number, green: number, blue: number): Lab {
  const redLinear = srgbToLinear(red / 255);
  const greenLinear = srgbToLinear(green / 255);
  const blueLinear = srgbToLinear(blue / 255);

  let x = redLinear * 0.4124564 + greenLinear * 0.3575761 + blueLinear * 0.1804375;
  let y = redLinear * 0.2126729 + greenLinear * 0.7151522 + blueLinear * 0.0721750;
  let z = redLinear * 0.0193339 + greenLinear * 0.1191920 + blueLinear * 0.9503041;

  x /= 0.95047;
  y /= 1.0;
  z /= 1.08883;

  const f = (value: number) =>
    value > 0.008856 ? value ** (1 / 3) : 7.787 * value + 16 / 116;

  const fx = f(x);
  const fy = f(y);
  const fz = f(z);

  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function deltaECie76(first: Lab, second: Lab): number {
  return Math.hypot(first[0] - second[0], first[1] - second[1], first[2] - second[2]);
}

export function minPaletteDeltaE(hexColors: string[]): {
  minimum: number;
  closestPair: [string, string] | null;
} {
  if (hexColors.length < 2) {
    return { minimum: Number.POSITIVE_INFINITY, closestPair: null };
  }

  const labs = hexColors.map((hex) => {
    const [red, green, blue] = hexToRgb(hex);
    return rgbToLab(red, green, blue);
  });

  let minimum = Number.POSITIVE_INFINITY;
  let closestPair: [string, string] | null = null;

  for (let left = 0; left < hexColors.length; left++) {
    for (let right = left + 1; right < hexColors.length; right++) {
      const distance = deltaECie76(labs[left], labs[right]);
      if (distance < minimum) {
        minimum = distance;
        closestPair = [hexColors[left], hexColors[right]];
      }
    }
  }

  return { minimum, closestPair };
}

export function hasDistinguishablePalette(
  level: Level,
  minDeltaE: number = MIN_PALETTE_DELTA_E,
): boolean {
  const hexColors = level.palette.map((color) => color.hex);
  const { minimum } = minPaletteDeltaE(hexColors);
  return minimum >= minDeltaE;
}
