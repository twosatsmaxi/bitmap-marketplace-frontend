"use client";

import dynamic from "next/dynamic";

const RarityDonut = dynamic(() => import("./RarityDonut"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <p className="font-mono text-xs text-zinc-500 animate-pulse">Loading chart...</p>
    </div>
  ),
});

export default RarityDonut;
