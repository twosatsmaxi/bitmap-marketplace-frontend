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
  flickerIndex: number = -1,
  mousePos: { x: number; y: number } | null = null
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  const duration = 600; // ms
  const totalStagger = 400; // ms stagger over all squares
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
    
    // Target position
    let tx = sq.x;
    let ty = sq.y;

    // Repulsion logic
    if (mousePos && progress === 1) {
      const mx = mousePos.x / gridSize;
      const my = (mousePos.y - offsetY) / gridSize;
      const dx = tx + sq.r / 2 - mx;
      const dy = ty + sq.r / 2 - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 5; // grid units
      if (dist < radius) {
        const force = (1 - dist / radius) * 2;
        tx += (dx / dist) * force;
        ty += (dy / dist) * force;
      }
    }

    const px = tx * gridSize + unitPadding;
    // Fall from 20 units above
    const startY = sq.y - 20;
    const currentY = startY + (ty - startY) * easedProgress;
    
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
  flickerIndex: number = -1,
  mousePos: { x: number; y: number } | null = null
) {
  ctx.fillStyle = "#0d1117";
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  const draw = Math.max(layoutWidth, usedHeight);
  const gridSize = canvasSize / draw;
  const offsetY = (canvasSize - usedHeight * gridSize) / 2;
  const unitPadding = gridSize / 4;

  const duration = 600; // ms
  const totalStagger = 400; // ms stagger over all squares
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
    
    // Target position
    let tx = sq.x;
    let ty = sq.y;

    // Repulsion logic
    if (mousePos && progress === 1) {
      const mx = mousePos.x / gridSize;
      const my = (mousePos.y - offsetY) / gridSize;
      const dx = tx + sq.r / 2 - mx;
      const dy = ty + sq.r / 2 - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const radius = 5; // grid units
      if (dist < radius) {
        const force = (1 - dist / radius) * 2;
        tx += (dx / dist) * force;
        ty += (dy / dist) * force;
      }
    }

    const px = tx * gridSize + unitPadding;
    // Fall from 20 units above
    const startY = sq.y - 20;
    const currentY = startY + (ty - startY) * easedProgress;
    
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

export function drawInteractive(
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
    
    // Initial Reveal
    const staggerDelay = (i / squares.length) * 300;
    const elapsed = currentTime - startTime - staggerDelay;
    const revealProgress = progress === 1 ? 1 : Math.max(0, Math.min(1, elapsed / 400));

    if (revealProgress <= 0) continue;

    // Dramatic "Bubble" Repulsion
    if (mousePos && progress === 1) {
      const mx = mousePos.x / gridSize;
      const my = (mousePos.y - offsetY) / gridSize;
      
      const dx = (sq.x + sq.r / 2) - mx;
      const dy = (sq.y + sq.r / 2) - my;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      const radius = 25; // Much larger interactive bubble
      if (dist < radius) {
        // Smooth Cosine Falloff for "Liquid" feel
        const force = (Math.cos((dist / radius) * Math.PI) + 1) / 2;
        const strength = 12; // Powerful push
        offsetX = (dx / (dist || 1)) * force * strength;
        offsetYDisplace = (dy / (dist || 1)) * force * strength;
      }
    }

    const eased = easeOutBack(revealProgress);
    const curX = sq.x + offsetX;
    const curY = sq.y + offsetYDisplace;

    const px = (sq.x + (curX - sq.x) * eased) * gridSize + unitPadding;
    const py = (sq.y + (curY - sq.y) * eased) * gridSize + offsetY + unitPadding;
    const pw = sq.r * gridSize - unitPadding * 2;

    if (pw <= 0) continue;

    ctx.globalAlpha = isFlicker ? 1 : revealProgress;
    const brightness = isFlicker ? 2 : (1 + (Math.abs(offsetX + offsetYDisplace) * 0.08)); // Brighter glow on move
    ctx.fillStyle = `rgb(${Math.min(255, baseR * brightness)}, ${Math.min(255, baseG * brightness)}, ${Math.min(255, baseB * brightness)})`;
    
    if (isFlicker) {
      ctx.shadowBlur = 12;
      ctx.shadowColor = `rgba(${baseR}, ${baseG}, ${baseB}, 1)`;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.fillRect(px, py, pw, pw);
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
}
