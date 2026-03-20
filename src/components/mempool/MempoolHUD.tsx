"use client";

import { useEffect, useState } from "react";
import type { MempoolStats, QualityLevel } from "./types/mempool";

interface MempoolHUDProps {
  stats: MempoolStats;
  fps: number;
  quality: QualityLevel;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return num.toFixed(0);
}

export function MempoolHUD({ stats, fps, quality }: MempoolHUDProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Top Left - Title */}
      <div className="absolute top-6 left-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary/60">
            Live Mempool
          </span>
        </div>
        <h1 className="font-mono text-xl font-bold uppercase tracking-[-0.02em] text-white">
          Network Flow
        </h1>
      </div>

      {/* Top Right - Stats */}
      <div className="absolute top-6 right-6 text-right">
        <div className="space-y-3">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Pending TXs
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {formatNumber(stats.txCount)}
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Incoming Rate
            </div>
            <div className="font-mono text-lg font-bold text-primary">
              {stats.txPerSecond.toFixed(1)}
              <span className="text-xs text-zinc-500 ml-1">tx/s</span>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Avg Fee Rate
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {stats.avgFeeRate.toFixed(1)}
              <span className="text-xs text-zinc-500 ml-1">sat/vB</span>
            </div>
          </div>

          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Mempool Size
            </div>
            <div className="font-mono text-sm font-bold text-zinc-400">
              {formatBytes(stats.totalSize)}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Left - Legend */}
      <div className="absolute bottom-6 left-6">
        <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-2">
          Fee Rate
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffeb3b]" />
            <span className="font-mono text-xs text-zinc-400">500+ sat/vB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ffc12a]" />
            <span className="font-mono text-xs text-zinc-400">100-500 sat/vB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#f7931a]" />
            <span className="font-mono text-xs text-zinc-400">50-100 sat/vB</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-[#7e4912]" />
            <span className="font-mono text-xs text-zinc-400">&lt;50 sat/vB</span>
          </div>
        </div>
      </div>

      {/* Bottom Right - Performance */}
      <div className="absolute bottom-6 right-6 text-right">
        <div className="flex items-center justify-end gap-3">
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              FPS
            </div>
            <div
              className={`font-mono text-sm font-bold ${
                fps >= 55 ? "text-success" : fps >= 30 ? "text-primary" : "text-danger"
              }`}
            >
              {fps}
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
              Quality
            </div>
            <div className="font-mono text-sm font-bold text-zinc-300 uppercase">
              {quality}
            </div>
          </div>
        </div>
      </div>

      {/* Center - Hint text (fades out) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center">
        <p className="font-mono text-xs text-zinc-600">
          Move mouse to look around
        </p>
      </div>
    </div>
  );
}
