import type { ReactNode } from "react";
import { PortalEstudanteLayout } from "@/components/ui/portal-estudante/PortalEstudanteLayout";

export default function PortalLayout({ children }: { children: ReactNode }) {
  return <PortalEstudanteLayout>{children}</PortalEstudanteLayout>;
}
