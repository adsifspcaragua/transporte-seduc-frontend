const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadValidation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/auth/passwordRecoveryPresentation.ts",
  );
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const exports = {};
  vm.runInNewContext(source, { exports }, { filename });
  return exports.validatePasswordRecovery;
}

test("forgot requires email but does not require a password", () => {
  const validate = loadValidation();
  assert.equal(
    JSON.stringify(
      validate(
        { email: " aluno@example.com ", password: "", confirmation: "" },
        false,
      ),
    ),
    "{}",
  );
  assert.ok(
    validate({ email: "invalid", password: "", confirmation: "" }, false).email,
  );
});

test("reset requires eight characters and matching confirmation", () => {
  const validate = loadValidation();
  const form = {
    email: "aluno@example.com",
    password: "short",
    confirmation: "different",
  };
  assert.ok(validate(form, true).password);
  assert.ok(validate(form, true).password_confirmation);
  assert.equal(
    JSON.stringify(
      validate(
        { ...form, password: "12345678", confirmation: "12345678" },
        true,
      ),
    ),
    "{}",
  );
});

test("password service initializes CSRF and sends backend field names", async () => {
  const filename = path.resolve(
    __dirname,
    "../src/services/api/modules/password.ts",
  );
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const calls = [];
  const exports = {};
  vm.runInNewContext(
    source,
    {
      exports,
      require: (name) => {
        if (name.endsWith("/client"))
          return {
            csrfClient: { get: async (url) => calls.push(["csrf", url]) },
            api: {
              post: async (url, payload) => {
                calls.push(["post", url, payload]);
                return { data: { message: "ok" } };
              },
            },
          };
        if (name.endsWith("/endpoints"))
          return {
            API_ENDPOINTS: {
              AUTH: {
                CSRF_COOKIE: "/sanctum/csrf-cookie",
                PASSWORD_EMAIL: "/password/email",
                PASSWORD_RESET: "/password/reset",
              },
            },
          };
        throw new Error(`Unexpected import: ${name}`);
      },
    },
    { filename },
  );
  assert.equal(
    (await exports.passwordService.requestLink("student@example.com")).message,
    "ok",
  );
  const payload = {
    token: "test-token",
    email: "student@example.com",
    password: "12345678",
    password_confirmation: "12345678",
  };
  await exports.passwordService.reset(payload);
  assert.deepEqual(JSON.parse(JSON.stringify(calls)), [
    ["csrf", "/sanctum/csrf-cookie"],
    ["post", "/password/email", { email: "student@example.com" }],
    ["csrf", "/sanctum/csrf-cookie"],
    ["post", "/password/reset", payload],
  ]);
});
