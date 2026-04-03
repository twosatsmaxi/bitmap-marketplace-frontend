import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/auth-api";
import type { WalletProvider } from "@/lib/wallet-service";

interface WalletState {
  profile: Profile | null;
  provider: WalletProvider | null;

  setAuth: (profile: Profile, provider: WalletProvider) => void;
  updateProfile: (profile: Profile) => void;
  clearAuth: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      profile: null,
      provider: null,

      setAuth: (profile, provider) => set({ profile, provider }),
      updateProfile: (profile) => set({ profile }),
      clearAuth: () => set({ profile: null, provider: null }),
    }),
    { name: "bitmap-wallets" }
  )
);
