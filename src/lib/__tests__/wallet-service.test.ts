import {
  isWalletAvailable,
  connectWallet,
  disconnectWallet,
  signChallengeMessage,
  signPsbtInputs,
  signPsbt,
} from "@/lib/wallet-service";
import { getProvider, detectWallets } from "@/lib/wallet/registry";
import type { WalletProviderStrategy } from "@/lib/wallet/types";

vi.mock("@/lib/wallet/registry");

const mockProvider: WalletProviderStrategy = {
  key: "xverse",
  name: "Xverse",
  isAvailable: vi.fn(() => true),
  connect: vi.fn().mockResolvedValue({
    paymentAddress: "bc1qpay",
    ordinalsAddress: "bc1qord",
  }),
  disconnect: vi.fn().mockResolvedValue(undefined),
  signMessage: vi.fn().mockResolvedValue("mock-signature"),
  signPsbt: vi.fn().mockResolvedValue("signed-psbt-b64"),
};

beforeEach(() => {
  vi.mocked(getProvider).mockReturnValue(mockProvider);
  vi.mocked(detectWallets).mockReturnValue([
    { provider: "xverse", name: "Xverse", installed: true },
    { provider: "unisat", name: "UniSat", installed: false },
  ]);
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// isWalletAvailable
// ---------------------------------------------------------------------------
describe("isWalletAvailable", () => {
  it("returns true when at least one wallet is installed", () => {
    expect(isWalletAvailable()).toBe(true);
  });

  it("returns false when no wallets are installed", () => {
    vi.mocked(detectWallets).mockReturnValue([
      { provider: "xverse", name: "Xverse", installed: false },
      { provider: "unisat", name: "UniSat", installed: false },
    ]);

    expect(isWalletAvailable()).toBe(false);
  });

  it("returns true when all wallets are installed", () => {
    vi.mocked(detectWallets).mockReturnValue([
      { provider: "xverse", name: "Xverse", installed: true },
      { provider: "unisat", name: "UniSat", installed: true },
    ]);

    expect(isWalletAvailable()).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// connectWallet
// ---------------------------------------------------------------------------
describe("connectWallet", () => {
  it("delegates to provider.connect() with specified provider", async () => {
    const result = await connectWallet("xverse");

    expect(getProvider).toHaveBeenCalledWith("xverse");
    expect(mockProvider.connect).toHaveBeenCalled();
    expect(result).toEqual({
      paymentAddress: "bc1qpay",
      ordinalsAddress: "bc1qord",
    });
  });

  it("uses default provider when none specified", async () => {
    await connectWallet();

    expect(getProvider).toHaveBeenCalledWith(undefined);
  });
});

// ---------------------------------------------------------------------------
// disconnectWallet
// ---------------------------------------------------------------------------
describe("disconnectWallet", () => {
  it("delegates to provider.disconnect()", async () => {
    await disconnectWallet("unisat");

    expect(getProvider).toHaveBeenCalledWith("unisat");
    expect(mockProvider.disconnect).toHaveBeenCalled();
  });

  it("uses default provider when none specified", async () => {
    await disconnectWallet();

    expect(getProvider).toHaveBeenCalledWith(undefined);
    expect(mockProvider.disconnect).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// signChallengeMessage
// ---------------------------------------------------------------------------
describe("signChallengeMessage", () => {
  it("delegates to provider.signMessage() with address and message", async () => {
    const result = await signChallengeMessage(
      "bc1qaddr",
      "sign this",
      "unisat",
    );

    expect(getProvider).toHaveBeenCalledWith("unisat");
    expect(mockProvider.signMessage).toHaveBeenCalledWith(
      "bc1qaddr",
      "sign this",
    );
    expect(result).toBe("mock-signature");
  });

  it("uses default provider when none specified", async () => {
    await signChallengeMessage("bc1qaddr", "msg");

    expect(getProvider).toHaveBeenCalledWith(undefined);
  });
});

// ---------------------------------------------------------------------------
// signPsbtInputs
// ---------------------------------------------------------------------------
describe("signPsbtInputs", () => {
  it("delegates to provider.signPsbt() with all arguments", async () => {
    const result = await signPsbtInputs(
      "psbt-b64",
      "bc1qaddr",
      [0, 1],
      "xverse",
    );

    expect(getProvider).toHaveBeenCalledWith("xverse");
    expect(mockProvider.signPsbt).toHaveBeenCalledWith(
      "psbt-b64",
      "bc1qaddr",
      [0, 1],
    );
    expect(result).toBe("signed-psbt-b64");
  });
});

// ---------------------------------------------------------------------------
// signPsbt (convenience wrapper)
// ---------------------------------------------------------------------------
describe("signPsbt", () => {
  it("calls signPsbtInputs with inputIndices [0]", async () => {
    const result = await signPsbt("psbt-b64", "bc1qpay", "xverse");

    expect(getProvider).toHaveBeenCalledWith("xverse");
    expect(mockProvider.signPsbt).toHaveBeenCalledWith(
      "psbt-b64",
      "bc1qpay",
      [0],
    );
    expect(result).toBe("signed-psbt-b64");
  });
});
