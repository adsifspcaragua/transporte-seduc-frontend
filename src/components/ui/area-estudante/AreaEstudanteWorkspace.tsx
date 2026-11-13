"use client";

import axios from "axios";
import { ArrowRight, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/buttons";
import { CpfInput, Input } from "@/components/form/inputs";
import { recadastroService } from "@/services/api/modules/recadastro";
import type { AcessoEstudanteResponse } from "@/types/recadastro";
import { cleanCpf, isValidCpf } from "@/utils/cpf";

export const STUDENT_ACCESS_STORAGE_KEY = "transporte-seduc:student-access";
const REGISTRATION_DRAFT_STORAGE_KEY = "transporte-seduc:registration-draft";

type ApiError = {
  message?: string;
  errors?: { cpf?: string[]; codigo?: string[] };
};
type Verification = Extract<AcessoEstudanteResponse, { fluxo: "verificacao" }>;

export function AreaEstudanteWorkspace() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [codigo, setCodigo] = useState("");

  function continueWithAccess(
    access: Exclude<AcessoEstudanteResponse, Verification>,
  ) {
    window.sessionStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
    window.sessionStorage.setItem(
      STUDENT_ACCESS_STORAGE_KEY,
      JSON.stringify(access),
    );
    router.push("/registro");
  }

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
      if (verification) {
        if (!/^\d{6}$/.test(codigo)) {
          setError("Informe o código de 6 dígitos enviado por e-mail.");
          return;
        }
        continueWithAccess(
          await recadastroService.verificarAcesso(value, codigo),
        );
      } else {
        const access = await recadastroService.acessar(value);
        if (access.fluxo === "verificacao") {
          setVerification(access);
        } else {
          continueWithAccess(access);
        }
      }
    } catch (currentError) {
      if (axios.isAxiosError<ApiError>(currentError)) {
        setError(
          currentError.response?.data?.errors?.codigo?.[0] ??
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

  async function resendCode() {
    try {
      setLoading(true);
      setError("");
      const access = await recadastroService.acessar(cleanCpf(cpf));
      if (access.fluxo === "verificacao") setVerification(access);
    } catch (currentError) {
      setError(
        axios.isAxiosError<ApiError>(currentError)
          ? (currentError.response?.data?.message ??
              "Não foi possível reenviar o código.")
          : "Não foi possível reenviar o código.",
      );
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
                {verification
                  ? `Enviamos um código para ${verification.data.email_mascarado}. Informe-o para continuar. Ele vale por ${verification.data.validade_minutos} minutos.`
                  : "Já possui uma conta? Entre no portal com seu CPF e senha. Para iniciar sua inscrição, informe o CPF abaixo."}
              </p>
            </div>

            <form className="flex flex-col gap-5" onSubmit={handleContinue}>
              <CpfInput
                error={verification ? undefined : error}
                label="CPF"
                name="cpf"
                onChange={(event) => {
                  setCpf(event.target.value);
                  setError("");
                }}
                value={cpf}
                disabled={Boolean(verification)}
                variant="white"
                className="rounded-full bg-surface-primary pl-7"
                formatGuideClassName="pl-7"
                labelClassName="ml-3"
              />

              {verification && (
                <>
                  <Input
                    autoComplete="one-time-code"
                    error={error}
                    inputMode="numeric"
                    label="Código de acesso"
                    maxLength={6}
                    onChange={(event) => {
                      setCodigo(event.target.value.replace(/\D/g, ""));
                      setError("");
                    }}
                    pattern="[0-9]{6}"
                    required
                    value={codigo}
                    variant="white"
                  />
                  <div className="flex flex-wrap gap-3">
                    <Button
                      fullWidth={false}
                      disabled={loading}
                      onClick={() => void resendCode()}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Reenviar código
                    </Button>
                    <Button
                      fullWidth={false}
                      disabled={loading}
                      onClick={() => {
                        setVerification(null);
                        setCodigo("");
                        setError("");
                      }}
                      size="sm"
                      type="button"
                      variant="secondary"
                    >
                      Alterar CPF
                    </Button>
                  </div>
                </>
              )}

              <Button
                loading={loading}
                rightIcon={<ArrowRight className="size-5" />}
                type="submit"
                variant="light"
                className="rounded-full text-sm"
              >
                {verification ? "Verificar código" : "Continuar"}
              </Button>

              <Link
                className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-action-light-default bg-action-light-default px-4 text-sm font-semibold normal-case tracking-normal text-brand-600 shadow-sm transition-all duration-200 hover:border-action-light-hover hover:bg-action-light-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.99] active:border-action-light-pressing active:bg-action-light-pressing"
                href="/portal-estudante"
              >
                <LogIn className="size-5" />
                <span>Entrar no Portal do Estudante</span>
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
