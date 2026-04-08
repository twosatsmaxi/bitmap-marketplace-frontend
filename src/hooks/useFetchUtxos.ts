"use client";

import useSWR from "swr";
import { fetchUtxos } from "@/lib/marketplace-api";
import type { MempoolUtxo } from "@/lib/marketplace-types";

/**
 * Fetches and caches confirmed UTXOs for an address from mempool.space.
 * Network-aware — uses the URL from network-config.
 */
export function useFetchUtxos(address: string | null) {
  const { data, error, isLoading, mutate } = useSWR<MempoolUtxo[]>(
    address ? `utxos:${address}` : null,
    () => fetchUtxos(address!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 10_000,
    },
  );

  return {
    utxos: data ?? [],
    isLoading,
    error: error as Error | undefined,
    refresh: () => mutate(),
  };
}
