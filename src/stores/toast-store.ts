import { create } from "zustand";

export type ToastVariant = "default" | "success" | "error";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
  /** Timestamp when toast was added — used for ordering */
  createdAt: number;
  /** Set to true when the toast is exiting (for animation) */
  exiting?: boolean;
}

interface ToastState {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id" | "createdAt" | "exiting">) => string;
  dismissToast: (id: string) => void;
  /** Mark toast as exiting (triggers fade-out animation before removal) */
  markExiting: (id: string) => void;
}

const MAX_VISIBLE = 3;

let counter = 0;

export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = `toast-${++counter}-${Date.now()}`;
    const newToast: Toast = { ...toast, id, createdAt: Date.now() };

    set((state) => {
      let next = [...state.toasts, newToast];
      // If over the limit, remove the oldest (first in array)
      while (next.length > MAX_VISIBLE) {
        next = next.slice(1);
      }
      return { toasts: next };
    });

    return id;
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },

  markExiting: (id) => {
    set((state) => ({
      toasts: state.toasts.map((t) =>
        t.id === id ? { ...t, exiting: true } : t
      ),
    }));
  },
}));
