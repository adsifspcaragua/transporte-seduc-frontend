"use client";

import { CloudOff, CloudUpload, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { env } from "@/services/api/env";
import { portalEstudanteService } from "@/services/api/modules/portal-estudante";
import {
  OFFLINE_QUEUE_EVENT,
  OFFLINE_SYNC_EVENT,
  type OfflineSyncResult,
  pendingProofs,
  syncOfflineProofs,
} from "@/services/offline-presence";
import { deviceScope } from "@/services/student-device";
import { portalDate, portalError } from "./portalPresentation";

/** Tentativa periódica enquanto houver registro guardado e rede. */
const NOVA_TENTATIVA_MS = 60_000;

type Aviso = { sucesso: boolean; texto: string };

function textoDoEnvio(resultado: OfflineSyncResult): Aviso | null {
  const enviados = resultado.sent.map((tentativa) => {
    const viagem = tentativa.viagem
      ? `${tentativa.viagem.linha?.name ?? `Linha ${tentativa.viagem.linha_id}`} · ${tentativa.viagem.sentido}`
      : "viagem";
    return `${viagem}, lida em ${portalDate(tentativa.capturado_em ?? tentativa.recebida_em, true)}`;
  });
  const recusados = resultado.rejected.map(
    (item) =>
      `Registro de ${portalDate(new Date(item.proof.capturadoEm).toISOString(), true)} recusado: ${item.message}`,
  );

  if (recusados.length > 0)
    return { sucesso: false, texto: [...recusados].join(" ") };
  if (enviados.length === 0) return null;

  return {
    sucesso: true,
    texto: `${enviados.length === 1 ? "Sua presença registrada sem internet foi enviada" : `${enviados.length} presenças registradas sem internet foram enviadas`} (${enviados.join("; ")}). A gestão vai confirmar; acompanhe em Frequência.`,
  };
}

/**
 * Faixa do portal para a presença sem internet: avisa quando o aparelho está
 * offline, mostra o que está guardado e envia sozinha quando a conexão volta
 * (ao abrir o portal, no evento "online" e a cada minuto), avisando o estudante.
 */
export function PresencaOfflineAviso({ userId }: { userId: number }) {
  const [online, setOnline] = useState(true);
  const [pendentes, setPendentes] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<Aviso | null>(null);

  const scope = deviceScope(userId, env.apiUrl);

  const enviar = useCallback(() => {
    if (!navigator.onLine) return;
    setEnviando(true);
    void syncOfflineProofs(
      scope,
      (payload) => portalEstudanteService.sendOfflineProof(payload),
      portalError,
    )
      .catch(() => undefined)
      .finally(() => setEnviando(false));
  }, [scope]);

  useEffect(() => {
    const contar = () =>
      void pendingProofs(scope)
        .then((itens) => setPendentes(itens.length))
        .catch(() => undefined);
    const aoEnviar = (evento: Event) => {
      const resultado = (evento as CustomEvent<OfflineSyncResult>).detail;
      setPendentes(resultado.remaining);
      const novo = textoDoEnvio(resultado);
      if (novo) {
        setAviso(novo);
        navigator.vibrate?.(200);
      }
    };
    const aoMudarRede = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine) enviar();
    };

    setOnline(navigator.onLine);
    contar();
    enviar();
    window.addEventListener("online", aoMudarRede);
    window.addEventListener("offline", aoMudarRede);
    window.addEventListener(OFFLINE_QUEUE_EVENT, contar);
    window.addEventListener(OFFLINE_SYNC_EVENT, aoEnviar);
    const timer = window.setInterval(() => {
      contar();
      enviar();
    }, NOVA_TENTATIVA_MS);

    return () => {
      window.removeEventListener("online", aoMudarRede);
      window.removeEventListener("offline", aoMudarRede);
      window.removeEventListener(OFFLINE_QUEUE_EVENT, contar);
      window.removeEventListener(OFFLINE_SYNC_EVENT, aoEnviar);
      window.clearInterval(timer);
    };
  }, [scope, enviar]);

  const guardados =
    pendentes === 1
      ? "1 presença guardada neste celular aguardando envio."
      : `${pendentes} presenças guardadas neste celular aguardando envio.`;

  return (
    <div className="space-y-3" data-testid="presenca-offline-aviso">
      {!online && (
        <output className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-900">
          <CloudOff aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>
            Você está sem internet. Ainda dá para registrar a presença lendo o
            QR da van: ela fica guardada no celular e é enviada sozinha quando a
            conexão voltar.
            {pendentes > 0 && ` ${guardados}`}
          </span>
        </output>
      )}
      {online && pendentes > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-600/15 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-content-secondary">
            {guardados} O envio é automático.
          </p>
          <Button
            fullWidth={false}
            leftIcon={<CloudUpload />}
            loading={enviando}
            onClick={enviar}
            variant="secondary"
          >
            Enviar agora
          </Button>
        </div>
      )}
      {aviso && (
        <div
          className={
            aviso.sucesso
              ? "flex items-start justify-between gap-3 rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800"
              : "flex items-start justify-between gap-3 rounded-lg border border-danger-600/20 bg-red-50 px-4 py-3 text-sm font-medium text-danger-600"
          }
          role={aviso.sucesso ? "status" : "alert"}
        >
          <span>{aviso.texto}</span>
          <button
            aria-label="Fechar aviso"
            className="shrink-0 cursor-pointer rounded p-1 hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-brand-600"
            onClick={() => setAviso(null)}
            type="button"
          >
            <X aria-hidden="true" className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}
