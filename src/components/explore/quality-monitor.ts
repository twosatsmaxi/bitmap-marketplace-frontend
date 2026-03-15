/**
 * FPS-based quality tier monitor.
 * Tracks frame times over a rolling window and triggers tier downgrades
 * when performance drops below thresholds.
 */

import type { QualityTier, QualityFeatures } from "./types";

const WINDOW_SIZE = 30; // frames to average over
const DOWNGRADE_FPS = 24; // below this, downgrade
const UPGRADE_FPS = 50; // above this, consider upgrade
const DOWNGRADE_FRAMES = 20; // consecutive low frames before downgrade
const UPGRADE_FRAMES = 60; // consecutive high frames before upgrade

const TIER_ORDER: QualityTier[] = ["full", "reduced", "canvas2d", "static"];

const TIER_FEATURES: Record<QualityTier, QualityFeatures> = {
  full: { repulsion: true, flicker: true, animated: true },
  reduced: { repulsion: false, flicker: false, animated: true },
  canvas2d: { repulsion: false, flicker: false, animated: true },
  static: { repulsion: false, flicker: false, animated: false },
};

export class QualityMonitor {
  private frameTimes: number[] = [];
  private lastFrameTime = 0;
  private lowCount = 0;
  private highCount = 0;
  private _tier: QualityTier;
  private _locked = false;

  constructor(initialTier: QualityTier = "full") {
    this._tier = initialTier;
  }

  get tier(): QualityTier {
    return this._tier;
  }

  get features(): QualityFeatures {
    return TIER_FEATURES[this._tier];
  }

  /** Lock the current tier (prevent further changes) */
  lock(): void {
    this._locked = true;
  }

  /** Record a frame timestamp and return true if tier changed */
  recordFrame(now: number): boolean {
    if (this._locked || this._tier === "static") return false;

    if (this.lastFrameTime > 0) {
      const dt = now - this.lastFrameTime;
      this.frameTimes.push(dt);
      if (this.frameTimes.length > WINDOW_SIZE) {
        this.frameTimes.shift();
      }
    }
    this.lastFrameTime = now;

    if (this.frameTimes.length < 10) return false;

    const avgDt =
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const fps = 1000 / avgDt;

    if (fps < DOWNGRADE_FPS) {
      this.lowCount++;
      this.highCount = 0;
      if (this.lowCount >= DOWNGRADE_FRAMES) {
        this.lowCount = 0;
        return this.downgrade();
      }
    } else if (fps > UPGRADE_FPS) {
      this.highCount++;
      this.lowCount = 0;
      if (this.highCount >= UPGRADE_FRAMES) {
        this.highCount = 0;
        return this.upgrade();
      }
    } else {
      this.lowCount = 0;
      this.highCount = 0;
    }

    return false;
  }

  private downgrade(): boolean {
    const idx = TIER_ORDER.indexOf(this._tier);
    if (idx < TIER_ORDER.length - 1) {
      this._tier = TIER_ORDER[idx + 1];
      this.frameTimes = [];
      return true;
    }
    return false;
  }

  private upgrade(): boolean {
    const idx = TIER_ORDER.indexOf(this._tier);
    if (idx > 0) {
      this._tier = TIER_ORDER[idx - 1];
      this.frameTimes = [];
      return true;
    }
    return false;
  }

  reset(tier?: QualityTier): void {
    this.frameTimes = [];
    this.lastFrameTime = 0;
    this.lowCount = 0;
    this.highCount = 0;
    this._locked = false;
    if (tier) this._tier = tier;
  }
}

export function getTierFeatures(tier: QualityTier): QualityFeatures {
  return TIER_FEATURES[tier];
}
