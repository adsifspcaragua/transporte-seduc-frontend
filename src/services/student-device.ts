import type {
  PortalDesafio,
  PortalVinculacaoPayload,
} from "@/types/portal-estudante";

type DeviceKeyPair = { privateKey: CryptoKey; publicKey: CryptoKey };
export type StudentDeviceKeys = {
  active: (DeviceKeyPair & { deviceId: string }) | null;
  pending: (DeviceKeyPair & { requestId: number }) | null;
};
export interface StudentDeviceStorage {
  load(scope: string): Promise<StudentDeviceKeys>;
  update(
    scope: string,
    change: (current: StudentDeviceKeys) => StudentDeviceKeys,
  ): Promise<StudentDeviceKeys>;
  remove(scope: string): Promise<void>;
}

const emptyKeys = (): StudentDeviceKeys => ({ active: null, pending: null });

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(
        new Error(
          "Este navegador não permite guardar a chave de autorização com segurança.",
        ),
      );
      return;
    }
    const request = indexedDB.open("sigtu-student-device", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("credentials");
    request.onerror = () =>
      reject(
        request.error ??
          new Error("Falha ao abrir o armazenamento do dispositivo."),
      );
    request.onblocked = () =>
      reject(
        new Error(
          "Feche outras abas para atualizar o armazenamento do dispositivo.",
        ),
      );
    request.onsuccess = () => resolve(request.result);
  });
}

const browserStorage: StudentDeviceStorage = {
  async load(scope) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("credentials", "readonly");
      const request = transaction.objectStore("credentials").get(scope);
      transaction.oncomplete = () => {
        db.close();
        resolve(request.result ?? emptyKeys());
      };
      transaction.onabort = transaction.onerror = () => {
        db.close();
        reject(
          transaction.error ??
            new Error("Não foi possível ler a chave do dispositivo."),
        );
      };
    });
  },
  async update(scope, change) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("credentials", "readwrite");
      const store = transaction.objectStore("credentials");
      const request = store.get(scope);
      let updated: StudentDeviceKeys;
      let failure: unknown;
      request.onsuccess = () => {
        try {
          updated = change(request.result ?? emptyKeys());
          store.put(updated, scope);
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
      transaction.oncomplete = () => {
        db.close();
        resolve(updated);
      };
      transaction.onabort = transaction.onerror = () => {
        db.close();
        reject(
          failure ??
            transaction.error ??
            new Error("Não foi possível guardar a chave do dispositivo."),
        );
      };
    });
  },
  async remove(scope) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction("credentials", "readwrite");
      transaction.objectStore("credentials").delete(scope);
      transaction.oncomplete = () => {
        db.close();
        resolve();
      };
      transaction.onabort = transaction.onerror = () => {
        db.close();
        reject(
          transaction.error ??
            new Error("Não foi possível remover a chave do dispositivo."),
        );
      };
    });
  },
};

/** API/account isolation; IndexedDB already isolates the frontend origin. */
export function deviceScope(userId: number, apiBaseUrl: string): string {
  if (!Number.isSafeInteger(userId) || userId <= 0)
    throw new Error("Conta inválida para vincular dispositivo.");
  const url = new URL(apiBaseUrl);
  if (
    !/^https?:$/.test(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw new Error("Endereço da API inválido.");
  return JSON.stringify([url.origin, url.pathname.replace(/\/+$/, ""), userId]);
}

export function loadDeviceKeys(
  scope: string,
  storage: StudentDeviceStorage = browserStorage,
) {
  return storage.load(scope);
}

/** Persist BEFORE sending enrollment. An uncertain response must retain this key. */
export async function prepareEnrollment(
  scope: string,
  requestId: number,
  storage: StudentDeviceStorage = browserStorage,
): Promise<void> {
  if (!Number.isSafeInteger(requestId) || requestId <= 0)
    throw new Error("Solicitação de dispositivo inválida.");
  const existing = await storage.load(scope);
  if (existing.pending?.requestId === requestId) return;
  if (!globalThis.crypto?.subtle)
    throw new Error(
      "A autorização do dispositivo exige uma conexão segura e Web Crypto.",
    );
  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign", "verify"],
  );
  // Read-modify-write is atomic in IndexedDB, including concurrent browser tabs.
  await storage.update(scope, (current) =>
    current.pending?.requestId === requestId
      ? current
      : { ...current, pending: { requestId, ...pair } },
  );
}

export function encodeBase64Url(bytes: ArrayBuffer): string {
  return btoa(
    Array.from(new Uint8Array(bytes), (byte) => String.fromCharCode(byte)).join(
      "",
    ),
  )
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function sign(
  privateKey: CryptoKey,
  challenge: PortalDesafio,
): Promise<string> {
  return signText(privateKey, challenge.desafio);
}

async function signText(privateKey: CryptoKey, text: string): Promise<string> {
  if (
    privateKey.extractable ||
    privateKey.type !== "private" ||
    privateKey.algorithm.name !== "ECDSA" ||
    (privateKey.algorithm as EcKeyAlgorithm).namedCurve !== "P-256"
  )
    throw new Error("Chave local inválida. Solicite uma nova autorização.");
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(text),
  );
  return encodeBase64Url(signature);
}

export async function enrollmentPayload(
  scope: string,
  requestId: number,
  challenge: PortalDesafio,
  rotulo?: string,
  storage: StudentDeviceStorage = browserStorage,
): Promise<PortalVinculacaoPayload> {
  const { pending } = await storage.load(scope);
  if (pending?.requestId !== requestId)
    throw new Error("A chave desta solicitação não está neste navegador.");
  return {
    chave_publica: encodeBase64Url(
      await crypto.subtle.exportKey("spki", pending.publicKey),
    ),
    desafio_id: challenge.desafio_id,
    desafio: challenge.desafio,
    assinatura: await sign(pending.privateKey, challenge),
    ...(rotulo ? { rotulo } : {}),
  };
}

/** Only call with the UUID from a definite successful completeEnrollment response.
 * me/dispositivo does not expose the public key/hash and cannot prove a pending
 * key belongs to its active UUID after an enrollment response was lost.
 */
export async function activateEnrollment(
  scope: string,
  requestId: number,
  deviceId: string,
  storage: StudentDeviceStorage = browserStorage,
): Promise<void> {
  if (!deviceId) throw new Error("Dispositivo autorizado inválido.");
  await storage.update(scope, (current) => {
    if (current.pending?.requestId !== requestId)
      throw new Error(
        "Chave pendente não encontrada. Solicite uma nova autorização.",
      );
    return {
      active: {
        privateKey: current.pending.privateKey,
        publicKey: current.pending.publicKey,
        deviceId,
      },
      pending: null,
    };
  });
}

export async function signPresence(
  scope: string,
  serverDeviceId: string,
  challenge: PortalDesafio,
  storage: StudentDeviceStorage = browserStorage,
): Promise<string> {
  const { active } = await storage.load(scope);
  if (!active || active.deviceId !== serverDeviceId)
    throw new Error(
      "Este navegador não possui a chave do dispositivo autorizado. Solicite a troca no atendimento.",
    );
  return sign(active.privateKey, challenge);
}

/**
 * Offline presence proof: no server challenge, so the text is built from the
 * locally stored device id and signed with the same non-exportable key.
 */
export async function signOfflineProof(
  scope: string,
  build: (deviceId: string) => string,
  storage: StudentDeviceStorage = browserStorage,
): Promise<{ comprovante: string; assinatura: string }> {
  const { active } = await storage.load(scope);
  if (!active)
    throw new Error(
      "Sem conexão, e este navegador não tem a chave do dispositivo autorizado.",
    );
  const comprovante = build(active.deviceId);
  return {
    comprovante,
    assinatura: await signText(active.privateKey, comprovante),
  };
}

/** Explicit local removal only; this does not revoke the server credential. */
export function deleteDeviceKeys(
  scope: string,
  storage: StudentDeviceStorage = browserStorage,
) {
  return storage.remove(scope);
}

export function parsePresenceQr(value: string, trustedOrigin: string): string {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Leia ou cole a URL completa do QR Code afixado na van.");
  }
  const trusted = new URL(trustedOrigin);
  const tokens = url.searchParams.getAll("t");
  if (
    !/^https?:$/.test(url.protocol) ||
    url.origin !== trusted.origin ||
    url.username ||
    url.password ||
    url.pathname !== "/presenca/scan" ||
    url.hash ||
    tokens.length !== 1 ||
    !/^[A-Za-z0-9_-]{20,128}$/.test(tokens[0])
  )
    throw new Error("QR Code não reconhecido. Leia o código afixado na van.");
  return tokens[0];
}
