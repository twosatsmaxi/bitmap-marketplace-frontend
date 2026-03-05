import { mulberry32, randInt, randPick } from "../prng";

const PALETTES = [
  ["#F7931A", "#F59E0B", "#EF4444", "#111111", "#0A0A0A"],
  ["#22C55E", "#16A34A", "#4ADE80", "#1a2b1a", "#0A0A0A"],
  ["#60A5FA", "#3B82F6", "#818CF8", "#1a2040", "#0A0A0A"],
  ["#F472B6", "#EC4899", "#A855F7", "#2a1a2a", "#0A0A0A"],
];

export function renderGrid(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blockNumber: number
): void {
  const rand = mulberry32(blockNumber);
  const palette = randPick(rand, PALETTES);

  ctx.fillStyle = palette[4];
  ctx.fillRect(0, 0, w, h);

  const cols = randInt(rand, 5, 12);
  const rows = randInt(rand, 5, 12);
  const cellW = w / cols;
  const cellH = h / rows;
  const gap = 2;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = c * cellW + gap / 2;
      const y = r * cellH + gap / 2;
      const cw = cellW - gap;
      const ch = cellH - gap;

      const roll = rand();
      if (roll < 0.1) {
        ctx.fillStyle = palette[4]; // empty
      } else if (roll < 0.4) {
        ctx.fillStyle = palette[3]; // dark
      } else if (roll < 0.65) {
        ctx.fillStyle = palette[2];
      } else if (roll < 0.85) {
        ctx.fillStyle = palette[1];
      } else {
        ctx.fillStyle = palette[0]; // accent
      }

      ctx.fillRect(x, y, cw, ch);

      // Occasional inner glow
      if (rand() > 0.85) {
        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = 0.08;
        ctx.fillRect(x, y, cw, ch);
        ctx.globalAlpha = 1;
      }
    }
  }

  // Scanline overlay
  ctx.fillStyle = "#00000020";
  for (let y = 0; y < h; y += 4) {
    ctx.fillRect(0, y, w, 1);
  }
}
