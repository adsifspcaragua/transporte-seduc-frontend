import { Check, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/utils/cn";

export type RegisterStepStatus = "complete" | "incomplete" | "pending";

type Props = {
  children: ReactNode;
  step: number | null;
  stepStatuses?: RegisterStepStatus[];
};

const steps = [
  "Identidade Civil",
  "Endereço e Contato",
  "Dados Institucionais",
  "Upload de Documentos",
  "Revisão e Confirmação",
];

const statusLabels: Record<RegisterStepStatus, string> = {
  complete: "Completo",
  incomplete: "Incompleto",
  pending: "Pendente",
};

export default function Register({ children, step, stepStatuses = [] }: Props) {
  const currentStep =
    step === null ? steps.length : Math.min(step + 1, steps.length);
  const progress = Math.round((currentStep / steps.length) * 100);

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="sticky top-0 hidden h-screen w-143.75 shrink-0 flex-col overflow-hidden bg-brand-600 p-6 text-white lg:flex">
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

        <div className="mt-16">
          <h2 className="text-2xl font-bold">Realize seu cadastro</h2>

          <div className="mt-8">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-brand-050">
              <span>
                Etapa {currentStep} de {steps.length}
              </span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full bg-brand-050 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="mt-10">
            <ol className="flex flex-col">
              {steps.map((item, index) => {
                const status = stepStatuses[index] ?? "pending";
                const isActive = step !== null && index === step;
                const isLast = index === steps.length - 1;
                const isComplete = status === "complete";

                const marker = isComplete ? (
                  <Check className="size-7 text-brand-050" />
                ) : (
                  <span className="text-lg font-bold">{index + 1}</span>
                );

                return (
                  <li key={item} className="grid grid-cols-[4.5rem_1fr]">
                    <div className="relative flex justify-center">
                      <div
                        className={cn(
                          "relative z-10 flex size-12 items-center justify-center rounded-full border-2 text-brand-050 transition-all duration-200",
                          isActive && "border-white bg-brand-600 text-white",
                          !isActive &&
                            isComplete &&
                            "border-brand-050 bg-brand-700",
                          !isActive &&
                            !isComplete &&
                            "border-white/60 bg-brand-800 text-white/85",
                        )}
                      >
                        {marker}
                      </div>

                      {!isLast && (
                        <div
                          className={cn(
                            "absolute top-12 bottom-0 z-0 w-0.5 bg-white/35",
                            isComplete && "bg-brand-050/80",
                          )}
                        />
                      )}
                    </div>

                    <div className={cn("pb-2", isLast && "pb-0")}>
                      <div
                        className={cn(
                          "flex min-h-16 items-center justify-between gap-4 rounded-lg border px-5 py-3.5 transition-all duration-200",
                          isActive &&
                            "border-white bg-white text-brand-700 shadow-xl shadow-brand-800/20",
                          !isActive &&
                            "border-white/10 bg-white/10 text-white shadow-sm shadow-brand-800/10",
                          !isActive &&
                            isComplete &&
                            "border-brand-050/20 bg-white/15",
                        )}
                      >
                        <div>
                          <span
                            className={cn(
                              "block text-base font-semibold transition-colors duration-200",
                              isActive && "font-bold text-brand-700",
                              !isActive && "text-white/90",
                              !isActive && isComplete && "text-white",
                            )}
                          >
                            {item}
                          </span>
                          <span
                            className={cn(
                              "mt-1 block text-sm font-medium transition-colors duration-200",
                              isActive && "text-brand-700",
                              !isActive && "text-brand-050/75",
                              !isActive && isComplete && "text-brand-050",
                            )}
                          >
                            {statusLabels[status]}
                          </span>
                        </div>

                        {isActive && (
                          <ChevronRight className="size-6 shrink-0 text-brand-600" />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>

        <p className="mt-auto text-center text-sm leading-6 text-white/90">
          © 2026 Prefeitura Municipal de Caraguatatuba.
          <br />
          Todos os direitos reservados.
        </p>
      </aside>

      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:p-10">{children}</main>
    </div>
  );
}
