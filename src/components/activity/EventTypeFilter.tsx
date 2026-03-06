"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { EventType } from "@/lib/types";

interface EventTypeFilterProps {
  currentType: string;
}

const EVENT_TYPES: { id: "all" | EventType; label: string }[] = [
  { id: "all", label: "All Activity" },
  { id: "sale", label: "Sales" },
  { id: "listing", label: "Listings" },
  { id: "offer", label: "Offers" },
  { id: "transfer", label: "Transfers" },
];

export default function EventTypeFilter({ currentType }: EventTypeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {EVENT_TYPES.map((type) => {
        const isActive = currentType === type.id;
        return (
          <Link
            key={type.id}
            href={`/activity${type.id === "all" ? "" : `?type=${type.id}`}`}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold uppercase tracking-wide border transition-all pixel-cut",
              isActive
                ? "bg-primary text-bg border-primary shadow-glow"
                : "bg-surface-2 text-text-secondary border-border hover:border-primary/50 hover:text-text-primary"
            )}
          >
            {type.label}
          </Link>
        );
      })}
    </div>
  );
}
