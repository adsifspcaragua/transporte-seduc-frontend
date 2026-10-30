const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function setup(response = { data: [] }, failure) {
  const calls = [];
  const modules = new Map();
  const api = Object.fromEntries(
    ["get", "post", "patch", "put", "delete"].map((method) => [
      method,
      async (...args) => {
        calls.push({ method, args: JSON.parse(JSON.stringify(args)) });
        if (failure) throw failure;
        return { data: response };
      },
    ]),
  );
  const overrides = {
    "@/services/api/client": { api },
    "@/services/api/query-cache": {
      createCachedQuery: (request) => ({ fetch: request }),
    },
    axios: {
      default: { isAxiosError: (error) => error?.isAxiosError === true },
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
    vm.runInNewContext(
      source,
      {
        exports,
        require: (dependency) =>
          load(
            dependency.startsWith(".")
              ? path.posix.normalize(
                  `${path.posix.dirname(name)}/${dependency}`,
                )
              : dependency,
          ),
      },
      { filename },
    );
    return exports;
  }
  return {
    calls,
    service: load("@/services/api/modules/transporte").transporteService,
    load,
  };
}
const plain = (value) => JSON.parse(JSON.stringify(value));

test("listas preservam paginação Laravel e encaminham filtros sem confundir presenças com chamadas", async () => {
  const response = {
    data: [{ id: 7, metodo: "Manual" }],
    meta: { current_page: 2, total: 30, last_page: 2 },
  };
  const { service, calls } = setup(response);
  assert.deepEqual(
    plain(
      await service.list("presencas", { linha_id: 4, page: 2, per_page: 15 }),
    ),
    response,
  );
  assert.deepEqual(calls, [
    {
      method: "get",
      args: ["/presencas", { params: { linha_id: 4, page: 2, per_page: 15 } }],
    },
  ]);
});

test("contratos antigos sem data são listas vazias; falhas HTTP não são disfarçadas", async () => {
  const { service } = setup({ message: "Nenhum cargo cadastrado" });
  assert.deepEqual(plain(await service.list("roles")), { data: [] });
  const failure = {
    response: { status: 403, data: { message: "Sem permissão" } },
  };
  await assert.rejects(
    setup(undefined, failure).service.list("veiculos"),
    (error) => error === failure,
  );
});

test("veículo criado entrega QR aninhado sem persistência e rotação envia motivo obrigatório", async () => {
  const response = {
    data: {
      id: 2,
      identificacao: "Van 2",
      qr: {
        token: "secret-local",
        url: "https://app.example/presenca/scan?t=secret-local",
      },
    },
  };
  const { service, calls } = setup(response);
  assert.deepEqual(
    plain(
      await service.save("veiculos", {
        identificacao: "Van 2",
        placa: null,
        ativo: true,
      }),
    ),
    response,
  );
  await service.rotateQr(2, "Adesivo danificado");
  assert.deepEqual(calls[1], {
    method: "post",
    args: ["/veiculos/2/qr", { motivo: "Adesivo danificado" }],
  });
});

test("atribuição e vínculo atualizam apenas o contrato permitido; UUID é preservado na revogação", async () => {
  const { service, calls } = setup({ message: "Atualizado" });
  await service.save(
    "atribuicoes",
    { fim: "2026-11-02", motivo: "Manutenção" },
    3,
  );
  await service.save("vinculos", { ordem: 2, horario_previsto: "18:15" }, 4);
  await service.revokeDevice("uuid-123", "Telefone perdido");
  assert.deepEqual(calls, [
    {
      method: "patch",
      args: [
        "/veiculos/atribuicoes/3",
        { fim: "2026-11-02", motivo: "Manutenção" },
      ],
    },
    {
      method: "patch",
      args: [
        "/pontos-embarque/linhas/4",
        { ordem: 2, horario_previsto: "18:15" },
      ],
    },
    {
      method: "patch",
      args: ["/dispositivos/uuid-123/revogar", { motivo: "Telefone perdido" }],
    },
  ]);
});

test("geração mantém conflitos e exceção manual usa IDs e justificativa reais", async () => {
  const response = {
    data: {
      criadas: 2,
      conflitos: [{ veiculo_id: 1, data: "2026-11-01", viagens: [3, 4] }],
    },
  };
  const { service, calls } = setup(response);
  assert.deepEqual(
    plain(
      await service.generate({
        de: "2026-11-01",
        ate: "2026-11-02",
        linha_id: null,
      }),
    ),
    response,
  );
  await service.manual({
    estudante_id: 6,
    viagem_id: 3,
    justificativa: "Embarque confirmado no atendimento",
  });
  assert.deepEqual(calls[1], {
    method: "post",
    args: [
      "/presencas/manual",
      {
        estudante_id: 6,
        viagem_id: 3,
        justificativa: "Embarque confirmado no atendimento",
      },
    ],
  });
});

test("aprovação e rejeição de dispositivo usam PATCH; revisão de tentativa usa PUT", async () => {
  const { service, calls } = setup({ data: { id: 2 } });
  await service.decideDevice(2, "aprovar", "Documento conferido");
  await service.decideDevice(2, "rejeitar", "Documento divergente");
  await service.review(3, {
    decisao: "Aprovada",
    parecer: "Embarque confirmado",
  });
  assert.deepEqual(calls, [
    {
      method: "patch",
      args: [
        "/dispositivos/solicitacoes/2/aprovar",
        { parecer: "Documento conferido" },
      ],
    },
    {
      method: "patch",
      args: [
        "/dispositivos/solicitacoes/2/rejeitar",
        { parecer: "Documento divergente" },
      ],
    },
    {
      method: "put",
      args: [
        "/presencas/tentativas/3/revisao",
        { decisao: "Aprovada", parecer: "Embarque confirmado" },
      ],
    },
  ]);
});

test("indicadores respeitam envelope próprio e filtros; consulta individual e exclusão têm URLs corretas", async () => {
  const { service, calls } = setup({ data: { gps: { leituras: 0 } } });
  assert.deepEqual(
    plain(await service.indicators({ de: "2026-11-01", linha_id: 5 })),
    { gps: { leituras: 0 } },
  );
  await service.detail("instituicoes", 22);
  await service.remove("autorizacoes", 12);
  assert.equal(calls[0].args[0], "/presencas/indicadores");
  assert.deepEqual(calls[0].args[1], {
    params: { de: "2026-11-01", linha_id: 5 },
  });
  assert.deepEqual(calls[1], { method: "get", args: ["/instituicao/22"] });
  assert.deepEqual(calls[2], {
    method: "delete",
    args: ["/autorizacoes-linha/12"],
  });
});

test("formulários preservam null, zero, dias numéricos e horário local sem conversão UTC", () => {
  const { load } = setup();
  const { transporteConfigs } = load(
    "@/components/ui/transportes/transporteConfig",
  );
  const presentation = load(
    "@/components/ui/transportes/transportePresentation",
  );
  const fields = transporteConfigs.find(
    (config) => config.key === "horarios",
  ).fields;
  const values = {
    linha_id: "1",
    sentido: "Ida",
    dias_semana: "1,3,5",
    horario_saida: "17:30",
    janela_antes_min: "0",
    janela_depois_min: "",
    vigencia_inicio: "",
    vigencia_fim: "",
    ativo: "false",
  };
  const payload = presentation.buildTransportePayload(fields, values);
  assert.equal(payload.janela_antes_min, 0);
  assert.equal(payload.janela_depois_min, null);
  assert.equal(payload.ativo, false);
  assert.deepEqual(plain(payload.dias_semana), [1, 3, 5]);
  const tripFields = transporteConfigs.find(
    (config) => config.key === "viagens",
  ).fields;
  const trip = {
    veiculo_id: 2,
    janela_inicio: "2026-11-02T17:15:00-03:00",
    janela_fim: "2026-11-02T17:45:00-03:00",
    status: "Programada",
  };
  const initial = presentation.initialTransporteValues(tripFields, trip);
  assert.equal(initial.janela_inicio, "2026-11-02T17:15");
  assert.deepEqual(
    plain(
      presentation.buildTransportePatch(
        tripFields,
        { ...initial, motivo: "Feriado municipal", status: "Cancelada" },
        trip,
      ),
    ),
    { motivo: "Feriado municipal", status: "Cancelada" },
  );
  const delayed = presentation.buildTransportePatch(
    tripFields,
    { ...initial, motivo: "Trânsito lento", janela_fim: "2026-11-02T18:10" },
    trip,
  );
  assert.equal(delayed.janela_fim, "2026-11-02 18:10");
  assert.equal(
    "veiculo_id" in delayed,
    false,
    "não deve marcar substituição de veículo ao ajustar somente horário",
  );
});

test("validações reproduzem limites de geração, dias distintos, raio obrigatório e parecer", () => {
  const { load } = setup();
  const { transporteConfigs, gerarViagensFields, parecerFields } = load(
    "@/components/ui/transportes/transporteConfig",
  );
  const { validateTransporteForm } = load(
    "@/components/ui/transportes/transportePresentation",
  );
  assert.deepEqual(
    plain(
      validateTransporteForm(gerarViagensFields, {
        de: "2026-10-19",
        ate: "2026-12-20",
      }),
    ),
    {},
  );
  assert.ok(
    validateTransporteForm(gerarViagensFields, {
      de: "2026-10-19",
      ate: "2026-12-21",
    }).ate,
  );
  assert.ok(validateTransporteForm(parecerFields, { parecer: "sim" }).parecer);
  const scheduleFields = transporteConfigs.find(
    (config) => config.key === "horarios",
  ).fields;
  assert.ok(
    validateTransporteForm(scheduleFields, { dias_semana: "1,1" }).dias_semana,
  );
  const pointFields = transporteConfigs.find(
    (config) => config.key === "pontos",
  ).fields;
  const errors = validateTransporteForm(pointFields, {
    nome: "Praça",
    latitude: "-23.62",
    longitude: "-45.41",
    raio_metros: "",
  });
  assert.ok(errors.raio_metros);
  assert.equal(errors.latitude, undefined);
});

test("cargos sem ID não recebem ações falsas e permissões de exclusão seguem cada módulo", () => {
  const { load } = setup();
  const { transporteConfigs } = load(
    "@/components/ui/transportes/transporteConfig",
  );
  const role = transporteConfigs.find((config) => config.key === "roles");
  assert.equal(role.edit, undefined);
  assert.equal(role.remove, undefined);
  assert.equal(role.create, true);
  assert.equal(
    transporteConfigs.find((config) => config.key === "dias").remove,
    "viagens.write",
  );
  assert.equal(
    transporteConfigs.find((config) => config.key === "veiculos").remove,
    "veiculos.delete",
  );
});

test("mensagens 409/422/429 preservam contexto e erros por campo", () => {
  const { load } = setup();
  const { transporteError } = load(
    "@/components/ui/transportes/transportePresentation",
  );
  assert.equal(
    transporteError({
      isAxiosError: true,
      response: {
        status: 409,
        data: {
          message: "A van já está na viagem #5 neste horário.",
          conflito_viagem_id: 5,
        },
      },
    }).message,
    "A van já está na viagem #5 neste horário.",
  );
  const error = transporteError({
    isAxiosError: true,
    response: {
      status: 422,
      data: {
        message: "Revise os dados",
        errors: { "dias_semana.0": ["Dia inválido"] },
      },
    },
  });
  assert.equal(error.fields.dias_semana, "Dia inválido");
  assert.match(
    transporteError({ isAxiosError: true, response: { status: 429 } }).message,
    /Aguarde/,
  );
});
