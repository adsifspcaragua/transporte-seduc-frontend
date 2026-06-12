"use client";

import axios from "axios";
import { ArrowRight, LogIn } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/buttons";
import { Checkbox, CpfInput, PasswordInput } from "@/components/form/inputs";
import LoginCarousel from "@/components/ui/auth/LoginCarousel";
import { useAuth } from "@/hooks/use-auth";
import { cleanCpf, isValidCpf } from "@/utils/cpf";

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

function getLoginPayload(value: string) {
  return cleanCpf(value);
}

function validateLoginField(
  value: string,
  { showRequired = false, showFormat = false }: ValidationOptions = {},
) {
  const loginValue = cleanCpf(value);

  if (!loginValue) {
    return showRequired ? "Este campo é obrigatório." : undefined;
  }

  if (loginValue.length < 11) {
    return showFormat ? "Informe um CPF completo." : undefined;
  }

  if (!isValidCpf(loginValue)) {
    return showFormat ? "Informe um CPF válido." : undefined;
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

export function LoginWorkspace() {
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
        login: rememberedLogin,
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

    const loginValue = cleanCpf(form.login);

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
    const fieldName = name === "cpf" ? "login" : name;

    const nextValue = value;

    setForm((prev) => ({
      ...prev,
      [fieldName]: nextValue,
    }));

    setErrors((prev) => {
      const nextErrors = {
        ...prev,
        form: undefined,
      };

      if (fieldName === "login") {
        nextErrors.login = validateLoginField(nextValue, {
          showRequired: touched.login || hasSubmitted,
          showFormat: formatValidationEnabled.login || hasSubmitted,
        });
      }

      if (fieldName === "password") {
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
    const fieldName = name === "cpf" ? "login" : name;

    if (fieldName === "login") {
      const loginError = validateLoginField(value, {
        showRequired: true,
        showFormat: true,
      });

      setTouched((prev) => ({ ...prev, login: true }));
      setFormatValidationEnabled((prev) => ({
        ...prev,
        login: Boolean(loginError && cleanCpf(value)),
      }));
      setErrors((prev) => ({
        ...prev,
        login: loginError,
      }));
    }

    if (fieldName === "password") {
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
      login: Boolean(loginError && cleanCpf(form.login)),
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
    <div className="flex min-h-screen w-full overflow-hidden bg-brand-600 lg:h-screen">
      <div className="flex min-h-screen w-full shrink-0 flex-col justify-between bg-brand-600 px-6 py-7 text-white sm:px-10 lg:h-full lg:min-h-0 lg:w-143.75 lg:p-6">
        <div className="w-full">
          <Image
            src="/logo_educacao_w.svg"
            width={240}
            height={90}
            alt="Logo da Prefeitura Municipal de Caraguatatuba"
            style={{ width: 240, height: "auto" }}
          />
        </div>

        <div className="mx-auto flex w-full max-w-112.5 flex-col gap-6 py-8 lg:py-0">
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
              <CpfInput
                label="CPF"
                name="cpf"
                aria-required="true"
                value={form.login}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                error={errors.login}
                autoComplete="off"
                variant="dark"
              />

              <PasswordInput
                label="Senha"
                name="password"
                autoComplete="current-password"
                aria-required="true"
                value={form.password}
                onChange={handleInputChange}
                onBlur={handleFieldBlur}
                error={errors.password}
                variant="dark"
              />

              <div className="flex items-center justify-between gap-4">
                <Checkbox
                  name="rememberLogin"
                  variant="dark"
                  label="Lembrar usuário"
                  checked={rememberLogin}
                  onChange={handleRememberLoginChange}
                  labelClassName="text-sm sm:text-base"
                />

                <Link
                  href="/recuperar-senha"
                  className="text-sm transition-colors hover:text-brand-100 sm:text-base"
                >
                  Esqueceu a senha?
                </Link>
              </div>

              {errors.form && (
                <span className="text-sm font-semibold text-danger-600">
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
                leftIcon={<LogIn />}
                loading={loading}
                disabled={isRateLimited}
                className="rounded-full text-sm"
              >
                {isRateLimited
                  ? `Tente novamente em ${retryAfterSeconds}s`
                  : "Entrar"}
              </Button>

              <Link
                href="/registro"
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-brand-600/20 bg-white px-5 text-center text-base font-semibold leading-tight text-brand-600 shadow-sm transition-all duration-200 hover:bg-brand-600/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 active:scale-[0.99] active:border-brand-600/30 active:bg-brand-600/10 lg:hidden"
              >
                <span>Solicitar transporte universitário</span>
                <ArrowRight className="size-5" />
              </Link>
            </form>
          </div>
        </div>

        <p className="text-center text-sm text-white">
          © 2026 Prefeitura Municipal de Caraguatatuba.
          <br />
          Todos os direitos reservados.
        </p>
      </div>

      <div className="hidden h-full w-full lg:block">
        <LoginCarousel />
      </div>
    </div>
  );
}
