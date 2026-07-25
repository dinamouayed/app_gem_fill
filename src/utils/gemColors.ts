export function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);

  if (Number.isNaN(num)) {
    return hex;
  }

  let red = (num >> 16) + percent;
  let green = ((num >> 8) & 0x00ff) + percent;
  let blue = (num & 0x0000ff) + percent;

  red = Math.min(255, Math.max(0, red));
  green = Math.min(255, Math.max(0, green));
  blue = Math.min(255, Math.max(0, blue));

  return (
    "#" +
    ((1 << 24) + (red << 16) + (green << 8) + blue).toString(16).slice(1)
  );
}

export function hexToRgba(hex: string, alpha: number): string {
  const normalizedHex = hex.replace("#", "");

  if (normalizedHex.length !== 6) {
    return hex;
  }

  const red = parseInt(normalizedHex.slice(0, 2), 16);
  const green = parseInt(normalizedHex.slice(2, 4), 16);
  const blue = parseInt(normalizedHex.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export interface GemPalette {
  highlight: string;
  light: string;
  base: string;
  dark: string;
  shadow: string;
}

export function buildGemPalette(colorHex: string): GemPalette {
  return {
    highlight: adjustColor(colorHex, 65),
    light: adjustColor(colorHex, 28),
    base: colorHex,
    dark: adjustColor(colorHex, -28),
    shadow: adjustColor(colorHex, -48),
  };
}
