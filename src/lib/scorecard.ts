// ── Types ────────────────────────────────────────────────────────────

export interface ScoreCardStat {
  label: string;
  value: string;
}

export interface ScoreCardOptions {
  gameName: string;
  sceneCapture: string; // data URL from captureThreeScene
  stats: ScoreCardStat[];
  blockHeight: number;
  isHighScore?: boolean;
}

// ── Constants ────────────────────────────────────────────────────────

const CARD_W = 1200;
const CARD_H = 630;
const BG_COLOR = "#09090b";
const PRIMARY = "#f7931a";
const LABEL_COLOR = "#71717a";
const VALUE_COLOR = "#f4f4f5";
const BRANDING_COLOR = "#52525b";
const GRID_COLOR = "rgba(255,255,255,0.03)";
const BORDER_COLOR = "rgba(255,255,255,0.08)";
const ACCENT_ALPHA = "rgba(247,147,26,0.5)";

// ── Scene Capture ────────────────────────────────────────────────────

export function captureThreeScene(
  renderer: { render: (scene: any, camera: any) => void; domElement: HTMLCanvasElement } | null,
  scene: { type: string } | null,
  camera: { type: string } | null,
): string | null {
  if (!renderer || !scene || !camera) return null;
  try {
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL("image/png");
    // Basic validation: a blank/empty canvas produces a very short data URL
    if (dataUrl.length < 1000) return null;
    return dataUrl;
  } catch {
    return null;
  }
}

// ── Score Card Generation ────────────────────────────────────────────

export async function generateScoreCard(
  options: ScoreCardOptions,
): Promise<HTMLCanvasElement> {
  const { gameName, sceneCapture, stats, blockHeight, isHighScore } = options;

  // Wait for fonts to be available
  await document.fonts.ready;

  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d")!;

  // ── Background ──
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // Subtle grid
  ctx.strokeStyle = GRID_COLOR;
  ctx.lineWidth = 1;
  for (let x = 0; x < CARD_W; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CARD_H);
    ctx.stroke();
  }
  for (let y = 0; y < CARD_H; y += 28) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CARD_W, y);
    ctx.stroke();
  }

  // ── Scene capture (left 60%) ──
  const imgPad = 24;
  const imgW = Math.floor(CARD_W * 0.58) - imgPad * 2;
  const imgH = CARD_H - imgPad * 2;

  try {
    const img = await loadImage(sceneCapture);
    // Draw with aspect-fit inside the region
    const scale = Math.min(imgW / img.width, imgH / img.height);
    const drawW = img.width * scale;
    const drawH = img.height * scale;
    const drawX = imgPad + (imgW - drawW) / 2;
    const drawY = imgPad + (imgH - drawH) / 2;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    // Border around image
    ctx.strokeStyle = BORDER_COLOR;
    ctx.lineWidth = 1;
    ctx.strokeRect(drawX - 0.5, drawY - 0.5, drawW + 1, drawH + 1);
  } catch {
    // If image fails to load, leave blank
  }

  // ── Right panel (40%) ──
  const rightX = Math.floor(CARD_W * 0.6);
  const rightW = CARD_W - rightX - 32;
  let curY = 80;

  // Game name
  ctx.fillStyle = PRIMARY;
  ctx.font = "bold 42px 'JetBrains Mono', 'SF Mono', monospace";
  ctx.textBaseline = "top";
  // Word-wrap game name if needed
  const nameLines = wrapText(ctx, gameName, rightW);
  for (const line of nameLines) {
    ctx.fillText(line, rightX, curY);
    curY += 50;
  }

  // Separator line
  curY += 8;
  ctx.strokeStyle = "rgba(247,147,26,0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rightX, curY);
  ctx.lineTo(rightX + rightW, curY);
  ctx.stroke();
  curY += 20;

  // Block height
  ctx.fillStyle = LABEL_COLOR;
  ctx.font = "500 16px 'JetBrains Mono', 'SF Mono', monospace";
  ctx.fillText(`Block ${blockHeight.toLocaleString()}`, rightX, curY);
  curY += 40;

  // Stats
  for (let i = 0; i < stats.length; i++) {
    const stat = stats[i];

    // Label
    ctx.fillStyle = LABEL_COLOR;
    ctx.font = "500 14px 'JetBrains Mono', 'SF Mono', monospace";
    ctx.fillText(stat.label.toUpperCase(), rightX, curY);
    curY += 24;

    // Value — first stat (score) gets primary color
    ctx.fillStyle = i === 0 ? PRIMARY : VALUE_COLOR;
    ctx.font = `bold ${i === 0 ? 36 : 28}px 'JetBrains Mono', 'SF Mono', monospace`;
    ctx.fillText(stat.value, rightX, curY);
    curY += i === 0 ? 48 : 40;
  }

  // New High Score badge
  if (isHighScore) {
    curY += 4;
    ctx.fillStyle = PRIMARY;
    ctx.font = "bold 18px 'JetBrains Mono', 'SF Mono', monospace";
    ctx.fillText("\u2605 New High Score!", rightX, curY);
  }

  // ── Corner accents ──
  const accentLen = 16;
  ctx.strokeStyle = ACCENT_ALPHA;
  ctx.lineWidth = 2;

  // Top-right
  ctx.beginPath();
  ctx.moveTo(CARD_W - 12, 12);
  ctx.lineTo(CARD_W - 12, 12 + accentLen);
  ctx.moveTo(CARD_W - 12, 12);
  ctx.lineTo(CARD_W - 12 - accentLen, 12);
  ctx.stroke();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(12, CARD_H - 12);
  ctx.lineTo(12, CARD_H - 12 - accentLen);
  ctx.moveTo(12, CARD_H - 12);
  ctx.lineTo(12 + accentLen, CARD_H - 12);
  ctx.stroke();

  // ── Branding ──
  ctx.fillStyle = BRANDING_COLOR;
  ctx.font = "500 14px 'JetBrains Mono', 'SF Mono', monospace";
  ctx.textAlign = "right";
  ctx.fillText("bitmap.game", CARD_W - 24, CARD_H - 24);
  ctx.textAlign = "left";

  return canvas;
}

// ── Download / Share Utilities ───────────────────────────────────────

export function downloadScoreCard(
  canvas: HTMLCanvasElement,
  filename: string,
): void {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}

export async function copyScoreCardToClipboard(
  canvas: HTMLCanvasElement,
): Promise<boolean> {
  try {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return false;
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}

export function openTwitterIntent(text: string): void {
  window.open(
    `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`,
    "_blank",
    "noopener,noreferrer",
  );
}

export async function nativeShare(
  canvas: HTMLCanvasElement,
  text: string,
): Promise<boolean> {
  try {
    if (!navigator.share || !navigator.canShare) return false;
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!blob) return false;
    const file = new File([blob], "scorecard.png", { type: "image/png" });
    const shareData = { text, files: [file] };
    if (!navigator.canShare(shareData)) return false;
    await navigator.share(shareData);
    return true;
  } catch {
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = test;
    }
  }
  if (current) lines.push(current);
  return lines;
}
