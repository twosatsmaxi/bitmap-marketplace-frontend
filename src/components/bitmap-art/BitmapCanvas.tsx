"use client";

import { useRef, useEffect } from "react";
import type { BitmapType } from "@/lib/types";
import { renderCity } from "./renderers/renderCity";
import { renderGrid } from "./renderers/renderGrid";
import { renderMondrian } from "./renderers/renderMondrian";
import { renderPunk } from "./renderers/renderPunk";
import { renderPalindrome } from "./renderers/renderPalindrome";

interface BitmapCanvasProps {
  blockNumber: number;
  bitmapType: BitmapType;
  width?: number;
  height?: number;
  className?: string;
}

const RENDERERS: Record<BitmapType, (ctx: CanvasRenderingContext2D, w: number, h: number, seed: number) => void> = {
  city: renderCity,
  grid: renderGrid,
  mondrian: renderMondrian,
  punk: renderPunk,
  palindrome: renderPalindrome,
};

export default function BitmapCanvas({
  blockNumber,
  bitmapType,
  width = 300,
  height = 300,
  className,
}: BitmapCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const renderer = RENDERERS[bitmapType];
    renderer(ctx, width, height, blockNumber);
  }, [blockNumber, bitmapType, width, height]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={className}
      style={{ imageRendering: bitmapType === "punk" ? "pixelated" : "auto" }}
    />
  );
}
