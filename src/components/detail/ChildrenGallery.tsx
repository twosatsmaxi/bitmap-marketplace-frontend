"use client";

import { useState, useEffect, useCallback } from "react";
import { ExternalLink, X } from "lucide-react";
import { truncateInscription } from "@/lib/utils";
import CopyButton from "@/components/ui/CopyButton";

interface ChildrenGalleryProps {
  childIds: string[];
  count?: number;
}

export default function ChildrenGallery({ childIds, count }: ChildrenGalleryProps) {
  const childCount = count ?? childIds.length;
  const childLabel = `${childCount} ${childCount === 1 ? "child" : "children"}`;
  const [selectedChild, setSelectedChild] = useState<{ id: string; index: number } | null>(null);

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
          <ChildCard
            key={idx}
            childId={childId}
            index={idx}
            onClick={() => setSelectedChild({ id: childId, index: idx })}
          />
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedChild && (
        <ChildLightbox
          childId={selectedChild.id}
          index={selectedChild.index}
          onClose={() => setSelectedChild(null)}
        />
      )}
    </div>
  );
}

interface ChildCardProps {
  childId: string;
  index: number;
  onClick: () => void;
}

function ChildCard({ childId, index, onClick }: ChildCardProps) {
  return (
    <button
      onClick={onClick}
      className="group flex-shrink-0 snap-start w-20 md:w-24 text-left"
      role="listitem"
    >
      <div className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[rgba(120,72,18,0.3)] bg-black/20 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]">
        {/* Preview Container - iframe with number fallback */}
        <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-md bg-black overflow-hidden flex items-center justify-center">
          <span className="absolute font-mono text-sm text-primary/70 font-bold">
            {index + 1}
          </span>
          <iframe
            src={`https://ordinals.com/preview/${childId}`}
            sandbox="allow-scripts"
            loading="lazy"
            scrolling="no"
            className="absolute inset-0 w-full h-full pointer-events-none"
            title={`Child inscription ${index + 1}`}
          />
        </div>

        {/* Truncated ID */}
        <span className="font-mono text-[9px] md:text-[10px] text-zinc-400 truncate max-w-full text-center leading-tight">
          {truncateInscription(childId)}
        </span>

        {/* External link icon */}
        <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-primary/70 transition-colors" />
      </div>
    </button>
  );
}

interface ChildLightboxProps {
  childId: string;
  index: number;
  onClose: () => void;
}

function ChildLightbox({ childId, index, onClose }: ChildLightboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsAnimating(true));
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-200 ${isAnimating ? "opacity-100" : "opacity-0"}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        className={`relative flex flex-col items-center gap-4 rounded-xl border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] p-4 shadow-2xl transition-all duration-200 ${isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Child inscription ${index + 1}`}
      >
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-[rgba(247,147,26,0.1)] hover:text-primary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Large iframe preview */}
        <div className="relative w-[320px] h-[320px] md:w-[400px] md:h-[400px] rounded-lg bg-black overflow-hidden">
          <span className="absolute inset-0 flex items-center justify-center font-mono text-2xl text-primary/30 font-bold">
            {index + 1}
          </span>
          <iframe
            src={`https://ordinals.com/preview/${childId}`}
            sandbox="allow-scripts"
            className="absolute inset-0 w-full h-full"
            title={`Child inscription ${index + 1} preview`}
          />
        </div>

        {/* Inscription ID + actions */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-zinc-400">
            {truncateInscription(childId)}
          </span>
          <CopyButton value={childId} />
          <a
            href={`https://ordinals.com/preview/${childId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 rounded px-2 py-1 text-xs font-mono text-zinc-400 transition-colors hover:text-primary hover:bg-primary/10"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
        </div>
      </div>
    </div>
  );
}
