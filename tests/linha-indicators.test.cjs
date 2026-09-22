const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadPresentation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/linhas/linhaPresentation.ts",
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

test("formata ultima presenca sem deslocar a data e trata ausencia", () => {
  const { formatLastPresence } = loadPresentation();

  assert.equal(formatLastPresence("2026-09-04"), "04/09/2026");
  assert.equal(formatLastPresence(null), "Sem presença registrada");
});
