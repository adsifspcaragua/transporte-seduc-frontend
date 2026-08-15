"use client";

import axios from "axios";
import { ArrowRight, IdCard } from "lucide-react";
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

  async function handleContinue() {
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
    <main className="flex min-h-screen bg-brand-600 p-4 sm:p-8">
      <section className="m-auto w-full max-w-md rounded-xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-8 flex justify-center rounded-lg bg-brand-600 p-5">
          <Image
            alt="Prefeitura Municipal de Caraguatatuba"
            height={72}
            src="/logo_educacao_w.svg"
            width={190}
          />
        </div>
        <div className="text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <IdCard className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold text-brand-700">
            Área do estudante
          </h1>
          <p className="mt-2 text-sm leading-6 text-content-muted">
            Informe seu CPF para iniciar uma inscrição, continuar a lista de
            espera ou realizar o recadastro semestral.
          </p>
        </div>

        <div className="mt-7 space-y-5">
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
          />
          <Button
            loading={loading}
            onClick={handleContinue}
            rightIcon={<ArrowRight className="size-5" />}
          >
            Continuar
          </Button>
          <Link
            className="block text-center text-sm font-semibold text-brand-600 hover:underline"
            href="/login"
          >
            Acesso administrativo
          </Link>
        </div>
      </section>
    </main>
  );
}
