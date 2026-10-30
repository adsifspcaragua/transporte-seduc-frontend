"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo } from "react";
import { AppLoadingScreen } from "@/components/loading";
import { useAuthStore } from "@/contexts/auth-store";
import { authService } from "@/services/api/modules/auth";
import {
  accountHome,
  isPortalPath,
  isStudentAccount,
  PENDING_PRESENCE_QR_KEY,
} from "@/services/navigation/account-navigation";

const guestOnlyRoutes = [
  "/login",
  "/recuperar-senha",
  "/redefinir-senha",
  "/reset-password",
];
const publicRoutes = [
  "/area-aluno",
  "/recadastro",
  "/registro",
  ...guestOnlyRoutes,
];

type AuthProviderProps = {
  children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const status = useAuthStore((state) => state.status);
  const user = useAuthStore((state) => state.user);
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

    if (isPublicRoute) {
      clearAuth();
      return;
    }

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
  }, [status, isPublicRoute, setUser, clearAuth]);

  useEffect(() => {
    if (status === "unknown") return;

    if (!isPublicRoute && status === "guest") {
      if (pathname === "/presenca/scan") {
        const token = new URL(window.location.href).searchParams.get("t");
        if (token && /^[A-Za-z0-9_-]{20,128}$/.test(token)) {
          window.sessionStorage.setItem(PENDING_PRESENCE_QR_KEY, token);
          window.history.replaceState(window.history.state, "", pathname);
        }
      }
      router.replace("/login");
      return;
    }

    if (isGuestOnlyRoute && status === "authenticated") {
      router.replace(
        accountHome(
          user,
          Boolean(window.sessionStorage.getItem(PENDING_PRESENCE_QR_KEY)),
        ),
      );
    } else if (
      status === "authenticated" &&
      isStudentAccount(user) &&
      !isPublicRoute &&
      !isPortalPath(pathname)
    ) {
      router.replace(accountHome(user));
    }
  }, [status, user, pathname, isPublicRoute, isGuestOnlyRoute, router]);

  if (status === "unknown") {
    return <AppLoadingScreen />;
  }

  if (!isPublicRoute && status === "guest") {
    return <AppLoadingScreen />;
  }

  if (isGuestOnlyRoute && status === "authenticated") {
    return <AppLoadingScreen />;
  }

  if (
    status === "authenticated" &&
    isStudentAccount(user) &&
    !isPublicRoute &&
    !isPortalPath(pathname)
  ) {
    return <AppLoadingScreen />;
  }

  return children;
}
