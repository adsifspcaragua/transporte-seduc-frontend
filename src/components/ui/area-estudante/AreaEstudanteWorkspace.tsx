"use client";

import axios from "axios";
import { ArrowRight, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

/** CPF com cadastro: a API enviou um codigo ao e-mail e espera a confirmacao. */
type CodigoPendente = {
  cpf: string;
  emailMascarado: string;
  validadeMinutos: number;
};

function mensagemDeErro(
  error: unknown,
  campo: "cpf" | "codigo",
  padrao: string,
) {
  if (axios.isAxiosError<ApiError>(error)) {
    return (
      error.response?.data?.errors?.[campo]?.[0] ??
      error.response?.data?.message ??
      padrao
    );
  }

  return padrao;
}

export function AreaEstudanteWorkspace() {
  const router = useRouter();
  const [cpf, setCpf] = useState("");
  const [codigo, setCodigo] = useState("");
  const [pendente, setPendente] = useState<CodigoPendente | null>(null);
  const [reenvioEm, setReenvioEm] = useState(0);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (reenvioEm <= 0) return;

    const timer = window.setTimeout(() => setReenvioEm((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [reenvioEm]);

  function entrar(access: AcessoEstudanteResponse) {
    window.sessionStorage.removeItem(REGISTRATION_DRAFT_STORAGE_KEY);
    window.sessionStorage.setItem(
      STUDENT_ACCESS_STORAGE_KEY,
      JSON.stringify(access),
    );
    router.push("/registro");
  }

  /**
   * CPF sem cadastro segue direto para a inscricao. Com cadastro, a API so
   * envia o codigo: os dados saem depois que ele e confirmado.
   */
  async function pedirCodigo(value: string) {
    const resposta = await recadastroService.acessar(value);

    if (resposta.fluxo !== "verificacao") {
      entrar(resposta);
      return;
    }

    setPendente({
      cpf: value,
      emailMascarado: resposta.data.email_mascarado,
      validadeMinutos: resposta.data.validade_minutos,
    });
    setReenvioEm(resposta.data.reenvio_em_segundos);
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
      await pedirCodigo(value);
    } catch (currentError) {
      setError(
        mensagemDeErro(
          currentError,
          "cpf",
          "Não foi possível consultar o CPF.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!pendente) return;

    if (codigo.length !== 6) {
      setError("Informe os 6 dígitos do código.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAviso("");
      entrar(await recadastroService.verificarAcesso(pendente.cpf, codigo));
    } catch (currentError) {
      setError(
        mensagemDeErro(
          currentError,
          "codigo",
          "Não foi possível confirmar o código.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!pendente || reenvioEm > 0) return;

    try {
      setLoading(true);
      setError("");
      await pedirCodigo(pendente.cpf);
      setCodigo("");
      setAviso("Enviamos um novo código. O anterior deixou de valer.");
    } catch (currentError) {
      setError(
        mensagemDeErro(
          currentError,
          "codigo",
          "Não foi possível reenviar o código.",
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  function usarOutroCpf() {
    setPendente(null);
    setCodigo("");
    setAviso("");
    setError("");
    setReenvioEm(0);
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
                {pendente ? "Confirme seu acesso" : "Área do estudante"}
              </h1>
              {pendente ? (
                <p className="text-base leading-relaxed text-content-secondary sm:text-lg">
                  Enviamos um código de 6 dígitos para{" "}
                  <strong className="text-content-primary">
                    {pendente.emailMascarado}
                  </strong>
                  . Ele vale por {pendente.validadeMinutos} minutos.
                </p>
              ) : (
                <p className="text-base leading-relaxed text-content-secondary sm:text-lg">
                  Já possui uma conta? Entre no portal com seu CPF e senha. Para
                  iniciar sua inscrição, informe o CPF abaixo.
                </p>
              )}
            </div>

            {pendente ? (
              <form className="flex flex-col gap-5" onSubmit={handleVerify}>
                <Input
                  autoComplete="one-time-code"
                  autoFocus
                  error={error}
                  hint={aviso || undefined}
                  inputMode="numeric"
                  label="Código"
                  maxLength={6}
                  name="codigo"
                  onChange={(event) => {
                    setCodigo(
                      event.target.value.replace(/\D/g, "").slice(0, 6),
                    );
                    setError("");
                  }}
                  value={codigo}
                  variant="white"
                  className="rounded-full bg-surface-primary pl-7 tracking-[0.3em]"
                  labelClassName="ml-3"
                />

                <Button
                  loading={loading}
                  rightIcon={<ArrowRight className="size-5" />}
                  type="submit"
                  variant="light"
                  className="rounded-full text-sm"
                >
                  Confirmar código
                </Button>

                <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                  <button
                    className="cursor-pointer font-semibold text-brand-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
                    onClick={usarOutroCpf}
                    type="button"
                  >
                    Usar outro CPF
                  </button>
                  <button
                    className="cursor-pointer font-semibold text-brand-600 underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-default disabled:text-content-muted disabled:no-underline"
                    disabled={loading || reenvioEm > 0}
                    onClick={handleResend}
                    type="button"
                  >
                    {reenvioEm > 0
                      ? `Reenviar código em ${reenvioEm}s`
                      : "Reenviar código"}
                  </button>
                </div>

                <p className="text-sm leading-relaxed text-content-muted">
                  Não tem mais acesso a esse e-mail? Procure o atendimento do
                  transporte universitário para corrigir o endereço.
                </p>
              </form>
            ) : (
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
                  formatGuideClassName="pl-7"
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
                  className="inline-flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-action-light-default bg-action-light-default px-4 text-sm font-semibold normal-case tracking-normal text-brand-600 shadow-sm transition-all duration-200 hover:border-action-light-hover hover:bg-action-light-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.99] active:border-action-light-pressing active:bg-action-light-pressing"
                  href="/portal-estudante"
                >
                  <LogIn className="size-5" />
                  <span>Entrar no Portal do Estudante</span>
                </Link>
              </form>
            )}
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
