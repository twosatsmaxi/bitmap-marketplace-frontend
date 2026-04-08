"use client";

import { Check, ExternalLink } from "lucide-react";
import Button from "@/components/ui/Button";
import { getMempoolTxUrl } from "@/lib/network-config";

interface TransactionSuccessProps {
  txId: string;
  title: string;
  description?: string;
  onDone: () => void;
}

export default function TransactionSuccess({
  txId,
  title,
  description,
  onDone,
}: TransactionSuccessProps) {
  const explorerUrl = getMempoolTxUrl(txId);

  return (
    <div className="flex flex-col items-center py-4">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/20">
        <Check className="h-6 w-6 text-green-400" />
      </div>
      <p className="font-mono text-sm font-bold text-zinc-200">{title}</p>
      {description && (
        <p className="mt-1 font-mono text-xs text-zinc-500">{description}</p>
      )}

      {/* Tx ID */}
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-zinc-900/50 px-3 py-2 font-mono text-xs text-zinc-400 transition-colors hover:text-primary"
      >
        <span>
          {txId.slice(0, 8)}...{txId.slice(-8)}
        </span>
        <ExternalLink className="h-3 w-3" />
      </a>

      <Button variant="primary" size="lg" className="mt-4 w-full" onClick={onDone}>
        Done
      </Button>
    </div>
  );
}
