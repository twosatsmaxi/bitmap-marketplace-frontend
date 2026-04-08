"use client";

import { useState, useEffect } from "react";
import { getMempoolApiBase } from "@/lib/network-config";

// Module-level cache for client-side
let cachedChainTip: number | null = null;
let fetchPromise: Promise<number> | null = null;

async function fetchChainTip(): Promise<number> {
  if (cachedChainTip !== null) {
    return cachedChainTip;
  }
  
  if (fetchPromise) {
    return fetchPromise;
  }
  
  fetchPromise = (async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const res = await fetch(`${getMempoolApiBase()}/blocks/tip/height`, {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error("non-ok");
      const text = await res.text();
      const n = parseInt(text.trim(), 10);
      cachedChainTip = isNaN(n) ? 893_000 : n;
      return cachedChainTip;
    } catch {
      cachedChainTip = 893_000;
      return cachedChainTip;
    } finally {
      fetchPromise = null;
    }
  })();
  
  return fetchPromise;
}

export function useChainTip() {
  const [chainTip, setChainTip] = useState<number | null>(cachedChainTip);
  const [isLoading, setIsLoading] = useState(cachedChainTip === null);

  useEffect(() => {
    let cancelled = false;
    
    async function load() {
      const tip = await fetchChainTip();
      if (!cancelled) {
        setChainTip(tip);
        setIsLoading(false);
      }
    }
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, []);

  return { chainTip, isLoading };
}
