const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadPresentation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/frequencias/frequenciaPresentation.ts",
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

function registro(id, situacao, observacao = null, justificativaStatus = null) {
  return {
    id: id + 100,
    estudante: { id, name: `Estudante ${id}`, cpf: null },
    estudante_id: id,
    situacao,
    observacao,
    marcada_em: situacao === "Pendente" ? null : "2026-09-18T10:00:00Z",
    justificativa: justificativaStatus
      ? { id: id + 200, status: justificativaStatus, parecer: null }
      : null,
  };
}

function chamada(frequencias) {
  return {
    id: 9,
    data: "2026-09-18",
    status: "Aberta",
    observacoes: null,
    fechada_em: null,
    linha: { id: 3, name: "Linha Centro", motorista: null },
    registrada_por: { id: 4, name: "Maria" },
    contadores: {
      total: frequencias.length,
      presentes: 0,
      faltas: 0,
      justificadas: 0,
      pendentes: frequencias.length,
    },
    frequencias,
  };
}

test("cria o rascunho preservando marcação e observação", () => {
  const { createChamadaDraft } = loadPresentation();

  const draft = createChamadaDraft(
    chamada([registro(1, "Presente"), registro(2, "Justificada", "Atestado")]),
  );

  assert.deepEqual(plain(draft), {
    1: { situacao: "Presente", observacao: "" },
    2: { situacao: "Justificada", observacao: "Atestado" },
  });
});

test("envia somente marcações alteradas e mantém a ordem da folha", () => {
  const { createChamadaDraft, getChangedEntries } = loadPresentation();
  const source = chamada([
    registro(2, "Falta"),
    registro(1, "Pendente"),
    registro(3, "Presente"),
  ]);
  const draft = createChamadaDraft(source);
  draft[1] = { situacao: "Justificada", observacao: " Consulta médica " };
  draft[2] = { situacao: "Presente", observacao: "" };

  assert.deepEqual(plain(getChangedEntries(source, draft)), [
    { estudante_id: 2, situacao: "Presente" },
    {
      estudante_id: 1,
      situacao: "Justificada",
      observacao: "Consulta médica",
    },
  ]);
});

test("exige motivo apenas para falta justificada", () => {
  const { validateDraft } = loadPresentation();

  assert.deepEqual(
    plain(
      validateDraft({
        4: { situacao: "Justificada", observacao: " " },
        5: { situacao: "Falta", observacao: "" },
      }),
    ),
    { 4: "Informe o motivo da falta justificada." },
  );
});

test("bloqueia somente justificativa que já recebeu decisão", () => {
  const { isRegistroLocked } = loadPresentation();

  assert.equal(
    isRegistroLocked(registro(1, "Justificada", "x", "Aprovada")),
    true,
  );
  assert.equal(
    isRegistroLocked(registro(2, "Justificada", "x", "Rejeitada")),
    true,
  );
  assert.equal(
    isRegistroLocked(registro(3, "Justificada", "x", "Em analise")),
    false,
  );
  assert.equal(isRegistroLocked(registro(4, "Falta")), false);
});

test("não envia alteração de registro bloqueado", () => {
  const { getChangedEntries } = loadPresentation();
  const source = chamada([registro(1, "Justificada", "Atestado", "Aprovada")]);
  const draft = { 1: { situacao: "Falta", observacao: "" } };

  assert.deepEqual(plain(getChangedEntries(source, draft)), []);
});

test("identifica se a folha ainda tem pendências", () => {
  const { hasPendingEntries } = loadPresentation();

  assert.equal(
    hasPendingEntries({ 1: { situacao: "Pendente", observacao: "" } }),
    true,
  );
  assert.equal(
    hasPendingEntries({ 1: { situacao: "Presente", observacao: "" } }),
    false,
  );
});

test("define a ação do card conforme a data e a chamada de hoje", () => {
  const { getLinhaCallAction } = loadPresentation();

  assert.equal(getLinhaCallAction(null, true), "Iniciar");
  assert.equal(
    getLinhaCallAction({ id: 1, status: "Aberta" }, true),
    "Continuar",
  );
  assert.equal(
    getLinhaCallAction({ id: 1, status: "Fechada" }, true),
    "Visualizar",
  );
  assert.equal(getLinhaCallAction(null, false), "Abrir chamada");
});

test("formata datas sem deslocamento de fuso", () => {
  const { formatCallDate, localDateIso } = loadPresentation();

  assert.equal(localDateIso(new Date(2026, 8, 8)), "2026-09-08");
  assert.equal(formatCallDate("2026-09-08"), "08/09/2026");
});

test("permite consultar chamada existente sem permissao de escrita", () => {
  const { canAccessLinhaCall } = loadPresentation();

  assert.equal(canAccessLinhaCall(false, true, true), true);
  assert.equal(canAccessLinhaCall(false, true, false), false);
  assert.equal(canAccessLinhaCall(true, false, false), true);
});
