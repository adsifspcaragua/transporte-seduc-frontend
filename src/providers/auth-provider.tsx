"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
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

    const isPublicRoute = publicRoutes.includes(pathname);

    useEffect(() => {
        if (!hasHydrated) return;

        if (!token && !isPublicRoute) {
            router.replace("/login");
            return;
        }

        if (token && isPublicRoute) {
            router.replace("/");
        }
    }, [hasHydrated, token, isPublicRoute, router]);

    useEffect(() => {
        if (!hasHydrated || !token || user) return;

        authService
            .me()
            .then(setUser)
            .catch(() => {
                clearAuth();
                router.replace("/login");
            });
    }, [hasHydrated, token, user, setUser, clearAuth, router]);

    if (!hasHydrated) return null;

    return children;
}