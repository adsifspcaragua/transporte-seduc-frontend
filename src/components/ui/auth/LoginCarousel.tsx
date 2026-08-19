"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

const slides = [
  {
    src: "/login/carrossel-3.png",
    alt: "Imagem ilustrativa de um ônibus",
  },
  {
    src: "/login/carrossel-2.png",
    alt: "Imagem ilustrativa do interior de um ônibus (2)",
  },
  {
    src: "/login/carrossel-1.png",
    alt: "Imagem ilustrativa do interior de um ônibus (1)",
  },
];

const SLIDE_DURATION_MS = 4000;

export default function LoginCarousel() {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSlideTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION_MS);
  }, []);

  useEffect(() => {
    startSlideTimer();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [startSlideTimer]);

  function handleSlideChange(index: number) {
    setCurrent(index);
    startSlideTimer();
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-login-carousel-bg">
      {slides.map((slide, index) => (
        <div
          key={slide.alt}
          className={`absolute inset-0 transition-opacity duration-700 ${
            current === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={slide.src}
            alt={slide.alt}
            fill
            priority={index === 0}
            className="object-cover"
          />

          <div className="absolute inset-0 bg-login-carousel-overlay/38" />
        </div>
      ))}

      <div className="absolute inset-y-0 left-0 z-10 w-px bg-white/20" />

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.alt}
            type="button"
            aria-label={`Ir para slide ${index + 1}`}
            onClick={() => handleSlideChange(index)}
            className={`h-2.5 rounded-full transition-all ${
              current === index
                ? "w-8 bg-white"
                : "w-2.5 bg-white/35 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
