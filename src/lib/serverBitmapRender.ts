/**
 * Server-Side Bitmap PNG Renderer
 * 
 * Uses the same Mondrian layout engine as the WASM worker
 * to generate transaction-based bitmap visuals for server-side
 * PNG generation.
 */

import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { processBlockBuffer, type TxSquare } from "./blockLayout";

// HCL → RGB color conversion (same as bitmap-worker.js)
function hclToRgb(hDeg: number, c: number, l: number): [number, number, number] {
  const h = hDeg * Math.PI / 180;
  const a = Math.cos(h) * c;
  const b = Math.sin(h) * c;
  const fy = (l + 16) / 116;
  const fx = a / 500 + fy;
  const fz = fy - b / 200;
  const e = 0.008856;
  const k = 903.3;
  const X = (fx * fx * fx > e ? fx * fx * fx : (116 * fx - 16) / k) * 0.95047;
  const Y = l > k * e ? Math.pow((l + 16) / 116, 3) : l / k;
  const Z = (fz * fz * fz > e ? fz * fz * fz : (116 * fz - 16) / k) * 1.08883;
  const lin = (v: number) => v <= 0.0031308 ? 12.92 * v : 1.055 * Math.pow(v, 1 / 2.4) - 0.055;
  return [
    Math.max(0, Math.min(255, Math.round(lin(X * 3.2406 + Y * -1.5372 + Z * -0.4986) * 255))),
    Math.max(0, Math.min(255, Math.round(lin(X * -0.9689 + Y * 1.8758 + Z * 0.0415) * 255))),
    Math.max(0, Math.min(255, Math.round(lin(X * 0.0557 + Y * -0.2040 + Z * 1.0570) * 255))),
  ];
}

const C = 78.225;
const ORANGE = { h: 0.181, l: 0.472 };
const TX_COLOR = (() => {
  const [r, g, b] = hclToRgb(ORANGE.h * 360, C, ORANGE.l * 150);
  return `rgb(${r},${g},${b})`;
})();

const BG_COLOR = "#0d1117";

export interface RenderOptions {
  /** Canvas size in pixels (default: 512) */
  size?: number;
  /** Add block height watermark (default: true) */
  watermark?: boolean;
  /** Padding around the bitmap (default: 0) */
  padding?: number;
  /** Background color (default: #0d1117) */
  backgroundColor?: string;
  /** Tile color (default: HCL orange) */
  tileColor?: string;
}

/**
 * Render transaction squares to canvas context
 * Matches the visual style of bitmap-worker.js renderSquares()
 */
function renderSquares(
  ctx: CanvasRenderingContext2D,
  squares: TxSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  options: RenderOptions = {}
): void {
  const {
    backgroundColor = BG_COLOR,
    tileColor = TX_COLOR,
    padding = 0,
  } = options;

  // Background
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  const drawSize = Math.max(layoutWidth, usedHeight);
  const gridSize = (canvasSize - padding * 2) / drawSize;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  // Draw tiles
  ctx.fillStyle = tileColor;
  for (const sq of squares) {
    const px = sq.x * gridSize + unitPadding + padding;
    const py = sq.y * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    if (pw <= 0) continue;
    ctx.fillRect(px, py, pw, pw);
  }
}

/**
 * Add block metadata watermark
 */
function addWatermark(
  ctx: CanvasRenderingContext2D,
  blockHeight: number,
  txCount: number,
  canvasSize: number
): void {
  const fontSize = Math.max(12, canvasSize / 32);
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `bold ${fontSize}px monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  
  const text = `#${blockHeight}`;
  const subText = `${txCount} txs`;
  
  // Main block number
  ctx.fillText(text, canvasSize - 16, canvasSize - 16 - fontSize);
  
  // Transaction count (smaller)
  ctx.font = `${Math.max(10, fontSize * 0.75)}px monospace`;
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.fillText(subText, canvasSize - 16, canvasSize - 16);
}

/**
 * Generate bitmap PNG buffer from block transaction data
 * 
 * @param blockBuffer - Binary transaction data (each byte = tx size)
 * @param blockHeight - Block height for watermark
 * @param options - Rendering options
 * @returns PNG buffer
 */
export function generateBitmapPng(
  blockBuffer: ArrayBuffer,
  blockHeight: number,
  options: RenderOptions = {}
): Buffer {
  const { size = 512 } = options;

  // Process layout using same engine as WASM worker
  const { squares, layoutWidth, usedHeight, txCount } = processBlockBuffer(blockBuffer);

  // Create canvas
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");

  // Render squares
  renderSquares(ctx, squares, layoutWidth, usedHeight, size, options);

  // Add watermark
  if (options.watermark !== false) {
    addWatermark(ctx, blockHeight, txCount, size);
  }

  // Convert to PNG
  return canvas.toBuffer("image/png");
}

/**
 * Generate bitmap with custom styling (for social sharing, etc.)
 */
export function generateStyledBitmap(
  blockBuffer: ArrayBuffer,
  blockHeight: number,
  style: "default" | "twitter" | "square" = "default"
): Buffer {
  switch (style) {
    case "twitter":
      // 1200x675 Twitter card aspect ratio
      return generateBitmapPng(blockBuffer, blockHeight, {
        size: 1200,
        watermark: true,
        padding: 40,
      });
    case "square":
      // High-res square for profile pics, etc.
      return generateBitmapPng(blockBuffer, blockHeight, {
        size: 1024,
        watermark: true,
        padding: 20,
      });
    default:
      return generateBitmapPng(blockBuffer, blockHeight);
  }
}

export { processBlockBuffer, type TxSquare };
