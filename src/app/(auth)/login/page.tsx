"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import axios from "axios";
import { useRouter } from "next/navigation";
import { IoIosMail } from "react-icons/io";
import { BiLogIn } from "react-icons/bi";

import LoginCarousel from "@/components/auth/LoginCarousel";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { formatCpf, isCpfLike, isValidCpf } from "@/lib/utils/cpf";

type LoginFormData = {
  login: string;
  password: string;
  remember: boolean;
};

type LoginFormErrors = {
  login?: string;
  password?: string;
  form?: string;
};

type TouchedFields = {
  login: boolean;
  password: boolean;
};

type ApiErrorResponse = {
  message?: string;
  errors?: {
    login?: string[];
    password?: string[];
  };
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateLoginField(value: string) {
  const loginValue = value.trim();

  if (!loginValue) {
    return "Este campo é obrigatório.";
  }

  if (isCpfLike(loginValue)) {
    if (!isValidCpf(loginValue)) {
      return "Informe um CPF válido.";
    }

    return undefined;
  }

  if (!isValidEmail(loginValue)) {
    return "Informe um e-mail válido.";
  }

  return undefined;
}

function validatePasswordField(value: string) {
  const passwordValue = value.trim();

  if (!passwordValue) {
    return "Este campo é obrigatório.";
  }

  if (passwordValue.length < 4) {
    return "A senha deve ter no mínimo 4 caracteres.";
  }

  return undefined;
}

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [form, setForm] = useState<LoginFormData>({
    login: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    login: false,
    password: false,
  });
  const [loading, setLoading] = useState(false);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;

    let nextValue = value;

    if (name === "login") {
      const looksLikeCpf = /^[\d.\-]*$/.test(value);

      if (looksLikeCpf) {
        nextValue = formatCpf(value);
      }
    }

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : nextValue,
    }));

    setErrors((prev) => {
      const nextErrors = {
        ...prev,
        form: undefined,
      };

      if (name === "login") {
        nextErrors.login = touched.login
          ? validateLoginField(nextValue)
          : undefined;
      }

      if (name === "password") {
        nextErrors.password = touched.password
          ? validatePasswordField(nextValue)
          : undefined;
      }

      return nextErrors;
    });
  }

  function handleFieldBlur(event: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === "login") {
      setTouched((prev) => ({ ...prev, login: true }));
      setErrors((prev) => ({
        ...prev,
        login: validateLoginField(value),
      }));
    }

    if (name === "password") {
      setTouched((prev) => ({ ...prev, password: true }));
      setErrors((prev) => ({
        ...prev,
        password: validatePasswordField(value),
      }));
    }
  }

  function validateForm() {
    const loginError = validateLoginField(form.login);
    const passwordError = validatePasswordField(form.password);

    setTouched({
      login: true,
      password: true,
    });

    setErrors((prev) => ({
      ...prev,
      login: loginError,
      password: passwordError,
      form: undefined,
    }));

    return !loginError && !passwordError;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!validateForm()) return;

    try {
      setLoading(true);

      await signIn(
        {
          login: form.login.trim(),
          password: form.password,
        },
        form.remember,
      );

      router.replace("/");
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const apiErrors = error.response?.data?.errors;

        if (apiErrors?.login?.[0] || apiErrors?.password?.[0]) {
          setErrors((prev) => ({
            ...prev,
            login: apiErrors.login?.[0] ?? prev.login,
            password: apiErrors.password?.[0] ?? prev.password,
            form: error.response?.data?.message,
          }));
        } else if (error.response?.status === 401) {
          setErrors((prev) => ({
            ...prev,
            form: "Credenciais inválidas.",
          }));
        } else if (error.response?.status === 422) {
          setErrors((prev) => ({
            ...prev,
            form: error.response?.data?.message ?? "Dados inválidos.",
          }));
        } else {
          setErrors((prev) => ({
            ...prev,
            form: "Não foi possível entrar no sistema agora.",
          }));
        }
      } else {
        setErrors((prev) => ({
          ...prev,
          form: "Não foi possível entrar no sistema agora.",
        }));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <div className="flex h-full w-143.75 shrink-0 flex-col justify-between bg-brand-600 p-6 text-white">
        <div className="w-full">
          <Image
            src="/logo_educacao_w.svg"
            width={240}
            height={90}
            alt="Logo da Prefeitura Municipal de Caraguatatuba"
          />
        </div>

        <div className="mx-auto flex w-full max-w-112.5 flex-col gap-6">
          <div className="flex flex-col gap-3">
            <h1 className="text-center text-2xl font-semibold">
              Acesso ao sistema
            </h1>

            <span className="text-lg leading-relaxed text-white">
              Gerencie e acompanhe o transporte universitário de forma simples e
              segura.
            </span>
          </div>

          <div>
            <form
              onSubmit={handleSubmit}
              noValidate
              className="flex flex-col gap-5"
            >
              <Input
                label="E-mail ou CPF"
                name="login"
                type="text"
                icon={IoIosMail}
                required
                value={form.login}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                error={errors.login}
                autoComplete="username"
              />

              <PasswordInput
                label="Senha"
                name="password"
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                error={errors.password}
              />

              {errors.form && (
                <span className="text-sm font-semibold text-red-400">
                  {errors.form}
                </span>
              )}

              <div className="flex items-center justify-between">
                <Checkbox
                  name="remember"
                  label="Lembrar usuário"
                  checked={form.remember}
                  onChange={handleInputChange}
                />

                <Link href="/recuperar-senha">Esqueceu a senha?</Link>
              </div>

              <Button
                type="submit"
                variant="light"
                size="md"
                leftIcon={<BiLogIn className="size-5" />}
                loading={loading}
              >
                Entrar
              </Button>
            </form>
          </div>
        </div>

        <div className="text-center text-sm text-white">
          <span>
            © 2026 Prefeitura Municipal de Caraguatatuba.
            <br />
            Todos os direitos reservados.
          </span>
        </div>
      </div>

      <div className="h-full w-full">
        <LoginCarousel />
      </div>
    </div>
  );
}
