"use client";

import { useState, useEffect, useCallback } from "react";
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

// Generate mock blocks
function generateMockBlocks(count: number): Bitmap[] {
  const types = ["city", "grid", "mondrian", "punk", "palindrome"] as const;
  const rarities = ["common", "uncommon", "rare", "epic", "legendary"] as const;
  
  return Array.from({ length: count }, (_, i) => ({
    id: `${800000 + i}.bitmap`,
    blockNumber: 800000 + i,
    inscriptionId: `mock-${i}`,
    owner: `bc1q${Math.random().toString(36).substring(2, 15)}`,
    genesisHeight: 800000 + i,
    bitmapType: types[Math.floor(Math.random() * types.length)],
    rarity: rarities[Math.floor(Math.random() * rarities.length)],
    traits: [],
    listingStatus: Math.random() > 0.7 ? "listed" : "unlisted",
    price: Math.random() > 0.7 ? Math.floor(Math.random() * 1000000) : undefined,
    txid: `txid-${i}`,
  }));
}

export default function MempoolPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Bitmap | null>(null);
  const [blocks, setBlocks] = useState<Bitmap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    
    // Fetch blocks from API, fallback to mock data
    async function fetchBlocks() {
      try {
        const res = await fetch('/api/explore/blocks');
        if (res.ok) {
          const data = await res.json();
          if (data.blocks && data.blocks.length > 0) {
            setBlocks(data.blocks.slice(0, 100)); // Limit to 100 for performance
            setLoading(false);
            return;
          }
        }
      } catch (e) {
        console.log('API failed, using mock data');
      }
      
      // Fallback to mock data
      setBlocks(generateMockBlocks(100));
      setLoading(false);
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
    // TODO: Implement zoom via ref
  }, []);

  const handleZoomOut = useCallback(() => {
    // TODO: Implement zoom via ref
  }, []);

  const handleReset = useCallback(() => {
    // TODO: Implement reset via ref
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
