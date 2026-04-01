/**
 * OpenGraph Image Generator for Bitmap Blocks
 * 
 * GET /api/bitmap/{height}/og?ratio=square
 * 
 * Clean, simple OG image showing just the bitmap visualization
 * with the block number in .bitmap format.
 * 
 * Query params:
 *   - ratio: "horizontal" (1200x630, default) or "square" (1200x1200)
 */

import { NextRequest, NextResponse } from "next/server";
import { createCanvas, CanvasRenderingContext2D } from "canvas";
import { processBlockBuffer } from "../../../../../lib/blockLayout";

export const dynamic = "force-dynamic";

const RENDER_API = process.env.RENDER_API_BASE ?? "http://r2d2.local:3020";

// OG dimensions
const HORIZONTAL_WIDTH = 1200;
const HORIZONTAL_HEIGHT = 630; // 1.91:1 aspect ratio
const SQUARE_SIZE = 1200; // 1:1 aspect ratio for Instagram, etc.

// HCL → RGB (same as bitmap-worker.js)
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

function renderOGImage(
  ctx: CanvasRenderingContext2D,
  squares: { x: number; y: number; r: number }[],
  layoutWidth: number,
  usedHeight: number,
  blockHeight: number
): void {
  // Background
  ctx.fillStyle = BG_COLOR;
  ctx.fillRect(0, 0, OG_WIDTH, OG_HEIGHT);

  // Calculate layout - bitmap on right side
  const padding = 60;
  const textAreaWidth = 380; // Reserve space for text on left
  const bitmapSize = Math.min(OG_HEIGHT - padding * 2, OG_WIDTH - textAreaWidth - padding * 3);
  const drawSize = Math.max(layoutWidth, usedHeight);
  const gridSize = bitmapSize / drawSize;
  
  const offsetX = OG_WIDTH - bitmapSize - padding;
  const offsetY = (OG_HEIGHT - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  // Draw bitmap squares
  ctx.fillStyle = TX_COLOR;
  for (const sq of squares) {
    const px = offsetX + sq.x * gridSize + unitPadding;
    const py = offsetY + sq.y * gridSize + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    if (pw <= 0) continue;
    ctx.fillRect(px, py, pw, pw);
  }

  // Text: block number in orange, .bitmap in white - positioned at top
  const textX = 60;
  const topY = 80;

  // Block number (orange)
  ctx.fillStyle = "#f7931a";
  ctx.font = "bold 80px monospace";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(String(blockHeight), textX, topY);

  // .bitmap suffix (white) - positioned to the right of number
  const numberWidth = ctx.measureText(String(blockHeight)).width;
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px monospace";
  ctx.fillText(".bitmap", textX + numberWidth + 8, topY + 42);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ height: string }> }
): Promise<NextResponse> {
  const { height: heightStr } = await params;
  const height = parseInt(heightStr, 10);

  if (isNaN(height) || height < 0) {
    return NextResponse.json(
      { error: "Invalid block height" },
      { status: 400 }
    );
  }

  try {
    // Fetch block transaction data
    const blockDataUrl = `${RENDER_API}/api/block/${height}`;
    const response = await fetch(blockDataUrl, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Block not found" },
          { status: 404 }
        );
      }
      throw new Error(`Upstream error: ${response.status}`);
    }

    const blockBuffer = await response.arrayBuffer();
    const { squares, layoutWidth, usedHeight } = processBlockBuffer(blockBuffer);

    // Create OG canvas
    const canvas = createCanvas(OG_WIDTH, OG_HEIGHT);
    const ctx = canvas.getContext("2d");

    // Render OG image
    renderOGImage(ctx, squares, layoutWidth, usedHeight, height);

    // Convert to PNG
    const pngBuffer = canvas.toBuffer("image/png");

    return new NextResponse(Buffer.from(pngBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400, immutable",
        "Content-Disposition": `inline; filename="bitmap-${height}-og.png"`,
        "X-Block-Height": heightStr,
      },
    });

  } catch (error) {
    console.error("OG image generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate OG image" },
      { status: 502 }
    );
  }
}
