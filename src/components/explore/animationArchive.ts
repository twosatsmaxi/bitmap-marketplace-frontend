/**
 * ANIMATION ARCHIVE - Bitmap Marketplace
 * This file contains historical and alternative versions of the bitmap rendering animations.
 * These can be retrieved and plugged back into draw() loops if needed.
 */

import { WorkerSquare } from "./types";

// Helper for animations
export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

const BASE_ORANGE = { r: 203, g: 120, b: 37 };

// ----------------------------------------------------------------------------
// 1. ORIGINAL GLOW PULSE (Discarded for Performance)
// ----------------------------------------------------------------------------
export function drawGlowPulse_Archived(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  progress: number = 1,
  idlePulse: number = 0,
  flickerIndex: number = -1
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    const isFlicker = i === flickerIndex;
    
    // Target position
    const px = sq.x * gridSize + unitPadding;
    const py = sq.y * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    if (pw <= 0) continue;

    // Pulse/Glow logic
    const isLarge = sq.r > 2.5;
    const pulseFactor = isLarge ? 0.4 + 0.6 * idlePulse : 1;
    let brightness = isLarge ? 1 + 0.3 * idlePulse : 1;
    if (isFlicker) brightness *= 1.5;
    
    ctx.globalAlpha = isFlicker ? 1 : (isLarge ? pulseFactor : 1);
    
    if ((isLarge && progress === 1) || isFlicker) {
      ctx.shadowBlur = isFlicker ? 8 : (4 * idlePulse);
      ctx.shadowColor = `rgba(${BASE_ORANGE.r}, ${BASE_ORANGE.g}, ${BASE_ORANGE.b}, 0.8)`;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = `rgb(${Math.min(255, BASE_ORANGE.r * brightness)}, ${Math.min(255, BASE_ORANGE.g * brightness)}, ${Math.min(255, BASE_ORANGE.b * brightness)})`;
    ctx.fillRect(px, py, pw, pw);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}

// ----------------------------------------------------------------------------
// 2. BITFEED VACUUM V1 (Fast Version)
// ----------------------------------------------------------------------------
export function drawBitfeedVacuum_Fast_Archived(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  startTime: number,
  currentTime: number
) {
  const baseDuration = 600;
  const totalStagger = 500;
  // ... rest of the logic with faster durations
}

// ----------------------------------------------------------------------------
// 3. INTERACTIVE REPEL V1 (Small Radius)
// ----------------------------------------------------------------------------
export function drawInteractive_Small_Archived(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  mousePos: { x: number, y: number }
) {
  // Uses radius = 8 and strength = 4
}

// ----------------------------------------------------------------------------
// 4. THE LIQUID BUBBLE (Large Radius, Smooth Displacement)
// ----------------------------------------------------------------------------
export function drawInteractive_Liquid_Archived(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  progress: number = 1,
  startTime: number = 0,
  currentTime: number = 0,
  flickerIndex: number = -1,
  mousePos: { x: number; y: number } | null = null
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;
  const baseR = 203, baseG = 120, baseB = 37;

  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    const isFlicker = i === flickerIndex;
    const staggerDelay = (i / squares.length) * 300;
    const elapsed = currentTime - startTime - staggerDelay;
    const revealProgress = progress === 1 ? 1 : Math.max(0, Math.min(1, elapsed / 400));
    if (revealProgress <= 0) continue;

    let offsetX = 0, offsetYDisplace = 0;
    if (mousePos && progress === 1) {
      const mx = mousePos.x / gridSize;
      const my = (mousePos.y - offsetY) / gridSize;
      const dx = (sq.x + sq.r / 2) - mx;
      const dy = (sq.y + sq.r / 2) - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 25;
      if (dist < radius) {
        const force = (Math.cos((dist / radius) * Math.PI) + 1) / 2;
        offsetX = (dx / (dist || 1)) * force * 12;
        offsetYDisplace = (dy / (dist || 1)) * force * 12;
      }
    }
    const eased = easeOutBack(revealProgress);
    const px = (sq.x + (sq.x + offsetX - sq.x) * eased) * gridSize + unitPadding;
    const py = (sq.y + (sq.y + offsetYDisplace - sq.y) * eased) * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    if (pw <= 0) continue;
    ctx.globalAlpha = isFlicker ? 1 : revealProgress;
    const brightness = isFlicker ? 2 : (1 + (Math.abs(offsetX + offsetYDisplace) * 0.08));
    ctx.fillStyle = `rgb(${Math.min(255, baseR * brightness)}, ${Math.min(255, baseG * brightness)}, ${Math.min(255, baseB * brightness)})`;
    if (isFlicker) { ctx.shadowBlur = 12; ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, 1)`; }
    ctx.fillRect(px, py, pw, pw);
  }
}

// ----------------------------------------------------------------------------
// 6. GRAVITY PACK (Vertical Drop with Bounce)
// ----------------------------------------------------------------------------
export function drawGravityPack_Archived(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  progress: number = 1,
  startTime: number = 0,
  currentTime: number = 0,
  flickerIndex: number = -1,
  mousePos: { x: number; y: number } | null = null
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;
  const baseR = 203, baseG = 120, baseB = 37;
  
  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    const isFlicker = i === flickerIndex;
    let currentProgress = 1;
    if (progress < 1) {
      const staggerDelay = (i / squares.length) * 400;
      const elapsed = currentTime - startTime - staggerDelay;
      currentProgress = Math.max(0, Math.min(1, elapsed / 600));
    }
    if (currentProgress <= 0) continue;
    const easedProgress = easeOutBack(currentProgress);
    let tx = sq.x, ty = sq.y;
    if (mousePos && progress === 1) {
      const mx = mousePos.x / gridSize, my = (mousePos.y - offsetY) / gridSize;
      const dx = tx + sq.r / 2 - mx, dy = ty + sq.r / 2 - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 5) {
        const force = (1 - dist / 5) * 2;
        tx += (dx / dist) * force; ty += (dy / dist) * force;
      }
    }
    const startY = sq.y - 20;
    const currentY = startY + (ty - startY) * easedProgress;
    const px = tx * gridSize + unitPadding;
    const py = currentY * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    if (pw <= 0) continue;
    ctx.globalAlpha = isFlicker ? 1 : currentProgress;
    const brightness = isFlicker ? 1.5 : 1;
    ctx.fillStyle = `rgb(${Math.min(255, baseR * brightness)}, ${Math.min(255, baseG * brightness)}, ${Math.min(255, baseB * brightness)})`;
    ctx.fillRect(px, py, pw, pw);
  }
  ctx.globalAlpha = 1;
}
export function drawStatic_Archived(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;
  ctx.fillStyle = `rgb(${BASE_ORANGE.r},${BASE_ORANGE.g},${BASE_ORANGE.b})`;
  for (const sq of squares) {
    ctx.fillRect(sq.x * gridSize + unitPadding, sq.y * gridSize + offsetY + unitPadding, sq.r * gridSize - unitPadding * 2, sq.r * gridSize - unitPadding * 2);
  }
}
