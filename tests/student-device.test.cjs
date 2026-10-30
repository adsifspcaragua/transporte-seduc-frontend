const assert = require("node:assert/strict");
const { webcrypto } = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup() {
  const filename = path.resolve(__dirname, "../src/services/student-device.ts");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, {
    exports,
    crypto: webcrypto,
    TextEncoder,
    URL,
    btoa,
    Uint8Array,
    Error,
    Map,
  });
  const records = new Map();
  const store = {
    load: async (key) =>
      structuredClone(records.get(key) ?? { active: null, pending: null }),
    update: async (key, change) => {
      const value = change(
        structuredClone(records.get(key) ?? { active: null, pending: null }),
      );
      records.set(key, structuredClone(value));
      return value;
    },
    remove: async (key) => {
      records.delete(key);
    },
  };
  return { ...exports, store };
}

test("enrollment persists non-exportable key, signs exact UTF-8 P1363 and scopes accounts", async () => {
  const service = setup();
  const scope = service.deviceScope(7, "https://api.example.test/api/");
  assert.notEqual(
    scope,
    service.deviceScope(8, "https://api.example.test/api/"),
  );
  assert.notEqual(
    scope,
    service.deviceScope(7, "https://other.example.test/api/"),
  );
  await service.prepareEnrollment(scope, 14, service.store);
  const original = await service.loadDeviceKeys(scope, service.store);
  assert.equal(original.pending.privateKey.extractable, false);
  await assert.rejects(
    webcrypto.subtle.exportKey("jwk", original.pending.privateKey),
  );
  const desafio = {
    desafio_id: "uuid",
    desafio: "SIGTU\nv1\nvinculacao\ná\n",
    expira_em: "later",
  };
  const payload = await service.enrollmentPayload(
    scope,
    14,
    desafio,
    "Celular",
    service.store,
  );
  const publicKey = await webcrypto.subtle.importKey(
    "spki",
    Buffer.from(payload.chave_publica, "base64url"),
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["verify"],
  );
  assert.equal(Buffer.from(payload.assinatura, "base64url").length, 64);
  assert.equal(
    await webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      Buffer.from(payload.assinatura, "base64url"),
      new TextEncoder().encode(desafio.desafio),
    ),
    true,
  );
  assert.equal(
    await webcrypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      Buffer.from(payload.assinatura, "base64url"),
      new TextEncoder().encode(desafio.desafio.trim()),
    ),
    false,
  );
  await service.prepareEnrollment(scope, 14, service.store);
  const repeated = await service.enrollmentPayload(
    scope,
    14,
    desafio,
    undefined,
    service.store,
  );
  assert.equal(repeated.chave_publica, payload.chave_publica);
  await service.activateEnrollment(scope, 14, "device-1", service.store);
  await service.prepareEnrollment(scope, 15, service.store);
  const replacing = await service.loadDeviceKeys(scope, service.store);
  assert.equal(replacing.active.deviceId, "device-1");
  assert.equal(replacing.pending.requestId, 15);
  await service.signPresence(scope, "device-1", desafio, service.store);
  await assert.rejects(
    service.signPresence(scope, "other-device", desafio, service.store),
  );
  await assert.rejects(
    service.activateEnrollment(scope, 999, "wrong", service.store),
  );
  await service.deleteDeviceKeys(scope, service.store);
  assert.equal(
    (await service.loadDeviceKeys(scope, service.store)).active,
    null,
  );
});

test("simultaneous enrollment preparation reuses one persisted key and failed persistence rejects", async () => {
  const service = setup();
  const scope = service.deviceScope(7, "https://api.test/api");
  await Promise.all([
    service.prepareEnrollment(scope, 14, service.store),
    service.prepareEnrollment(scope, 14, service.store),
  ]);
  const challenge = {
    desafio_id: "uuid",
    desafio: "unchanged",
    expira_em: "later",
  };
  const first = await service.enrollmentPayload(
    scope,
    14,
    challenge,
    undefined,
    service.store,
  );
  await assert.rejects(
    service.enrollmentPayload(scope, 15, challenge, undefined, service.store),
  );
  const otherScope = service.deviceScope(8, "https://api.test/api");
  assert.equal(
    (await service.loadDeviceKeys(otherScope, service.store)).pending,
    null,
  );
  await assert.rejects(
    service.prepareEnrollment(otherScope, 19, {
      ...service.store,
      update: async () => {
        throw new Error("Quota exceeded");
      },
    }),
    /Quota exceeded/,
  );
  const retry = await service.enrollmentPayload(
    scope,
    14,
    challenge,
    undefined,
    service.store,
  );
  assert.equal(first.chave_publica, retry.chave_publica);
});

test("QR parser accepts only the trusted scan URL with one valid opaque token", () => {
  const { parsePresenceQr } = setup();
  const token = "a".repeat(43);
  assert.equal(
    parsePresenceQr(
      `https://app.test/presenca/scan?t=${token}`,
      "https://app.test",
    ),
    token,
  );
  for (const value of [
    `https://evil.test/presenca/scan?t=${token}`,
    `https://app.test/other?t=${token}`,
    `https://app.test/presenca/scan?t=${token}&t=${token}`,
    `https://user:pass@app.test/presenca/scan?t=${token}`,
    `javascript:alert(1)`,
    token,
  ]) {
    assert.throws(() => parsePresenceQr(value, "https://app.test"));
  }
});
