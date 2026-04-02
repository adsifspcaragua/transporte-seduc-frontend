"use client";

import { useRouter } from "next/navigation";

import { authService } from "@/features/auth/services/auth.service";
import type { LoginRequest } from "@/features/auth/types/auth.types";
import { useAuthStore } from "@/store/auth.store";

export function useAuth() {
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  async function signIn(credentials: LoginRequest) {
    const data = await authService.login(credentials);
    setAuth(data.token, data.user);
    return data;
  }

  async function signOut() {
    try {
      await authService.logout();
    } finally {
      clearAuth();
      router.replace("/login");
    }
  }

  return {
    token,
    user,
    isAuthenticated: Boolean(token),
    signIn,
    signOut,
  };
}
