/**
 * Bitmap Rendering Functions - Universal (works in Node.js + Browser)
 * 
 * These functions generate bitmap art without DOM dependencies.
 * Used by both the API route (server-side PNG) and Canvas component (client-side).
 */

import type { BitmapType } from "./types";

// Re-export for consumers
export type { BitmapType };

// ============================================================================
// PRNG (same as prng.ts but without module dependencies)
// ============================================================================

export function mulberry32(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function randPick<T>(rand: () => number, arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

// ============================================================================
// Color Palettes
// ============================================================================

const MONDRIAN_PALETTES = [
  ["#F7931A", "#EF4444", "#3B82F6", "#22C55E", "#111111", "#F5F5F5"],
  ["#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#111111", "#E5E5E5"],
  ["#F7931A", "#DC2626", "#2563EB", "#F5F5F5", "#111111", "#1F1F1F"],
];

const CITY_PALETTES = [
  ["#1a1a2e", "#16213e", "#0f3460", "#e94560", "#f39c12", "#fff5e6"],
  ["#0d1321", "#1d2d44", "#3e5c76", "#f0ebd8", "#748cab", "#e9c46a"],
  ["#2d132c", "#801336", "#c72c41", "#ee4540", "#f8b500", "#ff6b6b"],
];

const PUNK_COLORS = [
  "#ff0040", "#00ff80", "#4000ff", "#ff8000", "#80ff00", "#0080ff",
  "#ff0080", "#00ffff", "#ff4040", "#40ff40", "#4040ff", "#ffff40",
];

// ============================================================================
// Renderers
// ============================================================================

interface Rect { x: number; y: number; w: number; h: number; }

export function renderMondrian(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number
): void {
  const rand = mulberry32(seed);
  const palette = randPick(rand, MONDRIAN_PALETTES);

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, h);

  const rects: Rect[] = [{ x: 0, y: 0, w, h }];
  const maxSplits = 12 + (seed % 8);

  for (let i = 0; i < maxSplits && rects.length > 0; i++) {
    const idx = Math.floor(rand() * rects.length);
    const rect = rects.splice(idx, 1)[0];

    const canSplitH = rect.w > 40;
    const canSplitV = rect.h > 40;
    if (!canSplitH && !canSplitV) {
      rects.push(rect);
      continue;
    }

    const splitH = canSplitH && (!canSplitV || rand() > 0.5);
    if (splitH) {
      const split = rect.x + rect.w * (0.25 + rand() * 0.5);
      rects.push({ x: rect.x, y: rect.y, w: split - rect.x, h: rect.h });
      rects.push({ x: split, y: rect.y, w: rect.x + rect.w - split, h: rect.h });
    } else {
      const split = rect.y + rect.h * (0.25 + rand() * 0.5);
      rects.push({ x: rect.x, y: rect.y, w: rect.w, h: split - rect.y });
      rects.push({ x: rect.x, y: split, w: rect.w, h: rect.y + rect.h - split });
    }
  }

  const border = 2;
  for (const rect of rects) {
    const roll = rand();
    let color: string;
    if (roll < 0.12) color = palette[0];
    else if (roll < 0.2) color = palette[1];
    else if (roll < 0.28) color = palette[2];
    else if (roll < 0.34) color = palette[3];
    else if (roll < 0.65) color = palette[4];
    else color = palette[5];

    ctx.fillStyle = color;
    ctx.fillRect(rect.x + border, rect.y + border, rect.w - border * 2, rect.h - border * 2);
  }
}

export function renderCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number
): void {
  const rand = mulberry32(seed);
  const palette = randPick(rand, CITY_PALETTES);

  // Sky gradient
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, palette[0]);
  grad.addColorStop(1, palette[1]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Buildings
  const numBuildings = 8 + Math.floor(rand() * 8);
  const buildingWidth = w / numBuildings;

  for (let i = 0; i < numBuildings; i++) {
    const bh = h * (0.3 + rand() * 0.6);
    const bx = i * buildingWidth;
    const by = h - bh;

    // Building body
    ctx.fillStyle = palette[2];
    ctx.fillRect(bx + 2, by, buildingWidth - 4, bh);

    // Windows
    ctx.fillStyle = palette[4];
    const rows = Math.floor(bh / 15);
    const cols = Math.floor((buildingWidth - 8) / 10);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > 0.4) {
          ctx.fillRect(bx + 6 + c * 10, by + 8 + r * 15, 6, 8);
        }
      }
    }
  }

  // Moon/sun
  ctx.fillStyle = palette[5];
  ctx.beginPath();
  ctx.arc(w * 0.8, h * 0.2, w * 0.08, 0, Math.PI * 2);
  ctx.fill();
}

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number
): void {
  const rand = mulberry32(seed);
  const cols = 8 + (seed % 8);
  const rows = 8 + (seed % 8);
  const cellW = w / cols;
  const cellH = h / rows;

  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, w, h);

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const roll = rand();
      if (roll < 0.3) {
        const hue = (seed * 137 + x * 30 + y * 20) % 360;
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
      } else if (roll < 0.5) {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(x * cellW + 1, y * cellH + 1, cellW - 2, cellH - 2);
      }
    }
  }
}

export function renderPunk(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number
): void {
  const rand = mulberry32(seed);
  const pixelSize = Math.floor(w / 24);
  const gridW = Math.floor(w / pixelSize);
  const gridH = Math.floor(h / pixelSize);
  const offsetX = (w - gridW * pixelSize) / 2;
  const offsetY = (h - gridH * pixelSize) / 2;

  // Background
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);

  // Face base
  const skinColors = ["#ffdbac", "#f1c27d", "#e0ac69", "#8d5524", "#c68642"];
  const skin = randPick(rand, skinColors);

  // Simple punk face pattern (symmetric)
  for (let y = 4; y < gridH - 4; y++) {
    for (let x = 4; x < gridW - 4; x++) {
      const cx = x - gridW / 2;
      const cy = y - gridH / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);

      if (dist < 8) {
        ctx.fillStyle = skin;
      } else {
        continue;
      }

      // Hair
      if (y < 6 || (y < 10 && rand() > 0.7)) {
        ctx.fillStyle = randPick(rand, ["#000", "#4a3000", "#c0c0c0", "#ff0000"]);
      }

      // Eyes
      if (y === 10 && (x === 8 || x === gridW - 9)) {
        ctx.fillStyle = randPick(rand, ["#000", "#00ff00", "#0000ff"]);
      }

      ctx.fillRect(offsetX + x * pixelSize, offsetY + y * pixelSize, pixelSize, pixelSize);
    }
  }
}

export function renderPalindrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  seed: number
): void {
  const rand = mulberry32(seed);
  const str = seed.toString();
  const chars = str.split("");

  // Mirror gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, "#1a0a2e");
  grad.addColorStop(0.5, "#4a1a6e");
  grad.addColorStop(1, "#1a0a2e");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Draw mirrored digits
  const fontSize = w / (chars.length + 2);
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const startX = w / 2 - (chars.length - 1) * fontSize / 2;

  chars.forEach((char, i) => {
    const hue = (seed * 50 + i * 40) % 360;
    ctx.fillStyle = `hsl(${hue}, 80%, 60%)`;
    ctx.shadowColor = `hsl(${hue}, 80%, 40%)`;
    ctx.shadowBlur = 10;
    ctx.fillText(char, startX + i * fontSize, h / 2);
  });

  ctx.shadowBlur = 0;

  // Mirror line
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
}

// ============================================================================
// Main Export
// ============================================================================

export const RENDERERS: Record<BitmapType, (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) => void> = {
  city: renderCity,
  grid: renderGrid,
  mondrian: renderMondrian,
  punk: renderPunk,
  palindrome: renderPalindrome,
};

export function getBitmapType(blockNumber: number): BitmapType {
  const str = String(blockNumber);
  if (str === str.split("").reverse().join("")) return "palindrome";
  const types: BitmapType[] = ["city", "grid", "mondrian", "punk"];
  return types[blockNumber % 4];
}
