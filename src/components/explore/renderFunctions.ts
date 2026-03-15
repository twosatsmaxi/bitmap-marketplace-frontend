import { WorkerSquare } from "./types";

export function easeOutBack(x: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function drawBitfeedVacuum(
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

  const baseDuration = 1400;
  const totalStagger = 1200;
  const baseR = 203, baseG = 120, baseB = 37;

  for (let i = 0; i < squares.length; i++) {
    const sq = squares[i];
    const isFlicker = i === flickerIndex;
    
    // Target position
    let tx = sq.x;
    let ty = sq.y;

    // Interactive Repulsion
    if (mousePos && progress === 1) {
      const mx = mousePos.x / gridSize;
      const my = (mousePos.y - offsetY) / gridSize;
      const dx = tx + sq.r / 2 - mx;
      const dy = ty + sq.r / 2 - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 6; // grid units
      if (dist < radius) {
        const force = (1 - dist / radius) * 3; // Strength of push
        tx += (dx / dist) * force;
        ty += (dy / dist) * force;
      }
    }

    // Stable pseudo-random starting point outside the canvas
    const angle = Math.sin(i * 1234.56) * Math.PI * 2;
    const distFromCenter = (canvasSize / gridSize) * (1.2 + Math.cos(i * 789.1) * 0.5);
    const startX = sq.x + Math.cos(angle) * distFromCenter;
    const startY = sq.y + Math.sin(angle) * distFromCenter;

    // "Mass" factor: large blocks take slightly longer to reach
    const massFactor = sq.r * 50; 
    const staggerDelay = (i / squares.length) * totalStagger + Math.abs(Math.sin(i)) * 100;
    const elapsed = currentTime - startTime - staggerDelay;
    
    const duration = baseDuration + massFactor;
    let currentProgress = progress === 1 ? 1 : Math.max(0, Math.min(1, elapsed / duration));

    if (currentProgress <= 0) continue;

    const eased = easeOutBack(currentProgress);
    
    const curX = startX + (tx - startX) * eased;
    const curY = startY + (ty - startY) * eased;

    const px = curX * gridSize + unitPadding;
    const py = curY * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;

    if (pw <= 0) continue;

    // Bitfeed aesthetic: opacity increases as it "packs"
    ctx.globalAlpha = isFlicker ? 1 : Math.min(1, currentProgress * 1.5);
    const brightness = isFlicker ? 1.6 : 1;
    ctx.fillStyle = `rgb(${Math.min(255, baseR * brightness)}, ${Math.min(255, baseG * brightness)}, ${Math.min(255, baseB * brightness)})`;
    
    if (isFlicker) {
      ctx.shadowBlur = 6;
      ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, 0.8)`;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(px, py, pw, pw);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
