const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

test("student endpoints use the authenticated own-account contracts and preserve envelopes", async () => {
  const calls = [];
  const response = {
    data: [{ id: 1 }],
    message: "ok",
    meta: { current_page: 1 },
  };
  function load(name) {
    if (name === "@/services/api/client")
      return {
        api: Object.fromEntries(
          ["get", "post", "delete"].map((method) => [
            method,
            async (url, payload) => {
              calls.push({ method, url, payload });
              return { data: response };
            },
          ]),
        ),
      };
    if (name === "@/services/api/pending-request")
      return { sharePendingRequest: (fn) => fn };
    const filename = path.resolve(__dirname, "../src", `${name.slice(2)}.ts`);
    const exports = {};
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText;
    vm.runInNewContext(source, { exports, require: load }, { filename });
    return exports;
  }
  const { portalEstudanteService: s } = load(
    "@/services/api/modules/portal-estudante",
  );
  assert.equal(await s.device(), response);
  await s.trips();
  await s.presences({ page: 2, per_page: 20 });
  await s.attempts();
  await s.requestDevice("Troca");
  await s.cancelDeviceRequest(7);
  await s.enrollmentChallenge(7);
  const enrollment = {
    chave_publica: "pub",
    desafio_id: "uuid",
    desafio: "text",
    assinatura: "sig",
  };
  await s.completeEnrollment(7, enrollment);
  await s.resolveQr("opaque");
  await s.presenceChallenge("opaque");
  const presence = {
    qr_token: "opaque",
    desafio_id: "uuid",
    desafio: "text",
    assinatura: "sig",
    erro_localizacao: "permissao_negada",
  };
  await s.confirmPresence(presence);
  await s.requestReview(3, "Falha no GPS");
  assert.deepEqual(
    calls.map((c) => [c.method, c.url]),
    [
      ["get", "/me/dispositivo"],
      ["get", "/me/viagens"],
      ["get", "/me/presencas"],
      ["get", "/me/presencas/tentativas"],
      ["post", "/me/dispositivo/solicitacoes"],
      ["delete", "/me/dispositivo/solicitacoes/7"],
      ["post", "/me/dispositivo/solicitacoes/7/desafio"],
      ["post", "/me/dispositivo/solicitacoes/7/concluir"],
      ["post", "/presencas/resolver-qr"],
      ["post", "/presencas/desafios"],
      ["post", "/presencas"],
      ["post", "/me/presencas/tentativas/3/revisao"],
    ],
  );
  assert.equal(calls[7].payload, enrollment);
  assert.equal(calls[10].payload, presence);
  assert.equal(calls[2].payload.params.page, 2);
});
