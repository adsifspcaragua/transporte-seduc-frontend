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
    <div className="relative h-full w-full overflow-hidden bg-[#0d4f8f]">
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

          <div className="absolute inset-0 bg-[#0a73b8]/38" />
        </div>
      ))}

      <div className="absolute inset-y-0 left-0 z-10 w-px bg-white/20" />

      <div className="absolute right-8 top-8 z-20">
        <Link
          href="/registro"
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#C4E6F0] bg-[#C4E6F0] px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-[#084E80] shadow-sm transition-all duration-200 hover:border-[#D6EFF6] hover:bg-[#D6EFF6] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#084E80] active:scale-[0.99] active:border-[#AFD8E5] active:bg-[#AFD8E5]"
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
