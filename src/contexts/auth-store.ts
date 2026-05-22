import { create } from "zustand";

import type { AuthStatus, AuthUser } from "@/types/auth";

type AuthState = {
  user: AuthUser | null;
  status: AuthStatus;
  setUser: (user: AuthUser) => void;
  clearAuth: () => void;
};

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  status: "unknown",

  setUser: (user) =>
    set({
      user,
      status: "authenticated",
    }),

  clearAuth: () =>
    set({
      user: null,
      status: "guest",
    }),
}));
