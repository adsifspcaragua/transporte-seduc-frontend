import axios from "axios";
import { signOfflineProof } from "@/services/student-device";
import type {
  PortalDataResponse,
  PortalErroLocalizacao,
  PortalLocalizacao,
  PortalTentativa,
} from "@/types/portal-estudante";

/**
 * Presença registrada sem conexão.
 *
 * Sem internet não há desafio do servidor: o navegador monta o comprovante no
 * formato que a API define (ComprovanteOffline no backend), assina com a chave
 * do dispositivo e guarda aqui. Quando a conexão volta, envia. A API nunca
 * transforma o comprovante em presença sozinha: ele vai para a revisão da
 * gestão, porque horário e GPS do celular não são confiáveis.
 */

export type OfflineLocation =
  | { localizacao: PortalLocalizacao; erro_localizacao?: null }
  | { erro_localizacao: PortalErroLocalizacao; localizacao?: null };

export type PendingProof = {
  id: string;
  scope: string;
  comprovante: string;
  assinatura: string;
  capturadoEm: number;
};

export type OfflineSyncResult = {
  sent: PortalTentativa[];
  rejected: { proof: PendingProof; message: string }[];
  remaining: number;
};

type SendProof = (payload: {
  comprovante: string;
  assinatura: string;
}) => Promise<PortalDataResponse<PortalTentativa>>;

const DATABASE = "sigtu-presenca-offline";
const STORE = "comprovantes";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        new Error("Este navegador não permite guardar o registro sem conexão."),
      );
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: "id" });
      store.createIndex("scope", "scope");
    };
    request.onerror = () =>
      reject(
        request.error ?? new Error("Falha ao abrir os registros sem conexão."),
      );
    request.onsuccess = () => resolve(request.result);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T> | undefined,
): Promise<T | undefined> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE, mode);
    const request = run(transaction.objectStore(STORE));
    transaction.oncomplete = () => {
      db.close();
      resolve(request?.result);
    };
    transaction.onabort = transaction.onerror = () => {
      db.close();
      reject(
        transaction.error ??
          new Error("Não foi possível acessar os registros sem conexão."),
      );
    };
  });
}

function locationLine(location: OfflineLocation): string {
  if (!location.localizacao) return `local:erro:${location.erro_localizacao}`;
  const { latitude, longitude, precisao_metros } = location.localizacao;
  return `local:${latitude.toFixed(7)},${longitude.toFixed(7)},${Math.max(1, Math.round(precisao_metros))}`;
}

/** Monta, assina e guarda o comprovante neste navegador. */
export async function createOfflineProof(
  scope: string,
  qrToken: string,
  location: OfflineLocation,
): Promise<PendingProof> {
  const id = crypto.randomUUID();
  const capturadoEm = Date.now();
  const { comprovante, assinatura } = await signOfflineProof(
    scope,
    (deviceId) =>
      [
        "SIGTU",
        "v1",
        "presenca-offline",
        id,
        `dispositivo:${deviceId}`,
        `qr:${qrToken}`,
        `capturado_em:${capturadoEm}`,
        locationLine(location),
      ].join("\n"),
  );
  const proof = { id, scope, comprovante, assinatura, capturadoEm };
  await withStore("readwrite", (store) => store.put(proof));
  return proof;
}

export async function pendingProofs(scope: string): Promise<PendingProof[]> {
  const all =
    (await withStore<PendingProof[]>("readonly", (store) =>
      store.index("scope").getAll(scope),
    )) ?? [];
  return all.sort((a, b) => a.capturadoEm - b.capturadoEm);
}

async function removeProof(id: string) {
  await withStore("readwrite", (store) => store.delete(id));
}

/**
 * Sem resposta, erro do servidor ou sessão expirada: tenta de novo depois.
 * Qualquer outra resposta é definitiva para aquele comprovante.
 */
function shouldRetry(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) return true;
  const status = error.response.status;
  return status >= 500 || [401, 408, 419, 425, 429].includes(status);
}

let running: Promise<OfflineSyncResult> | null = null;

/** Envia os comprovantes guardados. Chamadas simultâneas compartilham o envio. */
export function syncOfflineProofs(
  scope: string,
  send: SendProof,
  describe: (error: unknown) => string,
): Promise<OfflineSyncResult> {
  running ??= (async () => {
    const result: OfflineSyncResult = { sent: [], rejected: [], remaining: 0 };
    for (const proof of await pendingProofs(scope)) {
      try {
        const response = await send({
          comprovante: proof.comprovante,
          assinatura: proof.assinatura,
        });
        await removeProof(proof.id);
        result.sent.push(response.data);
      } catch (error) {
        if (shouldRetry(error)) break;
        await removeProof(proof.id);
        result.rejected.push({ proof, message: describe(error) });
      }
    }
    result.remaining = (await pendingProofs(scope)).length;
    return result;
  })().finally(() => {
    running = null;
  });
  return running;
}

/** A requisição nem chegou ao servidor. */
export function isConnectionError(error: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  return axios.isAxiosError(error) && !error.response;
}
