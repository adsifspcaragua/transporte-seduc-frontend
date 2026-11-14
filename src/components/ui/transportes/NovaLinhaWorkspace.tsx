"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { TextSkeleton } from "@/components/loading";
import { useAuthz } from "@/hooks/use-authz";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { linhasQuery } from "@/services/api/page-queries";
import { TransporteLinhaStep } from "./TransporteLinhaStep";

export function NovaLinhaWorkspace() {
  const router = useRouter();
  const { can } = useAuthz();
  const result = useCachedQuery(linhasQuery);
  return (
    <div className="space-y-5">
      <Link
        href="/transportes"
        className="text-sm font-semibold text-brand-700"
      >
        ← Gestão do transporte
      </Link>
      <header>
        <h1 className="text-2xl font-bold text-brand-700">Nova linha</h1>
        <p className="mt-2 text-sm text-content-muted">
          Salve os dados básicos e prossiga nas abas da linha. Cada configuração
          é gravada separadamente.
        </p>
      </header>
      {!can("linhas.write") || !can("linhas.view") ? (
        <p role="alert">Seu perfil não permite cadastrar linhas.</p>
      ) : result.isLoading ? (
        <TextSkeleton />
      ) : result.error ? (
        <p role="alert">Não foi possível consultar as linhas existentes.</p>
      ) : (
        <div className="rounded-xl border border-border-subtle bg-white p-5">
          <TransporteLinhaStep
            linhas={{ data: result.data ?? [] }}
            selected={null}
            onSelect={(id) =>
              router.push(`/transportes/linhas/${id}?aba=veiculo`)
            }
            onSaved={() => {}}
            refresh={() => void result.refresh()}
          />
        </div>
      )}
    </div>
  );
}
