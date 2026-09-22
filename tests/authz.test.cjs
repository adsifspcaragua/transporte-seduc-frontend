const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadAuthz() {
  const filename = path.resolve(__dirname, "../src/utils/authz.ts");
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

test("autoriza permissao individual e nega permissao ausente", () => {
  const { can } = loadAuthz();
  const permissions = ["linhas.view"];

  assert.equal(can(permissions, "linhas.view"), true);
  assert.equal(can(permissions, "linhas.write"), false);
});

test("autoriza recadastramento por qualquer permissao de leitura prevista", () => {
  const { hasRouteAccess } = loadAuthz();

  assert.equal(hasRouteAccess("/recadastramento", ["periodos.view"]), true);
  assert.equal(hasRouteAccess("/recadastramento", ["solicitacoes.view"]), true);
  assert.equal(hasRouteAccess("/recadastramento", ["linhas.view"]), false);
});

test("protege solicitacoes de inscricao com a permissao do endpoint consumido", () => {
  const { hasRouteAccess } = loadAuthz();

  assert.equal(hasRouteAccess("/solicitacoes", ["inscricoes.view"]), true);
  assert.equal(hasRouteAccess("/solicitacoes", ["solicitacoes.view"]), false);
});

test("mantem dashboard e perfil livres para usuario autenticado", () => {
  const { hasRouteAccess } = loadAuthz();

  assert.equal(hasRouteAccess("/", []), true);
  assert.equal(hasRouteAccess("/perfil", []), true);
});

test("nega acesso direto a rota protegida sem permissao", () => {
  const { hasRouteAccess } = loadAuthz();

  assert.equal(hasRouteAccess("/usuarios", ["linhas.view"]), false);
  assert.equal(
    hasRouteAccess("/frequencias/justificativas", ["frequencias.view"]),
    false,
  );
});
