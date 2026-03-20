"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { Bitmap } from "@/lib/types";
import Link from "next/link";

interface WorldHUDProps {
  selectedBlock: Bitmap | null;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
  blockCount: number;
}

export function WorldHUD({ 
  selectedBlock, 
  onClose, 
  onZoomIn, 
  onZoomOut, 
  onReset,
  blockCount 
}: WorldHUDProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      {/* Top Left - Title */}
      <div className="absolute top-6 left-6 z-10">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-primary/60">
            Interactive World
          </span>
        </div>
        <h1 className="font-mono text-xl font-bold uppercase tracking-[-0.02em] text-white">
          Bitmap City
        </h1>
        <p className="font-mono text-xs text-zinc-500 mt-1">
          {blockCount.toLocaleString()} blocks rendered
        </p>
      </div>

      {/* Top Right - Controls */}
      <div className="absolute top-6 right-6 z-10 flex flex-col gap-2">
        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2 border border-white/10">
          <button
            onClick={onZoomIn}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4 text-zinc-300" />
          </button>
          <button
            onClick={onZoomOut}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4 text-zinc-300" />
          </button>
          <button
            onClick={onReset}
            className="p-2 hover:bg-white/10 rounded transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4 text-zinc-300" />
          </button>
        </div>
      </div>

      {/* Bottom Left - Instructions */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-2">
            Controls
          </h3>
          <ul className="font-mono text-xs text-zinc-500 space-y-1">
            <li>• Left click + drag to rotate</li>
            <li>• Right click + drag to pan</li>
            <li>• Scroll to zoom</li>
            <li>• Click block to view details</li>
          </ul>
        </div>
      </div>

      {/* Selected Block Panel */}
      {selectedBlock && (
        <div className="absolute bottom-6 right-6 z-10 w-80">
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-primary/30 p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-mono text-lg font-bold text-white">
                  {selectedBlock.blockNumber}.bitmap
                </h2>
                <span className="font-mono text-xs uppercase tracking-[0.15em] text-zinc-500">
                  {selectedBlock.bitmapType}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4 text-zinc-400" />
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Rarity</span>
                <span className="font-mono text-xs uppercase text-primary">
                  {selectedBlock.rarity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Status</span>
                <span className="font-mono text-xs uppercase text-zinc-300">
                  {selectedBlock.listingStatus}
                </span>
              </div>
              {selectedBlock.price && (
                <div className="flex justify-between">
                  <span className="font-mono text-xs text-zinc-500">Price</span>
                  <span className="font-mono text-xs text-primary">
                    {(selectedBlock.price / 100000000).toFixed(4)} BTC
                  </span>
                </div>
              )}
            </div>

            <Link
              href={`/bitmap/${selectedBlock.id}`}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-lg font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary transition-colors"
            >
              View Details
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-24 right-6 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/10">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-2">
            Block Types
          </h3>
          <div className="space-y-1.5">
            {[
              { type: "city", color: "#f7931a" },
              { type: "grid", color: "#10b981" },
              { type: "mondrian", color: "#3b82f6" },
              { type: "punk", color: "#ec4899" },
              { type: "palindrome", color: "#8b5cf6" },
            ].map(({ type, color }) => (
              <div key={type} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-[10px] uppercase text-zinc-400">
                  {type}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
