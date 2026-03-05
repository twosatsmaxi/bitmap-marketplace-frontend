import { mulberry32, randInt, randPick } from "../prng";

const PALETTES = [
  ["#F7931A", "#F59E0B", "#EF4444"],
  ["#22C55E", "#16A34A", "#4ADE80"],
  ["#60A5FA", "#3B82F6", "#A78BFA"],
  ["#F472B6", "#EC4899", "#F59E0B"],
];

export function renderPalindrome(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blockNumber: number
): void {
  const rand = mulberry32(blockNumber);
  const palette = randPick(rand, PALETTES);

  ctx.fillStyle = "#0A0A0A";
  ctx.fillRect(0, 0, w, h);

  const cols = randInt(rand, 6, 10);
  const halfCols = Math.ceil(cols / 2);
  const rows = randInt(rand, 6, 10);
  const halfRows = Math.ceil(rows / 2);

  const cellW = w / cols;
  const cellH = h / rows;

  // Generate left half, mirror right
  for (let r = 0; r < halfRows; r++) {
    for (let c = 0; c < halfCols; c++) {
      const roll = rand();
      let color: string;
      if (roll < 0.15) color = palette[0];
      else if (roll < 0.3) color = palette[1];
      else if (roll < 0.4) color = palette[2];
      else if (roll < 0.7) color = "#1F1F1F";
      else color = "#111111";

      const positions = [
        [c, r],
        [cols - 1 - c, r],
        [c, rows - 1 - r],
        [cols - 1 - c, rows - 1 - r],
      ];

      for (const [pc, pr] of positions) {
        const x = pc * cellW + 1;
        const y = pr * cellH + 1;
        ctx.fillStyle = color;
        ctx.fillRect(x, y, cellW - 2, cellH - 2);
      }
    }
  }

  // Symmetry axis lines
  ctx.strokeStyle = palette[0];
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
  ctx.setLineDash([4, 4]);
  // Vertical center
  ctx.beginPath();
  ctx.moveTo(w / 2, 0);
  ctx.lineTo(w / 2, h);
  ctx.stroke();
  // Horizontal center
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;

  // Center glow
  const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.3);
  grad.addColorStop(0, palette[0] + "40");
  grad.addColorStop(1, "transparent");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}
