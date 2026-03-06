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
              "rounded-md border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.18em] transition-colors",
              isActive
                ? "border-primary bg-primary text-black"
                : "border-[rgba(120,72,18,0.55)] bg-[rgba(10,10,12,0.92)] text-zinc-500 hover:border-primary/45 hover:text-primary"
            )}
          >
            {type.label}
          </Link>
        );
      })}
    </div>
  );
}
