import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Profile } from "@/lib/auth-api";

interface WalletState {
  profile: Profile | null;

  setAuth: (profile: Profile) => void;
  updateProfile: (profile: Profile) => void;
  clearAuth: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      profile: null,

      setAuth: (profile) => set({ profile }),
      updateProfile: (profile) => set({ profile }),
      clearAuth: () => set({ profile: null }),
    }),
    { name: "bitmap-wallets" }
  )
);
