/**
 * Module-level cache for worker layout results.
 * Survives Next.js client-side navigation (component unmount/remount).
 * Keyed by block height — stores the squares array and layout dimensions.
 */

import type { WorkerSquare } from "./types";

export interface CachedLayout {
  squares: WorkerSquare[];
  layoutWidth: number;
  usedHeight: number;
}

const cache = new Map<number, CachedLayout>();

export function getCachedLayout(height: number): CachedLayout | undefined {
  return cache.get(height);
}

export function setCachedLayout(height: number, data: CachedLayout): void {
  cache.set(height, data);
}
