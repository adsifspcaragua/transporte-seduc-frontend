import type { ReactNode } from "react";
import { Button } from "@/components/buttons";
import { Skeleton } from "@/components/loading";
import { portalError } from "./portalPresentation";

export function PortalLoading() {
  return (
    <section
      aria-busy="true"
      aria-label="Carregando informações do estudante"
      className="grid gap-4 sm:grid-cols-2"
    >
      {["first", "second", "third", "fourth"].map((key) => (
        <Skeleton className="h-40 w-full rounded-lg" key={key} />
      ))}
    </section>
  );
}

export function PortalFeedback({
  children,
  success = false,
}: {
  children: ReactNode;
  success?: boolean;
}) {
  return (
    <p
      role={success ? "status" : "alert"}
      className={
        success
          ? "rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
          : "rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
      }
    >
      {children}
    </p>
  );
}

export function PortalError({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry: () => void;
}) {
  if (!error) return null;
  return (
    <div className="space-y-3">
      <PortalFeedback>{portalError(error)}</PortalFeedback>
      <Button fullWidth={false} onClick={onRetry} variant="secondary">
        Tentar novamente
      </Button>
    </div>
  );
}
