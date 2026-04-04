import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WalletLabelsState {
  labels: Record<string, string>;

  getLabel(address: string): string | undefined;
  setLabel(address: string, label: string): void;
  removeLabel(address: string): void;
  clearAllLabels(): void;
}

export const useWalletLabelsStore = create<WalletLabelsState>()(
  persist(
    (set, get) => ({
      labels: {},

      getLabel: (address) => get().labels[address],

      setLabel: (address, label) => {
        if (get().labels[address] === label) return;
        set((state) => ({
          labels: { ...state.labels, [address]: label },
        }));
      },

      removeLabel: (address) =>
        set((state) => {
          const { [address]: _, ...rest } = state.labels;
          return { labels: rest };
        }),

      clearAllLabels: () => set({ labels: {} }),
    }),
    { name: "bitmap-wallet-labels" }
  )
);
