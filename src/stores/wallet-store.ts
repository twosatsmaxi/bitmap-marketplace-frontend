import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/auth-api";
import type { WalletProvider } from "@/lib/wallet-service";

interface WalletState {
  profile: Profile | null;
  provider: WalletProvider | null;
  token: string | null;

  setAuth: (profile: Profile, provider: WalletProvider, token: string) => void;
  updateProfile: (profile: Profile) => void;
  clearAuth: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      profile: null,
      provider: null,
      token: null,

      setAuth: (profile, provider, token) => set({ profile, provider, token }),
      updateProfile: (profile) => set({ profile }),
      clearAuth: () => set({ profile: null, provider: null, token: null }),
    }),
    { name: "bitmap-wallets" }
  )
);
