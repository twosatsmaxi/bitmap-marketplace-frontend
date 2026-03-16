"use client";

import type { Bitmap } from "@/lib/types";
import { formatNumber, truncateAddr, truncateInscription } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetadataPanelProps {
  bitmap: Bitmap;
}

export default function MetadataPanel({ bitmap }: MetadataPanelProps) {
  const [showAllProps, setShowAllProps] = useState(false);

  const properties = [
    { label: "Inscription ID", value: truncateInscription(bitmap.inscriptionId) },
    { label: "Owner", value: truncateAddr(bitmap.owner) },
    { label: "Block Height", value: `${bitmap.blockNumber}.bitmap` },
    { label: "Genesis Height", value: formatNumber(bitmap.genesisHeight) },
    { label: "Sat Number", value: formatNumber(bitmap.sat) },
    { label: "Minted At", value: new Date(bitmap.mintedAt).toLocaleDateString() },
  ];

  // Show first 3 on mobile by default, all on desktop
  const displayProps = showAllProps ? properties : properties.slice(0, 3);

  return (
    <div className="br-card px-4 py-4 md:px-5 md:py-5">
      <h2 className="mb-3 md:mb-4 border-b border-[rgba(255,255,255,0.08)] pb-2 font-mono text-lg md:text-xl font-bold uppercase text-primary">
        Properties
      </h2>

      <div className="flex flex-col gap-2 md:gap-3">
        {displayProps.map((prop, idx) => (
          <div key={idx} className="flex items-center justify-between text-sm py-1">
            <span className="font-mono text-xs md:text-sm tracking-wide text-zinc-500">
              {prop.label}
            </span>
            <span className="font-mono text-xs md:text-sm text-zinc-300 text-right">
              {prop.value}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: Show More/Less */}
      {properties.length > 3 && (
        <button
          onClick={() => setShowAllProps(!showAllProps)}
          className="md:hidden mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-[rgba(120,72,18,0.45)] bg-black/30 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary active:scale-[0.98]"
        >
          {showAllProps ? "Show Less" : "Show More"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              showAllProps && "rotate-180"
            )}
          />
        </button>
      )}

      <div className="mt-4 md:mt-6 border-t border-[rgba(255,255,255,0.08)] pt-4">
        <h3 className="mb-3 font-mono text-xs md:text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">
          Traits
        </h3>
        <div className="grid grid-cols-2 gap-2 md:gap-3">
          <div className="flex flex-col items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-black/45 p-2.5 md:p-3 text-center">
            <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Pattern
            </span>
            <span className="font-mono text-sm md:text-base font-bold uppercase text-primary capitalize">
              {bitmap.bitmapType}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center rounded-lg border border-[rgba(255,255,255,0.08)] bg-black/45 p-2.5 md:p-3 text-center">
            <span className="mb-1 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
              Rarity
            </span>
            <span className="font-mono text-sm md:text-base font-bold uppercase text-primary capitalize">
              {bitmap.rarity}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
