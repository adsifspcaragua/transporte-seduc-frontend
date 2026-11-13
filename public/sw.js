/*
 * Service worker do SIGTU: deixa o portal do estudante abrir sem internet.
 *
 * - /_next/static: arquivos com hash no nome; guardados todos na instalação
 *   (lista em /sw-assets) e servidos do cache primeiro.
 * - Páginas: rede primeiro (sempre a versão nova quando há conexão), cópia
 *   guardada quando não há. As do portal são guardadas já na instalação.
 * - API (outro domínio), RSC do Next e /sw-assets não passam por aqui: sem
 *   rede, a página cai na navegação completa, servida do cache.
 *
 * O registro sem conexão em si não depende disto: fica no IndexedDB e é
 * enviado pela página quando a conexão volta.
 */

const PAGINAS = "sigtu-paginas-v1";
const PREFIXO_ESTATICO = "sigtu-estatico-";
const PAGINAS_DO_PORTAL = [
  "/portal-estudante",
  "/portal-estudante/presenca",
  "/portal-estudante/dispositivo",
  "/portal-estudante/frequencia",
  "/portal-estudante/transporte",
  "/portal-estudante/conta",
  "/presenca/scan",
  "/login",
];

const versao =
  new URL(self.location.href).searchParams.get("v") || "sem-versao";
const ESTATICO = `${PREFIXO_ESTATICO}${versao}`;

async function guardarTodos(cache, urls) {
  // Um arquivo que falhar não impede os demais.
  await Promise.all(urls.map((url) => cache.add(url).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const resposta = await fetch("/sw-assets", { cache: "no-store" });
      const { arquivos } = await resposta.json();
      await guardarTodos(await caches.open(ESTATICO), arquivos);
      await guardarTodos(await caches.open(PAGINAS), PAGINAS_DO_PORTAL);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const nomes = await caches.keys();
      await Promise.all(
        nomes
          .filter(
            (nome) => nome.startsWith(PREFIXO_ESTATICO) && nome !== ESTATICO,
          )
          .map((nome) => caches.delete(nome)),
      );
      await self.clients.claim();
    })(),
  );
});

async function primeiroCache(request) {
  const guardada = await caches.match(request);
  if (guardada) return guardada;
  const resposta = await fetch(request);
  if (resposta.ok) (await caches.open(ESTATICO)).put(request, resposta.clone());
  return resposta;
}

async function primeiroRede(request) {
  const url = new URL(request.url);
  const chave = url.origin + url.pathname;
  try {
    const resposta = await fetch(request);
    if (resposta.ok) (await caches.open(PAGINAS)).put(chave, resposta.clone());
    return resposta;
  } catch {
    // A chave ignora a query: /presenca/scan?t=TOKEN usa a cópia de
    // /presenca/scan, e a página lê o token da própria URL.
    const guardada =
      (await caches.match(chave)) ||
      (url.pathname.startsWith("/portal-estudante/")
        ? await caches.match(`${url.origin}/portal-estudante`)
        : undefined);
    if (guardada) return guardada;
    return new Response(
      "<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'>" +
        "<p style='font-family:sans-serif;padding:24px'>Sem conexão. Abra o Portal do Estudante uma vez com internet para usá-lo offline.</p>",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname === "/sw-assets" || url.pathname === "/sw.js") return;
  if (request.headers.get("RSC") === "1") return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(primeiroCache(request));
  } else if (request.mode === "navigate") {
    event.respondWith(primeiroRede(request));
  } else if (/\.(png|svg|jpg|jpeg|webp|ico|woff2?)$/.test(url.pathname)) {
    event.respondWith(primeiroCache(request));
  }
});
