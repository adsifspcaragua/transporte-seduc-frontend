const path = require("node:path");
const { tmpdir } = require("node:os");
const playwrightModule = process.env.UNIBUS_PLAYWRIGHT_MODULE || "playwright";
const { chromium } = require(playwrightModule);
const { expect } = require(path.join(playwrightModule, "test"));
const assert = require("node:assert/strict");

const base = process.env.UNIBUS_TEST_BASE_URL || "http://127.0.0.1:3123";
if (!["127.0.0.1", "localhost"].includes(new URL(base).hostname))
  throw Error("Use somente um servidor local para este ensaio.");
const today = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
}).format(new Date());
const permissions = [
  "dashboard.view",
  "linhas.view",
  "linhas.write",
  "estudantes.view",
  "veiculos.view",
  "veiculos.write",
  "viagens.view",
  "viagens.write",
  "geocercas.view",
  "geocercas.write",
  "users.view",
  "users.write",
  "roles.view",
  "presencas.view",
  "dispositivos.view",
  "auditoria.view",
];
const lines = [
  {
    id: 1,
    name: "Linha Simulada",
    description: "Atendimento de teste",
    max_capacity: 30,
    ocupacao: 5,
    motorista_id: 5,
    motorista: { id: 5, name: "Motorista Simulado" },
  },
];
const vehicles = [
  {
    id: 2,
    identificacao: "Van Simulada",
    placa: "TESTE",
    ativo: true,
    qr_gerado_em: today,
    atribuicoes: [],
  },
];
const assignments = [
  {
    id: 10,
    linha_id: 1,
    veiculo_id: 2,
    inicio: today,
    fim: null,
    veiculo: vehicles[0],
    linha: { id: 1, name: lines[0].name },
  },
];
const schedules = [];
const trips = [];
const links = [];
const points = [
  {
    id: 4,
    nome: "Ponto Simulado",
    latitude: -23.6,
    longitude: -45.4,
    raio_metros: 100,
    ativo: true,
    linhas: [],
  },
];
const writes = [];
const errors = [];
const unexpected = [];
async function choose(scope, label, name) {
  await scope.getByRole("button", { name: label }).click();
  await scope.getByRole("option", { name, exact: true }).click();
}
let mode = "normal";
let failLineRead = false;
let failPointDetail = false;
(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.UNIBUS_BROWSER_EXECUTABLE ||
      (process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : undefined),
  });
  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  });
  await context.route("**/*", async (route) => {
    const req = route.request(),
      url = new URL(req.url());
    const p = url.pathname.replace(/^\/api/, "");
    const headers = {
      "access-control-allow-origin": base,
      "access-control-allow-credentials": "true",
      "access-control-allow-headers": "*",
      "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    };
    const send = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: "application/json",
        headers,
        body: JSON.stringify(body),
      });
    if (req.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (p === "/me")
      return send({
        id: 99,
        name: "Equipe Simulada",
        email: "teste@example.invalid",
        roles: ["gestor"],
        permissions,
      });
    if (p === "/sanctum/csrf-cookie")
      return route.fulfill({ status: 204, headers });
    const isApi = [
      "/linha",
      "/veiculos",
      "/horarios-viagem",
      "/viagens",
      "/pontos-embarque",
      "/dias-sem-operacao",
      "/users",
      "/roles",
      "/dispositivos",
      "/presencas",
      "/auditoria",
      "/instituicao",
    ].some((path) => p === path || p.startsWith(`${path}/`));
    if (!isApi) {
      if (url.origin === base) return route.continue();
      unexpected.push(p);
      return route.abort();
    }
    if (req.method() !== "GET") {
      const payload = req.postDataJSON();
      writes.push({ method: req.method(), path: p, payload });
      if (p === "/horarios-viagem") {
        const h = {
          ...payload,
          id: 20 + schedules.length,
          linha: { id: 1, name: lines[0].name },
          janela_efetiva: { antes_min: 15, depois_min: 15 },
        };
        schedules.push(h);
        return send(
          { data: h, message: "Horário cadastrado com sucesso" },
          201,
        );
      }
      if (p === "/pontos-embarque/linhas") {
        const l = {
          ...payload,
          id: 40 + links.length,
          ponto: points[0],
          linha: { id: 1, name: lines[0].name },
        };
        links.push(l);
        return send({ data: l, message: "Ponto vinculado" }, 201);
      }
      if (p === "/viagens/gerar") {
        for (const h of schedules) {
          if (!trips.some((t) => t.horario_id === h.id))
            trips.push({
              id: 100 + trips.length,
              horario_id: h.id,
              linha_id: 1,
              linha: { id: 1, name: lines[0].name },
              data: today,
              sentido: h.sentido,
              horario_saida: h.horario_saida,
              janela_inicio: `${today}T18:15:00-03:00`,
              janela_fim: `${today}T18:45:00-03:00`,
              status: "Programada",
              veiculo_id: 2,
              veiculo: vehicles[0],
              veiculo_substituido: false,
            });
        }
        return send({
          data: { criadas: trips.length, conflitos: [] },
          message: "Viagens geradas",
        });
      }
      if (p === "/linha" && req.method() === "POST") {
        const l = { ...payload, id: lines.length + 1 };
        lines.push(l);
        if (mode === "lost-response") {
          failLineRead = true;
          return route.abort("failed");
        }
        return send({ data: l, message: "Linha criada" });
      }
      if (p === "/linha/1") {
        Object.assign(lines[0], payload);
        return send({ data: lines[0] });
      }
      if (p === "/pontos-embarque") {
        const point = { ...payload, id: points.length + 5 };
        points.push(point);
        return send({ data: point }, 201);
      }
      return send({ message: "Operação não simulada" }, 422);
    }
    if (p === "/linha")
      return failLineRead
        ? send({ message: "Limite de consulta" }, 429)
        : send({ data: lines });
    if (p === "/veiculos/atribuicoes") return send({ data: assignments });
    if (p === "/veiculos") return send({ data: vehicles });
    if (p === "/horarios-viagem") return send({ data: schedules });
    if (p.startsWith("/horarios-viagem/"))
      return send({
        data: schedules.find((h) => h.id === Number(p.split("/").pop())),
      });
    if (p === "/pontos-embarque/linhas") return send({ data: links });
    if (p === "/pontos-embarque") return send({ data: points });
    if (p.startsWith("/pontos-embarque/"))
      return failPointDetail
        ? send({ message: "Sem acesso" }, 403)
        : send({
            data: points.find((h) => h.id === Number(p.split("/").pop())),
          });
    if (p === "/dias-sem-operacao") return send({ data: [] });
    if (p === "/viagens") {
      const page = Number(url.searchParams.get("page") || 1);
      return send({
        data: trips,
        meta: {
          current_page: page,
          last_page: 1,
          total: trips.length,
          per_page: 50,
          from: trips.length ? 1 : null,
          to: trips.length || null,
        },
      });
    }
    return send({ data: [] });
  });
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("dialog", (d) => d.accept());
  await page.goto(`${base}/transportes`);
  await expect(
    page.getByRole("heading", { name: "Linha Simulada", exact: true }),
  ).toBeVisible();
  assert.equal(writes.length, 0, "overview must never write");
  await page
    .getByRole("button", { name: "Configurar transporte", exact: true })
    .click();
  await choose(page, /^Linha/, "Linha Simulada");
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await page.getByRole("button", { name: "3. Horários", exact: true }).click();
  await page
    .getByRole("button", { name: "2. Veículo", exact: true })
    .click();
  assert.equal(writes.length, 0, "navigation must not write");
  lines[0].name = "Linha atualizada por outro servidor";
  lines[0].max_capacity = 45;
  await page.getByRole("button", { name: "3. Horários", exact: true }).click();
  await page.getByRole("button", { name: "Cadastrar", exact: true }).click();
  let dialog = page.getByRole("dialog");
  await choose(dialog, /^Sentido/, "Ida");
  const day = [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ][new Date(`${today}T12:00:00Z`).getUTCDay()];
  await dialog.getByLabel(day, { exact: true }).press("Space");
  await dialog.locator('input[name="horario_saida"]').fill("18:30");
  await dialog.locator('input[name="horario_saida"]').press("Tab");
  await dialog
    .getByLabel("Entendi o alcance e quero gravar esta alteração.")
    .press("Space");
  await dialog
    .getByRole("button", { name: "Confirmar", exact: true })
    .last()
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "4. Pontos de embarque", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Cadastrar", exact: true })
    .first()
    .click();
  dialog = page.getByRole("dialog");
  await choose(dialog, /^ponto/, "Ponto Simulado");
  await choose(dialog, /^Sentido/, "Ida");
  await dialog
    .getByLabel("Entendi o alcance e quero gravar esta alteração.")
    .press("Space");
  await dialog
    .getByRole("button", { name: "Confirmar", exact: true })
    .last()
    .click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: "5. Calendário e viagens", exact: true })
    .click();
  const before = writes.length;
  await page
    .getByRole("button", { name: "Gerar viagens", exact: true })
    .click();
  dialog = page.getByRole("dialog");
  assert.equal(writes.length, before, "opening generation is not execution");
  await dialog
    .getByLabel("Entendi o alcance e quero gravar esta alteração.")
    .press("Space");
  await dialog
    .getByRole("button", { name: "Confirmar", exact: true })
    .last()
    .click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "6. Revisão", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "O que foi enviado nesta configuração" }),
  ).toBeVisible();
  assert.ok(
    writes.filter((x) => x.path === "/horarios-viagem")[0].payload.linha_id ===
      1,
  );
  assert.ok(
    writes.filter((x) => x.path === "/pontos-embarque/linhas")[0].payload
      .linha_id === 1,
  );
  assert.ok(
    writes.filter((x) => x.path === "/viagens/gerar")[0].payload.linha_id === 1,
  );
  await page.screenshot({
    path: path.join(tmpdir(), "unibus-guided-desktop.png"),
    fullPage: true,
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await expect
    .poll(() =>
      page.locator("main").evaluate((el) => el.getBoundingClientRect().width),
    )
    .toBeGreaterThan(300);
  await page.screenshot({
    path: path.join(tmpdir(), "unibus-guided-mobile.png"),
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "mobile page must not overflow",
  );
  const edge = await context.newPage();
  edge.on("dialog", (d) => d.accept());
  edge.on("pageerror", (e) => errors.push(e.message));
  await edge.goto(`${base}/transportes?linha=1&configurar=1`);
  await edge
    .getByRole("button", { name: "4. Pontos de embarque", exact: true })
    .click();
  await edge
    .getByText("Não encontrou o local? Cadastrar um novo ponto", {
      exact: true,
    })
    .click();
  await edge
    .getByRole("button", { name: "Cadastrar", exact: true })
    .last()
    .click();
  const edgeDialog = edge.getByRole("dialog");
  await edgeDialog.locator('input[name="nome"]').fill("Novo ponto de teste");
  await edgeDialog.locator('input[name="latitude"]').fill("-23.61");
  await edgeDialog.locator('input[name="longitude"]').fill("-45.41");
  await edgeDialog.locator('input[name="raio_metros"]').fill("120");
  await edgeDialog
    .getByLabel("Entendi o alcance e quero gravar esta alteração.")
    .press("Space");
  failPointDetail = true;
  await edgeDialog
    .getByRole("button", { name: "Confirmar", exact: true })
    .last()
    .click();
  await expect(
    edgeDialog.getByRole("button", { name: "Confirmar", exact: true }).last(),
  ).toBeDisabled();
  assert.equal(writes.filter((x) => x.path === "/pontos-embarque").length, 1);
  await edgeDialog
    .getByRole("button", { name: "Cancelar", exact: true })
    .click();
  await edge
    .getByRole("button", { name: "2. Veículo", exact: true })
    .click();
  failLineRead = true;
  await edge.getByRole("button", { name: "6. Revisão", exact: true }).click();
  await edge
    .getByRole("button", {
      name: "Conferir novamente no servidor",
      exact: true,
    })
    .click();
  await expect(
    edge.getByText(/Não foi possível conferir os dados atuais da linha/),
  ).toBeVisible();
  await edge
    .getByRole("button", { name: "2. Veículo", exact: true })
    .click();
  failLineRead = false;
  await edge.close();
  const lost = await context.newPage();
  lost.on("pageerror", (e) => errors.push(e.message));
  lost.on("dialog", (d) => d.accept());
  await lost.goto(`${base}/transportes`);
  await lost
    .getByRole("button", { name: "Configurar transporte", exact: true })
    .click();
  await lost
    .getByRole("button", { name: "Cadastrar nova linha", exact: true })
    .click();
  const lostDialog = lost.getByRole("dialog");
  await lostDialog
    .getByRole("textbox", { name: /^Nome/ })
    .fill("Linha com resposta perdida");
  await lostDialog.getByLabel(/^Capacidade/).fill("20");
  await lostDialog
    .getByLabel(
      "Conferi os cadastros existentes e quero gravar esta nova linha.",
    )
    .press("Space");
  mode = "lost-response";
  await lostDialog
    .getByRole("button", { name: "Confirmar cadastro", exact: true })
    .click();
  await expect(
    lostDialog.getByRole("button", { name: "Confirmar cadastro", exact: true }),
  ).toBeDisabled();
  assert.equal(
    writes.filter((w) => w.path === "/linha" && w.method === "POST").length,
    1,
  );
  await lost.close();
  failLineRead = false;
  mode = "normal";
  const navigation = await context.newPage();
  navigation.on("pageerror", (e) => errors.push(e.message));
  await navigation.goto(`${base}/linhas`);
  await navigation
    .getByRole("button", {
      name: "Ações de Linha atualizada por outro servidor",
      exact: true,
    })
    .click();
  const configureLink = navigation.getByRole("link", {
    name: "Configurar transporte",
    exact: true,
  });
  await expect(configureLink).toHaveAttribute(
    "href",
    "/transportes?linha=1&configurar=1",
  );
  await configureLink.click();
  await expect(
    navigation.getByRole("heading", {
      name: "Configurar transporte · Linha atualizada por outro servidor",
      exact: true,
    }),
  ).toBeVisible();
  await navigation.close();
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify({
      result: "PASS",
      scenario:
        "six steps, reuse, explicit generation, review, mobile, failed confirmation, lost response, concurrent change, link from lines",
      writes: writes.map((x) => ({ method: x.method, path: x.path })),
      pageErrors: errors,
      externalBlocked: unexpected,
    }),
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
