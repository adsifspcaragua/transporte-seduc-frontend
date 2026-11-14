import { LinhaTransporteWorkspace } from "@/components/ui/transportes/LinhaTransporteWorkspace";

export default async function LinhaTransportePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ aba?: string }>;
}) {
  const { id } = await params;
  const { aba } = await searchParams;
  return <LinhaTransporteWorkspace id={Number(id)} tab={aba ?? "resumo"} />;
}
