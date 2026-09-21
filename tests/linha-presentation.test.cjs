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

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("oferece somente motoristas ativos em ordem alfabética", () => {
  const { getAvailableDrivers } = loadPresentation();
  const users = [
    { id: 3, name: "Bruno" },
    { id: 4, name: "Ana" },
  ];

  assert.deepEqual(plain(getAvailableDrivers(users)), [
    { id: 4, name: "Ana" },
    { id: 3, name: "Bruno" },
  ]);
});

test("preserva o motorista atual quando a listagem de usuários não o contém", () => {
  const { getAvailableDrivers } = loadPresentation();

  assert.deepEqual(
    plain(getAvailableDrivers([], { id: 8, name: "Motorista atual" })),
    [{ id: 8, name: "Motorista atual" }],
  );
});
