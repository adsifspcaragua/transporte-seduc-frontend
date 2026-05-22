"use client";

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/contexts/auth-store";
import { authService } from "@/services/api/modules/auth";
import type { LoginRequest } from "@/types/auth";

export function useAuth() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const status = useAuthStore((state) => state.status);
  const setUser = useAuthStore((state) => state.setUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  async function signIn(credentials: LoginRequest) {
    await authService.login(credentials);

    const authenticatedUser = await authService.me();
    setUser(authenticatedUser);

    return authenticatedUser;
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
    user,
    isAuthenticated: status === "authenticated",
    signIn,
    signOut,
  };
}
