import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; colors: string }
> = {
  listed: {
    label: "Buy Now",
    colors: "bg-primary-muted text-primary border-primary/30",
  },
  has_offer: {
    label: "Has Offer",
    colors: "bg-surface-3 text-text-primary border-border",
  },
  unlisted: {
    label: "Unlisted",
    colors: "bg-transparent text-text-secondary border-transparent",
  },
};

export default function StatusPill({
  status,
  className,
}: {
  status: ListingStatus;
  className?: string;
}) {
  if (status === "unlisted") return null;

  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "px-2 py-1 pixel-cut-sm text-[9px] uppercase font-mono tracking-[0.2em] font-bold border",
        config.colors,
        className
      )}
    >
      {config.label}
    </span>
  );
}
