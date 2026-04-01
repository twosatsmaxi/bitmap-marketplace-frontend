/**
 * Client-side bitmap download utilities
 * 
 * Generate and download PNGs directly from browser canvas
 */

import { RENDERERS, getBitmapType, BitmapType } from "./bitmapRenderers";

interface DownloadOptions {
  blockNumber: number;
  size?: number;
  style?: BitmapType;
  filename?: string;
}

/**
 * Generate a bitmap on a canvas and trigger download
 */
export function downloadBitmapPNG(options: DownloadOptions): void {
  const { blockNumber, size = 1024, style, filename } = options;
  
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.error("Failed to get canvas context");
    return;
  }

  const bitmapType = style || getBitmapType(blockNumber);
  const renderer = RENDERERS[bitmapType];
  
  // Render the bitmap
  renderer(ctx, size, size, blockNumber);

  // Add metadata text
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `bold ${Math.max(12, size / 32)}px monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(`#${blockNumber}`, size - 16, size - 16);

  // Trigger download
  const link = document.createElement("a");
  link.download = filename || `bitmap-${blockNumber}.png`;
  link.href = canvas.toDataURL("image/png");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get a data URL for a bitmap (useful for previews/sharing)
 */
export function getBitmapDataURL(
  blockNumber: number,
  size: number = 512,
  style?: BitmapType
): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const bitmapType = style || getBitmapType(blockNumber);
  const renderer = RENDERERS[bitmapType];
  
  renderer(ctx, size, size, blockNumber);

  // Add metadata
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = `bold ${Math.max(12, size / 32)}px monospace`;
  ctx.textAlign = "right";
  ctx.textBaseline = "bottom";
  ctx.fillText(`#${blockNumber}`, size - 16, size - 16);

  return canvas.toDataURL("image/png");
}

/**
 * Get blob for a bitmap (useful for uploading to servers)
 */
export async function getBitmapBlob(
  blockNumber: number,
  size: number = 512,
  style?: BitmapType
): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      resolve(null);
      return;
    }

    const bitmapType = style || getBitmapType(blockNumber);
    const renderer = RENDERERS[bitmapType];
    
    renderer(ctx, size, size, blockNumber);

    // Add metadata
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.font = `bold ${Math.max(12, size / 32)}px monospace`;
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText(`#${blockNumber}`, size - 16, size - 16);

    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Copy bitmap to clipboard as image
 */
export async function copyBitmapToClipboard(
  blockNumber: number,
  size: number = 512,
  style?: BitmapType
): Promise<boolean> {
  try {
    const blob = await getBitmapBlob(blockNumber, size, style);
    if (!blob) return false;
    
    await navigator.clipboard.write([
      new ClipboardItem({ "image/png": blob })
    ]);
    return true;
  } catch (err) {
    console.error("Failed to copy to clipboard:", err);
    return false;
  }
}
