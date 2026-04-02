import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { StateStorage } from "zustand/middleware";

import type { AuthUser } from "@/features/auth/types/auth.types";
import { STORAGE_KEYS } from "@/lib/constants/storage-keys";

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  rememberMe: boolean;
  hasHydrated: boolean;
  setAuth: (token: string, user: AuthUser, rememberMe: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
};

const authStateStorage: StateStorage = {
  getItem: (name) => {
    if (typeof window === "undefined") return null;

    const localValue = window.localStorage.getItem(name);
    if (localValue) return localValue;

    const sessionValue = window.sessionStorage.getItem(name);
    if (sessionValue) return sessionValue;

    return null;
  },

  setItem: (name, value) => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);

    try {
      const parsed = JSON.parse(value);
      const rememberMe = parsed?.state?.rememberMe ?? false;

      if (rememberMe) {
        window.localStorage.setItem(name, value);
      } else {
        window.sessionStorage.setItem(name, value);
      }
    } catch {
      window.sessionStorage.setItem(name, value);
    }
  },

  removeItem: (name) => {
    if (typeof window === "undefined") return;

    window.localStorage.removeItem(name);
    window.sessionStorage.removeItem(name);
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      rememberMe: false,
      hasHydrated: false,

      setAuth: (token, user, rememberMe) =>
        set({
          token,
          user,
          rememberMe,
        }),

      setUser: (user) => set({ user }),

      clearAuth: () =>
        set({
          token: null,
          user: null,
          rememberMe: false,
        }),

      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: STORAGE_KEYS.AUTH_STORAGE,
      storage: createJSONStorage(() => authStateStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        rememberMe: state.rememberMe,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
