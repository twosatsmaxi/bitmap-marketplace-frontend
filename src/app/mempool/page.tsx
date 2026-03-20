"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { BlockWorld } from "@/components/mempool/BlockWorld";
import { WorldHUD } from "@/components/mempool/WorldHUD";
import { BackButton } from "@/components/mempool/BackButton";
import type { Bitmap } from "@/lib/types";

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-mono text-sm text-zinc-500 uppercase tracking-[0.2em]">
          Building World...
        </p>
      </div>
    </div>
  );
}

export default function MempoolPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Bitmap | null>(null);
  const [blocks, setBlocks] = useState<Bitmap[]>([]);
  const [loading, setLoading] = useState(true);
  const controlsRef = useRef<any>(null);

  useEffect(() => {
    setMounted(true);
    
    // Fetch blocks from API
    async function fetchBlocks() {
      try {
        const res = await fetch('/api/explore/blocks');
        if (res.ok) {
          const data = await res.json();
          setBlocks(data.blocks || []);
        }
      } catch (e) {
        console.error('Failed to fetch blocks:', e);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBlocks();
  }, []);

  const handleBlockClick = useCallback((block: Bitmap) => {
    setSelectedBlock(block);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedBlock(null);
  }, []);

  const handleZoomIn = useCallback(() => {
    // This will be implemented via the BlockWorld ref
  }, []);

  const handleZoomOut = useCallback(() => {
    // This will be implemented via the BlockWorld ref
  }, []);

  const handleReset = useCallback(() => {
    // This will be implemented via the BlockWorld ref
  }, []);

  if (!mounted || loading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <BlockWorld 
        blocks={blocks}
        onBlockClick={handleBlockClick}
        selectedBlock={selectedBlock?.id}
      />
      <WorldHUD
        selectedBlock={selectedBlock}
        onClose={handleClose}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleReset}
        blockCount={blocks.length}
      />
      <BackButton />
    </>
  );
}
