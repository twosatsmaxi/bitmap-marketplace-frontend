"use client";

import { useState, useCallback } from "react";
import { cancelListing } from "@/lib/marketplace-api";
import { useToast } from "./useToast";

export function useCancelListing() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const cancel = useCallback(
    async (listingId: string) => {
      setIsLoading(true);
      setError(null);

      try {
        await cancelListing(listingId);
        toast({ title: "Listing cancelled", variant: "success" });
        return true;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to cancel listing";
        setError(message);
        toast({ title: message, variant: "error" });
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [toast],
  );

  return { cancel, isLoading, error };
}
