const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// Executa os modulos TypeScript reais, substituindo apenas sessao e transporte.
// Nao precisa de servidor, credenciais ou dependencias adicionais de testes.
function setup(client = {}) {
  let session = { status: "authenticated", user: { id: 1 } };
  const modules = new Map();
  const overrides = {
    "@/contexts/auth-store": { useAuthStore: { getState: () => session } },
    "@/services/api/client": { api: client, publicApi: client },
  };
  function load(name) {
    if (overrides[name]) return overrides[name];
    if (modules.has(name)) return modules.get(name);
    const filename = path.resolve(__dirname, "../src", `${name.slice(2)}.ts`);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    const exports = {};
    modules.set(name, exports);
    vm.runInNewContext(source, { exports, require: load }, { filename });
    return exports;
  }
  return {
    ...load("@/services/api/pending-request"),
    load,
    changeSession: () => {
      session = { status: "authenticated", user: { id: 2 } };
    },
  };
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("compartilha leituras simultaneas e consulta novamente depois de concluir", async () => {
  const { sharePendingRequest } = setup();
  const response = deferred();
  let calls = 0;
  const read = sharePendingRequest(() => {
    calls++;
    return response.promise;
  });
  const first = read();
  const second = read();
  assert.equal(first, second);
  assert.equal(calls, 1);
  response.resolve("ok");
  assert.deepEqual(await Promise.all([first, second]), ["ok", "ok"]);
  await read();
  assert.equal(calls, 2);
});

test("falhas chegam a todos os consumidores e permitem tentar novamente", async () => {
  const { sharePendingRequest } = setup();
  const response = deferred();
  let calls = 0;
  const read = sharePendingRequest(() =>
    ++calls === 1 ? response.promise : Promise.resolve("ok"),
  );
  const first = read();
  assert.equal(first, read());
  response.reject(new Error("offline"));
  await assert.rejects(first, /offline/);
  assert.equal(await read(), "ok");
});

test("paginas e tokens diferentes nunca compartilham resposta", async () => {
  const { sharePendingRequest } = setup();
  let calls = 0;
  const read = sharePendingRequest(async (...args) => {
    calls++;
    return args;
  });
  await Promise.all([read(1, "a"), read(2, "a"), read(1, "b"), read(1, "a")]);
  assert.equal(calls, 3);
});

test("troca de sessao e mutacao invalidam leituras anteriores ainda pendentes", async () => {
  const { sharePendingRequest, invalidatePendingRequests, changeSession } =
    setup();
  const responses = [deferred(), deferred(), deferred()];
  let calls = 0;
  const read = sharePendingRequest(() => responses[calls++].promise);
  const first = read();
  changeSession();
  const second = read();
  invalidatePendingRequests();
  const third = read();
  assert.equal(calls, 3);
  responses[0].resolve("old");
  responses[1].resolve("before mutation");
  await Promise.all([first, second]);
  assert.equal(read(), third);
  responses[2].resolve("current");
  assert.equal(await third, "current");
});

test("duas cargas simultaneas de solicitacoes fazem somente quatro chamadas", async () => {
  const calls = [];
  const inscricao = {
    id: 1,
    documentos: [{ id: 2 }],
    instituicaoAcademica: { course: "Curso" },
  };
  const { load } = setup({
    get: async (url) => {
      calls.push(url);
      return { data: { data: url === "/inscricoes" ? [inscricao] : [] } };
    },
  });
  const { inscricaoService } = load("@/services/api/modules/inscricao");
  const { linhaService } = load("@/services/api/modules/linha");
  const readPage = () =>
    Promise.all([
      inscricaoService.listInscricoes(),
      inscricaoService.listCursos(),
      inscricaoService.listInstituicoes(),
      inscricaoService.listLinhas(),
    ]);
  const [first, second] = await Promise.all([
    readPage(),
    readPage(),
    linhaService.list(),
  ]);
  assert.equal(calls.length, 4);
  assert.equal(first[0][0], inscricao);
  assert.equal(second[0][0], inscricao);
  assert.equal(
    calls.some((url) => /inscricoes\/\d+/.test(url)),
    false,
  );
});
