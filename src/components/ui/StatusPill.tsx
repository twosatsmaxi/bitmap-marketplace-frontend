import { cn } from "@/lib/utils";
import type { ListingStatus } from "@/lib/types";

const STATUS_CONFIG: Record<
  ListingStatus,
  { label: string; colors: string }
> = {
  listed: {
    label: "Buy Now",
    colors: "bg-[#14532D] text-[#22C55E] border-[#166534]",
  },
  has_offer: {
    label: "Has Offer",
    colors: "bg-[#1F1F1F] text-[#F5F5F5] border-[#333333]",
  },
  unlisted: {
    label: "Unlisted",
    colors: "bg-transparent text-[#8A8A8A] border-transparent",
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
        "px-2 py-1 rounded text-xs font-semibold border",
        config.colors,
        className
      )}
    >
      {config.label}
    </span>
  );
}
