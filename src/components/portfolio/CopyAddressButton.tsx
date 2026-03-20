"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyAddressButtonProps {
  address: string;
}

export default function CopyAddressButton({ address }: CopyAddressButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center p-1.5 rounded-md transition-all",
        "border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.035)]",
        "hover:border-primary/40 hover:bg-primary/10",
        "active:scale-95",
        copied && "border-green-500/40 bg-green-500/10"
      )}
      aria-label={copied ? "Address copied" : "Copy address"}
      title={copied ? "Copied!" : "Copy address"}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-zinc-400" />
      )}
    </button>
  );
}
