import { useWalletStore } from "@/stores/wallet-store";
import type { Profile } from "@/lib/auth-api";
import type { WalletProvider } from "@/lib/wallet-service";

const makeProfile = (overrides: Partial<Profile> = {}): Profile => ({
  id: "user-1",
  primaryAddress: "bc1q-test-address",
  wallets: [
    {
      paymentAddress: "bc1q-payment",
      ordinalsAddress: "bc1q-ordinals",
      label: "xverse",
      linkedAt: "2025-01-01T00:00:00Z",
    },
  ],
  createdAt: "2025-01-01T00:00:00Z",
  ...overrides,
});

const resetStore = () =>
  useWalletStore.setState({ profile: null, provider: null, token: null });

describe("useWalletStore", () => {
  beforeEach(() => {
    resetStore();
  });

  describe("initial state", () => {
    it("has null profile, provider, and token", () => {
      const { profile, provider, token } = useWalletStore.getState();
      expect(profile).toBeNull();
      expect(provider).toBeNull();
      expect(token).toBeNull();
    });
  });

  describe("setAuth", () => {
    it("sets profile, provider, and token", () => {
      const profile = makeProfile();
      const provider: WalletProvider = "xverse";
      const token = "jwt-abc-123";

      useWalletStore.getState().setAuth(profile, provider, token);

      const state = useWalletStore.getState();
      expect(state.profile).toEqual(profile);
      expect(state.provider).toBe("xverse");
      expect(state.token).toBe("jwt-abc-123");
    });

    it("overwrites previously set auth", () => {
      const first = makeProfile({ id: "user-1" });
      const second = makeProfile({ id: "user-2", primaryAddress: "bc1q-other" });

      useWalletStore.getState().setAuth(first, "xverse", "token-1");
      useWalletStore.getState().setAuth(second, "unisat", "token-2");

      const state = useWalletStore.getState();
      expect(state.profile).toEqual(second);
      expect(state.provider).toBe("unisat");
      expect(state.token).toBe("token-2");
    });
  });

  describe("updateProfile", () => {
    it("updates only the profile, preserving provider and token", () => {
      const original = makeProfile({ id: "user-1" });
      useWalletStore.getState().setAuth(original, "xverse", "jwt-token");

      const updated = makeProfile({
        id: "user-1",
        primaryAddress: "bc1q-new-address",
        wallets: [
          {
            paymentAddress: "bc1q-payment-new",
            ordinalsAddress: "bc1q-ordinals-new",
            label: "unisat",
            linkedAt: "2025-06-01T00:00:00Z",
          },
        ],
      });

      useWalletStore.getState().updateProfile(updated);

      const state = useWalletStore.getState();
      expect(state.profile).toEqual(updated);
      expect(state.provider).toBe("xverse");
      expect(state.token).toBe("jwt-token");
    });

    it("can set profile even when provider and token are null", () => {
      const profile = makeProfile();
      useWalletStore.getState().updateProfile(profile);

      const state = useWalletStore.getState();
      expect(state.profile).toEqual(profile);
      expect(state.provider).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe("clearAuth", () => {
    it("resets profile, provider, and token to null", () => {
      const profile = makeProfile();
      useWalletStore.getState().setAuth(profile, "unisat", "jwt-xyz");

      useWalletStore.getState().clearAuth();

      const state = useWalletStore.getState();
      expect(state.profile).toBeNull();
      expect(state.provider).toBeNull();
      expect(state.token).toBeNull();
    });

    it("is a no-op when already cleared", () => {
      useWalletStore.getState().clearAuth();

      const state = useWalletStore.getState();
      expect(state.profile).toBeNull();
      expect(state.provider).toBeNull();
      expect(state.token).toBeNull();
    });
  });

  describe("persist partialize", () => {
    it("only serializes profile and provider, not token", () => {
      const profile = makeProfile();
      const fullState = useWalletStore.getState();

      // Populate state with a token so we can confirm it is excluded
      useWalletStore.getState().setAuth(profile, "xverse", "super-secret-jwt");

      const partialize = useWalletStore.persist.getOptions().partialize!;
      const persisted = partialize(useWalletStore.getState());

      expect(persisted).toHaveProperty("profile");
      expect(persisted).toHaveProperty("provider");
    });

    it("does not include token in the persisted slice", () => {
      useWalletStore
        .getState()
        .setAuth(makeProfile(), "xverse", "super-secret-jwt");

      const partialize = useWalletStore.persist.getOptions().partialize!;
      const persisted = partialize(useWalletStore.getState());

      expect("token" in persisted).toBe(false);
    });

    it("does not include action methods in the persisted slice", () => {
      const partialize = useWalletStore.persist.getOptions().partialize!;
      const persisted = partialize(useWalletStore.getState());

      expect("setAuth" in persisted).toBe(false);
      expect("updateProfile" in persisted).toBe(false);
      expect("clearAuth" in persisted).toBe(false);
    });

    it("persists the correct profile and provider values", () => {
      const profile = makeProfile({ id: "user-42" });
      useWalletStore.getState().setAuth(profile, "unisat", "jwt-token");

      const partialize = useWalletStore.persist.getOptions().partialize!;
      const persisted = partialize(useWalletStore.getState());

      expect(persisted.profile).toEqual(profile);
      expect(persisted.provider).toBe("unisat");
    });

    it("persists null profile and provider when store is cleared", () => {
      useWalletStore
        .getState()
        .setAuth(makeProfile(), "xverse", "jwt-token");
      useWalletStore.getState().clearAuth();

      const partialize = useWalletStore.persist.getOptions().partialize!;
      const persisted = partialize(useWalletStore.getState());

      expect(persisted.profile).toBeNull();
      expect(persisted.provider).toBeNull();
    });
  });
});
