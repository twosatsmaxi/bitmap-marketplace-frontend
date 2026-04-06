import {
  getChallenge,
  connectToBackend,
  getProfile,
  removeWalletFromProfile,
} from "@/lib/auth-api";
import {
  createMockProfile,
  createMockChallengeResponse,
  createMockAuthResponse,
  mockFetchSequence,
} from "@/test/helpers";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// getChallenge
// ---------------------------------------------------------------------------
describe("getChallenge", () => {
  it("returns parsed ChallengeResponse on success", async () => {
    const expected = createMockChallengeResponse();
    mockFetchSequence([{ status: 200, body: expected }]);

    const result = await getChallenge("bc1qtest");

    expect(result).toEqual(expected);
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/challenge?address=bc1qtest",
      { cache: "no-store" },
    );
  });

  it("URL-encodes the address parameter", async () => {
    const expected = createMockChallengeResponse();
    mockFetchSequence([{ status: 200, body: expected }]);

    await getChallenge("bc1q test&special");

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/challenge?address=bc1q%20test%26special",
      { cache: "no-store" },
    );
  });

  it("throws with fallback message when server returns 400 with empty body", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 400 }),
    );

    await expect(getChallenge("bad")).rejects.toThrow(
      "Challenge failed: 400",
    );
  });

  it("extracts error message from JSON body { error: ... }", async () => {
    // mockFetchSequence JSON-stringifies the body, so res.text() returns
    // '{"error":"custom error"}' which extractErrorMessage can parse.
    mockFetchSequence([{ status: 422, body: { error: "custom error" } }]);

    await expect(getChallenge("addr")).rejects.toThrow("custom error");
  });

  it("uses plain body text when response is not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("rate limited", { status: 429 }),
    );

    await expect(getChallenge("addr")).rejects.toThrow("rate limited");
  });

  it("uses fallback when body is empty and not JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500 }),
    );

    await expect(getChallenge("addr")).rejects.toThrow(
      "Challenge failed: 500",
    );
  });

  it("returns JSON body as error when JSON has no .error field", async () => {
    // JSON body like '{"detail":"bad request"}' -- valid JSON, no .error key
    mockFetchSequence([{ status: 400, body: { detail: "bad request" } }]);

    await expect(getChallenge("addr")).rejects.toThrow(
      '{"detail":"bad request"}',
    );
  });
});

// ---------------------------------------------------------------------------
// connectToBackend
// ---------------------------------------------------------------------------
describe("connectToBackend", () => {
  const addresses = {
    paymentAddress: "bc1qpay",
    ordinalsAddress: "bc1qord",
  };

  it("returns AuthResponse on success", async () => {
    const expected = createMockAuthResponse();
    mockFetchSequence([{ status: 200, body: expected }]);

    const result = await connectToBackend(
      addresses,
      "sig",
      "msg",
      "nonce1",
      "xverse",
    );

    expect(result).toEqual(expected);
  });

  it("includes Authorization header when authToken is provided", async () => {
    mockFetchSequence([{ status: 200, body: createMockAuthResponse() }]);

    await connectToBackend(
      addresses,
      "sig",
      "msg",
      "nonce1",
      "xverse",
      "my-jwt-token",
    );

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers).toHaveProperty(
      "Authorization",
      "Bearer my-jwt-token",
    );
  });

  it("does not include Authorization header when authToken is absent", async () => {
    mockFetchSequence([{ status: 200, body: createMockAuthResponse() }]);

    await connectToBackend(addresses, "sig", "msg", "nonce1");

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(init.headers).not.toHaveProperty("Authorization");
  });

  it("sends correct POST body with provider label", async () => {
    mockFetchSequence([{ status: 200, body: createMockAuthResponse() }]);

    await connectToBackend(addresses, "sig", "msg", "nonce1", "unisat");

    const [, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(JSON.parse(init.body)).toEqual({
      paymentAddress: "bc1qpay",
      ordinalsAddress: "bc1qord",
      signature: "sig",
      message: "msg",
      nonce: "nonce1",
      label: "unisat",
    });
  });

  it("throws with extracted error on failure", async () => {
    mockFetchSequence([
      { status: 401, body: { error: "invalid signature" } },
    ]);

    await expect(
      connectToBackend(addresses, "bad-sig", "msg", "nonce1"),
    ).rejects.toThrow("invalid signature");
  });

  it("uses fallback message when error body is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 503 }),
    );

    await expect(
      connectToBackend(addresses, "sig", "msg", "nonce1"),
    ).rejects.toThrow("Auth connect failed: 503");
  });
});

// ---------------------------------------------------------------------------
// getProfile
// ---------------------------------------------------------------------------
describe("getProfile", () => {
  it("returns Profile on success", async () => {
    const expected = createMockProfile();
    mockFetchSequence([{ status: 200, body: expected }]);

    const result = await getProfile();

    expect(result).toEqual(expected);
    expect(fetch).toHaveBeenCalledWith("/api/auth/profile", {
      credentials: "include",
    });
  });

  it("throws on non-ok response with status code", async () => {
    mockFetchSequence([{ status: 401, body: {} }]);

    await expect(getProfile()).rejects.toThrow(
      "Failed to fetch profile: 401",
    );
  });
});

// ---------------------------------------------------------------------------
// removeWalletFromProfile
// ---------------------------------------------------------------------------
describe("removeWalletFromProfile", () => {
  it("returns updated Profile on success", async () => {
    const expected = createMockProfile({ wallets: [] });
    mockFetchSequence([{ status: 200, body: expected }]);

    const result = await removeWalletFromProfile("bc1qord123");

    expect(result).toEqual(expected);
  });

  it("sends DELETE request with URL-encoded address", async () => {
    mockFetchSequence([{ status: 200, body: createMockProfile() }]);

    await removeWalletFromProfile("bc1q special&addr");

    const [url, init] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(url).toBe("/api/auth/wallets/bc1q%20special%26addr");
    expect(init.method).toBe("DELETE");
    expect(init.credentials).toBe("include");
  });

  it("throws with extracted JSON error on failure", async () => {
    mockFetchSequence([
      { status: 404, body: { error: "wallet not found" } },
    ]);

    await expect(removeWalletFromProfile("bc1qunknown")).rejects.toThrow(
      "wallet not found",
    );
  });

  it("uses fallback message when error body is empty", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("", { status: 500 }),
    );

    await expect(removeWalletFromProfile("bc1qord")).rejects.toThrow(
      "Failed to remove wallet: 500",
    );
  });
});
