"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ExternalLink, Loader2, X } from "lucide-react";
import { truncateInscription } from "@/lib/utils";
import CopyButton from "@/components/ui/CopyButton";

interface ChildrenGalleryProps {
  childIds: string[];
  count?: number;
  blockHeight?: number;
}

const CHILDREN_PAGE_SIZE = 25;

// Ref-counted scroll lock — only restores body scroll when all consumers release
let scrollLockCount = 0;
function lockScroll() {
  scrollLockCount++;
  document.body.style.overflow = "hidden";
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = "";
}

export default function ChildrenGallery({ childIds, count, blockHeight }: ChildrenGalleryProps) {
  const childCount = count ?? childIds.length;
  const childLabel = `${childCount} ${childCount === 1 ? "child" : "children"}`;
  const [selectedChild, setSelectedChild] = useState<{ id: string; index: number } | null>(null);
  const [showGrid, setShowGrid] = useState(false);
  const remaining = childCount - childIds.length;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs md:text-sm tracking-wide text-zinc-500">
          Children
        </span>
        <span className="font-mono text-xs text-zinc-400">{childLabel}</span>
      </div>

      <div
        className="flex gap-2 overflow-x-auto pb-2 scroll-smooth snap-x snap-mandatory hide-scrollbar"
        role="list"
        aria-label="Bitmap children"
      >
        {childIds.map((childId, idx) => (
          <InscriptionCard
            key={childId}
            childId={childId}
            index={idx}
            variant="gallery"
            onClick={() => setSelectedChild({ id: childId, index: idx })}
          />
        ))}

        {remaining > 0 && blockHeight && (
          <button
            onClick={() => setShowGrid(true)}
            className="flex-shrink-0 snap-start w-20 md:w-24"
          >
            <div className="flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg border border-dashed border-[rgba(120,72,18,0.4)] bg-black/20 h-full min-h-[88px] md:min-h-[104px] transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]">
              <span className="font-mono text-sm text-primary font-bold">
                +{remaining}
              </span>
              <span className="font-mono text-[9px] md:text-[10px] text-zinc-500 text-center leading-tight">
                Show more
              </span>
            </div>
          </button>
        )}
      </div>

      {selectedChild && (
        <ChildLightbox
          childId={selectedChild.id}
          index={selectedChild.index}
          onClose={() => setSelectedChild(null)}
        />
      )}

      {showGrid && blockHeight && (
        <ChildrenGridModal
          initialChildIds={childIds}
          childCount={childCount}
          blockHeight={blockHeight}
          onClose={() => setShowGrid(false)}
          onChildClick={(id, index) => setSelectedChild({ id, index })}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// InscriptionCard — shared card for inline gallery and grid modal
// ---------------------------------------------------------------------------

function InscriptionCard({
  childId,
  index,
  variant,
  onClick,
}: {
  childId: string;
  index: number;
  variant: "gallery" | "grid";
  onClick: () => void;
}) {
  const isGallery = variant === "gallery";

  return (
    <button
      onClick={onClick}
      className={
        isGallery
          ? "group flex-shrink-0 snap-start w-20 md:w-24 text-left"
          : "group flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[rgba(120,72,18,0.3)] bg-black/20 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]"
      }
      role={isGallery ? "listitem" : undefined}
    >
      <div className={isGallery ? "flex flex-col items-center gap-1.5 p-2 rounded-lg border border-[rgba(120,72,18,0.3)] bg-black/20 transition-all duration-200 hover:border-primary/50 hover:bg-primary/5 active:scale-[0.97]" : undefined}>
        <div
          className={`relative rounded-md bg-black overflow-hidden flex items-center justify-center ${
            isGallery ? "w-12 h-12 md:w-14 md:h-14" : "w-full aspect-square"
          }`}
        >
          <span className={`absolute font-mono font-bold text-primary/70 ${isGallery ? "text-sm" : "text-xs"}`}>
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
        <span className={`font-mono truncate max-w-full text-center leading-tight ${
          isGallery ? "text-[9px] md:text-[10px] text-zinc-400" : "text-[9px] md:text-[10px] text-zinc-500"
        }`}>
          {truncateInscription(childId)}
        </span>
        {isGallery && (
          <ExternalLink className="w-3 h-3 text-zinc-600 group-hover:text-primary/70 transition-colors" />
        )}
      </div>
    </button>
  );
}

// ---------------------------------------------------------------------------
// ChildrenGridModal
// ---------------------------------------------------------------------------

interface ChildrenGridModalProps {
  initialChildIds: string[];
  childCount: number;
  blockHeight: number;
  onClose: () => void;
  onChildClick: (id: string, index: number) => void;
}

function ChildrenGridModal({
  initialChildIds,
  childCount,
  blockHeight,
  onClose,
  onChildClick,
}: ChildrenGridModalProps) {
  const [allChildIds, setAllChildIds] = useState<string[]>(initialChildIds);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(childCount > initialChildIds.length);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsAnimating(true));
    lockScroll();
    return unlockScroll;
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(onClose, 150);
  }, [onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const res = await fetch(
        `/api/bitmap/${blockHeight}/children?page=${nextPage}&limit=${CHILDREN_PAGE_SIZE}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const newIds: string[] = data.children.map((c: { id: string }) => c.id);
      setAllChildIds((prev) => {
        const existing = new Set(prev);
        const unique = newIds.filter((id: string) => !existing.has(id));
        return [...prev, ...unique];
      });
      setPage(nextPage);
      setHasMore(data.has_more);
    } catch {
      // User can retry
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, blockHeight, page]);

  const remaining = childCount - allChildIds.length;

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4">
      <div
        className={`absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity ${isAnimating ? "duration-200 opacity-100" : "duration-150 opacity-0"}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={`relative flex flex-col w-full max-h-[85dvh] md:max-h-[80vh] border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] shadow-2xl transition-all rounded-t-2xl md:rounded-xl md:max-w-lg ${isAnimating ? "duration-200 translate-y-0 md:scale-100 opacity-100" : "duration-150 translate-y-full md:translate-y-0 md:scale-95 opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-label="All children inscriptions"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(120,72,18,0.3)]">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-primary uppercase tracking-wide">
              Children
            </span>
            <span className="font-mono text-xs text-zinc-500">
              {allChildIds.length} / {childCount}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-[rgba(247,147,26,0.1)] hover:text-primary"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] hide-scrollbar">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {allChildIds.map((childId, idx) => (
              <InscriptionCard
                key={childId}
                childId={childId}
                index={idx}
                variant="grid"
                onClick={() => onChildClick(childId, idx)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center pt-4 pb-2">
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex items-center gap-2 rounded-lg border border-dashed border-[rgba(120,72,18,0.4)] bg-black/20 px-5 py-3 min-h-[44px] font-mono text-xs text-zinc-400 transition-all hover:border-primary/50 hover:text-primary active:scale-[0.97] disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span className="text-primary font-bold">+{remaining}</span>
                    <span>Load more</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ChildLightbox
// ---------------------------------------------------------------------------

interface ChildLightboxProps {
  childId: string;
  index: number;
  onClose: () => void;
}

function ChildLightbox({ childId, index, onClose }: ChildLightboxProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setIsAnimating(true));
    lockScroll();
    return unlockScroll;
  }, []);

  const handleClose = useCallback(() => {
    setIsAnimating(false);
    setTimeout(onClose, 150);
  }, [onClose]);

  // Escape only closes the topmost modal (lightbox sits at z-[60])
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        handleClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleClose]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center pb-[15vh] md:pb-[12vh] p-3 md:p-4">
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity ${isAnimating ? "duration-200 opacity-100" : "duration-150 opacity-0"}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        className={`relative flex flex-col items-center gap-4 rounded-xl border border-[rgba(120,72,18,0.55)] bg-[rgba(7,7,9,0.98)] p-4 shadow-2xl transition-all ${isAnimating ? "duration-200 scale-100 opacity-100" : "duration-150 scale-95 opacity-0"}`}
        role="dialog"
        aria-modal="true"
        aria-label={`Child inscription ${index + 1}`}
      >
        <button
          onClick={handleClose}
          className="absolute top-2 right-2 z-10 flex h-10 w-10 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-[rgba(247,147,26,0.1)] hover:text-primary"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative w-[min(320px,calc(100vw-64px))] aspect-square md:w-[min(400px,calc(100vh-200px))] rounded-lg bg-black overflow-hidden">
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

        <div className="flex flex-wrap items-center justify-center gap-2">
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
