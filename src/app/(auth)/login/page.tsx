import Image from "next/image";

export default function Login() {
  return (
    <div className="w-full h-screen flex">
      <div className="bg-brand-600 text-white w-[35%] h-full flex flex-col items-center justify-between p-4">
        <div className="w-full flex items-start">
          <Image
            src="/logo_educacao_w.svg"
            width={240}
            height={90}
            alt="Logo da Prefeitura Municipal de Caraguatatuba"
          />
        </div>
        <div>
          <form method="post">
            
          </form>
        </div>
        <div className="text-center text-sm">
          <span>© 2026 Prefeitura Municipal de Caraguatatuba.<br />Todos os direitos reservados.</span>
        </div>
      </div>
      <div>

      </div>
    </div>
  );
}
