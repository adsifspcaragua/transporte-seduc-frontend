import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Lista do build atual para o service worker guardar (public/sw.js).
 *
 * Os arquivos de /_next/static têm hash no nome; guardando todos, o portal
 * abre sem internet mesmo em telas ainda não visitadas. A versão é o
 * BUILD_ID: a cada deploy o service worker é atualizado e troca o cache.
 */
export const dynamic = "force-dynamic";

async function listar(pasta: string, prefixo = ""): Promise<string[]> {
  const entradas = await readdir(pasta, { withFileTypes: true });
  const arquivos = await Promise.all(
    entradas.map((entrada) => {
      const relativo = `${prefixo}${entrada.name}`;
      return entrada.isDirectory()
        ? listar(path.join(pasta, entrada.name), `${relativo}/`)
        : Promise.resolve([relativo]);
    }),
  );
  return arquivos.flat();
}

export async function GET() {
  const raiz = path.join(process.cwd(), ".next");
  const versao = (
    await readFile(path.join(raiz, "BUILD_ID"), "utf8").catch(() => "dev")
  ).trim();
  const arquivos = (
    await listar(path.join(raiz, "static")).catch(() => [] as string[])
  )
    .filter((arquivo) => !arquivo.endsWith(".map"))
    .map((arquivo) => `/_next/static/${arquivo}`);

  return Response.json(
    { versao, arquivos },
    { headers: { "Cache-Control": "no-store" } },
  );
}
