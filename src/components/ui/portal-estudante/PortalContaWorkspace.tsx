"use client";

import { useAuth } from "@/hooks/use-auth";
import { formatCpf } from "@/utils/cpf";
import { portalDate } from "./portalPresentation";

export function PortalContaWorkspace() {
  const { user } = useAuth();
  const fields = [
    ["Nome", user?.name],
    ["E-mail", user?.email],
    ["CPF", user?.cpf ? formatCpf(user.cpf) : null],
    ["Matrícula", user?.matricula],
    [
      "Nascimento",
      user?.data_nascimento ? portalDate(user.data_nascimento) : null,
    ],
  ];
  return (
    <section className="rounded-lg border border-brand-600/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-brand-700">Dados da minha conta</h2>
      <dl className="mt-5 grid gap-5 sm:grid-cols-2">
        {fields
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase text-content-muted">
                {label}
              </dt>
              <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
            </div>
          ))}
      </dl>
      <p className="mt-6 text-sm text-content-secondary">
        Para corrigir informações da conta, entre em contato com a equipe
        responsável pelo transporte.
      </p>
    </section>
  );
}
