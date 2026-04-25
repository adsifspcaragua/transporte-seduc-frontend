import { Check } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";
import Link from "next/link";

type Props = {
  children: ReactNode;
  step: number;
};

const steps = [
  "Identidade Civil",
  "Endereço e Contato",
  "Dados Institucionais",
  "Upload de Documentos",
  "Revisão e Confirmação",
];

export default function Register({ children, step }: Props) {
  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex min-h-screen w-143.75 shrink-0 flex-col bg-brand-600 p-6 text-white">
        <div className="w-full">
          <Link href="/login">
            <Image
              src="/logo_educacao_w.svg"
              alt="Logo da Prefeitura Municipal de Caraguatatuba"
              width={240}
              height={90}
              priority
            />
          </Link>
        </div>

        <div className="ml-8 mt-24">
          <h2 className="text-xl font-bold">Realize seu cadastro</h2>

          <div className="relative mt-10">
            <div className="absolute left-[1.375rem] top-7 h-[calc(100%-3.5rem)] w-3 rounded-full bg-white" />

            <ol className="relative flex flex-col gap-8">
              {steps.map((item, index) => {
                const isActive = index === step;
                const isCompleted = index < step;

                return (
                  <li key={item} className="relative flex items-center gap-5">
                    <div
                      className={cn(
                        "relative z-10 flex size-14 shrink-0 items-center justify-center rounded-full bg-white",
                        isActive && "border-[9px] border-white bg-brand-600",
                      )}
                    >
                      {isCompleted && (
                        <div className="flex size-[2.375rem] items-center justify-center rounded-full bg-brand-600">
                          <Check className="size-7 text-white" />
                        </div>
                      )}
                    </div>

                    <span
                      className={cn(
                        "text-sm font-medium text-white/62 transition-colors duration-200",
                        isActive && "text-base font-bold text-white",
                        isCompleted && "text-white",
                      )}
                    >
                      {item}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <p className="mt-auto text-center text-sm text-white">
          © 2026 Prefeitura Municipal de Caraguatatuba.
          <br />
          Todos os direitos reservados.
        </p>
      </aside>

      <main className="min-w-0 flex-1 p-8">{children}</main>
    </div>
  );
}
