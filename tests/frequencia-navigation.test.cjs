const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadNavigation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/frequencias/frequenciaNavigation.ts",
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

test("reune as quatro funcoes na ordem operacional", () => {
  const { FREQUENCIA_TABS } = loadNavigation();

  assert.deepEqual(
    plain(FREQUENCIA_TABS.map(({ label, href }) => ({ label, href }))),
    [
      { label: "Chamada diária", href: "/frequencias" },
      { label: "Histórico", href: "/frequencias/chamadas" },
      { label: "Justificativas", href: "/frequencias/justificativas" },
      { label: "Relatórios", href: "/frequencias/relatorio" },
    ],
  );
});

test("filtra abas por permissao e escolhe um destino acessivel", () => {
  const { getFrequencyLandingPath, getVisibleFrequencyTabs } = loadNavigation();

  assert.deepEqual(
    plain(getVisibleFrequencyTabs(["justificativas.view"])).map(
      ({ label }) => label,
    ),
    ["Justificativas"],
  );
  assert.equal(
    getFrequencyLandingPath(["justificativas.view"]),
    "/frequencias/justificativas",
  );
  assert.equal(getFrequencyLandingPath(["frequencias.view"]), "/frequencias");
});

test("marca somente a aba correspondente a rota atual", () => {
  const { isFrequencyTabActive } = loadNavigation();

  assert.equal(isFrequencyTabActive("/frequencias", "/frequencias"), true);
  assert.equal(
    isFrequencyTabActive("/frequencias/chamadas", "/frequencias"),
    false,
  );
  assert.equal(
    isFrequencyTabActive("/frequencias/chamadas/12", "/frequencias/chamadas"),
    true,
  );
});
