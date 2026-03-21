"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const slides = [
    {
        src: "/login/carrossel-3.png",
        alt: "Ônibus do transporte universitário",
    },
    {
        src: "/login/carrossel-3.png",
        alt: "Imagem institucional do transporte universitário",
    },
    {
        src: "/login/carrossel-3.png",
        alt: "Imagem ilustrativa do sistema de transporte",
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
        <div className="relative h-full w-full overflow-hidden bg-brand-700">
            {slides.map((slide, index) => (
                <div
                    key={slide.src}
                    className={`absolute inset-0 transition-opacity duration-700 ${current === index ? "opacity-100" : "opacity-0"
                        }`}
                >
                    <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        priority={index === 0}
                        className="object-cover"
                    />

                    <div className="absolute inset-0 bg-black/20" />
                </div>
            ))}

            <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2">
                {slides.map((_, index) => (
                    <button
                        // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                        key={index}
                        type="button"
                        aria-label={`Ir para slide ${index + 1}`}
                        onClick={() => setCurrent(index)}
                        className={`h-2.5 rounded-full transition-all ${current === index
                            ? "w-8 bg-white"
                            : "w-2.5 bg-white/35 hover:bg-white/60"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
}