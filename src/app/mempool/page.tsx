"use client";

import { useState, useEffect, useCallback } from "react";
import { BlockVisualizer } from "@/components/mempool/BlockVisualizer";
import { BlockSelector } from "@/components/mempool/BlockSelector";
import { BackButton } from "@/components/mempool/BackButton";

interface BlockMeta {
  height: number;
  tx_count: number;
  size: number;
}

interface BlockData {
  meta: BlockMeta;
  /** 1 byte per tx — values 1-6 (log₁₀ output value buckets) */
  bytes: Uint8Array;
}

function LoadingOverlay({ blockHeight }: { blockHeight: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg/90 z-50">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-mono text-sm text-zinc-400 uppercase tracking-[0.2em]">
          Loading Block
        </p>
        <p className="font-mono text-xl font-bold text-primary mt-2">
          {blockHeight.toLocaleString()}
        </p>
      </div>
    </div>
  );
}

// Bucket value labels for the legend and detail panel
const BUCKET_LABELS: Record<number, string> = {
  1: "< 0.001 BTC",
  2: "0.001 – 0.01 BTC",
  3: "0.01 – 0.1 BTC",
  4: "0.1 – 1 BTC",
  5: "1 – 10 BTC",
  6: "10+ BTC",
};

export default function MempoolPage() {
  const [mounted, setMounted] = useState(false);
  const [blockHeight, setBlockHeight] = useState(800150);
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [selectedTxIndex, setSelectedTxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch block data when height changes
  useEffect(() => {
    let cancelled = false;

    async function fetchBlock() {
      setLoading(true);
      setSelectedTxIndex(null);

      try {
        // Fetch meta and binary data in parallel
        const [metaRes, bytesRes] = await Promise.all([
          fetch(`/api/explore/blocks/${blockHeight}/meta`),
          fetch(`/api/explore/blocks/${blockHeight}`),
        ]);

        if (cancelled) return;

        if (!metaRes.ok || !bytesRes.ok) {
          throw new Error(`HTTP error: meta=${metaRes.status} bytes=${bytesRes.status}`);
        }

        const meta = await metaRes.json();
        const buffer = await bytesRes.arrayBuffer();
        const bytes = new Uint8Array(buffer);

        if (cancelled) return;

        setBlockData({
          meta: {
            height: blockHeight,
            tx_count: meta.tx_count || bytes.length,
            size: meta.size || 0,
          },
          bytes,
        });
      } catch (e) {
        if (!cancelled) {
          console.error("Failed to fetch block:", e);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchBlock();

    return () => {
      cancelled = true;
    };
  }, [blockHeight]);

  const handleHeightChange = useCallback((height: number) => {
    setBlockHeight(height);
  }, []);

  const handleTxClick = useCallback((index: number) => {
    setSelectedTxIndex(index);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedTxIndex(null);
  }, []);

  if (!mounted) {
    return <LoadingOverlay blockHeight={800150} />;
  }

  const selectedBucket = selectedTxIndex !== null && blockData
    ? blockData.bytes[selectedTxIndex]
    : null;

  return (
    <>
      {/* Loading Overlay */}
      {loading && <LoadingOverlay blockHeight={blockHeight} />}

      {/* Block Selector */}
      <BlockSelector
        currentHeight={blockHeight}
        onHeightChange={handleHeightChange}
        txCount={blockData?.meta.tx_count}
        disabled={loading}
      />

      {/* Block Info — rendered inside BlockSelector */}

      {/* 3D Visualizer */}
      {blockData && !loading && (
        <BlockVisualizer
          key={blockData.meta.height}
          blockBytes={blockData.bytes}
          onTransactionClick={handleTxClick}
        />
      )}

      {/* Transaction Detail Panel */}
      {selectedTxIndex !== null && selectedBucket && !loading && (
        <div className="absolute bottom-6 right-6 z-10 w-64">
          <div className="br-card p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  Transaction #{selectedTxIndex + 1}
                </div>
                <div className="font-mono text-sm font-bold text-primary mt-1">
                  {BUCKET_LABELS[selectedBucket] ?? `Bucket ${selectedBucket}`}
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-[rgba(255,255,255,0.07)] rounded transition-colors active:scale-95"
              >
                <span className="text-zinc-500 text-sm">✕</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute right-6 z-10" style={{ top: "calc(var(--header-total) + 1rem)" }}>
        <div className="br-card p-3">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-2">
            Output Value
          </div>
          <div className="space-y-1.5">
            {[
              { label: "10+ BTC", color: "#ffeb3b" },
              { label: "1 – 10 BTC", color: "#ffc12a" },
              { label: "0.1 – 1 BTC", color: "#f7931a" },
              { label: "0.01 – 0.1", color: "#b87326" },
              { label: "0.001 – 0.01", color: "#a05a1a" },
              { label: "< 0.001", color: "#7e4912" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-[10px] text-zinc-500">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BackButton />
    </>
  );
}
