import { redirect } from "next/navigation";
import { TransportesWorkspace } from "@/components/ui/transportes/TransportesWorkspace";

export default async function TransportesPage({
  searchParams,
}: {
  searchParams: Promise<{ linha?: string; configurar?: string }>;
}) {
  const query = await searchParams;
  const lineId = Number(query.linha);
  if (query.configurar === "1" && Number.isSafeInteger(lineId) && lineId > 0)
    redirect(`/transportes/linhas/${lineId}`);
  return <TransportesWorkspace />;
}
