import { cn } from "@/lib/utils";
import type { GiveawayStatus } from "@/lib/types";

const STATUS_CONFIG: Record<GiveawayStatus, { label: string; colors: string }> = {
  active: {
    label: "Active",
    colors: "bg-[#0A1A14] text-emerald-400 border-[#163829]",
  },
  winner_selected: {
    label: "Winner Selected",
    colors: "bg-primary/10 text-primary border-primary/30",
  },
  claimed: {
    label: "Claimed",
    colors: "bg-surface-3 text-text-secondary border-border",
  },
  cancelled: {
    label: "Cancelled",
    colors: "bg-red-500/10 text-red-400 border-red-500/20",
  },
};

interface GiveawayStatusBadgeProps {
  status: GiveawayStatus;
  className?: string;
}

export default function GiveawayStatusBadge({ status, className }: GiveawayStatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono font-bold uppercase tracking-[0.16em] border select-none px-2 py-1 text-[9px] tracking-[0.2em]",
        config.colors,
        className,
      )}
    >
      {config.label}
    </span>
  );
}
