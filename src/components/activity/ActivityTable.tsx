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
      <div className="py-20 text-center border border-dashed border-border bg-surface/30 pixel-cut">
        <p className="text-text-secondary">No activity found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto hide-scrollbar border border-border">
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-surface-2 border-b border-border text-[10px] uppercase tracking-[0.16em] text-text-secondary">
            <th className="p-4 font-semibold">Event</th>
            <th className="p-4 font-semibold">Item</th>
            <th className="p-4 font-semibold">Price</th>
            <th className="p-4 font-semibold">From</th>
            <th className="p-4 font-semibold">To</th>
            <th className="p-4 font-semibold">Time</th>
          </tr>
        </thead>
        <tbody className="bg-bg">
          {events.map((event) => {
            const config = EVENT_CONFIG[event.eventType];
            const Icon = config.icon;

            return (
              <tr 
                key={event.id} 
                className="border-b border-border/50 hover:bg-surface-2/50 transition-colors group"
              >
                <td className="p-4 align-middle">
                  <div className="flex items-center gap-2">
                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center border", config.bg, config.border)}>
                      <Icon className={cn("w-4 h-4", config.color)} />
                    </div>
                    <span className="text-sm font-semibold capitalize tracking-wide">{event.eventType}</span>
                  </div>
                </td>
                
                <td className="p-4 align-middle">
                  <Link 
                    href={`/bitmap/${event.bitmap.id}`}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-10 h-10 border border-border bg-bg pixel-cut overflow-hidden flex-shrink-0 relative">
                      <BitmapCanvas 
                        blockNumber={event.bitmap.blockNumber} 
                        bitmapType={event.bitmap.bitmapType} 
                        className="w-full h-full object-contain"
                        width={80}
                        height={80}
                      />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-sm text-text-primary group-hover:text-primary transition-colors">
                        {formatNumber(event.bitmap.blockNumber)}
                      </div>
                      <div className="text-[10px] font-mono text-text-secondary uppercase">
                        {event.bitmap.bitmapType}
                      </div>
                    </div>
                  </Link>
                </td>
                
                <td className="p-4 align-middle">
                  {event.price ? (
                    <PriceDisplay price={event.price} size="sm" />
                  ) : (
                    <span className="text-text-secondary text-sm">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle font-mono text-sm">
                  {event.from ? (
                    <span className="text-primary hover:underline cursor-pointer">{truncateAddr(event.from)}</span>
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle font-mono text-sm">
                  {event.to ? (
                    <span className="text-primary hover:underline cursor-pointer">{truncateAddr(event.to)}</span>
                  ) : (
                    <span className="text-text-secondary">—</span>
                  )}
                </td>
                
                <td className="p-4 align-middle">
                  <a 
                    href={`https://mempool.space/tx/${event.txid}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-text-secondary hover:text-primary transition-colors"
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
