"use client";

import { useEffect } from "react";

/**
 * Registra o service worker (public/sw.js) com a versão do build na URL: a cada
 * deploy o navegador instala o novo e guarda os arquivos novos. Sem internet a
 * consulta da versão falha e o service worker já instalado segue valendo.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    )
      return;

    void fetch("/sw-assets", { cache: "no-store" })
      .then((resposta) => resposta.json() as Promise<{ versao: string }>)
      .then(({ versao }) =>
        navigator.serviceWorker.register(
          `/sw.js?v=${encodeURIComponent(versao)}`,
          { scope: "/" },
        ),
      )
      .catch(() => undefined);
  }, []);

  return null;
}
