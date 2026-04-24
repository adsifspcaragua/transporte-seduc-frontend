"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";

import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

const guestOnlyRoutes = ["/login", "/recuperar-senha"];
const publicRoutes = ["/registro", ...guestOnlyRoutes];

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const status = useAuthStore((state) => state.status);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setUser = useAuthStore((state) => state.setUser);

  const isPublicRoute = useMemo(
    () => publicRoutes.includes(pathname),
    [pathname],
  );
  const isGuestOnlyRoute = useMemo(
    () => guestOnlyRoutes.includes(pathname),
    [pathname],
  );

  useEffect(() => {
    if (status !== "unknown") return;

    let isActive = true;

    async function restoreSession() {
      try {
        const me = await authService.me();

        if (!isActive) return;

        setUser(me);
      } catch {
        if (!isActive) return;

        clearAuth();
      }
    }

    void restoreSession();

    return () => {
      isActive = false;
    };
  }, [status, setUser, clearAuth]);

  useEffect(() => {
    if (status === "unknown") return;

    if (!isPublicRoute && status === "guest") {
      router.replace("/login");
      return;
    }

    if (isGuestOnlyRoute && status === "authenticated") {
      router.replace("/");
    }
  }, [status, isPublicRoute, isGuestOnlyRoute, router]);

  if (status === "unknown") {
    return null;
  }

  if (!isPublicRoute && status === "guest") {
    return null;
  }

  if (isGuestOnlyRoute && status === "authenticated") {
    return null;
  }

  return children;
}
