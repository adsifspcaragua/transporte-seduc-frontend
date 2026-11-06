const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const ts = require("typescript");

const cache = new Map();
function loadComponent(file) {
  const absolute = path.resolve(__dirname, "..", file);
  if (cache.has(absolute)) return cache.get(absolute);
  const exports = {};
  cache.set(absolute, exports);
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(absolute, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
        esModuleInterop: true,
      },
    }).outputText,
    {
      exports,
      require(name) {
        if (name === "@/hooks/use-cached-query")
          return {
            useCachedQuery: () => ({
              data: [{ id: 4, name: "Linha Centro" }],
              isLoading: false,
              isFetching: false,
              refresh: async () => {},
            }),
          };
        if (name === "@/services/api/page-queries") return { linhasQuery: {} };
        if (name === "@/services/api/modules/transporte")
          return { transporteQuery: {} };
        // The Next router and authenticated session belong to the running app.
        if (name === "next/navigation") {
          return { usePathname: () => "/recadastramento" };
        }
        if (name === "@/hooks/use-authz") {
          return {
            useAuthz: () => ({
              can: () => true,
              canAny: () => true,
              permissions: [],
            }),
          };
        }
        if (name === "@/hooks/use-auth") {
          return { useAuth: () => ({ user: null, signOut: () => {} }) };
        }
        if (!name.startsWith("@/") && !name.startsWith(".")) {
          return require(name);
        }
        const base = name.startsWith("@/")
          ? path.resolve(__dirname, "../src", name.slice(2))
          : path.resolve(path.dirname(absolute), name);
        const target = [".tsx", ".ts", "/index.ts"].find((suffix) =>
          fs.existsSync(base + suffix),
        );
        return loadComponent(
          path.relative(path.resolve(__dirname, ".."), base + target),
        );
      },
    },
  );
  return exports;
}

test("date fields use the administrative style and keep ISO submission with Brazilian display", () => {
  const { default: DateInput } = loadComponent(
    "src/components/form/inputs/DateInput.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(DateInput, {
      label: "Data de vigência",
      name: "data",
      value: "2026-11-06",
      onChange() {},
    }),
  );
  assert.match(html, /data-input-variant="white"/);
  assert.match(html, /value="06\/11\/2026"/);
  assert.match(html, /type="hidden"[^>]*name="data"[^>]*value="2026-11-06"/);
});

test("transport navigation assigns every section once and retains indicators", () => {
  const { transporteConfigs } = loadComponent(
    "src/components/ui/transportes/transporteConfig.ts",
  );
  const { transporteGroups } = loadComponent(
    "src/components/ui/transportes/transporteNavigation.ts",
  );
  const sections = transporteGroups.flatMap((group) => group.sections);
  assert.equal(new Set(sections).size, sections.length);
  assert.deepEqual(
    [...sections].sort(),
    [...transporteConfigs.map((config) => config.key), "indicadores"].sort(),
  );
});

test("explicit dark date fields preserve their style and constraints", () => {
  const { default: DateInput } = loadComponent(
    "src/components/form/inputs/DateInput.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(DateInput, {
      label: "Data",
      variant: "dark",
      value: "2026-11-06",
      disabled: true,
      min: "2026-01-01",
      max: "2026-12-31",
      onChange() {},
    }),
  );
  assert.match(html, /data-input-variant="dark"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /value="06\/11\/2026"/);
});

test("compact record actions retain accessible names and tooltips", () => {
  const { default: TableActionButton } = loadComponent(
    "src/components/table/TableActionButton.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(TableActionButton, {
      ariaLabel: "Editar registro",
      tooltip: "Editar",
      variant: "secondary",
      icon: React.createElement("svg"),
    }),
  );
  assert.match(html, /aria-label="Editar registro"/);
  assert.match(html, /title="Editar"/);
  assert.match(html, /type="button"/);
});

test("optional relationships allow clearing an existing selection", () => {
  const { TransporteLinhaField } = loadComponent(
    "src/components/ui/transportes/TransporteReferenceField.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(TransporteLinhaField, {
      field: { key: "linha_id", label: "Linha", required: false },
      value: "4",
      onChange() {},
    }),
  );
  assert.match(html, /<option value="">Sem seleção<\/option>/);
  assert.match(html, /Linha Centro/);
});

test("audit filters use already authorized names without duplicate choices", () => {
  const { TransporteResponsavelDisponivelField } = loadComponent(
    "src/components/ui/transportes/TransporteReferenceField.tsx",
  );
  const html = renderToStaticMarkup(
    React.createElement(TransporteResponsavelDisponivelField, {
      field: { key: "user_id", label: "Responsável", required: false },
      value: "",
      onChange() {},
      records: [
        { id: 7, name: "Gestora" },
        { id: 7, name: "Gestora" },
      ],
    }),
  );
  assert.equal((html.match(/<option value="7">/g) ?? []).length, 1);
  assert.match(html, /Gestora/);
});
