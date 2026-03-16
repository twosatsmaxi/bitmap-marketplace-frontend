"use client";

import Link from "next/link";
import type { ActivityEvent } from "@/lib/types";
import { truncateAddr, timeAgo, cn } from "@/lib/utils";
import BitmapCanvas from "@/components/bitmap-art/BitmapCanvas";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { ShoppingCart, Tag, ArrowRightLeft, Handshake, ExternalLink } from "lucide-react";

const EVENT_CONFIG = {
  sale: {
    icon: ShoppingCart,
    color: "text-success",
    bg: "bg-success/15",
    border: "border-success/40",
    label: "Sale",
  },
  listing: {
    icon: Tag,
    color: "text-primary",
    bg: "bg-primary/15",
    border: "border-primary/40",
    label: "Listing",
  },
  transfer: {
    icon: ArrowRightLeft,
    color: "text-zinc-400",
    bg: "bg-zinc-800/50",
    border: "border-zinc-700",
    label: "Transfer",
  },
  offer: {
    icon: Handshake,
    color: "text-[#82C7FF]",
    bg: "bg-[#82C7FF]/15",
    border: "border-[#82C7FF]/40",
    label: "Offer",
  },
};

interface ActivityCardProps {
  event: ActivityEvent;
}

export default function ActivityCard({ event }: ActivityCardProps) {
  const config = EVENT_CONFIG[event.eventType];
  const Icon = config.icon;

  return (
    <div className="group relative border-b border-[rgba(120,72,18,0.35)] bg-[rgba(7,7,9,0.5)] p-4 transition-colors last:border-b-0 hover:bg-[rgba(247,147,26,0.03)] active:bg-[rgba(247,147,26,0.05)]">
      {/* Header: Event Type + Price */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg border",
              config.bg,
              config.border
            )}
          >
            <Icon className={cn("h-4 w-4", config.color)} />
          </div>
          <div>
            <span className={cn("font-mono text-sm font-bold uppercase tracking-[0.12em]", config.color)}>
              {config.label}
            </span>
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-600">
              {timeAgo(event.timestamp)}
            </p>
          </div>
        </div>
        {event.price ? (
          <PriceDisplay price={event.price} size="md" />
        ) : (
          <span className="font-mono text-sm text-zinc-600">—</span>
        )}
      </div>

      {/* Item Details */}
      <Link
        href={`/bitmap/${event.bitmap.id}`}
        className="mb-3 flex items-center gap-3 rounded-lg border border-[rgba(120,72,18,0.35)] bg-black/40 p-3 transition-colors active:bg-black/60"
      >
        <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-md border border-[rgba(120,72,18,0.55)] bg-black">
          <BitmapCanvas
            blockNumber={event.bitmap.blockNumber}
            bitmapType={event.bitmap.bitmapType}
            className="h-full w-full object-contain"
            width={80}
            height={80}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-base font-bold uppercase text-primary">
            {event.bitmap.blockNumber}.bitmap
          </div>
          <div className="font-mono text-xs uppercase tracking-[0.12em] text-zinc-500">
            <span className="capitalize">{event.bitmap.bitmapType}</span>
          </div>
        </div>
      </Link>

      {/* Participants */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 text-xs">
          {event.from ? (
            <>
              <span className="font-mono uppercase tracking-[0.1em] text-zinc-600">From</span>
              <span className="font-mono text-primary">{truncateAddr(event.from)}</span>
            </>
          ) : (
            <span className="font-mono text-zinc-600">—</span>
          )}
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 text-xs">
          {event.to ? (
            <>
              <span className="font-mono uppercase tracking-[0.1em] text-zinc-600">To</span>
              <span className="font-mono text-primary">{truncateAddr(event.to)}</span>
            </>
          ) : (
            <span className="font-mono text-zinc-600">—</span>
          )}
        </div>
      </div>

      {/* Transaction Link */}
      <a
        href={`https://mempool.space/tx/${event.txid}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-zinc-600 opacity-0 transition-all hover:bg-[rgba(247,147,26,0.1)] hover:text-primary group-hover:opacity-100"
        aria-label="View transaction"
      >
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
