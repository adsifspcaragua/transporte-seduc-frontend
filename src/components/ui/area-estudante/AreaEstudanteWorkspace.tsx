"use client";

import axios from "axios";
import { ArrowRight, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/buttons";
import { CpfInput } from "@/components/form/inputs";
import { recadastroService } from "@/services/api/modules/recadastro";
import { cleanCpf, isValidCpf } from "@/utils/cpf";

export const STUDENT_ACCESS_STORAGE_KEY = "transporte-seduc:student-access";
const REGISTRATION_DRAFT_STORAGE_KEY = "transporte-seduc:registration-draft";

type ApiError = { message?: string; errors?: { cpf?: string[] } };

export function AreaEstudanteWorkspace() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleContinue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = cleanCpf(cpf);
    if (!isValidCpf(value)) {
      setError("Informe um CPF válido.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const access = await recadastroService.acessar(value);
      window.sessionStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
      window.sessionStorage.setItem(
        STUDENT_ACCESS_STORAGE_KEY,
        JSON.stringify(access),
      );
      router.push("/registro");
    } catch (currentError) {
      if (axios.isAxiosError<ApiError>(currentError)) {
        setError(
          currentError.response?.data?.errors?.cpf?.[0] ??
            currentError.response?.data?.message ??
            "Não foi possível consultar o CPF.",
        );
      } else {
        setError("Não foi possível consultar o CPF.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full overflow-hidden bg-surface-muted lg:h-screen">
      <div className="relative order-2 hidden h-full w-[63%] shrink-0 bg-brand-600 lg:block">
        <Image
          src="/login/area-estudante.png"
          alt="Estudantes embarcando no transporte universitário"
          fill
          priority
          sizes="63vw"
          className="rounded-bl-[15%] object-cover"
        />
      </div>

      <section className="relative order-1 flex min-h-screen w-full min-w-0 flex-1 items-center justify-center overflow-hidden px-6 py-8 lg:h-full lg:min-h-0 lg:px-12">
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[32%] rounded-tr-[7.5vw_17vh] bg-brand-600"
          aria-hidden="true"
        />

        <div className="relative z-10 flex min-w-0 max-w-128 flex-1 flex-col justify-between gap-8 rounded-2xl bg-surface-primary p-6 text-content-primary shadow-2xl shadow-brand-800/20 sm:p-8 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
          <div className="flex w-full justify-center">
            <Image
              alt="Prefeitura Municipal de Caraguatatuba"
              className="h-auto w-60"
              height={175}
              src="/logo_caraguatatuba.svg"
              width={633}
            />
          </div>

          <div className="mx-auto flex w-full max-w-112.5 flex-col gap-6">
            <div className="flex flex-col gap-3">
              <h1 className="text-center text-2xl font-bold text-brand-600">
                Área do estudante
              </h1>
              <p className="text-base leading-relaxed text-content-secondary sm:text-lg">
                Informe seu CPF para dar continuidade.
              </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleContinue}>
              <CpfInput
                error={error}
                label="CPF"
                name="cpf"
                onChange={(event) => {
                  setCpf(event.target.value);
                  setError("");
                }}
                value={cpf}
                variant="white"
                className="rounded-full bg-surface-primary pl-7"
                labelClassName="ml-3"
              />

              <Button
                loading={loading}
                rightIcon={<ArrowRight className="size-5" />}
                type="submit"
                variant="light"
                className="rounded-full text-sm"
              >
                Continuar
              </Button>

              <Link
                className="inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-action-light-default bg-action-light-default px-5 text-sm font-semibold normal-case tracking-normal text-brand-600 shadow-sm transition-all duration-200 hover:border-action-light-hover hover:bg-action-light-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.99] active:border-action-light-pressing active:bg-action-light-pressing"
                href="/login"
              >
                <LogIn className="size-5" />
                <span>Acesso administrativo</span>
              </Link>
            </form>
          </div>

          <p className="text-center text-sm text-content-muted">
            © 2026 Prefeitura Municipal de Caraguatatuba.
            <br />
            Todos os direitos reservados.
          </p>
        </div>
      </section>
    </main>
  );
}
