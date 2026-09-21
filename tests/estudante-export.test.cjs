const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadModule(filename, overrides = {}) {
  const modules = new Map();

  function load(name) {
    if (overrides[name]) return overrides[name];
    if (modules.has(name)) return modules.get(name);

    const moduleFilename = path.resolve(
      __dirname,
      "../src",
      `${name.slice(2)}.ts`,
    );
    const source = ts.transpileModule(fs.readFileSync(moduleFilename, "utf8"), {
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

  return load(filename);
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("solicita a exportação como blob e preserva os cabeçalhos", async () => {
  const calls = [];
  const blob = { size: 123 };
  const service = loadModule("@/services/api/modules/estudante", {
    "@/services/api/client": {
      api: {
        get: async (url, config) => {
          calls.push({ url, config });
          return {
            data: blob,
            headers: {
              "content-disposition": 'attachment; filename="estudantes.csv"',
              "content-type": "text/csv",
            },
          };
        },
      },
    },
    "@/services/api/pending-request": {
      sharePendingRequest: (operation) => operation,
    },
  }).estudanteService;

  const result = await service.export("csv");

  assert.deepEqual(plain(calls), [
    {
      url: "/exportar-estudantes/csv",
      config: { responseType: "blob" },
    },
  ]);
  assert.deepEqual(plain(result), {
    blob,
    contentDisposition: 'attachment; filename="estudantes.csv"',
    contentType: "text/csv",
  });
});

test("extrai nomes UTF-8 e usa nome padrão quando o cabeçalho falta", () => {
  const { getExportFilename } = loadModule(
    "@/components/ui/estudantes/estudanteExportPresentation",
  );

  assert.equal(
    getExportFilename(
      "attachment; filename*=UTF-8''estudantes%20ativos.xlsx",
      "xlsx",
    ),
    "estudantes ativos.xlsx",
  );
  assert.equal(getExportFilename(undefined, "pdf"), "estudantes.pdf");
});
