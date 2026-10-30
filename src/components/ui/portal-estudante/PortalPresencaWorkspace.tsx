"use client";

import axios from "axios";
import { Camera, CheckCircle2, MapPin, QrCode } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Input } from "@/components/form/inputs";
import { useAuth } from "@/hooks/use-auth";
import { useCachedQuery } from "@/hooks/use-cached-query";
import { useQrCamera } from "@/hooks/use-qr-camera";
import { env } from "@/services/api/env";
import { portalEstudanteService } from "@/services/api/modules/portal-estudante";
import { portalDeviceQuery } from "@/services/api/portal-queries";
import { getQuerySessionVersion } from "@/services/api/query-cache";
import { PENDING_PRESENCE_QR_KEY } from "@/services/navigation/account-navigation";
import {
  deviceScope,
  loadDeviceKeys,
  parsePresenceQr,
  signPresence,
} from "@/services/student-device";
import type {
  PortalErroLocalizacao,
  PortalErroResposta,
  PortalLocalizacao,
  PortalPresenca,
  PortalQrResolvido,
} from "@/types/portal-estudante";
import { PortalError, PortalFeedback } from "./PortalFeedback";
import { portalDate, portalError } from "./portalPresentation";

type LocationResult =
  | { localizacao: PortalLocalizacao; erro_localizacao?: null }
  | { erro_localizacao: PortalErroLocalizacao; localizacao?: null };

function currentLocation(): Promise<LocationResult> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ erro_localizacao: "indisponivel" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          localizacao: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            precisao_metros: position.coords.accuracy,
            timestamp_ms: Math.round(position.timestamp),
          },
        }),
      (error) =>
        resolve({
          erro_localizacao:
            error.code === 1
              ? "permissao_negada"
              : error.code === 3
                ? "tempo_esgotado"
                : "indisponivel",
        }),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  });
}

export function PortalPresencaWorkspace() {
  const { user } = useAuth();
  const device = useCachedQuery(portalDeviceQuery);
  const [qrUrl, setQrUrl] = useState("");
  const [phase, setPhase] = useState<
    "idle" | "resolving" | "locating" | "confirming" | "success" | "error"
  >("idle");
  const [preview, setPreview] = useState<PortalQrResolvido | null>(null);
  const [presence, setPresence] = useState<PortalPresenca | null>(null);
  const [feedback, setFeedback] = useState("");
  const [already, setAlready] = useState(false);
  const [reviewable, setReviewable] = useState(false);
  const busy = useRef(false);
  const viewVersion = useRef(0);
  useEffect(
    () => () => {
      viewVersion.current++;
    },
    [],
  );
  useEffect(() => {
    const url = new URL(window.location.href);
    const token =
      url.pathname === "/presenca/scan"
        ? url.searchParams.get("t")
        : window.sessionStorage.getItem(PENDING_PRESENCE_QR_KEY);
    if (token) {
      setQrUrl(
        `${window.location.origin}/presenca/scan?t=${encodeURIComponent(token)}`,
      );
      window.sessionStorage.removeItem(PENDING_PRESENCE_QR_KEY);
    }
    if (url.pathname === "/presenca/scan" && url.searchParams.has("t"))
      window.history.replaceState(window.history.state, "", url.pathname);
  }, []);

  async function register(value: string) {
    if (!user || busy.current) return;
    busy.current = true;
    camera.stop();
    setPhase("resolving");
    setFeedback("");
    setAlready(false);
    setReviewable(false);
    setPresence(null);
    setPreview(null);
    const session = getQuerySessionVersion();
    const view = viewVersion.current;
    const current = () =>
      session === getQuerySessionVersion() && view === viewVersion.current;
    try {
      const token = parsePresenceQr(value, window.location.origin);
      const scope = deviceScope(user.id, env.apiUrl);
      const state = await portalEstudanteService.device();
      if (!current()) return;
      const local = await loadDeviceKeys(scope);
      if (!current()) return;
      if (
        !state.data.dispositivo ||
        !local.active ||
        local.active.deviceId !== state.data.dispositivo.id
      )
        throw new Error(
          "Este navegador ainda não está autorizado. Acesse Meu dispositivo para solicitar ou concluir sua autorização.",
        );
      const resolved = await portalEstudanteService.resolveQr(token);
      if (!current()) return;
      setPreview(resolved.data);
      setPhase("locating");
      const location = await currentLocation();
      if (!current()) return;
      const challenge = await portalEstudanteService.presenceChallenge(token);
      if (!current()) return;
      const signature = await signPresence(
        scope,
        state.data.dispositivo.id,
        challenge.data,
      );
      if (!current()) return;
      setPhase("confirming");
      const response = await portalEstudanteService.confirmPresence({
        qr_token: token,
        desafio_id: challenge.data.desafio_id,
        desafio: challenge.data.desafio,
        assinatura: signature,
        ...location,
      });
      if (!current()) return;
      setPresence(response.data);
      setFeedback(response.message ?? "Presença registrada com sucesso.");
      setPhase("success");
      setQrUrl("");
    } catch (currentError) {
      if (!current()) return;
      const apiError = axios.isAxiosError<PortalErroResposta>(currentError)
        ? currentError.response?.data
        : null;
      setAlready(apiError?.codigo === "ATTENDANCE_ALREADY_RECORDED");
      setReviewable(Boolean(apiError?.pode_pedir_revisao));
      setFeedback(portalError(currentError));
      setPhase("error");
    } finally {
      busy.current = false;
    }
  }
  const camera = useQrCamera((value) => {
    setQrUrl(value);
    void register(value);
  });
  const isBusy = ["resolving", "locating", "confirming"].includes(phase);
  const stateLabel =
    phase === "resolving"
      ? "QR Code identificado. Validando a viagem…"
      : phase === "locating"
        ? "Obtendo sua localização atual…"
        : phase === "confirming"
          ? "Validando e registrando presença…"
          : null;
  return (
    <>
      <section>
        <h2 className="text-lg font-bold text-brand-700">Registrar presença</h2>
        <p className="mt-1 text-sm text-content-secondary">
          Leia o QR afixado na van durante o horário da sua viagem. Use o
          navegador autorizado e permita o acesso à localização.
        </p>
      </section>
      <PortalError error={device.error} onRetry={() => void device.refresh()} />
      {feedback && (
        <PortalFeedback success={phase === "success" || already}>
          {feedback}
        </PortalFeedback>
      )}
      {presence && (
        <section className="space-y-2 rounded-lg border border-emerald-600/20 bg-white p-5 shadow-sm">
          <CheckCircle2 className="size-5 text-emerald-700" />
          <h3 className="font-bold text-brand-700">Comprovante de presença</h3>
          <p className="text-sm">
            {presence.viagem.linha?.name ?? `Linha ${presence.viagem.linha_id}`}{" "}
            · {presence.viagem.sentido}
          </p>
          <p className="text-sm">{portalDate(presence.registrada_em, true)}</p>
          {presence.ponto && (
            <p className="text-sm">Ponto: {presence.ponto.nome}</p>
          )}
          <Link
            className="inline-block text-sm font-semibold text-brand-600 underline"
            href="/portal-estudante/frequencia"
          >
            Consultar minhas presenças
          </Link>
        </section>
      )}
      {reviewable && (
        <Link
          className="inline-block text-sm font-semibold text-brand-600 underline"
          href="/portal-estudante/frequencia"
        >
          Acompanhar a tentativa e pedir revisão
        </Link>
      )}
      {isBusy && (
        <output
          aria-live="polite"
          className="flex items-center gap-2 text-sm font-semibold text-brand-600"
        >
          <MapPin className="size-5" />
          {stateLabel}
        </output>
      )}
      {preview && isBusy && (
        <p className="text-sm text-content-secondary">
          {preview.viagem.linha?.name ?? `Linha ${preview.viagem.linha_id}`} ·{" "}
          {preview.viagem.sentido} · precisão máxima de GPS:{" "}
          {preview.localizacao.precisao_maxima_metros} m.
        </p>
      )}
      <section className="space-y-4 rounded-lg border border-brand-600/10 bg-white p-5 shadow-sm">
        <h3 className="font-bold text-brand-700">Leitura do QR Code</h3>
        <video
          aria-label="Câmera para leitura do QR Code"
          ref={camera.videoRef}
          muted
          playsInline
          className={
            camera.isStarting || camera.isScanning
              ? "aspect-square max-h-80 w-full rounded-lg bg-slate-950 object-cover"
              : "hidden"
          }
        />
        {camera.error && <PortalFeedback>{camera.error}</PortalFeedback>}
        {camera.isStarting && (
          <output className="text-sm text-content-secondary">
            Solicitando permissão da câmera…
          </output>
        )}
        {camera.isScanning ? (
          <Button fullWidth={false} onClick={camera.stop} variant="secondary">
            Encerrar câmera
          </Button>
        ) : (
          <Button
            fullWidth={false}
            disabled={isBusy}
            loading={camera.isStarting}
            leftIcon={<Camera />}
            onClick={() => void camera.start()}
            variant="primary"
          >
            Ler QR e registrar presença
          </Button>
        )}
        <p className="text-sm text-content-secondary">
          Você também pode escanear com a câmera do celular e abrir a URL do
          UNIBUS, ou informar essa URL abaixo.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void register(qrUrl);
          }}
          className="space-y-3"
        >
          <Input
            label="URL completa do QR Code"
            value={qrUrl}
            disabled={isBusy}
            onChange={(event) => setQrUrl(event.target.value)}
            autoComplete="off"
            inputMode="url"
          />
          <Button
            type="submit"
            fullWidth={false}
            loading={isBusy}
            disabled={!qrUrl.trim() || camera.isStarting || camera.isScanning}
            leftIcon={<QrCode />}
            variant="secondary"
          >
            Validar e registrar
          </Button>
        </form>
        <Link
          className="inline-block text-sm font-semibold text-brand-600 underline"
          href="/portal-estudante/dispositivo"
        >
          Consultar autorização deste navegador
        </Link>
      </section>
    </>
  );
}
