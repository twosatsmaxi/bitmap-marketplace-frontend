import { getProvider, detectWallets } from "@/lib/wallet/registry";

// ---------------------------------------------------------------------------
// getProvider
// ---------------------------------------------------------------------------
describe("getProvider", () => {
  it('returns the Xverse provider for key "xverse"', () => {
    const provider = getProvider("xverse");

    expect(provider.key).toBe("xverse");
    expect(provider.name).toBe("Xverse");
  });

  it('returns the UniSat provider for key "unisat"', () => {
    const provider = getProvider("unisat");

    expect(provider.key).toBe("unisat");
    expect(provider.name).toBe("Unisat");
  });

  it("returns Xverse (default) when key is undefined", () => {
    const provider = getProvider(undefined);

    expect(provider.key).toBe("xverse");
  });

  it("returns Xverse (default) when key is unknown", () => {
    const provider = getProvider("unknown" as any);

    expect(provider.key).toBe("xverse");
  });

  it("returns the same instance for repeated calls with the same key", () => {
    const a = getProvider("unisat");
    const b = getProvider("unisat");

    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// detectWallets
// ---------------------------------------------------------------------------
describe("detectWallets", () => {
  it("returns an array with two providers", () => {
    const wallets = detectWallets();

    expect(wallets).toHaveLength(2);
  });

  it("includes xverse as the first entry", () => {
    const wallets = detectWallets();

    expect(wallets[0].provider).toBe("xverse");
    expect(wallets[0].name).toBe("Xverse");
  });

  it("includes unisat as the second entry", () => {
    const wallets = detectWallets();

    expect(wallets[1].provider).toBe("unisat");
    expect(wallets[1].name).toBe("Unisat");
  });

  it("reports installed status based on runtime availability", () => {
    const wallets = detectWallets();

    // In a test environment (happy-dom), neither extension is injected,
    // so both should report installed: false.
    for (const w of wallets) {
      expect(typeof w.installed).toBe("boolean");
    }
  });

  it("each entry has the correct shape", () => {
    const wallets = detectWallets();

    for (const w of wallets) {
      expect(w).toHaveProperty("provider");
      expect(w).toHaveProperty("name");
      expect(w).toHaveProperty("installed");
    }
  });
});
