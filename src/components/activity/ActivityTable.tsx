import Link from "next/link";
import type { ActivityEvent } from "@/lib/types";
import { formatNumber, truncateAddr, timeAgo, cn } from "@/lib/utils";
import BitmapCanvas from "@/components/bitmap-art/BitmapCanvas";
import PriceDisplay from "@/components/ui/PriceDisplay";
import { ShoppingCart, Tag, ArrowRightLeft, Handshake, ExternalLink } from "lucide-react";

const EVENT_CONFIG = {
  sale: { icon: ShoppingCart, color: "text-success", bg: "bg-success/10", border: "border-success/30" },
  listing: { icon: Tag, color: "text-primary", bg: "bg-primary/10", border: "border-primary/30" },
  transfer: { icon: ArrowRightLeft, color: "text-text-secondary", bg: "bg-surface-3", border: "border-border" },
  offer: { icon: Handshake, color: "text-[#82C7FF]", bg: "bg-[#82C7FF]/10", border: "border-[#82C7FF]/30" },
};

export default function ActivityTable({ events }: { events: ActivityEvent[] }) {
  if (!events || events.length === 0) {
    return (
      <div className="border border-dashed border-[rgba(120,72,18,0.55)] bg-black/35 py-20 text-center">
        <p className="font-mono text-zinc-500">No activity found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[rgba(120,72,18,0.55)] bg-black/30 hide-scrollbar">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="border-b border-[rgba(120,72,18,0.55)] bg-[rgba(247,147,26,0.04)] font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-500">
            <th className="p-4 font-bold">Event</th>
            <th className="p-4 font-bold">Item</th>
            <th className="p-4 font-bold">Price</th>
            <th className="p-4 font-bold">From</th>
            <th className="p-4 font-bold">To</th>
            <th className="p-4 font-bold">Time</th>
          </tr>
        </thead>
        <tbody className="bg-transparent">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.eventType];
            const Icon = config.icon;

            return (
              <tr 
                key={event.id} 
                className="group border-b border-[rgba(120,72,18,0.45)] transition-colors hover:bg-primary/[0.03]"
              >
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", config.bg, config.border)}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <span className="font-mono text-sm font-bold uppercase tracking-[0.12em] text-zinc-300">{event.eventType}</span>
                  </div>
                </td>
                
                <td className="p-4 align-middle">
                  <Link 
                    href={`/bitmap/${event.bitmap.id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden border border-[rgba(120,72,18,0.55)] bg-black">
                      <BitmapCanvas 
                        blockNumber={event.bitmap.blockNumber} 
                        bitmapType={event.bitmap.bitmapType} 
                        className="w-full h-full object-contain"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div>
                      <div className="font-mono text-sm font-bold uppercase text-primary">
                        {formatNumber(event.bitmap.blockNumber)}
                      </div>
                      <div className="font-mono text-[10px] uppercase text-zinc-500">
                        {event.bitmap.bitmapType}
                      </div>
                    </div>
                  </Link>
                </td>
                
                <td className="p-4 align-middle">
                  {event.price ? (
                    <PriceDisplay price={event.price} size="sm" />
                  ) : (
                    <span className="font-mono text-sm text-zinc-500">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle font-mono text-sm">
                  {event.from ? (
                    <span className="text-primary hover:underline cursor-pointer">{truncateAddr(event.from)}</span>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle font-mono text-sm">
                  {event.to ? (
                    <span className="text-primary hover:underline cursor-pointer">{truncateAddr(event.to)}</span>
                  ) : (
                    <span className="text-zinc-500">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle">
                  <a 
                    href={`https://mempool.space/tx/${event.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 font-mono text-sm text-zinc-500 transition-colors hover:text-primary"
                  >
                    {timeAgo(event.timestamp)}
                    <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
