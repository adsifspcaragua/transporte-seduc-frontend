const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const filename = path.resolve(
  __dirname,
  "../src/components/ui/frequencias/relatorioFrequenciaPresentation.ts",
);
const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const presentation = {};
vm.runInNewContext(source, { exports: presentation, Intl, Date }, { filename });

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("monta os filtros do relatório sem parâmetros vazios", () => {
  assert.deepEqual(
    plain(
      presentation.buildRelatorioParams({
        de: "2026-09-01",
        ate: "2026-09-18",
        linhaId: "4",
        faltasConsecutivasMin: "3",
      }),
    ),
    {
      de: "2026-09-01",
      ate: "2026-09-18",
      linha_id: 4,
      faltas_consecutivas_min: 3,
    },
  );
});

test("valida ordem e limite máximo de 366 dias", () => {
  assert.match(
    presentation.validateReportPeriod("2026-09-18", "2026-09-01"),
    /posterior/,
  );
  assert.match(
    presentation.validateReportPeriod("2025-01-01", "2026-09-18"),
    /366/,
  );
  assert.equal(
    presentation.validateReportPeriod("2026-01-01", "2026-09-18"),
    "",
  );
});

test("formata percentual ausente e informado", () => {
  assert.equal(presentation.formatAttendancePercentage(null), "—");
  assert.equal(presentation.formatAttendancePercentage(87.5), "87,5%");
});

test("classifica o risco do estudante pelas faltas", () => {
  assert.equal(
    presentation.getAttendanceTone({ faltas: 3, faltas_consecutivas: 3 }),
    "danger",
  );
  assert.equal(
    presentation.getAttendanceTone({ faltas: 5, faltas_consecutivas: 1 }),
    "danger",
  );
  assert.equal(
    presentation.getAttendanceTone({ faltas: 1, faltas_consecutivas: 0 }),
    "warning",
  );
  assert.equal(
    presentation.getAttendanceTone({ faltas: 0, faltas_consecutivas: 0 }),
    "success",
  );
});

test("formata o período retornado pelo backend sem deslocar a data", () => {
  assert.equal(
    presentation.formatReportPeriod({
      de: "2026-09-01",
      ate: "2026-09-18",
    }),
    "01/09/2026 a 18/09/2026",
  );
});
