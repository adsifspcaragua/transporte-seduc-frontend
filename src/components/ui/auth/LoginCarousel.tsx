"use client";

import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

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

export default function LoginCarousel() {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

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

      <div className="absolute right-8 top-8 z-20">
        <Link
          href="/registro"
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-action-light-default bg-action-light-default px-5 text-sm font-semibold text-brand-600 shadow-sm transition-all duration-200 hover:border-action-light-hover hover:bg-action-light-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.99] active:border-action-light-pressing active:bg-action-light-pressing"
        >
          <span>Solicitar transporte universitário</span>
          <ArrowRight className="size-5" />
        </Link>
      </div>

      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.alt}
            type="button"
            aria-label={`Ir para slide ${index + 1}`}
            onClick={() => setCurrent(index)}
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
