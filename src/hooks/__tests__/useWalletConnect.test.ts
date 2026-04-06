import { renderHook, act } from "@testing-library/react";
import { useWalletConnect } from "@/hooks/useWalletConnect";
import { useWalletStore } from "@/stores/wallet-store";
import type { Profile, ChallengeResponse, AuthResponse } from "@/lib/auth-api";
import type { WalletAddresses } from "@/lib/wallet-service";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@/lib/wallet-service", () => ({
  connectWallet: vi.fn(),
  disconnectWallet: vi.fn(),
  signChallengeMessage: vi.fn(),
}));

vi.mock("@/lib/auth-api", () => ({
  getChallenge: vi.fn(),
  connectToBackend: vi.fn(),
  removeWalletFromProfile: vi.fn(),
  logout: vi.fn().mockResolvedValue(undefined),
}));

// Import the mocked functions after vi.mock so we can configure them per test
import { connectWallet, disconnectWallet, signChallengeMessage } from "@/lib/wallet-service";
import { getChallenge, connectToBackend, removeWalletFromProfile } from "@/lib/auth-api";

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------
const mockAddresses: WalletAddresses = {
  paymentAddress: "bc1qpay",
  ordinalsAddress: "bc1qord",
};

const mockChallenge: ChallengeResponse = {
  message: "Sign this message",
  nonce: "abc123",
  issued_at: new Date().toISOString(),
  expiration_time: new Date(Date.now() + 300_000).toISOString(),
};

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "user-1",
  primaryAddress: "bc1qord",
  wallets: [
    {
      paymentAddress: "bc1qpay",
      ordinalsAddress: "bc1qord",
      label: "unisat",
      linkedAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  ...overrides,
});

const mockAuth: AuthResponse = {
  token: "jwt-token-abc",
  profile: makeProfile(),
};

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------
describe("useWalletConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWalletStore.setState({ profile: null, provider: null, token: null });
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------
  describe("initial state", () => {
    it("returns isConnected false, profile null, error null", () => {
      const { result } = renderHook(() => useWalletConnect());

      expect(result.current.isConnected).toBe(false);
      expect(result.current.profile).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.isConnecting).toBe(false);
      expect(result.current.provider).toBeNull();
      expect(result.current.wallets).toEqual([]);
    });
  });

  // -------------------------------------------------------------------------
  // connect
  // -------------------------------------------------------------------------
  describe("connect", () => {
    it("connects successfully and returns the profile", async () => {
      vi.mocked(connectWallet).mockResolvedValue(mockAddresses);
      vi.mocked(getChallenge).mockResolvedValue(mockChallenge);
      vi.mocked(signChallengeMessage).mockResolvedValue("signature-hex");
      vi.mocked(connectToBackend).mockResolvedValue(mockAuth);

      const { result } = renderHook(() => useWalletConnect());

      let connectResult: Awaited<ReturnType<typeof result.current.connect>>;
      await act(async () => {
        connectResult = await result.current.connect("unisat");
      });

      expect(connectResult!).toEqual({
        profile: mockAuth.profile,
        ordinalsAddress: "bc1qord",
      });
      expect(result.current.isConnected).toBe(true);
      expect(result.current.profile).toEqual(mockAuth.profile);
      expect(result.current.error).toBeNull();
      expect(result.current.isConnecting).toBe(false);
    });

    it("calls wallet-service and auth-api in the correct order", async () => {
      vi.mocked(connectWallet).mockResolvedValue(mockAddresses);
      vi.mocked(getChallenge).mockResolvedValue(mockChallenge);
      vi.mocked(signChallengeMessage).mockResolvedValue("sig");
      vi.mocked(connectToBackend).mockResolvedValue(mockAuth);

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.connect("unisat");
      });

      expect(connectWallet).toHaveBeenCalledWith("unisat");
      expect(getChallenge).toHaveBeenCalledWith("bc1qord");
      expect(signChallengeMessage).toHaveBeenCalledWith(
        "bc1qord",
        "Sign this message",
        "unisat"
      );
      expect(connectToBackend).toHaveBeenCalledWith(
        mockAddresses,
        "sig",
        "Sign this message",
        "abc123",
        "unisat",
        undefined // no existing token for first connect
      );
    });

    it("sets isConnecting to true during connection and false after", async () => {
      // Use a deferred promise so we can observe the intermediate state
      let resolveConnect!: (v: WalletAddresses) => void;
      vi.mocked(connectWallet).mockImplementation(
        () => new Promise((resolve) => { resolveConnect = resolve; })
      );
      vi.mocked(getChallenge).mockResolvedValue(mockChallenge);
      vi.mocked(signChallengeMessage).mockResolvedValue("sig");
      vi.mocked(connectToBackend).mockResolvedValue(mockAuth);

      const { result } = renderHook(() => useWalletConnect());

      expect(result.current.isConnecting).toBe(false);

      let connectPromise: Promise<unknown>;
      act(() => {
        connectPromise = result.current.connect("unisat");
      });

      // While connectWallet is pending, isConnecting should be true
      expect(result.current.isConnecting).toBe(true);

      // Resolve and let it finish
      await act(async () => {
        resolveConnect(mockAddresses);
        await connectPromise!;
      });

      expect(result.current.isConnecting).toBe(false);
    });

    it("sets error and returns null when connectWallet throws", async () => {
      vi.mocked(connectWallet).mockRejectedValue(new Error("Wallet rejected"));

      const { result } = renderHook(() => useWalletConnect());

      let connectResult: Awaited<ReturnType<typeof result.current.connect>>;
      await act(async () => {
        connectResult = await result.current.connect("unisat");
      });

      expect(connectResult!).toBeNull();
      expect(result.current.error).toBe("Wallet rejected");
      expect(result.current.isConnected).toBe(false);
      expect(result.current.isConnecting).toBe(false);
    });

    it("sets generic error for non-Error throws", async () => {
      vi.mocked(connectWallet).mockRejectedValue("string error");

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.connect("unisat");
      });

      expect(result.current.error).toBe("Connection failed");
    });

    it("sets error when getChallenge fails", async () => {
      vi.mocked(connectWallet).mockResolvedValue(mockAddresses);
      vi.mocked(getChallenge).mockRejectedValue(new Error("Server error"));

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.connect("unisat");
      });

      expect(result.current.error).toBe("Server error");
      expect(result.current.isConnected).toBe(false);
    });
  });

  // -------------------------------------------------------------------------
  // connectAnother
  // -------------------------------------------------------------------------
  describe("connectAnother", () => {
    it("passes existing token from store to authenticateWallet", async () => {
      // Pre-set auth so token is available
      useWalletStore.setState({
        profile: makeProfile(),
        provider: "xverse",
        token: "existing-jwt",
      });

      // Use a different address for the new wallet (not already in profile)
      const newWalletAddresses: WalletAddresses = {
        paymentAddress: "bc1qnewpay",
        ordinalsAddress: "bc1qneword",
      };

      vi.mocked(connectWallet).mockResolvedValue(newWalletAddresses);
      vi.mocked(getChallenge).mockResolvedValue(mockChallenge);
      vi.mocked(signChallengeMessage).mockResolvedValue("sig");
      vi.mocked(connectToBackend).mockResolvedValue(mockAuth);

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.connectAnother("unisat");
      });

      expect(connectToBackend).toHaveBeenCalledWith(
        newWalletAddresses,
        "sig",
        "Sign this message",
        "abc123",
        "unisat",
        "existing-jwt" // existing token passed
      );
    });

    it("returns profile on success", async () => {
      useWalletStore.setState({
        profile: makeProfile(),
        provider: "xverse",
        token: "existing-jwt",
      });

      // Use a different address for the new wallet (not already in profile)
      const newWalletAddresses: WalletAddresses = {
        paymentAddress: "bc1qnewpay",
        ordinalsAddress: "bc1qneword",
      };

      vi.mocked(connectWallet).mockResolvedValue(newWalletAddresses);
      vi.mocked(getChallenge).mockResolvedValue(mockChallenge);
      vi.mocked(signChallengeMessage).mockResolvedValue("sig");
      vi.mocked(connectToBackend).mockResolvedValue(mockAuth);

      const { result } = renderHook(() => useWalletConnect());

      let connectResult: Awaited<ReturnType<typeof result.current.connectAnother>>;
      await act(async () => {
        connectResult = await result.current.connectAnother("unisat");
      });

      expect(connectResult!).toEqual({
        profile: mockAuth.profile,
        ordinalsAddress: "bc1qneword",
      });
    });

    it("sets error on failure", async () => {
      useWalletStore.setState({
        profile: makeProfile(),
        provider: "xverse",
        token: "existing-jwt",
      });

      vi.mocked(connectWallet).mockRejectedValue(new Error("User denied"));

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.connectAnother("unisat");
      });

      expect(result.current.error).toBe("User denied");
    });
  });

  // -------------------------------------------------------------------------
  // disconnect
  // -------------------------------------------------------------------------
  describe("disconnect", () => {
    it("calls disconnectWallet and clears auth state", async () => {
      useWalletStore.setState({
        profile: makeProfile(),
        provider: "unisat",
        token: "jwt-token",
      });

      vi.mocked(disconnectWallet).mockResolvedValue(undefined);

      const { result } = renderHook(() => useWalletConnect());
      expect(result.current.isConnected).toBe(true);

      await act(async () => {
        await result.current.disconnect();
      });

      expect(disconnectWallet).toHaveBeenCalledWith("unisat");
      expect(result.current.isConnected).toBe(false);
      expect(result.current.profile).toBeNull();
      expect(result.current.provider).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // removeWallet
  // -------------------------------------------------------------------------
  describe("removeWallet", () => {
    it("calls removeWalletFromProfile and updates the profile", async () => {
      const initialProfile = makeProfile();
      useWalletStore.setState({
        profile: initialProfile,
        provider: "unisat",
        token: "jwt",
      });

      const updatedProfile = makeProfile({ wallets: [] });
      vi.mocked(removeWalletFromProfile).mockResolvedValue(updatedProfile);

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.removeWallet("bc1qord");
      });

      expect(removeWalletFromProfile).toHaveBeenCalledWith("bc1qord");
      expect(result.current.profile).toEqual(updatedProfile);
      expect(result.current.wallets).toEqual([]);
    });

    it("sets error when removeWalletFromProfile fails", async () => {
      useWalletStore.setState({
        profile: makeProfile(),
        provider: "unisat",
        token: "jwt",
      });

      vi.mocked(removeWalletFromProfile).mockRejectedValue(
        new Error("Not authorized")
      );

      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.removeWallet("bc1qord");
      });

      expect(result.current.error).toBe("Not authorized");
    });

    it("does nothing when profile is null", async () => {
      const { result } = renderHook(() => useWalletConnect());

      await act(async () => {
        await result.current.removeWallet("bc1qord");
      });

      expect(removeWalletFromProfile).not.toHaveBeenCalled();
      expect(result.current.error).toBeNull();
    });
  });
});
