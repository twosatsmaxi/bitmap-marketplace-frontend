"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { HelicopterVisualizer } from "@/components/visualizer/HelicopterVisualizer";
import { SatoshiSurvivors } from "@/components/visualizer/SatoshiSurvivors";
import { BlockVisualizer } from "@/components/visualizer/BlockVisualizer";
import { BlockSelector } from "@/components/mempool/BlockSelector";
import { BackButton } from "@/components/mempool/BackButton";
import { useChainTip } from "@/hooks/useChainTip";
import { Gamepad2, BarChart3, Sparkles, Brain, Zap, Maximize2, Palette } from "lucide-react";
import { useIsMobile } from "@/hooks/useMediaQuery";

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

// Mode configuration with icons
const MODES = {
  visualize: { label: "Visualize", shortLabel: "Viz", icon: BarChart3, color: "#f7931a" },
  snake: { label: "Helicopter", shortLabel: "Heli", icon: Gamepad2, color: "#10b981" },
  survivors: { label: "Survivors", shortLabel: "Surv", icon: Zap, color: "#ef4444" },
  memory: { label: "Bit Recall", shortLabel: "Recall", icon: Brain, color: "#8b5cf6" },
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
  const mobile = useIsMobile();
  const [legendOpen, setLegendOpen] = useState(true);
  // Collapse legend by default on mobile
  useEffect(() => { setLegendOpen(!mobile); }, [mobile]);

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
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-primary/30 bg-primary/5 mb-4">
            <Sparkles className="w-8 h-8 text-primary/60" />
          </div>
          <p className="font-mono text-lg text-primary tracking-wider">INITIALIZING</p>
          <div className="flex gap-1.5 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-8 bg-primary/80"
                style={{
                  animation: `bitmapPulse 1s ease-in-out ${i * 0.1}s infinite`,
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
      {/* Mode Toggle - Top Left */}
      <div className="absolute top-[calc(var(--header-total)+1rem)] left-4 md:left-6 z-20">
        <div className="flex flex-col gap-1.5">
          {(Object.keys(MODES) as Array<keyof typeof MODES>).map((mode) => {
            // Skip modes that aren't available for this block
            if (mode === "snake" && !isHelicopterBlock) return null;
            if (mode === "survivors" && !isSurvivorsBlock) return null;
            if (mode === "memory" && !isSmallBlock) return null;
            
            const modeConfig = MODES[mode];
            const Icon = modeConfig.icon;
            const isActive = gameMode === mode;
            
            return (
              <button
                key={mode}
                onClick={() => setGameMode(mode)}
                className={`
                  group flex items-center gap-2 px-3 py-2 min-h-[44px]
                  font-mono text-[10px] md:text-xs uppercase tracking-wider
                  border transition-all duration-200
                  ${isActive
                    ? "bg-primary border-primary text-black font-bold"
                    : "bg-surface border-border text-text-secondary hover:border-primary/50 hover:text-primary"
                  }
                `}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-black" : "text-text-secondary group-hover:text-primary"}`} />
                <span className="sm:hidden">{modeConfig.shortLabel}</span>
                <span className="hidden sm:inline">{modeConfig.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Block Selector - Center */}
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
          <div className="text-center space-y-4">
            <div className="inline-block">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary/60 mb-2">Loading Block</p>
              <p className="font-heading text-4xl md:text-5xl font-black text-primary tracking-tight">
                {blockHeight.toLocaleString()}
              </p>
              <p className="font-mono text-sm text-text-secondary mt-1">.bitmap</p>
            </div>
            <div className="flex gap-1 justify-center pt-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-10 bg-primary"
                  style={{
                    animation: `bitmapPulse 0.8s ease-in-out ${i * 0.08}s infinite`,
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

              {/* Legend Panel - Collapsible on mobile */}
              <div className="absolute right-4 md:right-6 z-10" style={{ top: "calc(var(--header-total) + 5rem)" }}>
                <button
                  onClick={() => setLegendOpen(!legendOpen)}
                  className="md:hidden mb-1 w-10 h-10 ml-auto flex items-center justify-center panel-frame"
                  aria-label="Toggle legend"
                >
                  <Palette className="w-4 h-4 text-text-secondary" />
                </button>
                {legendOpen && (
                  <div className="panel-frame p-3 md:p-4 min-w-[120px] md:min-w-[140px]">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-1.5 h-1.5 bg-primary" />
                      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-text-secondary">
                        Output Value
                      </span>
                    </div>
                    <div className="space-y-2">
                      {[
                        { label: "10+ BTC", color: "#ffeb3b", bucket: 6 },
                        { label: "1 – 10 BTC", color: "#ffc12a", bucket: 5 },
                        { label: "0.1 – 1 BTC", color: "#f7931a", bucket: 4 },
                        { label: "0.01 – 0.1", color: "#b87326", bucket: 3 },
                        { label: "0.001 – 0.01", color: "#a05a1a", bucket: 2 },
                        { label: "< 0.001", color: "#7e4912", bucket: 1 },
                      ].map(({ label, color, bucket }) => (
                        <div
                          key={label}
                          className="flex items-center gap-2.5 group cursor-pointer"
                          onClick={() => setSelectedTxIndex(bucket - 1)}
                        >
                          <div
                            className="w-3 h-3 border border-white/10 transition-transform group-hover:scale-110"
                            style={{ backgroundColor: color }}
                          />
                          <span className="font-mono text-[10px] text-text-secondary group-hover:text-text-primary transition-colors">
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Transaction Detail Panel - Compact bottom sheet on mobile */}
              {selectedTxIndex !== null && selectedBucket && (
                <div className="absolute bottom-0 md:bottom-6 left-0 right-0 md:left-auto md:right-6 z-10 md:w-72 max-h-[40vh] safe-area-inset-bottom">
                  <div className="panel-frame p-3 md:p-4 rounded-t-lg md:rounded-none">
                    <div className="flex items-center justify-between mb-2 md:mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 border border-primary/50 bg-primary/10 flex items-center justify-center">
                          <span className="font-mono text-[10px] text-primary font-bold">
                            {(selectedBucket % 6) + 1}
                          </span>
                        </div>
                        <div>
                          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-text-secondary">
                            Transaction
                          </div>
                          <div className="font-mono text-lg font-bold text-text-primary leading-none">
                            #{selectedTxIndex + 1}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedTxIndex(null)}
                        className="w-10 h-10 md:w-6 md:h-6 flex items-center justify-center border border-border bg-surface hover:border-primary/50 hover:bg-primary/10 transition-colors"
                        aria-label="Close"
                      >
                        <span className="text-text-secondary text-sm leading-none">×</span>
                      </button>
                    </div>
                    <div className="border-t border-border pt-2 md:pt-3">
                      <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-text-secondary mb-1">
                        Value Bucket
                      </div>
                      <div className="font-mono text-sm font-bold text-primary">
                        {BUCKET_LABELS[selectedBucket] ?? `Bucket ${selectedBucket}`}
                      </div>
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
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 border border-primary/30 bg-primary/5 mb-4">
            <Sparkles className="w-8 h-8 text-primary/60" />
          </div>
          <p className="font-mono text-lg text-primary tracking-wider">INITIALIZING</p>
          <div className="flex gap-1.5 justify-center">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="w-3 h-8 bg-primary/80"
                style={{
                  animation: `bitmapPulse 1s ease-in-out ${i * 0.1}s infinite`,
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
