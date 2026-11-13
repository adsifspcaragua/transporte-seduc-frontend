const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

test("public institution options include records after the first backend page", async () => {
  const pages = [];
  const source = fs.readFileSync(
    path.resolve(__dirname, "../src/services/api/modules/inscricao.ts"),
    "utf8",
  );
  const exports = {};
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
              async get(_url, options) {
                const page = options?.params?.page ?? 1;
                pages.push(page);
                return {
                  data: {
                    data:
                      page === 1
                        ? Array.from({ length: 15 }, (_, i) => ({ id: i + 1 }))
                        : [{ id: 16 }],
                  },
                };
              },
            },
          };
        if (name === "@/services/api/endpoints")
          return { API_ENDPOINTS: { INSTITUICOES: { BASE: "/instituicao" } } };
        if (name === "@/services/api/modules/linha")
          return { linhaService: {} };
        if (name === "@/services/api/pending-request")
          return { sharePendingRequest: (fn) => fn };
        throw new Error(`Unexpected dependency: ${name}`);
      },
    },
  );
  const options = await exports.inscricaoService.listInstituicoes();
  assert.equal(options.length, 16);
  assert.deepEqual(pages, [1, 2]);
});
