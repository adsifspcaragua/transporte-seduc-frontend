const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup(client) {
  let now = 1000;
  let session = { user: { id: 1 }, status: "authenticated" };
  const listeners = new Set();
  const modules = new Map();
  const auth = {
    useAuthStore: {
      getState: () => session,
      subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      },
    },
  };
  function load(name) {
    if (name === "@/contexts/auth-store") return auth;
    if (name === "@/services/api/env")
      return { env: { apiUrl: "http://localhost:8000/api" } };
    if (client && name === "@/services/api/client")
      return { api: client, publicApi: client };
    if (!name.startsWith("@/")) return require(name);
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
    vm.runInNewContext(
      source,
      { exports, Date: { now: () => now }, require: load },
      { filename },
    );
    return exports;
  }
  return {
    ...load("@/services/api/query-cache"),
    load,
    advance: (ms) => {
      now += ms;
    },
    changeSession: (user = { id: 2 }) => {
      session = { user, status: user ? "authenticated" : "guest" };
      for (const listener of listeners) listener();
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

test("primeiro acesso busca e retorno reutiliza inclusive listas vazias", async () => {
  const { createCachedQuery } = setup();
  let calls = 0;
  const query = createCachedQuery(async () => {
    calls++;
    return [];
  });
  assert.equal(query.getSnapshot().data, undefined);
  await query.fetch();
  assert.equal(query.getSnapshot().data.length, 0);
  await query.fetch();
  assert.equal(calls, 1);
});

test("resposta de mutacao atualiza cache mesmo se a revalidacao falhar", async () => {
  const { createCachedQuery, invalidateQueries, getQuerySessionVersion } =
    setup();
  let calls = 0;
  const query = createCachedQuery(async () => {
    if (++calls > 1) throw new Error("offline");
    return [{ id: 2, ativo: true }];
  });
  await query.fetch();
  invalidateQueries();
  query.updateData(getQuerySessionVersion(), (current) =>
    current.map((user) => ({ ...user, ativo: false })),
  );
  await assert.rejects(query.fetch(), /offline/);
  assert.equal(query.getSnapshot().data[0].ativo, false);
});

test("expiracao atualiza em segundo plano e falha preserva dados", async () => {
  const { createCachedQuery, advance } = setup();
  const next = deferred();
  let calls = 0;
  const query = createCachedQuery(() =>
    ++calls === 1 ? Promise.resolve([1]) : next.promise,
  );
  await query.fetch();
  advance(60001);
  const refresh = query.fetch();
  assert.equal(query.getSnapshot().data[0], 1);
  assert.equal(query.getSnapshot().isFetching, true);
  next.reject(new Error("offline"));
  await assert.rejects(refresh, /offline/);
  assert.equal(query.getSnapshot().data[0], 1);
  assert.equal(query.getSnapshot().isFetching, false);
  assert.match(query.getSnapshot().error.message, /offline/);
});

test("concorrencia compartilha promessa e parametros separam pagina e filtros", async () => {
  const { createCachedQuery } = setup();
  let calls = 0;
  const query = createCachedQuery(async (params) => {
    calls++;
    return params.page;
  });
  const first = query.fetch({ page: 1, search: "ana" });
  assert.equal(first, query.fetch({ search: "ana", page: 1 }));
  await first;
  await query.fetch({ page: 2, search: "ana" });
  await query.fetch({ page: 1, search: "bia" });
  assert.equal(calls, 3);
  assert.equal(query.getSnapshot({ page: 1, search: "ana" }).data, 1);
});

test("mutacao invalida cache sem esconder dados e descarta resposta anterior", async () => {
  const { createCachedQuery, invalidateQueries } = setup();
  const old = deferred();
  let calls = 0;
  const query = createCachedQuery(() =>
    ++calls === 1 ? old.promise : Promise.resolve("novo"),
  );
  const first = query.fetch();
  invalidateQueries();
  await query.fetch();
  old.resolve("antigo");
  await first;
  assert.equal(query.getSnapshot().data, "novo");
  invalidateQueries();
  assert.equal(query.getSnapshot().data, "novo");
  await query.fetch();
  assert.equal(calls, 3);
});

test("logout e troca de sessao limpam dados e impedem resposta da sessao antiga", async () => {
  const { createCachedQuery, changeSession } = setup();
  const old = deferred();
  let calls = 0;
  const query = createCachedQuery(() =>
    ++calls === 1 ? old.promise : Promise.resolve("usuario 2"),
  );
  const first = query.fetch();
  changeSession();
  assert.equal(query.getSnapshot().data, undefined);
  await query.fetch();
  old.resolve("usuario 1");
  await first;
  assert.equal(query.getSnapshot().data, "usuario 2");
  changeSession(null);
  assert.equal(query.getSnapshot().data, undefined);
});

test("atualizar perfil da mesma sessao preserva cache, mas mudar permissoes limpa", async () => {
  const { createCachedQuery, changeSession } = setup();
  let calls = 0;
  const query = createCachedQuery(async () => ++calls);
  await query.fetch();
  changeSession({ id: 1, name: "Nome atualizado" });
  await query.fetch();
  assert.equal(calls, 1);
  changeSession({
    id: 1,
    name: "Nome atualizado",
    permissions: ["users.view"],
  });
  assert.equal(query.getSnapshot().data, undefined);
});

test("mutacao iniciada em outra sessao nao grava dados no cache da sessao atual", async () => {
  const { createCachedQuery, changeSession, getQuerySessionVersion } = setup();
  const query = createCachedQuery(async () => [
    { id: 2, name: "Sessao atual" },
  ]);
  await query.fetch();
  const mutationSession = getQuerySessionVersion();
  changeSession();
  await query.fetch();
  query.updateData(mutationSession, () => [{ id: 1, name: "Sessao antiga" }]);
  assert.equal(query.getSnapshot().data[0].name, "Sessao atual");
  changeSession({ id: 1 });
  await query.fetch();
  query.updateData(mutationSession, () => [{ id: 1, name: "Sessao antiga" }]);
  assert.equal(query.getSnapshot().data[0].name, "Sessao atual");
});

test("atualizacao explicita ignora validade, notifica consumidores e aceita nova tentativa", async () => {
  const { createCachedQuery } = setup();
  let calls = 0;
  let notifications = 0;
  const query = createCachedQuery(async () => {
    calls++;
    if (calls === 1) throw new Error("offline");
    return calls;
  });
  const unsubscribe = query.subscribe(() => {
    notifications++;
  });
  await assert.rejects(query.fetch(), /offline/);
  await query.fetch();
  assert.equal(query.getSnapshot().data, 2);
  await query.refresh();
  assert.equal(query.getSnapshot().data, 3);
  assert.ok(notifications >= 6);
  unsubscribe();
});

test("consultas das paginas atuais reutilizam servicos e opcoes sem requisicoes redundantes", async () => {
  const calls = [];
  const { load } = setup({
    get: async (url) => {
      calls.push(url);
      if (url === "/estudantes")
        return { data: { data: [], meta: { total: 0 } } };
      return { data: { data: [] } };
    },
  });
  const queries = load("@/services/api/page-queries");
  const visitAll = () =>
    Promise.all([
      queries.linhasQuery.fetch(),
      queries.usersQuery.fetch(),
      queries.studentsQuery.fetch(1, 10),
      queries.solicitacoesQuery.fetch(),
      queries.recadastroQuery.fetch(true, true),
    ]);
  await visitAll();
  const initialCalls = calls.length;
  await visitAll();
  assert.equal(calls.length, initialCalls);
  assert.equal(calls.filter((url) => url === "/linha").length, 1);
  assert.equal(calls.filter((url) => url === "/inscricoes").length, 1);
  assert.equal(queries.usersQuery.getSnapshot().data.length, 0);
});

test("recadastro consulta somente colecoes autorizadas", async () => {
  const calls = [];
  const { load } = setup({
    get: async (url) => {
      calls.push(url);
      return { data: { data: [] } };
    },
  });
  const { recadastroQuery } = load("@/services/api/page-queries");
  await recadastroQuery.fetch(true, false);
  assert.deepEqual(calls, ["/reecadastro/periodos"]);
  await recadastroQuery.fetch(false, true);
  assert.deepEqual(calls, [
    "/reecadastro/periodos",
    "/reecadastro/solicitacoes",
  ]);
});

test("falha ao atualizar linhas opcionais preserva opcoes de filtro carregadas", async () => {
  let fail = false;
  const { load, invalidateQueries } = setup({
    get: async (url) => {
      if (url === "/linha" && fail) throw new Error("offline");
      return {
        data: {
          data: url === "/linha" ? [{ id: 7, name: "Linha existente" }] : [],
        },
      };
    },
  });
  const { studentOptionsQuery } = load("@/services/api/page-queries");
  await studentOptionsQuery.fetch();
  fail = true;
  invalidateQueries();
  await studentOptionsQuery.fetch();
  assert.equal(studentOptionsQuery.getSnapshot().data.linhas[0]?.id, 7);
});

test("interceptors invalidam apos mutacoes privadas e publicas bem-sucedidas", async () => {
  const { load, createCachedQuery } = setup();
  const { api, publicApi } = load("@/services/api/client");
  const adapter = async (config) => ({
    data: {},
    status: 200,
    statusText: "OK",
    headers: {},
    config,
  });
  api.defaults.adapter = adapter;
  publicApi.defaults.adapter = adapter;
  let calls = 0;
  const query = createCachedQuery(async () => ++calls);
  await query.fetch();
  await api.put("/users/2", {});
  assert.equal(query.getSnapshot().data, 1);
  await query.fetch();
  assert.equal(calls, 2);
  await publicApi.post("/inscricoes", {});
  await query.fetch();
  assert.equal(calls, 3);
  api.defaults.adapter = async () => {
    throw new Error("offline");
  };
  await assert.rejects(api.delete("/linha/1"), /offline/);
  await query.fetch();
  assert.equal(calls, 3);
});
