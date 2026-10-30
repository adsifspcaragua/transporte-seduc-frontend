"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type QrDetector = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};
type QrDetectorConstructor = new (options: { formats: string[] }) => QrDetector;

export function useQrCamera(onRead: (value: string) => void) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const generation = useRef(0);
  const frame = useRef<number | null>(null);
  const onReadRef = useRef(onRead);
  const [isStarting, setIsStarting] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    onReadRef.current = onRead;
  }, [onRead]);

  const stop = useCallback(() => {
    generation.current++;
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setIsScanning(false);
    setIsStarting(false);
  }, []);

  useEffect(() => {
    function visibilityChanged() {
      if (document.hidden) stop();
    }
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      document.removeEventListener("visibilitychange", visibilityChanged);
      stop();
    };
  }, [stop]);

  const start = useCallback(async () => {
    stop();
    setError("");
    const Detector = (
      window as typeof window & { BarcodeDetector?: QrDetectorConstructor }
    ).BarcodeDetector;
    if (!Detector) {
      setError(
        "A leitura direta não está disponível neste navegador. Use a câmera do celular para abrir o QR da van ou informe a URL completa abaixo.",
      );
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setError(
        "A câmera exige um navegador compatível e conexão HTTPS. Você também pode abrir o QR pela câmera do celular.",
      );
      return;
    }
    const run = ++generation.current;
    setIsStarting(true);
    try {
      const detector = new Detector({ formats: ["qr_code"] });
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (run !== generation.current) {
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        return;
      }
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Não foi possível preparar a câmera.");
      video.srcObject = stream;
      await video.play();
      if (run !== generation.current) return;
      setIsStarting(false);
      setIsScanning(true);
      async function scan() {
        if (run !== generation.current) return;
        try {
          if (video && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
            const codes = await detector.detect(video);
            if (run !== generation.current) return;
            if (codes[0]?.rawValue) {
              stop();
              onReadRef.current(codes[0].rawValue);
              return;
            }
          }
        } catch {
          if (run !== generation.current) return;
          stop();
          setError(
            "Não foi possível ler a imagem. Tente novamente ou abra o QR pela câmera do celular.",
          );
          return;
        }
        frame.current = requestAnimationFrame(() => void scan());
      }
      void scan();
    } catch (currentError) {
      if (run !== generation.current) return;
      stop();
      setError(
        currentError instanceof DOMException &&
          currentError.name === "NotAllowedError"
          ? "Permissão da câmera negada. Autorize o acesso nas configurações do navegador ou use a câmera do celular."
          : currentError instanceof DOMException &&
              currentError.name === "NotFoundError"
            ? "Nenhuma câmera compatível foi encontrada. Abra o QR com outro leitor e informe a URL abaixo."
            : "Não foi possível abrir a câmera. Verifique se ela está disponível e tente novamente.",
      );
    }
  }, [stop]);
  return { videoRef, start, stop, isStarting, isScanning, error };
}
