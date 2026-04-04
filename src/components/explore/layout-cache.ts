import type { WorkerSquare } from "./types";

export interface LayoutCacheEntry {
  squares: WorkerSquare[];
  layoutWidth: number;
  usedHeight: number;
  /** Pre-built WebGL instance data (x, y, r, index) — avoids re-allocation on cache hit */
  instanceData?: Float32Array;
}

/**
 * Module-level cache keyed by `${blockHeight}:${canvasSize}`.
 * Survives component unmount so navigating explore -> detail -> back
 * skips the worker and the 3s entry animation entirely.
 */
const cache = new Map<string, LayoutCacheEntry>();

function key(blockHeight: number, canvasSize: number): string {
  return `${blockHeight}:${canvasSize}`;
}

export function getLayoutCache(
  blockHeight: number,
  canvasSize: number
): LayoutCacheEntry | undefined {
  return cache.get(key(blockHeight, canvasSize));
}

export function setLayoutCache(
  blockHeight: number,
  canvasSize: number,
  entry: LayoutCacheEntry
): void {
  if (cache.size >= 200) {
    const firstKey = cache.keys().next().value;
    if (firstKey !== undefined) cache.delete(firstKey);
  }
  cache.set(key(blockHeight, canvasSize), entry);
}
