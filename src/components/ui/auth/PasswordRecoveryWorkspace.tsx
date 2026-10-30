"use client";

import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Button } from "@/components/buttons";
import { Input, PasswordInput } from "@/components/form/inputs";
import {
  type PasswordRecoveryErrors,
  validatePasswordRecovery,
} from "@/components/ui/auth/passwordRecoveryPresentation";
import { passwordService } from "@/services/api/modules/password";
import { scheduleFocusFirstFieldError } from "@/utils/focus-first-field-error";

type ApiError = {
  message?: string;
  errors?: Partial<Record<keyof PasswordRecoveryErrors, string[]>>;
};

export function PasswordRecoveryWorkspace({
  reset = false,
  token = "",
  initialEmail = "",
}: {
  reset?: boolean;
  token?: string;
  initialEmail?: string;
}) {
  const [form, setForm] = useState({
    email: initialEmail,
    password: "",
    confirmation: "",
  });
  const [errors, setErrors] = useState<PasswordRecoveryErrors>({});
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const missingToken = reset && !token;

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors({});
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading || missingToken) return;
    const nextErrors = validatePasswordRecovery(form, reset);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      scheduleFocusFirstFieldError(formRef.current);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const result = reset
        ? await passwordService.reset({
            token,
            email: form.email.trim(),
            password: form.password,
            password_confirmation: form.confirmation,
          })
        : await passwordService.requestLink(form.email.trim());
      setMessage(result.message);
      setForm((current) => ({ ...current, password: "", confirmation: "" }));
    } catch (currentError) {
      if (axios.isAxiosError<ApiError>(currentError)) {
        const data = currentError.response?.data;
        setErrors({
          email: data?.errors?.email?.[0],
          password: data?.errors?.password?.[0],
          password_confirmation: data?.errors?.password_confirmation?.[0],
        });
        setError(
          currentError.response?.status === 429
            ? "Muitas tentativas. Aguarde um minuto e tente novamente."
            : (data?.message ?? "Não foi possível concluir. Tente novamente."),
        );
      } else {
        setError("Não foi possível conectar ao serviço. Tente novamente.");
      }
      scheduleFocusFirstFieldError(formRef.current);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-muted px-6 py-10">
      <section className="w-full max-w-lg space-y-6 rounded-2xl bg-surface-primary p-6 text-content-primary shadow-xl sm:p-8">
        <Image
          alt="Prefeitura Municipal de Caraguatatuba"
          className="mx-auto h-auto w-60"
          height={175}
          src="/logo_caraguatatuba.svg"
          width={633}
          priority
        />
        <h1 className="text-center text-2xl font-bold text-brand-600">
          {reset ? "Redefinir senha" : "Recuperar acesso"}
        </h1>
        {message ? (
          <output className="rounded-lg bg-brand-100 p-4 text-sm text-brand-700">
            {message}
            {reset && " Entre com sua nova senha para acessar sua área."}
          </output>
        ) : missingToken ? (
          <p role="alert" className="text-sm text-danger-700">
            O link de redefinição está incompleto. Solicite um novo link para
            continuar.
          </p>
        ) : (
          <form
            ref={formRef}
            onSubmit={submit}
            className="space-y-5"
            noValidate
          >
            <p className="text-sm text-content-secondary">
              {reset
                ? "Informe o e-mail da conta e escolha uma nova senha."
                : "Informe o e-mail da sua conta para receber o link de redefinição."}
            </p>
            <Input
              autoComplete="email"
              error={errors.email}
              label="E-mail"
              name="email"
              onChange={(event) => updateField("email", event.target.value)}
              required
              type="email"
              value={form.email}
              variant="white"
            />
            {reset && (
              <>
                <PasswordInput
                  autoComplete="new-password"
                  error={errors.password}
                  label="Nova senha"
                  name="password"
                  onChange={(event) =>
                    updateField("password", event.target.value)
                  }
                  required
                  value={form.password}
                  variant="white"
                />
                <PasswordInput
                  autoComplete="new-password"
                  error={errors.password_confirmation}
                  label="Confirmar nova senha"
                  name="password_confirmation"
                  onChange={(event) =>
                    updateField("confirmation", event.target.value)
                  }
                  required
                  value={form.confirmation}
                  variant="white"
                />
              </>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger-700">
                {error}
              </p>
            )}
            <Button className="w-full" loading={loading} type="submit">
              {reset ? "Salvar nova senha" : "Enviar link"}
            </Button>
          </form>
        )}
        {reset && (
          <Link
            href="/recuperar-senha"
            className="block text-center text-sm font-semibold text-brand-600 underline"
          >
            Solicitar novo link
          </Link>
        )}
        <Link
          href="/login"
          className="block text-center text-sm font-semibold text-brand-600 underline"
        >
          Voltar para o login
        </Link>
      </section>
    </main>
  );
}
