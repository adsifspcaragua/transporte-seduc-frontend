"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Textarea } from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import { DataTable } from "@/components/table";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { portalEstudanteService } from "@/services/api/modules/portal-estudante";
import {
  portalAttemptsQuery,
  portalPresencesQuery,
} from "@/services/api/portal-queries";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import type { PortalTentativa } from "@/types/portal-estudante";
import { PortalFeedback } from "./PortalFeedback";
import { portalDate, portalError } from "./portalPresentation";

const columns = [
  { key: "viagem", label: "Viagem" },
  { key: "registro", label: "Registro" },
];
const gridClassName = "md:grid-cols-2";
type PerPage = 10 | 15 | 20 | 30;
const validPerPage = (value: number): value is PerPage =>
  [10, 15, 20, 30].includes(value);

function PresencasList() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(10);
  const result = useCachedQuery(portalPresencesQuery, {
    page,
    per_page: perPage,
  });
  const meta = result.data?.meta;
  return (
    <DataTable
      columns={columns}
      data={result.data?.data ?? []}
      emptyMessage="Nenhuma presença registrada."
      errorMessage={result.error ? portalError(result.error) : ""}
      getRowKey={(item) => item.id}
      gridClassName={gridClassName}
      loading={result.isLoading}
      onRetry={() => void result.refresh()}
      pagination={
        meta
          ? {
              currentPage: page,
              from: meta.from,
              to: meta.to,
              total: meta.total,
              lastPage: meta.last_page,
              perPage,
              onPageChange: setPage,
              onPerPageChange: (value) => {
                if (validPerPage(value)) {
                  setPerPage(value);
                  setPage(1);
                }
              },
            }
          : undefined
      }
      renderRow={(item) => (
        <article className="grid gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-2">
          <div>
            <h3 className="text-sm font-bold text-brand-700">
              {item.viagem?.linha?.name ?? `Viagem ${item.viagem?.id ?? ""}`} ·{" "}
              {item.viagem?.sentido}
            </h3>
            <p className="mt-1 text-xs text-content-muted">
              {portalDate(item.viagem?.data)}
            </p>
            {item.veiculo && (
              <p className="mt-1 text-sm">{item.veiculo.identificacao}</p>
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              Presença registrada
            </p>
            <p className="mt-1 text-xs text-content-muted">
              {portalDate(item.registrada_em, true)} ·{" "}
              {item.metodo === "Manual"
                ? "Lançamento administrativo"
                : "QR Code"}
            </p>
            {item.ponto && (
              <p className="mt-2 text-sm">Ponto: {item.ponto.nome}</p>
            )}
          </div>
        </article>
      )}
    />
  );
}

function TentativasList() {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<PerPage>(10);
  const result = useCachedQuery(portalAttemptsQuery, {
    page,
    per_page: perPage,
  });
  const [selected, setSelected] = useState<PortalTentativa | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  async function requestReview() {
    if (!selected || busyRef.current) return;
    if (reason.trim().length < 5) {
      setError("Descreva o motivo com pelo menos 5 caracteres.");
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setError("");
    const session = getQuerySessionVersion();
    try {
      const response = await portalEstudanteService.requestReview(
        selected.id,
        reason.trim(),
      );
      if (session !== getQuerySessionVersion()) return;
      setFeedback(
        response.message ??
          "Pedido de revisão enviado. Aguarde a análise da equipe.",
      );
      setSelected(null);
      setReason("");
      await result.refresh();
    } catch (currentError) {
      if (session === getQuerySessionVersion())
        setError(portalError(currentError));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const meta = result.data?.meta;
  return (
    <>
      {feedback && <PortalFeedback success>{feedback}</PortalFeedback>}
      <DataTable
        columns={[
          { key: "tentativa", label: "Tentativa" },
          { key: "revisao", label: "Revisão" },
        ]}
        data={result.data?.data ?? []}
        emptyMessage="Nenhuma tentativa negada."
        errorMessage={result.error ? portalError(result.error) : ""}
        getRowKey={(item) => item.id}
        gridClassName={gridClassName}
        loading={result.isLoading}
        onRetry={() => void result.refresh()}
        pagination={
          meta
            ? {
                currentPage: page,
                from: meta.from,
                to: meta.to,
                total: meta.total,
                lastPage: meta.last_page,
                perPage,
                onPageChange: setPage,
                onPerPageChange: (value) => {
                  if (validPerPage(value)) {
                    setPerPage(value);
                    setPage(1);
                  }
                },
              }
            : undefined
        }
        renderRow={(item) => (
          <article className="grid gap-3 border-b border-border-subtle px-5 py-4 last:border-b-0 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-brand-700">
                {item.viagem?.linha?.name ?? "Tentativa de presença"}
              </h3>
              <p className="mt-1 text-sm text-content-secondary">
                {item.mensagem ?? "Registro não autorizado."}
              </p>
              <p className="mt-2 text-xs text-content-muted">
                {portalDate(item.recebida_em, true)}
              </p>
            </div>
            <div>
              {item.revisao ? (
                <>
                  <p className="text-sm font-semibold">
                    {item.revisao.status === "Pendente"
                      ? "Aguardando análise"
                      : `Revisão ${item.revisao.status.toLowerCase()}`}
                  </p>
                  {item.revisao.parecer && (
                    <p className="mt-1 text-sm text-content-secondary">
                      {item.revisao.parecer}
                    </p>
                  )}
                </>
              ) : item.pode_pedir_revisao ? (
                <Button
                  fullWidth={false}
                  onClick={() => {
                    setSelected(item);
                    setError("");
                    setReason("");
                  }}
                  variant="secondary"
                >
                  Pedir revisão
                </Button>
              ) : (
                <p className="text-sm text-content-muted">
                  Revisão não disponível para esta tentativa.
                </p>
              )}
            </div>
          </article>
        )}
      />
      <Modal
        open={Boolean(selected)}
        title="Solicitar revisão da presença"
        onClose={() => {
          if (!busy) setSelected(null);
        }}
        onSave={() => void requestReview()}
        saveLabel="Enviar pedido"
        saveLoading={busy}
      >
        <p className="mb-4 text-sm text-content-secondary">
          Explique o ocorrido para a equipe responsável. O envio do pedido não
          registra uma presença automaticamente.
        </p>
        <Textarea
          label="Motivo"
          required
          minLength={5}
          maxLength={1000}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          error={error}
          disabled={busy}
        />
      </Modal>
    </>
  );
}

export function PortalFrequenciaWorkspace() {
  const [tab, setTab] = useState<"presencas" | "tentativas">("presencas");
  return (
    <>
      <div>
        <h2 className="text-lg font-bold text-brand-700">Minha frequência</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Comprovantes individuais e acompanhamento das tentativas de registro.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          fullWidth={false}
          aria-pressed={tab === "presencas"}
          variant={tab === "presencas" ? "primary" : "secondary"}
          onClick={() => setTab("presencas")}
        >
          Presenças
        </Button>
        <Button
          fullWidth={false}
          aria-pressed={tab === "tentativas"}
          variant={tab === "tentativas" ? "primary" : "secondary"}
          onClick={() => setTab("tentativas")}
        >
          Tentativas e revisões
        </Button>
      </div>
      {tab === "presencas" ? <PresencasList /> : <TentativasList />}
    </>
  );
}
