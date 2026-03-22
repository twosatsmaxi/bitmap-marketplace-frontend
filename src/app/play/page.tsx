"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HelicopterVisualizer } from "@/components/visualizer/HelicopterVisualizer";
import { SatoshiSurvivors } from "@/components/visualizer/SatoshiSurvivors";
import { BlockVisualizer } from "@/components/visualizer/BlockVisualizer";
import { BlockSelector } from "@/components/mempool/BlockSelector";
import { BackButton } from "@/components/mempool/BackButton";
import { useChainTip } from "@/hooks/useChainTip";

interface BlockMeta {
  height: number;
  tx_count: number;
  size: number;
}

interface BlockData {
  meta: BlockMeta;
  bytes: Uint8Array;
}

// Bucket value labels for the legend
const BUCKET_LABELS: Record<number, string> = {
  1: "< 0.001 BTC",
  2: "0.001 – 0.01 BTC",
  3: "0.01 – 0.1 BTC",
  4: "0.1 – 1 BTC",
  5: "1 – 10 BTC",
  6: "10+ BTC",
};

function VisualizerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { chainTip } = useChainTip();
  const [mounted, setMounted] = useState(false);
  const [blockHeight, setBlockHeight] = useState(800150);
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [selectedTxIndex, setSelectedTxIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [gameMode, setGameMode] = useState<"visualize" | "snake" | "survivors" | "memory">("visualize");

  // Read bitmap from query params on mount
  useEffect(() => {
    setMounted(true);
    const bitmapParam = searchParams.get("bitmap");
    const blockParam = searchParams.get("block");
    const heightParam = bitmapParam || blockParam;
    
    if (heightParam) {
      const height = parseInt(heightParam, 10);
      if (!isNaN(height) && height > 0) {
        setBlockHeight(height);
      }
    }
  }, [searchParams]);

  // Update URL when block height changes
  const updateBlockHeight = useCallback((height: number) => {
    setBlockHeight(height);
    // Update URL without reloading
    const params = new URLSearchParams(searchParams.toString());
    params.set("bitmap", height.toString());
    router.replace(`/play?${params.toString()}`, { scroll: false });
  }, [searchParams, router]);

  // Fetch block data
  useEffect(() => {
    let cancelled = false;

    async function fetchBlock() {
      setLoading(true);
      setSelectedTxIndex(null);

      try {
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

  const handleTxClick = useCallback((index: number) => {
    setSelectedTxIndex(index);
  }, []);

  const handleHeightChange = useCallback((height: number) => {
    updateBlockHeight(height);
  }, [updateBlockHeight]);

  // Block size classifications (must be before effects that use them)
  const isSmallBlock = blockData && blockData.meta.tx_count <= 20 && blockData.meta.tx_count >= 2;
  const isVerySmallBlock = blockData && blockData.meta.tx_count < 10;
  // Helicopter/Snake game works best with 20-40 txs (playable grid, not too long)
  const isHelicopterBlock = blockData && blockData.meta.tx_count >= 20 && blockData.meta.tx_count <= 40;
  // Survivors needs 30+ txs for enough enemy spawn points and arena space
  const isSurvivorsBlock = blockData && blockData.meta.tx_count >= 30;

  // Auto-switch from Helicopter or Survivors to Visualize if block is outside the sweet spot
  useEffect(() => {
    if (gameMode === "snake" && blockData && !isHelicopterBlock) {
      setGameMode("visualize");
    }
    if (gameMode === "survivors" && blockData && !isSurvivorsBlock) {
      setGameMode("visualize");
    }
  }, [blockData, gameMode, isHelicopterBlock, isSurvivorsBlock]);

  if (!mounted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-mono text-2xl text-black bg-primary px-4 py-2 inline-block">
            LOADING...
          </p>
          <br/>
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-primary rounded-sm"
                style={{
                  animation: `bitmapPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  const selectedBucket = selectedTxIndex !== null && blockData
    ? blockData.bytes[selectedTxIndex]
    : null;

  return (
    <>
      {/* Mode Toggle */}
      <div className="absolute top-[var(--header-total)] left-3 md:left-6 z-20 mt-2 md:mt-4">
        <div className="flex flex-wrap gap-1.5 md:gap-2 max-w-[180px] md:max-w-none">
          <button
            onClick={() => setGameMode("visualize")}
            className={`px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-xs uppercase tracking-wider rounded transition-colors ${
              gameMode === "visualize"
                ? "bg-primary text-black font-bold"
                : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
            }`}
          >
            Visualize
          </button>
          {isHelicopterBlock && (
            <button
              onClick={() => setGameMode("snake")}
              className={`px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-xs uppercase tracking-wider rounded transition-colors ${
                gameMode === "snake"
                  ? "bg-primary text-black font-bold"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Helicopter
            </button>
          )}
          {isSurvivorsBlock && (
            <button
              onClick={() => setGameMode("survivors")}
              className={`px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-xs uppercase tracking-wider rounded transition-colors ${
                gameMode === "survivors"
                  ? "bg-primary text-black font-bold"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Survivors
            </button>
          )}
          {isSmallBlock && (
            <button
              onClick={() => setGameMode("memory")}
              className={`px-2 md:px-4 py-1.5 md:py-2 font-mono text-[10px] md:text-xs uppercase tracking-wider rounded transition-colors ${
                gameMode === "memory"
                  ? "bg-primary text-black font-bold"
                  : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              Bit Recall
            </button>
          )}
        </div>
      </div>

      {/* Block Selector (Visualize, Survivors, and Bit Recall modes) */}
      {(gameMode === "visualize" || gameMode === "survivors" || gameMode === "memory") && (
        <BlockSelector
          currentHeight={blockHeight}
          onHeightChange={handleHeightChange}
          txCount={blockData?.meta.tx_count}
          disabled={loading}
          maxHeight={chainTip}
        />
      )}

      {/* Main Content */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-50">
          <div className="text-center space-y-3">
            <p className="font-mono text-2xl text-black bg-primary px-4 py-2 inline-block">
              LOADING BLOCK
            </p>
            <br/>
            <p className="font-mono text-4xl text-black bg-primary px-6 py-2 inline-block">
              {blockHeight.toLocaleString()}
            </p>
            <br/>
            <div className="mt-4 flex gap-1 justify-center">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-5 h-5 bg-primary rounded-sm"
                  style={{
                    animation: `bitmapPulse 1.2s ease-in-out ${i * 0.12}s infinite`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {blockData && !loading && (
        <>
          {gameMode === "snake" ? (
            <HelicopterVisualizer 
              blockBytes={blockData.bytes} 
              blockHeight={blockData.meta.height}
            />
          ) : gameMode === "survivors" ? (
            <SatoshiSurvivors 
              blockBytes={blockData.bytes} 
              blockHeight={blockData.meta.height}
            />
          ) : gameMode === "memory" ? (
            <BlockVisualizer
              key={`memory-${blockData.meta.height}`}
              blockBytes={blockData.bytes}
              gameMode="memory"
              blockHeight={blockData.meta.height}
            />
          ) : (
            <>
              <BlockVisualizer
                key={blockData.meta.height}
                blockBytes={blockData.bytes}
                onTransactionClick={handleTxClick}
              />

              {/* Legend */}
              <div className="absolute right-6 z-10" style={{ top: "calc(var(--header-total) + 4rem)" }}>
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
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
                        <span className="font-mono text-[10px] text-zinc-500">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Transaction Detail */}
              {selectedTxIndex !== null && selectedBucket && (
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
                        onClick={() => setSelectedTxIndex(null)}
                        className="p-1 hover:bg-[rgba(255,255,255,0.07)] rounded transition-colors"
                      >
                        <span className="text-zinc-500 text-sm">✕</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      <BackButton />
    </>
  );
}

// Wrap in Suspense for useSearchParams
export default function VisualizerPage() {
  return (
    <Suspense fallback={
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="font-mono text-2xl text-black bg-primary px-4 py-2 inline-block">
            LOADING...
          </p>
          <br/>
          <div className="flex gap-1 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-4 h-4 bg-primary rounded-sm"
                style={{
                  animation: `bitmapPulse 1.2s ease-in-out ${i * 0.15}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    }>
      <VisualizerContent />
    </Suspense>
  );
}
