"use client";

import { ExternalLink } from "lucide-react";
import { truncateInscription } from "@/lib/utils";

interface ChildrenGalleryProps {
  childIds: string[];
  count?: number;
}

/**
 * Horizontal scrollable mini gallery for bitmap children inscription IDs.
 * Displays each child as a compact card with preview image linking to ordinals.com.
 */
export default function ChildrenGallery({ childIds, count }: ChildrenGalleryProps) {
  const childCount = count ?? childIds.length;
  const childLabel = `${childCount} ${childCount === 1 ? "child" : "children"}`;

  return (
    <div className="flex flex-col gap-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs md:text-sm tracking-wide text-zinc-500">
          Children
        </span>
        <span className="font-mono text-xs text-zinc-400">{childLabel}</span>
      </div>

      {/* Scrollable Gallery */}
      <div
        className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
        role="list"
        aria-label="Bitmap children"
      >
        {childIds.map((childId, idx) => (
          <ChildCard key={idx} childId={childId} index={idx} />
        ))}
      </div>
    </div>
  );
}

interface ChildCardProps {
  childId: string;
  index: number;
}

function ChildCard({ childId, index }: ChildCardProps) {
  const contentUrl = `https://ordinals.com/content/${childId}`;

  return (
    <a
      href={contentUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex-shrink-0 snap-start w-20 md:w-24"
      role="listitem"
    >
      <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[rgba(120,72,18,0.3)] bg-black/20 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]">
        {/* Preview Container - always shows number placeholder */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-md bg-[rgba(120,72,18,0.15)] overflow-hidden flex items-center justify-center">
          {/* Number badge - always visible */}
          <span className="font-mono text-sm text-primary/70 font-bold">
            {index + 1}
          </span>
        </div>

        {/* Truncated ID */}
        <span className="font-mono text-[9px] md:text-[10px] text-zinc-400 truncate max-w-full text-center leading-tight">
          {truncateInscription(childId)}
        </span>

        {/* External link icon */}
        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-primary/70 transition-colors" />
      </div>
    </a>
  );
}
