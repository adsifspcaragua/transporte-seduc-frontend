"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IoIosMail } from "react-icons/io";
import { BiLogIn } from "react-icons/bi";

import LoginCarousel from "@/components/auth/LoginCarousel";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Checkbox from "@/components/ui/Checkbox";
import Button from "@/components/ui/Button";

type LoginFormData = {
  login: string;
  password: string;
  remember: boolean;
};

type LoginFormErrors = {
  login?: string;
  password?: string;
};

export default function Login() {
  const [form, setForm] = useState<LoginFormData>({
    login: "",
    password: "",
    remember: false,
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [loading, setLoading] = useState(false);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: undefined,
    }));
  }

  function validateForm() {
    const newErrors: LoginFormErrors = {};

    if (!form.login.trim()) {
      newErrors.login = "Informe seu e-mail ou CPF.";
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

      // depois você troca isso pela chamada da API
      console.log("Dados do login:", form);

      // exemplo futuro:
      // const response = await fetch("/api/login", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });

    } catch (error) {
      console.error(error);
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

              <div className="flex items-center justify-between">
                <Checkbox
                  name="remember"
                  label="Lembrar usuário"
                  checked={form.remember}
                  onChange={handleInputChange}
                />

                <Link href="/">Esqueceu a senha?</Link>
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