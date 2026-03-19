/**
 * Block data prefetch service with LRU caching.
 * 
 * Parses length-prefixed binary format from batch endpoint:
 * [4 bytes] block_count (u32 big-endian)
 * For each block:
 *   [4 bytes] height (u32 big-endian)
 *   [4 bytes] data_length (u32 big-endian)
 *   [data_length bytes] encoded_bytes
 */

const RENDER_API = "";
const CACHE_MAX_SIZE = 200;

interface CachedBlockData {
  buffer: ArrayBuffer;
  timestamp: number;
}

// LRU cache keyed by block height
const blockDataCache = new Map<number, CachedBlockData>();

// In-flight prefetch promises to dedupe concurrent requests
const inFlightRequests = new Map<string, Promise<Map<number, ArrayBuffer>>>();

function getCacheKey(heights: number[]): string {
  return heights.slice().sort((a, b) => a - b).join(",");
}

function evictCacheIfNeeded() {
  if (blockDataCache.size <= CACHE_MAX_SIZE) return;
  
  // Sort by timestamp (oldest first) and evict oldest entries
  const entries = Array.from(blockDataCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const toDelete = blockDataCache.size - CACHE_MAX_SIZE;
  for (let i = 0; i < toDelete; i++) {
    blockDataCache.delete(entries[i][0]);
  }
}

/**
 * Parse binary batch response into individual block data.
 * Returns a map of height -> ArrayBuffer for the encoded block data.
 */
function parseBatchBinary(buffer: ArrayBuffer): Map<number, ArrayBuffer> {
  const result = new Map<number, ArrayBuffer>();
  const view = new DataView(buffer);
  let offset = 0;

  // Read block count (u32 big-endian)
  const blockCount = view.getUint32(offset, false);
  offset += 4;

  for (let i = 0; i < blockCount; i++) {
    // Read height (u32 big-endian)
    const height = view.getUint32(offset, false);
    offset += 4;

    // Read data length (u32 big-endian)
    const dataLength = view.getUint32(offset, false);
    offset += 4;

    // Extract block data
    const blockData = buffer.slice(offset, offset + dataLength);
    offset += dataLength;

    result.set(height, blockData);
  }

  return result;
}

/**
 * Prefetch block data for multiple heights in a single batch request.
 * Results are stored in the LRU cache. Missing/unseeded heights are silently omitted.
 */
export async function prefetchBlocks(heights: number[]): Promise<void> {
  if (heights.length === 0) return;

  // Filter out heights already in cache
  const missingHeights = heights.filter(h => !blockDataCache.has(h));
  if (missingHeights.length === 0) return;

  // Limit to 50 per request (backend constraint)
  const batch = missingHeights.slice(0, 50);
  const cacheKey = getCacheKey(batch);

  // Check for in-flight request
  let inFlight = inFlightRequests.get(cacheKey);
  if (!inFlight) {
    inFlight = (async () => {
      try {
        const heightsParam = batch.join(",");
        const url = `${RENDER_API}/api/explore/blocks/batch?heights=${encodeURIComponent(heightsParam)}`;
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const buffer = await res.arrayBuffer();
        const parsed = parseBatchBinary(buffer);
        
        // Store in cache
        const now = Date.now();
        parsed.forEach((data, height) => {
          blockDataCache.set(height, { buffer: data, timestamp: now });
        });
        
        evictCacheIfNeeded();
        
        return parsed;
      } finally {
        inFlightRequests.delete(cacheKey);
      }
    })();
    
    inFlightRequests.set(cacheKey, inFlight);
  }

  await inFlight;
}

/**
 * Get block data from cache if available.
 * Returns undefined if not in cache (caller should fetch individually).
 */
export function getBlockData(height: number): ArrayBuffer | undefined {
  const cached = blockDataCache.get(height);
  if (cached) {
    // Update timestamp for LRU
    cached.timestamp = Date.now();
    return cached.buffer;
  }
  return undefined;
}

/**
 * Clear the block data cache (useful for testing or memory pressure).
 */
export function clearBlockDataCache(): void {
  blockDataCache.clear();
  inFlightRequests.clear();
}

/**
 * Get cache stats for debugging/monitoring.
 */
export function getBlockDataCacheStats(): { size: number; maxSize: number } {
  return { size: blockDataCache.size, maxSize: CACHE_MAX_SIZE };
}
