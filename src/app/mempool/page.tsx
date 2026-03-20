"use client";

import { useState, useEffect } from "react";
import { useMockMempoolData } from "@/components/mempool/hooks/useMockMempoolData";
import { useAdaptiveQuality } from "@/components/mempool/hooks/useAdaptiveQuality";
import { MempoolScene } from "@/components/mempool/MempoolScene";
import { MempoolHUD } from "@/components/mempool/MempoolHUD";
import { BackButton } from "@/components/mempool/BackButton";

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-bg">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto mb-4">
          <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
          <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="font-mono text-sm text-zinc-500 uppercase tracking-[0.2em]">
          Initializing...
        </p>
      </div>
    </div>
  );
}

export default function MempoolPage() {
  const [mounted, setMounted] = useState(false);
  const {
    transactions,
    stats,
    newTransactions,
    clearNewTransactions,
  } = useMockMempoolData();

  const { quality, fps, particleCount } = useAdaptiveQuality();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <LoadingScreen />;
  }

  return (
    <>
      <MempoolScene
        transactions={transactions}
        newTransactions={newTransactions}
        maxParticles={particleCount}
        onClearNew={clearNewTransactions}
      />
      <MempoolHUD stats={stats} fps={fps} quality={quality} />
      <BackButton />
    </>
  );
}
