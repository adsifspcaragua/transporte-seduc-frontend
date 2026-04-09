"use client";

import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { authService } from "@/features/auth/services/auth.service";
import { useAuthStore } from "@/store/auth.store";

const publicRoutes = ["/login", "/recuperar-senha"];

type AuthProviderProps = {
    children: ReactNode;
};

export default function AuthProvider({ children }: AuthProviderProps) {
    const pathname = usePathname();
    const router = useRouter();

    const token = useAuthStore((state) => state.token);
    const user = useAuthStore((state) => state.user);
    const hasHydrated = useAuthStore((state) => state.hasHydrated);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const setUser = useAuthStore((state) => state.setUser);

    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    const isPublicRoute = useMemo(
        () => publicRoutes.includes(pathname),
        [pathname]
    );

    useEffect(() => {
        if (!hasHydrated) return;

        async function checkAuth() {
            if (!token) {
                setIsCheckingAuth(false);

                if (!isPublicRoute) {
                    router.replace("/login");
                }

                return;
            }

            if (user) {
                setIsCheckingAuth(false);

                if (isPublicRoute) {
                    router.replace("/");
                }

                return;
            }

            try {
                const me = await authService.me();
                setUser(me);

                if (isPublicRoute) {
                    router.replace("/");
                }
            } catch {
                clearAuth();

                if (!isPublicRoute) {
                    router.replace("/login");
                }
            } finally {
                setIsCheckingAuth(false);
            }
        }

        void checkAuth();
    }, [hasHydrated, token, user, isPublicRoute, router, setUser, clearAuth]);

    if (!hasHydrated) {
        return null;
    }

    if (!isPublicRoute && (!token || isCheckingAuth)) {
        return null;
    }

    if (isPublicRoute && token) {
        return null;
    }

    return children;
}