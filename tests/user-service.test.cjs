const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup(responseData) {
  const calls = [];
  const modules = new Map();
  const overrides = {
    "@/services/api/client": {
      api: {
        get: async (url) => {
          calls.push({ method: "get", url });
          return { data: responseData };
        },
      },
    },
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

test("lista usuários disponíveis para vínculo com a linha", async () => {
  const motorista = {
    id: 7,
    name: "Maria Souza",
    email: "maria@example.com",
    ativo: true,
    roles: ["motorista"],
  };
  const { calls, service } = setup({ data: [motorista] });

  assert.deepEqual(plain(await service.list()), [motorista]);
  assert.deepEqual(calls, [{ method: "get", url: "/users" }]);
});
