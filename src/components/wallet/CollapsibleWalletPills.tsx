"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronUp, Search, X } from "lucide-react";

const COLLAPSE_THRESHOLD = 6;

interface CollapsibleWalletPillsProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getSearchText: (item: T) => string;
  renderItem: (item: T) => React.ReactNode;
  footer?: React.ReactNode;
  threshold?: number;
}

export default function CollapsibleWalletPills<T>({
  items,
  getKey,
  getSearchText,
  renderItem,
  footer,
  threshold = COLLAPSE_THRESHOLD,
}: CollapsibleWalletPillsProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const [hasScrollMore, setHasScrollMore] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLarge = items.length > threshold;
  const hiddenCount = items.length - threshold;

  const filtered =
    search
      ? items.filter((item) =>
          getSearchText(item).toLowerCase().includes(search.toLowerCase())
        )
      : items;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setHasScrollMore(el.scrollTop + el.clientHeight < el.scrollHeight - 4);
  };

  useEffect(() => {
    if (expanded) {
      setHasScrollMore(true);
      setTimeout(checkScroll, 50);
    }
  }, [expanded, filtered.length]);

  const visible = isLarge && !expanded ? items.slice(0, threshold) : null;

  return (
    <div className="flex flex-col gap-2">
      {/* Collapsed row */}
      {(!isLarge || !expanded) && (
        <div className="flex flex-wrap items-center gap-2">
          {(visible ?? items).map((item) => (
            <div key={getKey(item)}>{renderItem(item)}</div>
          ))}

          {isLarge && !expanded && (
            <button
              type="button"
              onClick={() => {
                setExpanded(true);
                setTimeout(() => inputRef.current?.focus(), 50);
              }}
              className="flex items-center gap-1 border border-dashed border-[rgba(120,72,18,0.35)] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-[rgba(120,72,18,0.55)] hover:text-primary"
            >
              <ChevronDown className="h-3 w-3" />
              +{hiddenCount} more
            </button>
          )}

          {footer}
        </div>
      )}

      {/* Expanded panel */}
      {isLarge && expanded && (
        <div className="flex flex-col gap-2">
          {/* Search + collapse row */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-zinc-600 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${items.length} wallets…`}
                className="w-full border border-[rgba(120,72,18,0.4)] bg-transparent pl-7 pr-7 py-1.5 font-mono text-[10px] text-zinc-300 placeholder:text-zinc-600 outline-none focus:border-primary/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setExpanded(false);
                setSearch("");
              }}
              className="flex items-center gap-1 border border-dashed border-[rgba(120,72,18,0.35)] px-2.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-[rgba(120,72,18,0.55)] hover:text-primary"
            >
              <ChevronUp className="h-3 w-3" />
              Collapse
            </button>
            {footer && <div className="ml-auto">{footer}</div>}
          </div>

          {/* Scrollable chip area */}
          <div className="relative">
            <div ref={scrollRef} onScroll={checkScroll} className="max-h-48 overflow-y-auto flex flex-wrap content-start gap-2 pr-1">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <div key={getKey(item)}>{renderItem(item)}</div>
                ))
              ) : (
                <span className="font-mono text-[10px] text-zinc-600">No wallets match.</span>
              )}
            </div>
            {/* Gradient fade — only shown when more content is below */}
            {filtered.length > 0 && hasScrollMore && (
              <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[rgba(7,7,9,0.96)] to-transparent" />
            )}
          </div>

          {/* Result count when searching */}
          {search && (
            <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
              {filtered.length} of {items.length} wallets
            </p>
          )}
        </div>
      )}
    </div>
  );
}
