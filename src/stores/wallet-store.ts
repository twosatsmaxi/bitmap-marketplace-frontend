import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/auth-api";

interface WalletState {
  token: string | null;
  profile: Profile | null;

  setAuth: (token: string, profile: Profile) => void;
  updateProfile: (profile: Profile) => void;
  clearAuth: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      token: null,
      profile: null,

      setAuth: (token, profile) => set({ token, profile }),
      updateProfile: (profile) => set({ profile }),
      clearAuth: () => set({ token: null, profile: null }),
    }),
    { name: "bitmap-wallets" }
  )
);
