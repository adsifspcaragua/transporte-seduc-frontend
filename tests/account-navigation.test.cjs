const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function navigation() {
  const file = path.resolve(
    __dirname,
    "../src/services/navigation/account-navigation.ts",
  );
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    { exports },
  );
  return exports;
}

test("conta estudante segue portal e administrador com todas permissoes segue painel", () => {
  const { accountHome, isStudentAccount } = navigation();
  const student = {
    roles: ["estudante"],
    permissions: ["presencas.registrar"],
  };
  const admin = {
    roles: ["admin"],
    permissions: ["presencas.registrar", "users.view"],
  };
  assert.equal(accountHome(student), "/portal-estudante");
  assert.equal(accountHome(admin), "/");
  assert.equal(isStudentAccount(admin), false);
});

test("retorno do QR e restrito ao fluxo interno de presenca", () => {
  const { accountHome, isPortalPath } = navigation();
  assert.equal(
    accountHome({ roles: ["estudante"] }, true),
    "/portal-estudante/presenca",
  );
  assert.equal(isPortalPath("/presenca/scan"), true);
  assert.equal(isPortalPath("/portal-estudante/frequencia"), true);
  assert.equal(isPortalPath("/portal-estudante-falso"), false);
  assert.equal(isPortalPath("https://evil.test/portal-estudante"), false);
});
