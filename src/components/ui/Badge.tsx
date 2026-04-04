import { cn } from "@/lib/utils";
import type { ListingStatus, RarityTier } from "@/lib/types";

/* ------------------------------------------------------------------ */
/*  Status variant — mirrors StatusPill                                */
/* ------------------------------------------------------------------ */

const STATUS_CONFIG: Record<ListingStatus, { label: string; colors: string }> = {
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

/* ------------------------------------------------------------------ */
/*  Rarity variant — mirrors RarityBadge                               */
/* ------------------------------------------------------------------ */

const RARITY_COLORS: Record<RarityTier, string> = {
  common: "bg-surface-3 text-text-secondary border-border",
  uncommon: "bg-[#0A1A14] text-success border-[#163829]",
  rare: "bg-[#091424] text-[#60A5FA] border-[#182E4D]",
  epic: "bg-[#1F1508] text-primary border-[#5C3E14]",
  legendary: "bg-primary/10 text-primary border-primary/50 shadow-glow",
};

/* ------------------------------------------------------------------ */
/*  Variant-specific props                                             */
/* ------------------------------------------------------------------ */

interface StatusProps {
  variant: "status";
  status: ListingStatus;
}

interface RarityProps {
  variant: "rarity";
  rarity: RarityTier;
}

interface ChipProps {
  variant: "chip";
  active?: boolean;
}

interface TagProps {
  variant: "tag";
}

interface SoonProps {
  variant: "soon";
}

type VariantProps = StatusProps | RarityProps | ChipProps | TagProps | SoonProps;

type BadgeProps = VariantProps & {
  children?: React.ReactNode;
  className?: string;
};

/* ------------------------------------------------------------------ */
/*  Shared base styles                                                 */
/* ------------------------------------------------------------------ */

const BASE =
  "inline-flex items-center font-mono font-bold uppercase tracking-[0.16em] border select-none";

/* ------------------------------------------------------------------ */
/*  Badge                                                              */
/* ------------------------------------------------------------------ */

export default function Badge(props: BadgeProps) {
  const { variant, className, children } = props;

  /* --- status --- */
  if (variant === "status") {
    const { status } = props;
    const config = STATUS_CONFIG[status];
    const isUnlisted = status === "unlisted";

    return (
      <span
        className={cn(
          BASE,
          "px-2 py-1 pixel-cut-sm text-[9px] tracking-[0.2em]",
          config.colors,
          isUnlisted && "opacity-0 pointer-events-none",
          className,
        )}
        aria-hidden={isUnlisted}
      >
        {children ?? config.label}
      </span>
    );
  }

  /* --- rarity --- */
  if (variant === "rarity") {
    const { rarity } = props;

    return (
      <span
        className={cn(
          BASE,
          "px-2 py-0.5 pixel-cut-sm text-[10px]",
          RARITY_COLORS[rarity],
          className,
        )}
      >
        {children ?? rarity}
      </span>
    );
  }

  /* --- chip (rounded pill for filters / categories) --- */
  if (variant === "chip") {
    const { active } = props;

    return (
      <span
        className={cn(
          BASE,
          "rounded-full px-3 py-1.5 text-[10px] tracking-[0.2em] transition-all",
          active
            ? "border-primary bg-primary text-black"
            : "border-[rgba(247,147,26,0.14)] bg-[rgba(247,147,26,0.06)] text-zinc-400 hover:border-primary/45 hover:text-primary",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  /* --- tag (small inline tag for traits / metadata) --- */
  if (variant === "tag") {
    return (
      <span
        className={cn(
          BASE,
          "rounded-md px-2 py-0.5 text-xs border-transparent bg-[rgba(120,72,18,0.2)] text-primary tracking-normal normal-case font-normal",
          className,
        )}
      >
        {children}
      </span>
    );
  }

  /* --- soon --- */
  return (
    <span
      className={cn(
        BASE,
        "rounded-sm border-transparent bg-[rgba(247,147,26,0.08)] px-1.5 py-0.5 text-[9px] tracking-[0.18em] text-primary",
        className,
      )}
    >
      {children ?? "Soon"}
    </span>
  );
}
