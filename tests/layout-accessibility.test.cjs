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

const { AppSidebar } = loadComponent("src/components/ui/layout/AppSidebar.tsx");
const { AppHeader } = loadComponent("src/components/ui/layout/AppHeader.tsx");
const noop = () => {};

test("sidebar identifies the current page in expanded and collapsed modes", () => {
  for (const isOpen of [true, false]) {
    const html = renderToStaticMarkup(
      React.createElement(AppSidebar, {
        isOpen,
        isMobileOpen: false,
        onToggle: noop,
        onMobileClose: noop,
      }),
    );
    const desktopSidebar = html.match(/<aside[\s\S]*?<\/aside>/)?.[0];
    assert.ok(desktopSidebar, "Desktop sidebar must be rendered");
    assert.match(
      desktopSidebar,
      /<a[^>]*aria-current="page"[^>]*href="\/recadastramento"/,
    );
    assert.match(desktopSidebar, /aria-label="Gestão do transporte"/);
    assert.match(desktopSidebar, /aria-label="Embarques e presenças"/);
  }
});

test("mobile navigation trigger exposes its state and targets the sidebar dialog", () => {
  for (const isMobileSidebarOpen of [true, false]) {
    const html = renderToStaticMarkup(
      React.createElement(AppHeader, {
        isMobileSidebarOpen,
        onOpenMobileSidebar: noop,
      }),
    );
    const mobileTrigger = html.match(
      /<button[^>]*aria-controls="mobile-sidebar"[^>]*>/,
    )?.[0];
    assert.ok(
      mobileTrigger,
      "Mobile navigation trigger must target the sidebar",
    );
    assert.match(
      mobileTrigger,
      new RegExp(`aria-expanded="${isMobileSidebarOpen}"`),
    );
  }
  const html = renderToStaticMarkup(
    React.createElement(AppSidebar, {
      isOpen: true,
      isMobileOpen: false,
      onToggle: noop,
      onMobileClose: noop,
    }),
  );
  assert.match(html, /<dialog[^>]*id="mobile-sidebar"/);
});
