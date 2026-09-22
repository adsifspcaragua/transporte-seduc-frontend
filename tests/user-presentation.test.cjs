const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadPresentation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/users/userPresentation.ts",
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

test("valida os campos obrigatorios e formatos do formulario", () => {
  const { validateUserForm } = loadPresentation();

  assert.deepEqual(
    plain(
      validateUserForm(
        {
          name: "",
          email: "invalido",
          password: "curta",
          cpf: "123",
          matricula: "12A",
          data_nascimento: "",
          role: "",
        },
        "create",
      ),
    ),
    {
      name: "Informe o nome.",
      email: "Informe um e-mail válido.",
      password: "A senha deve ter pelo menos 8 caracteres.",
      cpf: "Informe um CPF com 11 dígitos.",
      matricula: "A matrícula deve conter apenas números.",
      role: "Selecione um papel.",
    },
  );
});

test("normaliza o payload de criacao", () => {
  const { buildUserPayload } = loadPresentation();

  assert.deepEqual(
    plain(
      buildUserPayload(
        {
          name: "  Maria Souza  ",
          email: "  MARIA@example.com ",
          password: "password123",
          cpf: "123.456.789-01",
          matricula: "1024",
          data_nascimento: "1990-05-10",
          role: "motorista",
        },
        "create",
      ),
    ),
    {
      name: "Maria Souza",
      email: "maria@example.com",
      password: "password123",
      cpf: "12345678901",
      matricula: 1024,
      data_nascimento: "1990-05-10",
      role: "motorista",
    },
  );
});

test("omite senha, opcionais vazios e papel inalterado na edicao", () => {
  const { buildUserPayload } = loadPresentation();

  assert.deepEqual(
    plain(
      buildUserPayload(
        {
          name: "João",
          email: "joao@example.com",
          password: "",
          cpf: "",
          matricula: "",
          data_nascimento: "",
          role: "operador",
        },
        "edit",
        "operador",
      ),
    ),
    {
      name: "João",
      email: "joao@example.com",
    },
  );
});

test("envia papel na edicao somente quando ele foi alterado", () => {
  const { buildUserPayload } = loadPresentation();

  const payload = buildUserPayload(
    {
      name: "Joao",
      email: "joao@example.com",
      password: "",
      cpf: "",
      matricula: "",
      data_nascimento: "",
      role: "gestor",
    },
    "edit",
    "operador",
  );

  assert.equal(payload.role, "gestor");
});

test("oferece somente papeis administrativos existentes", () => {
  const { USER_ROLE_OPTIONS } = loadPresentation();

  assert.deepEqual(plain(USER_ROLE_OPTIONS.map(({ value }) => value)), [
    "admin",
    "gestor",
    "operador",
    "motorista",
  ]);
});

test("impede alterar situacao ou excluir o proprio usuario", () => {
  const { canChangeUserStatusOrDelete } = loadPresentation();

  assert.equal(canChangeUserStatusOrDelete(7, 7), false);
  assert.equal(canChangeUserStatusOrDelete(8, 7), true);
});
