"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  value: string;
  className?: string;
  size?: "sm" | "md";
}

export default function CopyButton({ value, className, size = "sm" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Silent fail - clipboard API not available
    }
  };

  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex items-center justify-center rounded p-1 transition-all",
        "text-zinc-600 hover:text-primary hover:bg-primary/10",
        copied && "text-emerald-500 hover:text-emerald-500 hover:bg-emerald-500/10",
        className
      )}
      aria-label={copied ? "Copied!" : "Copy to clipboard"}
      title={copied ? "Copied!" : "Copy to clipboard"}
    >
      {copied ? (
        <Check className={iconSize} />
      ) : (
        <Copy className={iconSize} />
      )}
    </button>
  );
}
