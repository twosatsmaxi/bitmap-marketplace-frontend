"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useMockMempoolData } from "@/components/mempool/hooks/useMockMempoolData";
import { useAdaptiveQuality } from "@/components/mempool/hooks/useAdaptiveQuality";
import { MempoolHUD } from "@/components/mempool/MempoolHUD";
import { BackButton } from "@/components/mempool/BackButton";

// Dynamically import Three.js scene to avoid SSR issues
const MempoolScene = dynamic(
  () =>
    import("@/components/mempool/MempoolScene").then((mod) => mod.MempoolScene),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

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

function MempoolContent() {
  const {
    transactions,
    stats,
    newTransactions,
    clearNewTransactions,
  } = useMockMempoolData();

  const { quality, fps, particleCount } = useAdaptiveQuality();

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

export default function MempoolPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <MempoolContent />
    </Suspense>
  );
}
