import { mulberry32, randInt, randPick } from "../prng";

const BG_COLORS = ["#5C3317", "#1a3a1a", "#1a1a3a", "#2a1a2a", "#3a1a1a", "#1a2a3a"];
const SKIN_TONES = ["#FDBCB4", "#E8956D", "#C68642", "#8D5524", "#4A2912"];
const HAIR_COLORS = ["#F7931A", "#EF4444", "#22C55E", "#60A5FA", "#A855F7", "#F5F5F5", "#111111"];

export function renderPunk(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  blockNumber: number
): void {
  const rand = mulberry32(blockNumber);

  // Background
  ctx.fillStyle = randPick(rand, BG_COLORS);
  ctx.fillRect(0, 0, w, h);

  const scale = Math.floor(Math.min(w, h) / 24);
  const ox = Math.floor((w - 24 * scale) / 2);
  const oy = Math.floor((h - 24 * scale) / 2);

  function px(x: number, y: number, color: string) {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x * scale, oy + y * scale, scale, scale);
  }

  const skin = randPick(rand, SKIN_TONES);
  const hair = randPick(rand, HAIR_COLORS);

  // Head outline (8x8 pixel art at offset 8,4)
  const headX = 8, headY = 4;
  // Head
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 8; x++) {
      px(headX + x, headY + y, skin);
    }
  }

  // Hair (top rows)
  const hairStyle = randInt(rand, 0, 3);
  if (hairStyle === 0) {
    // Mohawk
    for (let y = 0; y < 4; y++) px(headX + 3, headY - y - 1, hair);
    for (let y = 0; y < 4; y++) px(headX + 4, headY - y - 1, hair);
  } else if (hairStyle === 1) {
    // Flat top
    for (let x = 0; x < 8; x++) {
      px(headX + x, headY - 1, hair);
      px(headX + x, headY - 2, hair);
    }
  } else if (hairStyle === 2) {
    // Spiky
    for (let x = 1; x < 7; x++) {
      const spkH = randInt(rand, 1, 4);
      for (let y = 0; y < spkH; y++) px(headX + x, headY - y - 1, hair);
    }
  } else {
    // Cap
    for (let x = 0; x < 8; x++) px(headX + x, headY - 1, "#1F1F1F");
    for (let x = -1; x < 9; x++) px(headX + x, headY - 2, "#1F1F1F");
  }

  // Eyes
  const eyeColor = "#111111";
  px(headX + 1, headY + 3, eyeColor);
  px(headX + 2, headY + 3, eyeColor);
  px(headX + 5, headY + 3, eyeColor);
  px(headX + 6, headY + 3, eyeColor);

  // Nose
  px(headX + 3, headY + 5, "#c0805080");
  px(headX + 4, headY + 5, "#c0805080");

  // Mouth
  const mouthRoll = randInt(rand, 0, 2);
  if (mouthRoll === 0) {
    // Smile
    px(headX + 2, headY + 7, eyeColor);
    px(headX + 5, headY + 7, eyeColor);
    for (let x = 2; x <= 5; x++) px(headX + x, headY + 8, eyeColor);
  } else if (mouthRoll === 1) {
    // Frown
    for (let x = 2; x <= 5; x++) px(headX + x, headY + 7, eyeColor);
    px(headX + 2, headY + 8, eyeColor);
    px(headX + 5, headY + 8, eyeColor);
  } else {
    // Smirk
    for (let x = 3; x <= 5; x++) px(headX + x, headY + 7, eyeColor);
    px(headX + 5, headY + 8, eyeColor);
  }

  // Accessory
  if (rand() > 0.5) {
    // Cigarette
    px(headX + 6, headY + 7, "#F5F5F5");
    px(headX + 7, headY + 7, "#F5F5F5");
    px(headX + 8, headY + 7, "#F59E0B");
  }
  if (rand() > 0.6) {
    // Earring
    px(headX - 1, headY + 4, "#F7931A");
    px(headX - 1, headY + 5, "#F7931A");
  }

  // Neck
  for (let y = 0; y < 2; y++) {
    for (let x = 2; x < 6; x++) px(headX + x, headY + 10 + y, skin);
  }

  // Scanline overlay
  ctx.fillStyle = "#00000018";
  for (let y = 0; y < h; y += 2) {
    ctx.fillRect(0, y, w, 1);
  }
}
