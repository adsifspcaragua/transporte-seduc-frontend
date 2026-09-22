"use client";

import { useCallback } from "react";

import { useAuthStore } from "@/contexts/auth-store";
import { can, canAny } from "@/utils/authz";

export function useAuthz() {
  const permissions = useAuthStore((state) => state.user?.permissions ?? []);

  const canAccess = useCallback(
    (permission: string) => can(permissions, permission),
    [permissions],
  );
  const canAccessAny = useCallback(
    (required: string[]) => canAny(permissions, required),
    [permissions],
  );

  return {
    permissions,
    can: canAccess,
    canAny: canAccessAny,
  };
}
