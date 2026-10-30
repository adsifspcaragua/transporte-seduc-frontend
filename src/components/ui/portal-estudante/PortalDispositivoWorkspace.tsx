"use client";

import { CheckCircle2, Smartphone } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Input, Textarea } from "@/components/form/inputs";
import { useAuth } from "@/hooks/use-auth";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { env } from "@/services/api/env";
import { portalEstudanteService } from "@/services/api/modules/portal-estudante";
import { portalDeviceQuery } from "@/services/api/portal-queries";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import {
  activateEnrollment,
  deviceScope,
  enrollmentPayload,
  loadDeviceKeys,
  prepareEnrollment,
} from "@/services/student-device";
import { PortalError, PortalFeedback, PortalLoading } from "./PortalFeedback";
import { portalDate, portalError } from "./portalPresentation";

export function PortalDispositivoWorkspace() {
  const { user } = useAuth();
  const result = useCachedQuery(portalDeviceQuery);
  const state = result.data?.data;
  const serverDeviceId = state?.dispositivo?.id;
  const request = state?.solicitacao;
  const [reason, setReason] = useState("");
  const [label, setLabel] = useState("");
  const [localDeviceId, setLocalDeviceId] = useState<string | null>(null);
  const [storageError, setStorageError] = useState("");
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const viewVersion = useRef(0);
  useEffect(
    () => () => {
      viewVersion.current++;
    },
    [],
  );
  useEffect(() => {
    let active = true;
    if (!user) return;
    async function readLocal() {
      try {
        const scope = deviceScope(user?.id ?? 0, env.apiUrl);
        const keys = await loadDeviceKeys(scope);
        if (active) {
          const activeDevice = keys.active;
          const matchingDevice = activeDevice
            ? activeDevice.deviceId === serverDeviceId
              ? activeDevice.deviceId
              : null
            : null;
          setLocalDeviceId(matchingDevice);
          setStorageError("");
        }
      } catch (currentError) {
        if (active) setStorageError(portalError(currentError));
      }
    }
    void readLocal();
    return () => {
      active = false;
    };
  }, [user, serverDeviceId]);

  async function run(action: "request" | "cancel" | "conclude") {
    if (!user || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    setFeedback("");
    const session = getQuerySessionVersion();
    const view = viewVersion.current;
    const current = () =>
      session === getQuerySessionVersion() && view === viewVersion.current;
    try {
      if (action === "request") {
        if (state?.dispositivo && !reason.trim())
          throw new Error("Informe por que precisa trocar o dispositivo.");
        const response = await portalEstudanteService.requestDevice(
          reason.trim() || undefined,
        );
        if (!current()) return;
        setFeedback(
          response.message ??
            "Solicitação enviada. Procure o atendimento para conferir sua identidade e autorizar este navegador.",
        );
      } else if (action === "cancel" && request) {
        const response = await portalEstudanteService.cancelDeviceRequest(
          request.id,
        );
        if (!current()) return;
        setFeedback(response.message ?? "Solicitação cancelada.");
      } else if (action === "conclude" && request?.status === "Aprovada") {
        const scope = deviceScope(user.id, env.apiUrl);
        await prepareEnrollment(scope, request.id);
        if (!current()) return;
        const challenge = await portalEstudanteService.enrollmentChallenge(
          request.id,
        );
        if (!current()) return;
        const payload = await enrollmentPayload(
          scope,
          request.id,
          challenge.data,
          label.trim() || undefined,
        );
        if (!current()) return;
        const response = await portalEstudanteService.completeEnrollment(
          request.id,
          payload,
        );
        // A resposta comprovada deve concluir o armazenamento da conta de origem,
        // mesmo se o estudante já tiver saído desta tela ou encerrado a sessão.
        await activateEnrollment(scope, request.id, response.data.id);
        if (!current()) return;
        setLocalDeviceId(response.data.id);
        setFeedback(
          "Este navegador está autorizado para registrar sua presença.",
        );
      }
      if (current()) await result.refresh();
    } catch (currentError) {
      if (current()) {
        setError(portalError(currentError));
        void result.refresh();
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  if (result.isLoading) return <PortalLoading />;
  const matches = Boolean(
    state?.dispositivo && state.dispositivo.id === localDeviceId,
  );
  const openRequest =
    request && (request.status === "Pendente" || request.status === "Aprovada");
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-brand-700">Meu dispositivo</h2>
        <Button
          fullWidth={false}
          variant="secondary"
          loading={result.isFetching}
          onClick={() => void result.refresh()}
        >
          Atualizar situação
        </Button>
      </div>
      <PortalError error={result.error} onRetry={() => void result.refresh()} />
      {storageError && <PortalFeedback>{storageError}</PortalFeedback>}
      {error && <PortalFeedback>{error}</PortalFeedback>}
      {feedback && <PortalFeedback success>{feedback}</PortalFeedback>}
      {state && (
        <section className="space-y-4 rounded-lg border border-brand-600/10 bg-white p-5 shadow-sm">
          <Smartphone className="size-5 text-brand-600" />
          <h3 className="font-bold text-brand-700">Autorização do navegador</h3>
          <p className="text-sm text-content-secondary">
            A presença exige um navegador autorizado pela equipe. A chave fica
            guardada neste navegador; trocar de aparelho, perfil ou apagar os
            dados do site pode exigir uma nova autorização.
          </p>
          {matches ? (
            <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="size-5" />
              Este navegador possui a autorização ativa.
            </p>
          ) : state.dispositivo ? (
            <PortalFeedback>
              A autorização ativa pertence a outro navegador ou a chave local
              não está disponível. Solicite uma troca ao atendimento.
            </PortalFeedback>
          ) : (
            <p className="text-sm font-semibold">
              Nenhum dispositivo autorizado.
            </p>
          )}
          {state.dispositivo?.rotulo && (
            <p className="text-sm">Identificação: {state.dispositivo.rotulo}</p>
          )}
          {request && (
            <div className="rounded-md bg-surface-muted p-4 text-sm">
              <p className="font-semibold">
                Solicitação de {request.tipo.toLowerCase()}: {request.status}
              </p>
              {request.parecer && <p className="mt-2">{request.parecer}</p>}
              {request.aprovacao_expira_em && request.status === "Aprovada" && (
                <p className="mt-2">
                  Conclua até {portalDate(request.aprovacao_expira_em, true)}.
                </p>
              )}
              {request.status === "Pendente" && (
                <p className="mt-2">
                  Aguarde a aprovação da equipe responsável pelo transporte.
                </p>
              )}
            </div>
          )}
          {request?.status === "Aprovada" && (
            <>
              <Input
                label="Nome deste dispositivo (opcional)"
                maxLength={100}
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                disabled={busy}
              />
              <Button
                loading={busy}
                disabled={Boolean(storageError)}
                fullWidth={false}
                variant="primary"
                onClick={() => void run("conclude")}
              >
                Concluir autorização neste navegador
              </Button>
            </>
          )}
          {!openRequest && (
            <>
              <Textarea
                label={
                  state.dispositivo
                    ? "Motivo da troca"
                    : "Observação (opcional)"
                }
                maxLength={500}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                disabled={busy}
              />
              <Button
                loading={busy}
                fullWidth={false}
                variant="primary"
                onClick={() => void run("request")}
              >
                {state.dispositivo
                  ? "Solicitar troca de dispositivo"
                  : "Solicitar autorização"}
              </Button>
            </>
          )}
          {openRequest && (
            <Button
              loading={busy}
              fullWidth={false}
              variant="secondary"
              onClick={() => void run("cancel")}
            >
              Cancelar solicitação
            </Button>
          )}
        </section>
      )}
    </>
  );
}
