import { mulberry32, randInt, randPick } from "../prng";

const PALETTES = [
  ["#F7931A", "#1F1F1F", "#111111", "#0A0A0A"],
  ["#22C55E", "#1a2b1a", "#0f1f0f", "#0A0A0A"],
  ["#60A5FA", "#1a2040", "#0f1530", "#0A0A0A"],
  ["#F59E0B", "#2b1f0f", "#1f1000", "#0A0A0A"],
];

export function renderCity(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blockNumber: number
): void {
  const rand = mulberry32(blockNumber);
  const palette = randPick(rand, PALETTES);

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#080810");
  sky.addColorStop(1, "#0A0A1A");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars
  const starCount = randInt(rand, 20, 60);
  ctx.fillStyle = "#ffffff";
  for (let i = 0; i < starCount; i++) {
    const x = rand() * w;
    const y = rand() * h * 0.5;
    const size = rand() * 1.5 + 0.5;
    ctx.globalAlpha = rand() * 0.6 + 0.2;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Moon
  const moonX = randInt(rand, w * 0.1, w * 0.9);
  const moonR = randInt(rand, 8, 18);
  ctx.fillStyle = "#FFFDE7";
  ctx.beginPath();
  ctx.arc(moonX, randInt(rand, moonR + 10, h * 0.3), moonR, 0, Math.PI * 2);
  ctx.fill();

  // Ground
  const groundY = h * 0.7;
  ctx.fillStyle = "#0D0D10";
  ctx.fillRect(0, groundY, w, h - groundY);

  // Buildings
  const numBuildings = randInt(rand, 6, 14);
  const buildingWidth = Math.floor(w / numBuildings);

  for (let i = 0; i < numBuildings; i++) {
    const bw = randInt(rand, buildingWidth * 0.5, buildingWidth * 1.2);
    const bh = randInt(rand, h * 0.15, h * 0.55);
    const bx = i * buildingWidth + randInt(rand, 0, buildingWidth * 0.2);
    const by = groundY - bh;

    // Building body
    ctx.fillStyle = randPick(rand, ["#111118", "#12121A", "#0E0E14"]);
    ctx.fillRect(bx, by, bw, bh);

    // Accent line
    ctx.fillStyle = palette[0];
    ctx.globalAlpha = 0.3;
    ctx.fillRect(bx, by, 2, bh);
    ctx.globalAlpha = 1;

    // Windows
    const cols = Math.max(1, Math.floor(bw / 8));
    const rows = Math.max(1, Math.floor(bh / 10));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (rand() > 0.4) {
          ctx.fillStyle = rand() > 0.7 ? palette[0] : "#FFFDE730";
          ctx.globalAlpha = rand() * 0.8 + 0.2;
          ctx.fillRect(bx + 3 + c * 8, by + 5 + r * 10, 4, 6);
          ctx.globalAlpha = 1;
        }
      }
    }

    // Antenna
    if (rand() > 0.5) {
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.moveTo(bx + bw / 2, by);
      ctx.lineTo(bx + bw / 2, by - randInt(rand, 8, 20));
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Reflection on ground
  ctx.fillStyle = palette[0];
  ctx.globalAlpha = 0.05;
  ctx.fillRect(0, groundY, w, 2);
  ctx.globalAlpha = 1;
}
