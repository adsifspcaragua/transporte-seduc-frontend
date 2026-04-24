"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BiRightArrowAlt } from "react-icons/bi";

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
          className="inline-flex items-center gap-3 rounded-2xl border border-white/35 bg-[#d5ebfb]/88 px-5 py-3 text-sm font-semibold text-brand-700 shadow-[0_18px_48px_rgba(4,24,54,0.28)] backdrop-blur-md transition hover:bg-[#e2f2fd] hover:shadow-[0_22px_54px_rgba(4,24,54,0.34)]"
        >
          <span>Solicitar transporte universitário</span>
          <span className="flex size-6 items-center justify-center rounded-full border border-brand-700/30 bg-white/35">
            <BiRightArrowAlt className="size-4" />
          </span>
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
