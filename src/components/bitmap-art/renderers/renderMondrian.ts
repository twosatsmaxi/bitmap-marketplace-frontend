import { mulberry32, randPick } from "../prng";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const PALETTES = [
  ["#F7931A", "#EF4444", "#3B82F6", "#22C55E", "#111111", "#F5F5F5"],
  ["#F59E0B", "#8B5CF6", "#EC4899", "#14B8A6", "#111111", "#E5E5E5"],
  ["#F7931A", "#DC2626", "#2563EB", "#F5F5F5", "#111111", "#1F1F1F"],
];

export function renderMondrian(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blockNumber: number
): void {
  const rand = mulberry32(blockNumber);
  const palette = randPick(rand, PALETTES);

  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, w, h);

  const rects: Rect[] = [{ x: 0, y: 0, w, h }];
  const maxSplits = 12 + Math.floor(blockNumber % 8);

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
