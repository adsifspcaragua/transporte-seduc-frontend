type Props = {
  children: React.ReactNode;
  step: number;
};

export default function Register({ children, step }: Props) {
  const steps = [
    "Identidade Civil",
    "Endereço e Contato",
    "Dados Institucionais",
    "Upload de Documentos",
    "Revisão e Confirmação",
  ];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className="w-1/3 bg-brand-600 text-white p-8 flex flex-col">
        <h2 className="mb-10 text-lg font-semibold">Realize seu cadastro</h2>

        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 h-full w-1 bg-white/30" />

          {steps.map((item, index) => {
            const isActive = index === step;
            const isCompleted = index < step;

            return (
              <div key={index} className="flex items-center mb-10 relative">
                {/* Círculo */}
                <div
                  className={`
                    z-10 w-8 h-8 rounded-full flex items-center justify-center
                    border-2
                    ${
                      isActive
                        ? "bg-white border-white"
                        : isCompleted
                          ? "bg-white/80 border-white"
                          : "bg-transparent border-white/40"
                    }
                  `}
                >
                  {isCompleted ? (
                    <div className="w-3 h-3 bg-brand-600 rounded-full" />
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isActive ? "bg-brand-600" : "bg-transparent"
                      }`}
                    />
                  )}
                </div>

                {/* Texto */}
                <span
                  className={`ml-4 ${
                    isActive ? "font-semibold text-white" : "text-white/70"
                  }`}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-auto text-xs text-white/60">
          © 2026 Prefeitura Municipal de Caraguatatuba.
          <br />
          Todos os direitos reservados.
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 p-8 bg-gray-100">{children}</div>
    </div>
  );
}
