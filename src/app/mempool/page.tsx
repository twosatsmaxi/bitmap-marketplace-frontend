"use client";

import { useState, useEffect, useCallback } from "react";
import { BlockVisualizer } from "@/components/mempool/BlockVisualizer";
import { BlockSelector } from "@/components/mempool/BlockSelector";
import { BackButton } from "@/components/mempool/BackButton";

interface Transaction {
  txid: string;
  size: number;
  fee: number;
  inputs: number;
  outputs: number;
}

interface BlockData {
  height: number;
  hash: string;
  timestamp: number;
  size: number;
  tx_count: number;
  transactions: Transaction[];
}

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-mono text-sm text-zinc-500 uppercase tracking-[0.2em]">
          Loading Block...
        </p>
      </div>
    </div>
  );
}

export default function MempoolPage() {
  const [mounted, setMounted] = useState(false);
  const [blockHeight, setBlockHeight] = useState(800150);
  const [blockData, setBlockData] = useState<BlockData | null>(null);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch block data when height changes
  useEffect(() => {
    async function fetchBlock() {
      setLoading(true);
      setSelectedTx(null);
      
      try {
        const res = await fetch(`/api/explore/blocks/${blockHeight}`);
        const text = await res.text();
        
        if (!text || text.trim() === '') {
          throw new Error('Empty response');
        }
        
        const data = JSON.parse(text);
        
        if (res.ok && data.transactions) {
          setBlockData(data);
        } else {
          throw new Error(data.error || 'Invalid response');
        }
      } catch (e) {
        console.error("Failed to fetch block:", e);
        // Generate mock data on error
        const mockBlock = {
          height: blockHeight,
          hash: `0000000000000000000${Math.random().toString(36).substring(2, 20)}`,
          timestamp: Date.now() / 1000 - Math.random() * 3600,
          size: 187428,
          tx_count: 200,
          transactions: Array.from({ length: 200 }, (_, i) => ({
            txid: `${blockHeight}_${i}_${Math.random().toString(36).substring(2, 15)}`,
            size: 150 + Math.floor(Math.random() * 2000),
            fee: Math.floor(Math.random() * 100000),
            inputs: 1 + Math.floor(Math.random() * 5),
            outputs: 1 + Math.floor(Math.random() * 3),
          })),
        };
        setBlockData(mockBlock);
      } finally {
        setLoading(false);
      }
    }

    fetchBlock();
  }, [blockHeight]);

  const handleHeightChange = useCallback((height: number) => {
    setBlockHeight(height);
  }, []);

  const handleTxClick = useCallback((tx: Transaction) => {
    setSelectedTx(tx);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedTx(null);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <>
      {/* Block Selector */}
      <BlockSelector 
        currentHeight={blockHeight} 
        onHeightChange={handleHeightChange} 
      />

      {/* Block Info */}
      {blockData && (
        <div className="absolute top-6 left-72 z-10">
          <div className="bg-black/50 backdrop-blur-sm rounded-lg p-3 border border-white/10">
            <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-500">
              Transactions
            </div>
            <div className="font-mono text-lg font-bold text-white">
              {blockData.tx_count.toLocaleString()}
            </div>
            <div className="font-mono text-[10px] text-zinc-600">
              {(blockData.size / 1000000).toFixed(2)} MB
            </div>
          </div>
        </div>
      )}

      {/* 3D Visualizer */}
      {blockData && (
        <BlockVisualizer 
          blockData={blockData}
          onTransactionClick={handleTxClick}
        />
      )}
      
      {/* Transaction Detail Panel */}
      {selectedTx && (
        <div className="absolute bottom-6 right-6 z-10 w-80">
          <div className="bg-black/80 backdrop-blur-md rounded-xl border border-primary/30 p-5 shadow-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="font-mono text-xs text-zinc-500 uppercase tracking-wider mb-1">
                  Transaction
                </h2>
                <p className="font-mono text-sm font-bold text-white truncate max-w-[200px]">
                  {selectedTx.txid.substring(0, 16)}...
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <span className="text-zinc-400 text-lg">×</span>
              </button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Size</span>
                <span className="font-mono text-xs text-zinc-300">
                  {selectedTx.size.toLocaleString()} bytes
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Fee</span>
                <span className="font-mono text-xs text-primary">
                  {(selectedTx.fee / 100000000).toFixed(8)} BTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Inputs</span>
                <span className="font-mono text-xs text-zinc-300">
                  {selectedTx.inputs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Outputs</span>
                <span className="font-mono text-xs text-zinc-300">
                  {selectedTx.outputs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-xs text-zinc-500">Fee Rate</span>
                <span className="font-mono text-xs text-zinc-300">
                  {(selectedTx.fee / selectedTx.size).toFixed(1)} sat/vB
                </span>
              </div>
            </div>

            <a
              href={`https://mempool.space/tx/${selectedTx.txid}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded-lg font-mono text-xs font-bold uppercase tracking-[0.15em] text-primary transition-colors"
            >
              View on Mempool
              <span className="text-xs">↗</span>
            </a>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute top-20 right-6 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-3">
            Fee Rate (sat/vB)
          </h3>
          <div className="space-y-2">
            {[
              { label: "500+", color: "#ffeb3b" },
              { label: "100-500", color: "#ffc12a" },
              { label: "50-100", color: "#f7931a" },
              { label: "10-50", color: "#b87326" },
              { label: "<10", color: "#7e4912" },
            ].map(({ label, color }) => (
              <div key={label} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded"
                  style={{ backgroundColor: color }}
                />
                <span className="font-mono text-[10px] text-zinc-400">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-6 left-6 z-10">
        <div className="bg-black/50 backdrop-blur-sm rounded-lg p-4 border border-white/10">
          <h3 className="font-mono text-xs font-bold uppercase tracking-[0.15em] text-zinc-400 mb-2">
            Controls
          </h3>
          <ul className="font-mono text-xs text-zinc-500 space-y-1">
            <li>• Left click + drag to rotate</li>
            <li>• Right click + drag to pan</li>
            <li>• Scroll to zoom</li>
            <li>• Click cube for details</li>
          </ul>
        </div>
      </div>

      <BackButton />
    </>
  );
}
