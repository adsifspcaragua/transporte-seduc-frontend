'use client';

import Image from "next/image";
import { IoIosMail, IoIosLock } from "react-icons/io";
import { BiLogIn } from "react-icons/bi";
import LoginCarousel from "@/components/auth/LoginCarousel";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button"

export default function Login() {

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
            {/* Logo do sistema virá aqui */}
            <h1 className="text-2xl font-semibold text-center">
              Acesso ao sistema
            </h1>

            <span className="text-lg leading-relaxed text-white">
              Gerencie e acompanhe o transporte universitário de forma simples e segura.
            </span>
          </div>

          <div>
            <form method="post" className="flex flex-col gap-6">
              <Input
                label="E-mail ou CPF"
                name="email"
                type="email"
                icon={IoIosMail}
                required
              />

              <Input
                label="Senha"
                name="password"
                type="password"
                icon={IoIosLock}
                required
              />

            <Button type="button" icon={BiLogIn}>Entrar</Button>

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