// @vitest-environment node
import { NextRequest } from "next/server";
import { GET } from "../route";

function makeRequest(params = "") {
  return new NextRequest(
    `http://localhost/api/auth/challenge${params ? `?${params}` : ""}`,
  );
}

describe("GET /api/auth/challenge", () => {
  const challengePayload = { challenge: "sign-this-message-abc123" };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(challengePayload),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Missing address parameter
  // -------------------------------------------------------------------------
  it("returns 400 when address query param is missing", async () => {
    const res = await GET(makeRequest());

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Validation failed");
    expect(fetch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Valid address -- forwards to upstream
  // -------------------------------------------------------------------------
  it("forwards request to upstream and returns challenge data", async () => {
    const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
    const res = await GET(makeRequest(`address=${address}`));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(challengePayload);
    expect(fetch).toHaveBeenCalledTimes(1);

    const calledUrl = (fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(calledUrl).toContain(
      `/api/auth/challenge?address=${encodeURIComponent(address)}`,
    );
  });

  // -------------------------------------------------------------------------
  // Upstream returns non-200
  // -------------------------------------------------------------------------
  it("passes through upstream status code on non-200 response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ error: "not found" }),
      }),
    );

    const res = await GET(makeRequest("address=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"));

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "not found" });
  });

  // -------------------------------------------------------------------------
  // Upstream unreachable
  // -------------------------------------------------------------------------
  it("returns 502 when upstream is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    const res = await GET(makeRequest("address=bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upstream unreachable" });
  });
});
