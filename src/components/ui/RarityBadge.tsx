import { cn } from "@/lib/utils";
import type { RarityTier } from "@/lib/types";

const RARITY_COLORS: Record<RarityTier, string> = {
  common: "bg-surface-3 text-text-secondary border-border",
  uncommon: "bg-[#0A1A14] text-success border-[#163829]",
  rare: "bg-[#091424] text-[#60A5FA] border-[#182E4D]",
  epic: "bg-[#1F1508] text-primary border-[#5C3E14]",
  legendary: "bg-primary/10 text-primary border-primary/50 shadow-glow",
};

export default function RarityBadge({
  rarity,
  className,
}: {
  rarity: RarityTier;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "px-2 py-0.5 pixel-cut-sm text-[10px] font-mono font-bold uppercase tracking-[0.16em] border",
        RARITY_COLORS[rarity],
        className
      )}
    >
      {rarity}
    </span>
  );
}
