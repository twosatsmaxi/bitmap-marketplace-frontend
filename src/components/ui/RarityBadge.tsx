import { cn } from "@/lib/utils";
import type { RarityTier } from "@/lib/types";

const RARITY_COLORS: Record<RarityTier, string> = {
  common: "bg-[#1F1F1F] text-[#8A8A8A] border-[#333333]",
  uncommon: "bg-[#1E3A8A] text-[#60A5FA] border-[#2563EB]",
  rare: "bg-[#4C1D95] text-[#A78BFA] border-[#7C3AED]",
  epic: "bg-[#78350F] text-[#F59E0B] border-[#D97706]",
  legendary: "bg-[#7A2E0D] text-[#F7931A] border-[#F59E0B]",
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
        "px-2 py-0.5 rounded text-xs font-medium border uppercase tracking-wider",
        RARITY_COLORS[rarity],
        className
      )}
    >
      {rarity}
    </span>
  );
}
