"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { truncateAddr } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface OwnerLinkProps {
  address: string;
}

export default function OwnerLink({ address }: OwnerLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => {
        startTransition(() => {
          router.push(`/portfolio/${address}`);
        });
      }}
      className={cn(
        "inline-flex items-center gap-1.5 font-mono text-xs md:text-sm text-primary hover:underline transition-opacity",
        isPending && "opacity-60"
      )}
    >
      {truncateAddr(address)}
      {isPending && (
        <Loader2 className="h-3 w-3 animate-spin text-primary" />
      )}
    </button>
  );
}
