"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { getQuerySessionVersion } from "@/services/api/query-cache";

type QrArt = { url: string; svg: string; png: string };

export async function generateTransporteQr(url: string): Promise<QrArt> {
  const options = {
    errorCorrectionLevel: "M" as const,
    margin: 4,
    width: 1024,
    color: { dark: "#000000", light: "#ffffff" },
  };
  const [svg, png] = await Promise.all([
    QRCode.toString(url, { ...options, type: "svg" }),
    QRCode.toDataURL(url, { ...options, type: "image/png" }),
  ]);
  return { url, svg, png };
}

export function TransporteQrCode({ url }: { url: string }) {
  const [art, setArt] = useState<QrArt | null>(null);
  const [error, setError] = useState("");
  const printFrame = useRef<HTMLIFrameElement | null>(null);
  const generation = useRef(0);

  const generate = useCallback(() => {
    const currentGeneration = ++generation.current;
    const session = getQuerySessionVersion();
    setError("");
    setArt(null);
    void generateTransporteQr(url).then(
      (result) => {
        if (
          currentGeneration === generation.current &&
          session === getQuerySessionVersion()
        ) {
          setArt(result);
        }
      },
      () => {
        if (
          currentGeneration === generation.current &&
          session === getQuerySessionVersion()
        ) {
          setError(
            "Não foi possível gerar a imagem. Tente novamente ou copie o endereço do QR.",
          );
        }
      },
    );
  }, [url]);

  useEffect(() => {
    generate();
    return () => {
      generation.current++;
      printFrame.current?.remove();
      printFrame.current = null;
    };
  }, [generate]);

  function download(format: "svg" | "png") {
    if (!art || art.url !== url) return;
    const anchor = document.createElement("a");
    const svgUrl =
      format === "svg"
        ? URL.createObjectURL(
            new Blob([art.svg], { type: "image/svg+xml;charset=utf-8" }),
          )
        : null;
    anchor.href = svgUrl ?? art.png;
    anchor.download = `qr-veiculo.${format}`;
    anchor.click();
    if (svgUrl) URL.revokeObjectURL(svgUrl);
  }

  function print() {
    if (!art || art.url !== url) return;
    const session = getQuerySessionVersion();
    printFrame.current?.remove();
    const frame = document.createElement("iframe");
    frame.title = "Impressão do QR do veículo";
    frame.style.position = "fixed";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.setAttribute("aria-hidden", "true");
    // The encoder produces SVG paths only; no URL/token is interpolated as HTML.
    frame.srcdoc = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>QR do veículo</title><style>@page{size:A4;margin:20mm}body{margin:0;text-align:center;font:18px sans-serif;color:#000;background:#fff}svg{display:block;width:110mm;height:110mm;margin:12mm auto}h1{font-size:24px}p{margin:5mm 0}</style></head><body><h1>Transporte universitário</h1>${art.svg}<p>Leia o QR para registrar sua presença.</p></body></html>`;
    frame.onload = () => {
      if (
        printFrame.current !== frame ||
        session !== getQuerySessionVersion()
      ) {
        frame.remove();
        return;
      }
      const target = frame.contentWindow;
      if (!target) {
        setError(
          "Não foi possível abrir a impressão. Baixe o SVG ou PNG para imprimir.",
        );
        frame.remove();
        return;
      }
      target.onafterprint = () => {
        frame.remove();
        if (printFrame.current === frame) printFrame.current = null;
      };
      try {
        target.focus();
        target.print();
      } catch {
        setError(
          "Não foi possível abrir a impressão. Baixe o SVG ou PNG para imprimir.",
        );
        frame.remove();
        if (printFrame.current === frame) printFrame.current = null;
      }
    };
    printFrame.current = frame;
    document.body.append(frame);
  }

  const currentArt = art?.url === url ? art : null;
  return (
    <section
      aria-label="Arte do QR do veículo"
      className="space-y-4 rounded-xl border border-border-subtle bg-white p-4"
    >
      {currentArt ? (
        <Image
          src={currentArt.png}
          alt="QR do veículo para registrar presença no transporte universitário"
          width={320}
          height={320}
          unoptimized
          className="mx-auto h-auto w-full max-w-80"
        />
      ) : (
        <p
          className="py-8 text-center text-sm text-content-muted"
          aria-live="polite"
        >
          {error ? "Imagem indisponível." : "Gerando QR do veículo..."}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button
          fullWidth={false}
          size="sm"
          disabled={!currentArt}
          onClick={() => download("svg")}
        >
          Baixar SVG
        </Button>
        <Button
          fullWidth={false}
          size="sm"
          variant="secondary"
          disabled={!currentArt}
          onClick={() => download("png")}
        >
          Baixar PNG
        </Button>
        <Button
          fullWidth={false}
          size="sm"
          variant="secondary"
          disabled={!currentArt}
          onClick={print}
        >
          Imprimir QR
        </Button>
      </div>
      <p className="text-xs leading-5 text-content-muted">
        Imprima sem recortar a margem branca e confira a leitura antes de afixar
        no veículo.
      </p>
      {error && (
        <div role="alert" className="space-y-2 text-sm text-danger-600">
          <p>{error}</p>
          <Button
            fullWidth={false}
            size="sm"
            variant="secondary"
            onClick={generate}
          >
            Tentar gerar novamente
          </Button>
        </div>
      )}
    </section>
  );
}
