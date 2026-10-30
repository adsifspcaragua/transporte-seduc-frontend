const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function loadPresentation() {
  const filename = path.resolve(
    __dirname,
    "../src/components/ui/estudantes/studentAccountPresentation.ts",
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

test("association omits unchanged values and changes without authorization", () => {
  const { buildStudentAccountPayload } = loadPresentation();
  assert.equal(JSON.stringify(buildStudentAccountPayload("7", 7, true)), "{}");
  assert.equal(JSON.stringify(buildStudentAccountPayload("8", 7, false)), "{}");
  assert.equal(JSON.stringify(buildStudentAccountPayload("", 7, false)), "{}");
});

test("association sends explicit null for unlink and rejects invalid IDs", () => {
  const { buildStudentAccountPayload } = loadPresentation();
  assert.equal(
    JSON.stringify(buildStudentAccountPayload("", 7, true)),
    '{"user_id":null}',
  );
  assert.equal(
    JSON.stringify(buildStudentAccountPayload("8", null, true)),
    '{"user_id":8}',
  );
  for (const id of ["NaN", "0", "-1", "1.5", "Infinity"]) {
    assert.equal(
      JSON.stringify(buildStudentAccountPayload(id, null, true)),
      "{}",
    );
  }
});

test("account choices require active student role and preserve an existing association", () => {
  const { getStudentAccountOptions } = loadPresentation();
  const users = [
    {
      id: 1,
      name: "Student",
      email: "s@example.com",
      ativo: true,
      roles: ["estudante"],
    },
    {
      id: 2,
      name: "Admin",
      email: "a@example.com",
      ativo: true,
      roles: ["admin"],
    },
    {
      id: 3,
      name: "Inactive",
      email: "i@example.com",
      ativo: false,
      roles: ["estudante"],
    },
  ];
  const options = getStudentAccountOptions(users, 2);
  assert.equal(
    JSON.stringify(options.map((option) => option.value)),
    '["1","2"]',
  );
  assert.equal(options[1].disabled, true);
  assert.equal(getStudentAccountOptions([], 9)[0].value, "9");
  assert.equal(getStudentAccountOptions([], 9)[0].disabled, true);
});
