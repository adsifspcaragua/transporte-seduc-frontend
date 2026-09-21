const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadPresentation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/frequencias/chamadaHistoryPresentation.ts",
  );
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports }, { filename });
  return exports;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("monta os filtros da listagem removendo valores vazios", () => {
  const { buildChamadaHistoryParams } = loadPresentation();

  assert.deepEqual(
    plain(
      buildChamadaHistoryParams(
        {
          linhaId: "4",
          status: "Fechada",
          de: "",
          ate: "2026-09-21",
        },
        2,
        20,
      ),
    ),
    {
      linha_id: 4,
      status: "Fechada",
      ate: "2026-09-21",
      page: 2,
      per_page: 20,
    },
  );
});

test("valida o período antes de consultar a API", () => {
  const { validateChamadaHistoryDateRange } = loadPresentation();

  assert.equal(validateChamadaHistoryDateRange("", ""), "");
  assert.equal(validateChamadaHistoryDateRange("2026-09-01", "2026-09-21"), "");
  assert.equal(
    validateChamadaHistoryDateRange("2026-09-21", "2026-09-01"),
    "A data final deve ser igual ou posterior à data inicial.",
  );
});

test("calcula o percentual de registros concluídos", () => {
  const { getChamadaCompletionPercentage } = loadPresentation();

  assert.equal(getChamadaCompletionPercentage({ total: 10, pendentes: 2 }), 80);
  assert.equal(getChamadaCompletionPercentage({ total: 0, pendentes: 0 }), 0);
});
