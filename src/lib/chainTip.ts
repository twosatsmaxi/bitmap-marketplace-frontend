// Server-only chain tip fetcher with module-level caching
let cachedChainTip: number | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 60_000; // 1 minute

export async function getChainTipServer(): Promise<number> {
  const now = Date.now();
  
  // Return cached value if fresh
  if (cachedChainTip !== null && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedChainTip;
  }
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const res = await fetch("https://mempool.space/api/blocks/tip/height", {
      next: { revalidate: 60 },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) throw new Error("non-ok");
    const text = await res.text();
    const n = parseInt(text.trim(), 10);
    cachedChainTip = isNaN(n) ? 893_000 : n;
    lastFetchTime = now;
    return cachedChainTip;
  } catch {
    // Return cached fallback or default
    cachedChainTip = cachedChainTip ?? 893_000;
    lastFetchTime = now;
    return cachedChainTip;
  }
}
