import { WorkerSquare } from "./types";

export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function drawGravityPack(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  progress: number = 1,
  startTime: number = 0,
  currentTime: number = 0,
  flickerIndex: number = -1
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  const duration = 600; // ms
  const totalStagger = 400; // ms stagger over all squares

  // HCL orange matching bitmap-render
  const baseR = 203, baseG = 120, baseB = 37;
  
  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    const isFlicker = i === flickerIndex;
    
    // Animation logic
    let currentProgress = 1;
    if (progress < 1) {
      const staggerDelay = (i / squares.length) * totalStagger;
      const elapsed = currentTime - startTime - staggerDelay;
      currentProgress = Math.max(0, Math.min(1, elapsed / duration));
    }

    if (currentProgress <= 0) continue;

    const easedProgress = easeOutBack(currentProgress);
    
    const px = sq.x * gridSize + unitPadding;
    // Fall from 20 units above
    const startY = sq.y - 20;
    const currentY = startY + (sq.y - startY) * easedProgress;
    
    const py = currentY * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    
    if (pw <= 0) continue;
    
    // Fade in
    ctx.globalAlpha = isFlicker ? 1 : currentProgress;
    const brightness = isFlicker ? 1.5 : 1;
    ctx.fillStyle = `rgb(${Math.min(255, baseR * brightness)}, ${Math.min(255, baseG * brightness)}, ${Math.min(255, baseB * brightness)})`;
    ctx.fillRect(px, py, pw, pw);
  }
  ctx.globalAlpha = 1;
}

export function drawGlowPulse(
  ctx: CanvasRenderingContext2D,
  squares: WorkerSquare[],
  layoutWidth: number,
  usedHeight: number,
  canvasSize: number,
  progress: number = 1,
  startTime: number = 0,
  currentTime: number = 0,
  idlePulse: number = 0,
  flickerIndex: number = -1
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  const duration = 600; // ms
  const totalStagger = 400; // ms stagger over all squares

  // Base HCL orange matching bitmap-render
  const baseR = 203, baseG = 120, baseB = 37;
  
  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    const isFlicker = i === flickerIndex;
    
    // Animation logic
    let currentProgress = 1;
    if (progress < 1) {
      const staggerDelay = (i / squares.length) * totalStagger;
      const elapsed = currentTime - startTime - staggerDelay;
      currentProgress = Math.max(0, Math.min(1, elapsed / duration));
    }

    if (currentProgress <= 0) continue;

    const easedProgress = easeOutBack(currentProgress);
    
    const px = sq.x * gridSize + unitPadding;
    // Fall from 20 units above
    const startY = sq.y - 20;
    const currentY = startY + (sq.y - startY) * easedProgress;
    
    const py = currentY * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;
    
    if (pw <= 0) continue;
    
    // Pulse/Glow logic
    const isLarge = sq.r > 2.5;
    const pulseFactor = isLarge ? 0.4 + 0.6 * idlePulse : 1;
    let brightness = isLarge ? 1 + 0.3 * idlePulse : 1;
    
    if (isFlicker) {
      brightness *= 1.5;
    }
    
    ctx.globalAlpha = isFlicker ? 1 : currentProgress * (isLarge ? pulseFactor : 1);
    
    if ((isLarge && progress === 1) || isFlicker) {
      ctx.shadowBlur = isFlicker ? 8 : (4 * idlePulse);
      ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, 0.8)`;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillStyle = `rgb(${Math.min(255, baseR * brightness)}, ${Math.min(255, baseG * brightness)}, ${Math.min(255, baseB * brightness)})`;
    ctx.fillRect(px, py, pw, pw);
  }
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
