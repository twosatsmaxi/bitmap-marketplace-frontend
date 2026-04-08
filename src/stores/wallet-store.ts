import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/auth-api";
import type { WalletProvider } from "@/lib/wallet-service";

interface WalletState {
  profile: Profile | null;
  provider: WalletProvider | null;
  token: string | null;
  sessionKey: string | null;
  /** Compressed secp256k1 pubkey (hex) for the active payment address. */
  paymentPubkey: string | null;

  setAuth: (profile: Profile, provider: WalletProvider, token: string, paymentPubkey?: string) => void;
  updateProfile: (profile: Profile) => void;
  clearAuth: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      profile: null,
      provider: null,
      token: null,
      sessionKey: null,
      paymentPubkey: null,

      setAuth: (profile, provider, token, paymentPubkey) =>
        set({ profile, provider, token, paymentPubkey: paymentPubkey ?? null, sessionKey: Date.now().toString(36) }),
      updateProfile: (profile) => set({ profile }),
      clearAuth: () => set({ profile: null, provider: null, token: null, sessionKey: null, paymentPubkey: null }),
    }),
    {
      name: "bitmap-wallets",
      partialize: (state) => ({
        profile: state.profile,
        provider: state.provider,
        sessionKey: state.sessionKey,
      }),
    }
  )
);
