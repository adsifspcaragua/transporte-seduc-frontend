import { PortalEstudanteLayout } from "@/components/ui/portal-estudante/PortalEstudanteLayout";
import { PortalPresencaWorkspace } from "@/components/ui/portal-estudante/PortalPresencaWorkspace";
export default function ScanPage() {
  return (
    <PortalEstudanteLayout>
      <PortalPresencaWorkspace />
    </PortalEstudanteLayout>
  );
}
