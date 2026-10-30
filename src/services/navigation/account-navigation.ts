import type { AuthUser } from "@/types/auth";

export const PENDING_PRESENCE_QR_KEY = "unibus:presenca:qr-pendente";

export function isStudentAccount(user: Pick<AuthUser, "roles"> | null) {
  return Boolean(
    user?.roles.includes("estudante") &&
      !user.roles.some((role) =>
        ["admin", "gestor", "operador", "motorista"].includes(role),
      ),
  );
}

export function accountHome(
  user: Pick<AuthUser, "roles"> | null,
  pendingQr = false,
) {
  if (isStudentAccount(user)) {
    return pendingQr ? "/portal-estudante/presenca" : "/portal-estudante";
  }
  return "/";
}

export function isPortalPath(pathname: string) {
  return (
    pathname === "/portal-estudante" ||
    pathname.startsWith("/portal-estudante/") ||
    pathname === "/presenca/scan"
  );
}
