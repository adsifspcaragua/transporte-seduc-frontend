"use client";

import axios from "axios";
import { LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LoginCarousel from "@/components/auth/LoginCarousel";
import Button from "@/components/ui/Button";
import Checkbox from "@/components/ui/Checkbox";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import { useAuth } from "@/features/auth/hooks/use-auth";
import { cleanCpf, formatCpf, isCpfLike, isValidCpf } from "@/lib/utils/cpf";

type LoginFormData = {
  login: string;
  password: string;
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

type ValidationOptions = {
  showRequired?: boolean;
  showFormat?: boolean;
};

type FormatValidationState = {
  login: boolean;
  password: boolean;
};

const REMEMBERED_LOGIN_STORAGE_KEY = "remembered-login";

function parseRetryAfterSeconds(value?: string | null) {
  if (!value) return 60;

  const seconds = Number(value);

  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.max(1, Math.ceil(seconds));
  }

  const retryDate = Date.parse(value);

  if (!Number.isNaN(retryDate)) {
    return Math.max(1, Math.ceil((retryDate - Date.now()) / 1000));
  }

  return 60;
}

function isValidEmail(value: string) {
  if (!/^[a-z0-9._+-]+@[a-z0-9.-]+$/.test(value)) {
    return false;
  }

  const [localPart, domain, ...rest] = value.split("@");

  if (!localPart || !domain || rest.length > 0) {
    return false;
  }

  if (
    localPart.startsWith(".") ||
    localPart.endsWith(".") ||
    localPart.includes("..")
  ) {
    return false;
  }

  const labels = domain.split(".");

  if (labels.length < 2) {
    return false;
  }

  return labels.every((label) =>
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
  );
}

function sanitizeEmailInput(value: string) {
  return value
    .replace(/\s+/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9@._+-]/g, "");
}

function sanitizeLoginInput(value: string) {
  const compactValue = value.replace(/\s+/g, "");

  if (!compactValue) {
    return "";
  }

  const looksLikeEmail = /[a-zA-Z@_+]/.test(compactValue);

  if (!looksLikeEmail) {
    return formatCpf(compactValue);
  }

  return sanitizeEmailInput(compactValue);
}

function getLoginPayload(value: string) {
  const normalizedValue = sanitizeLoginInput(value).trim();

  if (isCpfLike(normalizedValue)) {
    return cleanCpf(normalizedValue);
  }

  return normalizedValue;
}

function validateLoginField(
  value: string,
  { showRequired = false, showFormat = false }: ValidationOptions = {},
) {
  const loginValue = sanitizeLoginInput(value).trim();

  if (!loginValue) {
    return showRequired ? "Este campo é obrigatório." : undefined;
  }

  if (isCpfLike(loginValue)) {
    const cpf = cleanCpf(loginValue);

    if (cpf.length < 11) {
      return showFormat ? "Informe um CPF completo." : undefined;
    }

    if (!isValidCpf(loginValue)) {
      return showFormat ? "Informe um CPF válido." : undefined;
    }

    return undefined;
  }

  if (!isValidEmail(loginValue)) {
    return showFormat ? "Informe um e-mail válido." : undefined;
  }

  return undefined;
}

function validatePasswordField(
  value: string,
  { showRequired = false, showFormat = false }: ValidationOptions = {},
) {
  const passwordValue = value;

  if (!passwordValue.trim()) {
    return showRequired ? "Este campo é obrigatório." : undefined;
  }

  if (passwordValue.length < 4) {
    return showFormat ? "A senha deve ter no mínimo 4 caracteres." : undefined;
  }

  return undefined;
}

export default function Login() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [form, setForm] = useState<LoginFormData>({
    login: "",
    password: "",
  });

  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [touched, setTouched] = useState<TouchedFields>({
    login: false,
    password: false,
  });
  const [formatValidationEnabled, setFormatValidationEnabled] =
    useState<FormatValidationState>({
      login: false,
      password: false,
    });
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [rememberLogin, setRememberLogin] = useState(false);
  const [rememberedLoginHydrated, setRememberedLoginHydrated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginBlockedUntil, setLoginBlockedUntil] = useState<number | null>(
    null,
  );
  const [retryAfterSeconds, setRetryAfterSeconds] = useState(0);

  const isRateLimited = retryAfterSeconds > 0;
  const isSubmitDisabled = loading || isRateLimited;

  useEffect(() => {
    const rememberedLogin = window.localStorage.getItem(
      REMEMBERED_LOGIN_STORAGE_KEY,
    );

    if (rememberedLogin) {
      setForm((prev) => ({
        ...prev,
        login: sanitizeLoginInput(rememberedLogin),
      }));
      setRememberLogin(true);
    }

    setRememberedLoginHydrated(true);
  }, []);

  useEffect(() => {
    if (!rememberedLoginHydrated) return;

    if (!rememberLogin) {
      window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
      return;
    }

    const loginValue = sanitizeLoginInput(form.login).trim();

    if (!loginValue) {
      window.localStorage.removeItem(REMEMBERED_LOGIN_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(REMEMBERED_LOGIN_STORAGE_KEY, loginValue);
  }, [form.login, rememberLogin, rememberedLoginHydrated]);

  useEffect(() => {
    if (!loginBlockedUntil) {
      setRetryAfterSeconds(0);
      return;
    }

    const blockedUntil = loginBlockedUntil;

    function updateCountdown() {
      const remaining = Math.max(
        0,
        Math.ceil((blockedUntil - Date.now()) / 1000),
      );

      setRetryAfterSeconds(remaining);

      if (remaining === 0) {
        setLoginBlockedUntil(null);
      }
    }

    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [loginBlockedUntil]);

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    const nextValue = name === "login" ? sanitizeLoginInput(value) : value;

    setForm((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    setErrors((prev) => {
      const nextErrors = {
        ...prev,
        form: undefined,
      };

      if (name === "login") {
        nextErrors.login = validateLoginField(nextValue, {
          showRequired: touched.login || hasSubmitted,
          showFormat: formatValidationEnabled.login || hasSubmitted,
        });
      }

      if (name === "password") {
        nextErrors.password = validatePasswordField(nextValue, {
          showRequired: touched.password || hasSubmitted,
          showFormat: formatValidationEnabled.password || hasSubmitted,
        });
      }

      return nextErrors;
    });
  }

  function handleRememberLoginChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setRememberLogin(event.target.checked);
  }

  function handleFieldBlur(event: React.FocusEvent<HTMLInputElement>) {
    const { name, value } = event.target;

    if (name === "login") {
      const loginError = validateLoginField(value, {
        showRequired: true,
        showFormat: true,
      });

      setTouched((prev) => ({ ...prev, login: true }));
      setFormatValidationEnabled((prev) => ({
        ...prev,
        login: Boolean(loginError && sanitizeLoginInput(value).trim()),
      }));
      setErrors((prev) => ({
        ...prev,
        login: loginError,
      }));
    }

    if (name === "password") {
      const passwordError = validatePasswordField(value, {
        showRequired: true,
        showFormat: true,
      });

      setTouched((prev) => ({ ...prev, password: true }));
      setFormatValidationEnabled((prev) => ({
        ...prev,
        password: Boolean(passwordError && value.trim()),
      }));
      setErrors((prev) => ({
        ...prev,
        password: passwordError,
      }));
    }
  }

  function validateForm() {
    const loginError = validateLoginField(form.login, {
      showRequired: true,
      showFormat: true,
    });
    const passwordError = validatePasswordField(form.password, {
      showRequired: true,
      showFormat: true,
    });

    setHasSubmitted(true);
    setTouched({
      login: true,
      password: true,
    });
    setFormatValidationEnabled({
      login: Boolean(loginError && sanitizeLoginInput(form.login).trim()),
      password: Boolean(passwordError && form.password.trim()),
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

    if (isSubmitDisabled) return;
    if (!validateForm()) return;

    try {
      setLoading(true);
      setErrors((prev) => ({
        ...prev,
        form: undefined,
      }));

      await signIn({
        login: getLoginPayload(form.login),
        password: form.password,
      });

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
        } else if (error.response?.status === 419) {
          setErrors((prev) => ({
            ...prev,
            form: "Sua sessão expirou. Tente novamente.",
          }));
        } else if (error.response?.status === 429) {
          const retryAfterHeader = error.response?.headers["retry-after"];
          const retryAfterValue = Array.isArray(retryAfterHeader)
            ? retryAfterHeader[0]
            : retryAfterHeader;
          const retryAfter = parseRetryAfterSeconds(retryAfterValue);

          setErrors((prev) => ({
            ...prev,
            form: undefined,
          }));
          setLoginBlockedUntil(Date.now() + retryAfter * 1000);
          setRetryAfterSeconds(retryAfter);
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

              <div className="flex items-center justify-between gap-4">
                <Checkbox
                  name="rememberLogin"
                  label="Lembrar login"
                  checked={rememberLogin}
                  onChange={handleRememberLoginChange}
                />

                <Link href="/recuperar-senha">Esqueceu a senha?</Link>
              </div>

              {errors.form && (
                <span className="text-sm font-semibold text-red-400">
                  {errors.form}
                </span>
              )}

              {isRateLimited && (
                <span className="text-sm font-semibold text-amber-200">
                  Muitas tentativas. Tente novamente em {retryAfterSeconds}s.
                </span>
              )}

              <Button
                type="submit"
                variant="light"
                size="md"
                leftIcon={<LogIn className="size-5" />}
                loading={loading}
                disabled={isRateLimited}
              >
                {isRateLimited
                  ? `Tente novamente em ${retryAfterSeconds}s`
                  : "Entrar"}
              </Button>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-white">
          © 2026 Prefeitura Municipal de Caraguatatuba.
          <br />
          Todos os direitos reservados.
        </p>
      </div>

      <div className="h-full w-full">
        <LoginCarousel />
      </div>
    </div>
  );
}
