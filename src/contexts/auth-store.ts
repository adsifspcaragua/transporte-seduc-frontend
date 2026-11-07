import { create } from "zustand";
import { esquecerConta } from "@/services/offline-session";

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

  // Sair ou sessão recusada (401) também apaga a conta lembrada para uso offline.
  clearAuth: () => {
    esquecerConta();
    set({
      user: null,
      status: "guest",
    });
  },
}));
