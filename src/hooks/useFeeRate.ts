"use client";

import useSWR from "swr";
import { fetchRecommendedFees } from "@/lib/marketplace-api";
import type { RecommendedFees } from "@/lib/marketplace-types";

/**
 * Fetches recommended fee rates from mempool.space.
 * Refreshes every 30 seconds. Network-aware.
 */
export function useFeeRate() {
  const { data, isLoading, error } = useSWR<RecommendedFees>(
    "fee-rates",
    fetchRecommendedFees,
    {
      refreshInterval: 30_000,
      revalidateOnFocus: false,
    },
  );

  return {
    fastest: data?.fastestFee ?? 0,
    halfHour: data?.halfHourFee ?? 0,
    hour: data?.hourFee ?? 0,
    economy: data?.economyFee ?? 0,
    isLoading,
    error: error as Error | undefined,
  };
}
