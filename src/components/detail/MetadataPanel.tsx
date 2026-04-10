"use client";

import type { Bitmap } from "@/lib/types";
import { formatNumber, truncateInscription } from "@/lib/utils";
import { useState } from "react";
import { ChevronDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import CopyButton from "@/components/ui/CopyButton";
import OwnerLink from "./OwnerLink";
import ChildrenGallery from "./ChildrenGallery";

interface MetadataPanelProps {
  bitmap: Bitmap;
}

export default function MetadataPanel({ bitmap }: MetadataPanelProps) {
  const [showAllProps, setShowAllProps] = useState(false);
  const [showAllTraits, setShowAllTraits] = useState(false);

  // Format traits for display - convert snake_case to Title Case
  const formatTrait = (trait: string): string => {
    return trait
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Traits section component
  const TraitsSection = () => {
    if (!bitmap.traits || bitmap.traits.length === 0) return null;
    
    const traits = bitmap.traits.map(formatTrait);
    const hasMore = traits.length > 2;
    const visibleTraits = showAllTraits ? traits : traits.slice(0, 2);
    const hiddenCount = traits.length - 2;

    return (
      <div className="flex items-start justify-between text-sm py-1">
        <span className="font-mono text-xs md:text-sm tracking-wide text-zinc-500 pt-0.5">
          Traits
        </span>
        <div className="flex flex-wrap items-center gap-1.5 justify-end max-w-[60%]">
          {visibleTraits.map((trait, idx) => (
            <span
              key={idx}
              className="inline-flex items-center rounded-md bg-[rgba(120,72,18,0.2)] px-2 py-0.5 font-mono text-xs text-primary"
            >
              {trait}
            </span>
          ))}
          {hasMore && !showAllTraits && (
            <button
              onClick={() => setShowAllTraits(true)}
              className="inline-flex items-center gap-0.5 rounded-md bg-[rgba(255,255,255,0.1)] px-2 py-0.5 font-mono text-xs text-zinc-400 transition-colors hover:text-zinc-200 hover:bg-[rgba(255,255,255,0.15)]"
            >
              <Plus className="h-3 w-3" />
              {hiddenCount}
            </button>
          )}
        </div>
      </div>
    );
  };


  // Key properties always visible
  const keyProperties = [
    { 
      label: "Block Height", 
      value: `${bitmap.blockNumber}.bitmap`,
      rawValue: `${bitmap.blockNumber}.bitmap`,
      copyable: true 
    },
  ];

  // Extended properties (collapsible on mobile)
  const extendedProperties = [
    { 
      label: "Inscription ID", 
      value: truncateInscription(bitmap.inscriptionId),
      rawValue: bitmap.inscriptionId,
      copyable: true 
    },
    { 
      label: "Owner", 
      value: bitmap.owner ? (
        <OwnerLink address={bitmap.owner} />
      ) : null,
      rawValue: bitmap.owner,
      copyable: true 
    },
    { 
      label: "Genesis Height", 
      value: formatNumber(bitmap.genesisHeight),
      rawValue: String(bitmap.genesisHeight),
      copyable: false 
    },
  ];

  const allProperties = [...keyProperties, ...extendedProperties];
  const displayProps = showAllProps ? allProperties : keyProperties;

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
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs md:text-sm text-zinc-300 text-right">
                {prop.value}
              </span>
              {prop.copyable && prop.rawValue && (
                <CopyButton value={prop.rawValue} size="sm" />
              )}
            </div>
          </div>
        ))}
        {bitmap.traits && bitmap.traits.length > 0 && <TraitsSection />}
        {bitmap.children && bitmap.children.length > 0 && (
          <div className="pt-1">
            <ChildrenGallery childIds={bitmap.children} count={bitmap.childrenCount} blockHeight={bitmap.blockNumber} />
          </div>
        )}
      </div>

      {/* Mobile: Show More/Less for extended properties */}
      {extendedProperties.length > 0 && (
        <button
          onClick={() => setShowAllProps(!showAllProps)}
          className="md:hidden mt-3 flex w-full items-center justify-center gap-1 rounded-md border border-[rgba(120,72,18,0.45)] bg-black/30 py-2 font-mono text-xs uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:text-primary active:scale-[0.98]"
          aria-label={showAllProps ? "Show less properties" : "Show more properties"}
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

      {/* Desktop: Always show extended properties */}
      <div className="hidden md:block mt-4 border-t border-[rgba(255,255,255,0.08)] pt-4">
        <div className="flex flex-col gap-2 md:gap-3">
          {extendedProperties.map((prop, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm py-1">
              <span className="font-mono text-xs md:text-sm tracking-wide text-zinc-500">
                {prop.label}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs md:text-sm text-zinc-300 text-right">
                  {prop.value}
                </span>
                {prop.copyable && prop.rawValue && (
                  <CopyButton value={prop.rawValue} size="sm" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
