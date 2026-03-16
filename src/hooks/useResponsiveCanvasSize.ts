"use client";

// Reverted to fixed size - WASM worker doesn't support dynamic sizing
export function useStableCanvasSize(): number {
  return 300;
}

export function useDetailCanvasSize(): number {
  return 800;
}
