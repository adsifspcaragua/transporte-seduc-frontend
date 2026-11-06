const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup(response, failure) {
  const calls = [];
  const exports = {};
  const source = fs.readFileSync(
    path.resolve(__dirname, "../src/services/api/modules/estudante.ts"),
    "utf8",
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === "@/services/api/pending-request")
          return { sharePendingRequest: (request) => request };
        if (name === "@/services/api/endpoints")
          return {
            API_ENDPOINTS: {
              ESTUDANTES: {
                BASE: "/estudantes",
                BY_ID: (id) => `/estudantes/${id}`,
              },
            },
          };
        if (name === "@/services/api/client")
          return {
            api: {
              async get(url, options) {
                calls.push({ url, options });
                if (failure) throw failure;
                return { data: response };
              },
            },
          };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    },
  );
  return { service: exports.estudanteService, calls };
}

test("student search sends the name and pagination to the server", async () => {
  const response = { data: [{ id: 20, name: "Ana" }], meta: { total: 16 } };
  const { service, calls } = setup(response);
  assert.equal(await service.list(2, 15, "  Ana  "), response);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    {
      url: "/estudantes",
      options: { params: { page: 2, per_page: 15, search: "Ana" } },
    },
  ]);
});

test("existing student lists keep their query contract without a search", async () => {
  const { service, calls } = setup({ message: "Nenhum estudante cadastrado" });
  assert.equal((await service.list()).data.length, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].options.params)), {
    page: 1,
    per_page: 10,
  });
});

test("student references resolve a selected name outside the search page", async () => {
  const student = { id: 99, name: "Ana" };
  const { service, calls } = setup({ data: student });
  assert.equal(await service.detail(99), student);
  assert.equal(calls[0].url, "/estudantes/99");
});

test("failed student lookups propagate the error instead of an empty result", async () => {
  const failure = new Error("Forbidden");
  const { service } = setup(undefined, failure);
  await assert.rejects(
    service.list(1, 15, "Ana"),
    (error) => error === failure,
  );
});
