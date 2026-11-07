const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function load(file, overrides = {}) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(path.resolve(__dirname, "..", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2022,
          esModuleInterop: true,
        },
      },
    ).outputText,
    {
      exports,
      require: (name) => overrides[name] ?? require(name),
      Date,
      Intl,
    },
  );
  return exports;
}
const presentation = () =>
  load("src/components/ui/transportes/transporteOperacaoPresentation.ts");
const plain = (value) => JSON.parse(JSON.stringify(value));
function snapshot() {
  return Object.fromEntries(
    [
      "linhas",
      "veiculos",
      "atribuicoes",
      "horarios",
      "pontos",
      "vinculos",
      "dias",
      "viagens",
    ].map((key) => [key, { data: [] }]),
  );
}
const period = { de: "2026-11-09", ate: "2026-11-10" };

test("diagnóstico não transforma falha de leitura em falta de cadastro nem prontidão", () => {
  const data = snapshot();
  data.horarios = { error: "Sem permissão" };
  data.viagens = { error: "Falha de rede" };
  const result = presentation().summarizeLinha(
    { id: 1, name: "Centro" },
    data,
    period,
  );
  assert.equal(result.expected, null);
  assert.equal(result.trips, null);
  assert.ok(result.unavailable.includes("Horários: Sem permissão"));
  assert.ok(
    !result.issues.some((item) => item.text.includes("Nenhum horário")),
  );
});
test("cobertura distingue suspensão global, data não gerada e viagem sem veículo", () => {
  const data = snapshot();
  data.horarios.data = [
    {
      id: 3,
      linha_id: 1,
      sentido: "Ida",
      ativo: true,
      dias_semana: [1, 2],
      horario_saida: "17:30",
    },
  ];
  data.dias.data = [{ data: "2026-11-09", linha_id: null }];
  let result = presentation().summarizeLinha(
    { id: 1, name: "Centro" },
    data,
    period,
  );
  assert.equal(result.expected, 1);
  assert.equal(result.missing, 1);
  assert.equal(result.calendar[0].suspended, true);
  data.viagens.data = [
    {
      id: 8,
      horario_id: 3,
      linha_id: 1,
      data: "2026-11-10",
      status: "Programada",
      veiculo_id: null,
    },
  ];
  result = presentation().summarizeLinha(
    { id: 1, name: "Centro" },
    data,
    period,
  );
  assert.equal(result.missing, 0);
  assert.equal(result.withoutVehicle, 1);
});
test("veículo efetivo respeita precedência, fim inclusivo e veículo inativo", () => {
  const { effectiveVehicle } = presentation();
  const vehicles = [
    { id: 1, ativo: true },
    { id: 2, ativo: true },
    { id: 3, ativo: false },
  ];
  const assignments = [
    { id: 1, linha_id: 4, veiculo_id: 1, inicio: "2026-01-01", fim: null },
    {
      id: 2,
      linha_id: 4,
      veiculo_id: 2,
      inicio: "2026-11-09",
      fim: "2026-11-09",
    },
    { id: 3, linha_id: 4, veiculo_id: 3, inicio: "2026-11-09", fim: null },
  ];
  assert.equal(effectiveVehicle(4, "2026-11-09", assignments, vehicles).id, 2);
  assert.equal(effectiveVehicle(4, "2026-11-10", assignments, vehicles).id, 1);
});
test("conflitos incluem outra linha, borda inclusiva e madrugada, sem incluir canceladas", () => {
  const { tripConflicts } = presentation();
  const trips = [
    {
      id: 1,
      linha_id: 4,
      veiculo_id: 2,
      status: "Programada",
      janela_inicio: "2026-11-09T23:50:00-03:00",
      janela_fim: "2026-11-10T00:10:00-03:00",
    },
    {
      id: 2,
      linha_id: 5,
      veiculo_id: 2,
      status: "Programada",
      janela_inicio: "2026-11-10T00:10:00-03:00",
      janela_fim: "2026-11-10T00:30:00-03:00",
    },
    {
      id: 3,
      linha_id: 5,
      veiculo_id: 2,
      status: "Cancelada",
      janela_inicio: "2026-11-10T00:00:00-03:00",
      janela_fim: "2026-11-10T00:30:00-03:00",
    },
  ];
  assert.deepEqual(
    plain(tripConflicts(trips).map((pair) => pair.map((t) => t.id))),
    [[1, 2]],
  );
});
test("leitura de viagens percorre todas as páginas sem escrita e não oculta falha intermediária", async () => {
  const calls = [];
  const service = {
    list: async (resource, filters) => {
      calls.push({ resource, ...filters });
      return {
        data: [{ id: filters.page }],
        meta: { current_page: filters.page, last_page: 2, total: 2 },
      };
    },
  };
  const module = load("src/services/api/modules/transporte-operacao.ts", {
    "@/services/api/modules/transporte": { transporteService: service },
    "@/services/api/modules/linha": { linhaService: {} },
    "@/services/api/query-cache": { createCachedQuery: (fn) => fn },
  });
  assert.deepEqual(plain(await module.readAllTrips(period)), [
    { id: 1 },
    { id: 2 },
  ]);
  assert.equal(calls.length, 2);
  service.list = async (_, filters) => {
    if (filters.page === 2) throw Error("offline");
    return {
      data: [{ id: 1 }],
      meta: { current_page: 1, last_page: 2, total: 2 },
    };
  };
  await assert.rejects(module.readAllTrips(period), /offline/);
});
test("escopo guiado fixa linha e período e remove identificadores dos campos visíveis", () => {
  const { guidedFields, scopedValues } = presentation();
  assert.deepEqual(
    plain(
      guidedFields([
        { key: "linha_id" },
        { key: "ponto_id", label: "ID do ponto" },
      ]),
    ),
    [{ key: "ponto_id", label: "ponto" }],
  );
  assert.deepEqual(
    plain(scopedValues({ linha_id: "999", de: "2020-01-01" }, 7, period)),
    { linha_id: "7", de: "2026-11-09", ate: "2026-11-10" },
  );
});

test("cadastro guiado reconhece duplicatas de vínculos e horários, preservando múltiplas saídas legítimas", () => {
  const { guidedDuplicate } = presentation();
  assert.equal(
    guidedDuplicate("vinculos", { linha_id: 1, ponto_id: 4, sentido: "Ida" }, [
      { linha_id: 1, ponto_id: 4, sentido: "Ida" },
    ]),
    true,
  );
  assert.equal(
    guidedDuplicate(
      "vinculos",
      { linha_id: 1, ponto_id: 4, sentido: "Volta" },
      [{ linha_id: 1, ponto_id: 4, sentido: "Ida" }],
    ),
    false,
  );
  const rule = {
    linha_id: 1,
    sentido: "Ida",
    horario_saida: "17:30",
    dias_semana: [1, 2],
    ativo: true,
    vigencia_inicio: null,
    vigencia_fim: null,
  };
  assert.equal(
    guidedDuplicate("horarios", rule, [
      { ...rule, horario_saida: "17:30:00", dias_semana: [2, 3] },
    ]),
    true,
  );
  assert.equal(
    guidedDuplicate("horarios", { ...rule, horario_saida: "18:30" }, [rule]),
    false,
  );
  assert.equal(
    guidedDuplicate("horarios", { ...rule, vigencia_inicio: "2027-01-01" }, [
      { ...rule, vigencia_fim: "2026-12-31" },
    ]),
    false,
  );
});

test("consultas negadas não chamam serviços e falha de um recurso permanece identificada", async () => {
  const calls = [];
  const mod = load("src/services/api/modules/transporte-operacao.ts", {
    "@/services/api/modules/transporte": {
      transporteService: {
        list: async (key) => {
          calls.push(key);
          if (key === "atribuicoes") throw Error("offline");
          return { data: [] };
        },
      },
    },
    "@/services/api/modules/linha": {
      linhaService: {
        list: async () => {
          throw Error("não deve consultar");
        },
      },
    },
    "@/services/api/query-cache": { createCachedQuery: (fn) => fn },
  });
  const data = await mod.loadTransporteOperacao(["veiculos.view"], period);
  assert.deepEqual(calls.sort(), ["atribuicoes", "veiculos"]);
  assert.equal(data.veiculos.data.length, 0);
  assert.equal(data.atribuicoes.data, undefined);
  assert.ok(data.atribuicoes.error);
  assert.ok(data.linhas.error);
  assert.ok(data.viagens.error);
});

test("falha da leitura após escrita aceita exige reconciliação mesmo se for 403 ou 404", () => {
  const { shouldReconcileGuidedFailure } = presentation();
  assert.equal(shouldReconcileGuidedFailure(true, true, 403), true);
  assert.equal(shouldReconcileGuidedFailure(true, true, 404), true);
  assert.equal(shouldReconcileGuidedFailure(true, false, 422), false);
  assert.equal(shouldReconcileGuidedFailure(true, false, 500), true);
  assert.equal(shouldReconcileGuidedFailure(true, false), true);
  assert.equal(shouldReconcileGuidedFailure(false, false), false);
});

test("vínculo de motorista envia só responsável e capacidade recém-consultada, sem sobrescrever nome", () => {
  const { buildMotoristaUpdate } = presentation();
  assert.deepEqual(
    plain(
      buildMotoristaUpdate(
        { id: 1, name: "Renomeada por outra pessoa", max_capacity: 45 },
        6,
      ),
    ),
    { max_capacity: 45, motorista_id: 6 },
  );
  assert.throws(() =>
    buildMotoristaUpdate({ id: 1, name: "Sem capacidade" }, null),
  );
});
