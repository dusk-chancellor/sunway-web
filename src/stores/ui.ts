import { create } from "zustand";

export interface Toast {
  id: string;
  message: string;
  variant: "ok" | "bad" | "info";
}

interface UIState {
  cartDrawerOpen: boolean;
  mobileNavOpen: boolean;
  toasts: Toast[];
  openCart: () => void;
  closeCart: () => void;
  toggleMobileNav: () => void;
  closeMobileNav: () => void;
  pushToast: (message: string, variant?: Toast["variant"]) => void;
  dismissToast: (id: string) => void;
}

export const useUI = create<UIState>((set) => ({
  cartDrawerOpen: false,
  mobileNavOpen: false,
  toasts: [],
  openCart: () => set({ cartDrawerOpen: true }),
  closeCart: () => set({ cartDrawerOpen: false }),
  toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),
  closeMobileNav: () => set({ mobileNavOpen: false }),
  pushToast: (message, variant = "info") =>
    set((s) => ({ toasts: [...s.toasts, { id: Math.random().toString(36).slice(2), message, variant }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
