// © 2026 Ali Abu Ras — ali.aburas@deliveryclarity.app. All rights reserved.
// Turns any hex color an admin freely picks into a coordinated
// {color, bg, border} triple — same "vivid color + pale background + soft
// border" look the Issue Type Hierarchy's fixed presets use, so a
// freely-picked color still reads as a readable, on-brand badge.

export function hexToHsl(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r)      h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else                 h = (r - g) / d + 4;
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const light = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(light, 1 - light);
  const f = (n: number) => light - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function deriveColorSet(hex: string): { color: string; bg: string; border: string } {
  const [h, s] = hexToHsl(hex);
  const tintSaturation = Math.min(Math.max(s, 40), 100); // keep tints visible even for near-gray picks
  return {
    color: hex,
    bg: hslToHex(h, tintSaturation, 96),
    border: hslToHex(h, tintSaturation, 78),
  };
}
