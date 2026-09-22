const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup(user) {
  const calls = [];
  const modules = new Map();
  const api = {
    get: async (url) => {
      calls.push({ method: "get", url });
      return { data: { data: [user] } };
    },
    post: async (url, payload) => {
      calls.push({ method: "post", url, payload });
      return { data: user };
    },
    put: async (url, payload) => {
      calls.push({ method: "put", url, payload });
      return { data: { data: user } };
    },
    patch: async (url) => {
      calls.push({ method: "patch", url });
      return { data: { data: user } };
    },
    delete: async (url) => {
      calls.push({ method: "delete", url });
      return { data: { message: "Usuário removido com sucesso" } };
    },
  };
  const overrides = {
    "@/services/api/client": { api },
    "@/services/api/pending-request": {
      sharePendingRequest: (operation) => operation,
    },
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
    calls,
    service: load("@/services/api/modules/user").userService,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("integra CRUD e mudanca de situacao normalizando os envelopes", async () => {
  const user = {
    id: 9,
    name: "Maria Souza",
    email: "maria@example.com",
    cpf: null,
    matricula: null,
    data_nascimento: null,
    ativo: true,
    roles: ["motorista"],
  };
  const payload = {
    name: user.name,
    email: user.email,
    password: "password123",
    role: "motorista",
  };
  const { calls, service } = setup(user);

  assert.deepEqual(plain(await service.list()), [user]);
  assert.deepEqual(plain(await service.create(payload)), user);
  assert.deepEqual(plain(await service.update(user.id, payload)), user);
  assert.deepEqual(plain(await service.activate(user.id)), user);
  assert.deepEqual(plain(await service.inactivate(user.id)), user);
  assert.equal(await service.remove(user.id), "Usuário removido com sucesso");
  assert.deepEqual(plain(calls), [
    { method: "get", url: "/users" },
    { method: "post", url: "/users", payload },
    { method: "put", url: "/users/9", payload },
    { method: "patch", url: "/users/9/ativar" },
    { method: "patch", url: "/users/9/inativar" },
    { method: "delete", url: "/users/9" },
  ]);
});
