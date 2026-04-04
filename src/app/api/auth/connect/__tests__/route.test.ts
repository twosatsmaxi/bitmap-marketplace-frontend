// @vitest-environment node
import { NextRequest } from "next/server";
import { POST } from "../route";

function makeRequest(
  body: Record<string, unknown>,
  headers: Record<string, string> = {},
) {
  return new NextRequest("http://localhost/api/auth/connect", {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
  });
}

describe("POST /api/auth/connect", () => {
  const connectPayload = { token: "jwt-abc-123", profile: { id: "user-1" } };

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(connectPayload),
        headers: new Headers(),
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  // -------------------------------------------------------------------------
  // Body forwarding
  // -------------------------------------------------------------------------
  it("forwards request body to upstream", async () => {
    const body = { address: "bc1q-test", signature: "sig123" };
    const res = await POST(makeRequest(body));

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(connectPayload);

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual(body);
    expect(options.headers["Content-Type"]).toBe("application/json");
  });

  // -------------------------------------------------------------------------
  // Authorization header forwarding
  // -------------------------------------------------------------------------
  it("forwards Authorization header when present", async () => {
    const body = { address: "bc1q-test" };
    await POST(makeRequest(body, { Authorization: "Bearer my-token" }));

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["Authorization"]).toBe("Bearer my-token");
  });

  it("omits Authorization header when not present on incoming request", async () => {
    const body = { address: "bc1q-test" };
    await POST(makeRequest(body));

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers).not.toHaveProperty("Authorization");
  });

  // -------------------------------------------------------------------------
  // Cookie header forwarding
  // -------------------------------------------------------------------------
  it("forwards Cookie header when present", async () => {
    const body = { address: "bc1q-test" };
    await POST(makeRequest(body, { Cookie: "session=abc123" }));

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers["Cookie"]).toBe("session=abc123");
  });

  it("omits Cookie header when not present on incoming request", async () => {
    const body = { address: "bc1q-test" };
    await POST(makeRequest(body));

    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.headers).not.toHaveProperty("Cookie");
  });

  // -------------------------------------------------------------------------
  // Set-Cookie passthrough from upstream
  // -------------------------------------------------------------------------
  it("forwards Set-Cookie headers from upstream response", async () => {
    const upstreamHeaders = new Headers();
    upstreamHeaders.append("set-cookie", "session=xyz; Path=/; HttpOnly");
    upstreamHeaders.append("set-cookie", "refresh=abc; Path=/; HttpOnly");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(connectPayload),
        headers: upstreamHeaders,
      }),
    );

    const res = await POST(makeRequest({ address: "bc1q-test" }));

    expect(res.status).toBe(200);

    const setCookies = res.headers.getSetCookie();
    expect(setCookies).toContain("session=xyz; Path=/; HttpOnly");
    expect(setCookies).toContain("refresh=abc; Path=/; HttpOnly");
  });

  // -------------------------------------------------------------------------
  // Upstream unreachable
  // -------------------------------------------------------------------------
  it("returns 502 when upstream is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    );

    const res = await POST(makeRequest({ address: "bc1q-test" }));

    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Upstream unreachable" });
  });
});
