const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const linha = {
  id: 3,
  name: "Linha Centro",
  departure_time: "07:00:00",
  return_time: "18:00:00",
  motorista: { id: 4, name: "Maria" },
  chamada_hoje: null,
};

const chamada = {
  id: 9,
  data: "2026-09-18",
  status: "Aberta",
  observacoes: null,
  fechada_em: null,
  linha: { id: 3, name: "Linha Centro", motorista: linha.motorista },
  registrada_por: { id: 4, name: "Maria" },
  contadores: {
    total: 1,
    presentes: 0,
    faltas: 0,
    justificadas: 0,
    pendentes: 1,
  },
  frequencias: [
    {
      id: 12,
      estudante: { id: 7, name: "Ana", cpf: "12345678900" },
      estudante_id: 7,
      situacao: "Pendente",
      observacao: null,
      marcada_em: null,
      justificativa: null,
    },
  ],
  created_at: "2026-09-18T10:00:00.000000Z",
  updated_at: "2026-09-18T10:00:00.000000Z",
};

const justificativa = {
  id: 21,
  status: "Em analise",
  motivo: "Atestado médico entregue na secretaria.",
  parecer: null,
  estudante: {
    id: 7,
    name: "Ana",
    cpf: "12345678900",
    email: "ana@example.com",
    status: "Ativo",
  },
  falta: {
    frequencia_id: 12,
    situacao: "Justificada",
    chamada_id: 9,
    data: "2026-09-18",
    linha: { id: 3, name: "Linha Centro" },
  },
  enviada_por: { id: 4, name: "Maria" },
  analisada_por: null,
  analisada_em: null,
  created_at: "2026-09-18T10:30:00.000000Z",
};

function setup(responseData) {
  const calls = [];
  const client = {};

  for (const method of ["get", "post", "put", "patch"]) {
    client[method] = async (url, body) => {
      calls.push({ method, url, ...(body === undefined ? {} : { body }) });
      return { data: responseData };
    };
  }

  const modules = new Map();
  const overrides = {
    "@/services/api/client": { api: client },
    "@/services/api/pending-request": {
      sharePendingRequest: (operation) => operation,
    },
  };

  function load(name) {
    if (overrides[name]) return overrides[name];
    if (modules.has(name)) return modules.get(name);

    const filename = path.resolve(__dirname, "../src", `${name.slice(2)}.ts`);
    const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
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

  return {
    calls,
    service: load("@/services/api/modules/frequencia").frequenciaService,
  };
}

function plain(value) {
  return JSON.parse(JSON.stringify(value));
}

test("lista as linhas disponíveis para chamada", async () => {
  const { service, calls } = setup({ data: [linha] });

  assert.deepEqual(plain(await service.listLinhas()), [linha]);
  assert.deepEqual(calls[0], {
    method: "get",
    url: "/frequencias/linhas",
  });
});

test("lista chamadas paginadas com filtros", async () => {
  const paginated = {
    data: [chamada],
    meta: {
      current_page: 2,
      from: 16,
      last_page: 3,
      per_page: 15,
      to: 30,
      total: 33,
    },
  };
  const { service, calls } = setup(paginated);

  assert.deepEqual(
    plain(
      await service.list({
        linha_id: 3,
        status: "Aberta",
        de: "2026-09-01",
        ate: "2026-09-18",
        page: 2,
        per_page: 15,
      }),
    ),
    paginated,
  );
  assert.deepEqual(plain(calls[0]), {
    method: "get",
    url: "/frequencias/chamadas",
    body: {
      params: {
        linha_id: 3,
        status: "Aberta",
        de: "2026-09-01",
        ate: "2026-09-18",
        page: 2,
        per_page: 15,
      },
    },
  });
});

test("abre e salva uma chamada com o contrato do backend", async () => {
  const { service, calls } = setup({ data: chamada });

  await service.open({ linha_id: 3, data: "2026-09-18" });
  await service.update(9, {
    frequencias: [{ estudante_id: 7, situacao: "Presente" }],
  });

  assert.deepEqual(calls, [
    {
      method: "post",
      url: "/frequencias/chamadas",
      body: { linha_id: 3, data: "2026-09-18" },
    },
    {
      method: "put",
      url: "/frequencias/chamadas/9",
      body: { frequencias: [{ estudante_id: 7, situacao: "Presente" }] },
    },
  ]);
});

test("carrega uma folha existente pelo id", async () => {
  const { service, calls } = setup({ data: chamada });

  assert.deepEqual(plain((await service.show(9)).data), chamada);
  assert.deepEqual(calls[0], {
    method: "get",
    url: "/frequencias/chamadas/9",
  });
});

test("fecha e reabre a chamada pelos endpoints de ação", async () => {
  const { service, calls } = setup({ data: chamada });

  await service.close(9);
  await service.reopen(9);

  assert.deepEqual(
    calls.map(({ method, url }) => ({ method, url })),
    [
      { method: "patch", url: "/frequencias/chamadas/9/fechar" },
      { method: "patch", url: "/frequencias/chamadas/9/reabrir" },
    ],
  );
});

test("lista justificativas paginadas com filtros", async () => {
  const response = {
    data: [justificativa],
    meta: {
      current_page: 2,
      from: 16,
      last_page: 3,
      per_page: 15,
      to: 30,
      total: 33,
    },
    em_analise: 4,
  };
  const { service, calls } = setup(response);

  assert.deepEqual(
    plain(
      await service.listJustificativas({
        status: "Em analise",
        linha_id: 3,
        de: "2026-09-01",
        ate: "2026-09-18",
        page: 2,
        per_page: 15,
      }),
    ),
    response,
  );
  assert.deepEqual(plain(calls[0]), {
    method: "get",
    url: "/frequencias/justificativas",
    body: {
      params: {
        status: "Em analise",
        linha_id: 3,
        de: "2026-09-01",
        ate: "2026-09-18",
        page: 2,
        per_page: 15,
      },
    },
  });
});

test("carrega e analisa uma justificativa", async () => {
  const response = {
    data: justificativa,
    message: "Justificativa rejeitada: a falta passa a contar",
  };
  const { service, calls } = setup(response);

  assert.deepEqual(
    plain((await service.showJustificativa(21)).data),
    justificativa,
  );
  await service.analyzeJustificativa(21, {
    decisao: "Rejeitada",
    parecer: "Documento sem data legível.",
  });

  assert.deepEqual(calls, [
    { method: "get", url: "/frequencias/justificativas/21" },
    {
      method: "put",
      url: "/frequencias/justificativas/21/analise",
      body: {
        decisao: "Rejeitada",
        parecer: "Documento sem data legível.",
      },
    },
  ]);
});

test("envia justificativa posterior para uma falta registrada", async () => {
  const response = {
    data: justificativa,
    message: "Justificativa enviada para análise",
  };
  const { service, calls } = setup(response);

  await service.createJustificativa({
    frequencia_id: 12,
    motivo: "Atestado entregue posteriormente.",
  });

  assert.deepEqual(calls, [
    {
      method: "post",
      url: "/frequencias/justificativas",
      body: {
        frequencia_id: 12,
        motivo: "Atestado entregue posteriormente.",
      },
    },
  ]);
});

test("carrega o relatório geral e o histórico do estudante", async () => {
  const response = {
    data: [],
    periodo: { de: "2026-09-01", ate: "2026-09-18" },
  };
  const { service, calls } = setup(response);

  await service.report({ de: "2026-09-01", linha_id: 3 });
  await service.studentReport(8, { ate: "2026-09-18" });

  assert.deepEqual(plain(calls), [
    {
      method: "get",
      url: "/frequencias/relatorio",
      body: { params: { de: "2026-09-01", linha_id: 3 } },
    },
    {
      method: "get",
      url: "/frequencias/estudantes/8/relatorio",
      body: { params: { ate: "2026-09-18" } },
    },
  ]);
});
