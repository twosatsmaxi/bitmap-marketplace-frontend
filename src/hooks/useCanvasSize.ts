"use client";

// Fixed canvas sizes - WASM worker requires stable sizing
export function useCanvasSize(): number {
  return 300;
}

export function useDetailCanvasSize(): number {
  return 800;
}
