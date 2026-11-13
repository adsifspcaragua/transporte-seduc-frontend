const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

test("access requests a code before resolving an existing student's flow", async () => {
  const calls = [];
  const source = fs.readFileSync(
    path.resolve(__dirname, "../src/services/api/modules/recadastro.ts"),
    "utf8",
  );
  const exports = {};
  const responses = [
    {
      fluxo: "verificacao",
      data: {
        email_mascarado: "an***@e***.com",
        validade_minutos: 10,
        reenvio_em_segundos: 60,
      },
    },
    { fluxo: "lista_espera", data: { inscricao: { id: 3 } } },
  ];
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === "@/services/api/client")
          return {
            api: {},
            publicApi: {
              async post(url, payload) {
                calls.push({ url, payload });
                return { data: responses.shift() };
              },
            },
          };
        if (name === "@/services/api/endpoints")
          return {
            API_ENDPOINTS: {
              AREA_ESTUDANTE: {
                ACESSO: "/area-estudante/acesso",
                VERIFICAR: "/area-estudante/acesso/verificar",
              },
            },
          };
        if (name === "@/services/api/pending-request")
          return { sharePendingRequest: (fn) => fn };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    },
  );
  const service = exports.recadastroService;
  assert.equal((await service.acessar("12345678901")).fluxo, "verificacao");
  assert.equal(
    (await service.verificarAcesso("12345678901", "004271")).fluxo,
    "lista_espera",
  );
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    { url: "/area-estudante/acesso", payload: { cpf: "12345678901" } },
    {
      url: "/area-estudante/acesso/verificar",
      payload: { cpf: "12345678901", codigo: "004271" },
    },
  ]);
});

test("recadastro listing keeps pagination and sends server filters", async () => {
  const calls = [];
  const source = fs.readFileSync(
    path.resolve(__dirname, "../src/services/api/modules/recadastro.ts"),
    "utf8",
  );
  const exports = {};
  const response = {
    data: [{ id: 11 }],
    meta: {
      current_page: 2,
      last_page: 3,
      per_page: 10,
      total: 25,
      from: 11,
      to: 20,
    },
  };
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === "@/services/api/client")
          return {
            api: {
              async get(url, options) {
                calls.push({ url, options });
                return { data: response };
              },
            },
            publicApi: {},
          };
        if (name === "@/services/api/endpoints")
          return {
            API_ENDPOINTS: {
              RECADASTRO: { SOLICITACOES: "/reecadastro/solicitacoes" },
            },
          };
        if (name === "@/services/api/pending-request")
          return { sharePendingRequest: (fn) => fn };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    },
  );
  const result = await exports.recadastroService.listSolicitacoes({
    page: 2,
    status: "Em analise",
    busca: "Ana",
  });
  assert.equal(result.meta.total, 25);
  assert.equal(result.data[0].id, 11);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    {
      url: "/reecadastro/solicitacoes",
      options: { params: { page: 2, status: "Em analise", busca: "Ana" } },
    },
  ]);
});
