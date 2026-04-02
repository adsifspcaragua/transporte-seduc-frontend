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

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [form, setForm] = useState<LoginFormData>({
    login: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
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

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
      form: undefined,
    }));
  }

  function validateForm() {
    const newErrors: LoginFormErrors = {};
    const loginValue = form.login.trim();

    if (!loginValue) {
      newErrors.login = "Informe seu e-mail ou CPF.";
    } else if (isCpfLike(loginValue)) {
      if (!isValidCpf(loginValue)) {
        newErrors.login = "Informe um CPF válido.";
      }
    } else if (!isValidEmail(loginValue)) {
      newErrors.login = "Informe um e-mail válido ou CPF válido.";
    }

    if (!form.password.trim()) {
      newErrors.password = "Informe sua senha.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
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
        form.remember
      );

      router.replace("/");
    } catch (error) {
      if (axios.isAxiosError<ApiErrorResponse>(error)) {
        const apiErrors = error.response?.data?.errors;

        if (apiErrors?.login?.[0] || apiErrors?.password?.[0]) {
          setErrors({
            login: apiErrors.login?.[0],
            password: apiErrors.password?.[0],
            form: error.response?.data?.message,
          });
        } else if (error.response?.status === 401) {
          setErrors({
            form: "E-mail/CPF ou senha inválidos.",
          });
        } else if (error.response?.status === 422) {
          setErrors({
            form: error.response?.data?.message ?? "Dados inválidos.",
          });
        } else {
          setErrors({
            form: "Não foi possível entrar no sistema agora.",
          });
        }
      } else {
        setErrors({
          form: "Não foi possível entrar no sistema agora.",
        });
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
              Gerencie e acompanhe o transporte universitário de forma simples e segura.
            </span>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <Input
                label="E-mail ou CPF"
                name="login"
                type="text"
                icon={IoIosMail}
                required
                value={form.login}
                onChange={handleInputChange}
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
                error={errors.password}
              />

              {errors.form && (
                <span className="text-sm text-red-300">{errors.form}</span>
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