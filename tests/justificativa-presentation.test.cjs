const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadPresentation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/frequencias/justificativaPresentation.ts",
  );
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports, Intl, Date }, { filename });
  return exports;
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("remove filtros vazios e mantém paginação", () => {
  const { buildJustificativaParams } = loadPresentation();

  assert.deepEqual(
    plain(
      buildJustificativaParams(
        {
          status: "Em analise",
          linhaId: "",
          de: "",
          ate: "2026-09-18",
        },
        2,
        15,
      ),
    ),
    {
      status: "Em analise",
      ate: "2026-09-18",
      page: 2,
      per_page: 15,
    },
  );
});

test("converte a linha selecionada em identificador numérico", () => {
  const { buildJustificativaParams } = loadPresentation();

  assert.deepEqual(
    plain(
      buildJustificativaParams(
        { status: "", linhaId: "8", de: "", ate: "" },
        1,
        30,
      ),
    ),
    { linha_id: 8, page: 1, per_page: 30 },
  );
});

test("rejeição exige parecer e aprovação não exige", () => {
  const { validateAnalysis } = loadPresentation();

  assert.equal(
    validateAnalysis("Rejeitada", " "),
    "Informe o parecer da rejeição.",
  );
  assert.equal(validateAnalysis("Rejeitada", "Documento inválido."), "");
  assert.equal(validateAnalysis("Aprovada", ""), "");
});

test("parecer de rejeição respeita o limite do backend", () => {
  const { validateAnalysis } = loadPresentation();

  assert.equal(validateAnalysis("Rejeitada", "x".repeat(1000)), "");
  assert.equal(
    validateAnalysis("Rejeitada", "x".repeat(1001)),
    "O parecer deve ter no máximo 1.000 caracteres.",
  );
});

test("somente justificativa pendente pode receber decisão", () => {
  const { canAnalyzeJustificativa } = loadPresentation();

  assert.equal(canAnalyzeJustificativa({ status: "Em analise" }), true);
  assert.equal(canAnalyzeJustificativa({ status: "Aprovada" }), false);
  assert.equal(canAnalyzeJustificativa({ status: "Rejeitada" }), false);
});

test("traduz o status para o tom visual sem acoplar classes", () => {
  const { getJustificativaStatusTone } = loadPresentation();

  assert.equal(getJustificativaStatusTone("Em analise"), "pending");
  assert.equal(getJustificativaStatusTone("Aprovada"), "approved");
  assert.equal(getJustificativaStatusTone("Rejeitada"), "rejected");
});

test("formata data e trata valor ausente", () => {
  const { formatJustificativaDateTime } = loadPresentation();

  assert.equal(formatJustificativaDateTime(null), "Não informado");
  assert.equal(
    formatJustificativaDateTime("2026-09-18T12:30:00.000Z", "UTC"),
    "18/09/2026, 12:30",
  );
});

test("impede período com data final anterior à inicial", () => {
  const { validateJustificativaDateRange } = loadPresentation();

  assert.equal(validateJustificativaDateRange("", ""), "");
  assert.equal(validateJustificativaDateRange("2026-09-01", "2026-09-18"), "");
  assert.equal(
    validateJustificativaDateRange("2026-09-18", "2026-09-01"),
    "A data final deve ser igual ou posterior à data inicial.",
  );
});
