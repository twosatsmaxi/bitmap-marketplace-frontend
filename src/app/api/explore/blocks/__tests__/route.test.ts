// @vitest-environment node
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Helper: dynamically import the route module so we get a fresh module-level
// cache Map for each test group (vi.resetModules() clears the module registry).
// ---------------------------------------------------------------------------
async function importRoute() {
  const mod = await import("../route");
  return mod;
}

function makeRequest(params = "page=1&limit=20") {
  return new NextRequest(
    `http://localhost/api/explore/blocks?${params}`,
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("GET /api/explore/blocks", () => {
  const upstreamPayload = { blocks: [{ id: 1 }], total: 100 };

  beforeEach(() => {
    vi.resetModules();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(upstreamPayload),
      }),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Cache MISS on first request
  // -------------------------------------------------------------------------
  it("returns X-Cache: MISS on first request and fetches upstream", async () => {
    const { GET } = await importRoute();
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(await res.json()).toEqual(upstreamPayload);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Cache HIT on second identical request within TTL
  // -------------------------------------------------------------------------
  it("returns X-Cache: HIT on second identical request within 30s", async () => {
    vi.useFakeTimers();

    const { GET } = await importRoute();
    // First call -- populates cache
    await GET(makeRequest());
    // Second call -- should come from cache
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("HIT");
    expect(await res.json()).toEqual(upstreamPayload);
    // fetch should have been called only once (for the first request)
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Cache TTL expiry
  // -------------------------------------------------------------------------
  it("re-fetches upstream after 30s TTL expires", async () => {
    vi.useFakeTimers();

    const { GET } = await importRoute();
    await GET(makeRequest());
    expect(fetch).toHaveBeenCalledTimes(1);

    // Advance past the 30s TTL
    vi.advanceTimersByTime(31_000);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("X-Cache")).toBe("MISS");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // Error caching (e.g. 429)
  // -------------------------------------------------------------------------
  it("caches error responses for 10s (ERROR_CACHE_TTL_MS)", async () => {
    vi.useFakeTimers();

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        json: () => Promise.resolve({ error: "rate limited" }),
      }),
    );

    const { GET } = await importRoute();

    // First call -- upstream returns 429
    const res1 = await GET(makeRequest());
    expect(res1.status).toBe(429);
    expect(fetch).toHaveBeenCalledTimes(1);

    // Second call within 10s -- served from cache
    vi.advanceTimersByTime(5_000);
    const res2 = await GET(makeRequest());
    expect(res2.status).toBe(429);
    expect(res2.headers.get("X-Cache")).toBe("HIT");
    expect(fetch).toHaveBeenCalledTimes(1);

    // After 10s the error cache expires
    vi.advanceTimersByTime(6_000); // total 11s
    await GET(makeRequest());
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  // -------------------------------------------------------------------------
  // Upstream unreachable (fetch throws)
  // -------------------------------------------------------------------------
  it("returns 502 with 'Upstream unreachable' when fetch throws", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    const { GET } = await importRoute();
    const res = await GET(makeRequest());

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upstream unreachable" });
  });

  // -------------------------------------------------------------------------
  // Different search params = different cache keys
  // -------------------------------------------------------------------------
  it("treats different search params as separate cache entries", async () => {
    const { GET } = await importRoute();

    await GET(makeRequest("page=1&limit=20"));
    await GET(makeRequest("page=2&limit=20"));

    // Both should trigger upstream calls (separate cache keys)
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
