import type { TransporteResource } from "@/types/transporte";

export const transporteGroups: {
  key: string;
  label: string;
  sections: (TransporteResource | "indicadores")[];
}[] = [
  {
    key: "estrutura",
    label: "Estrutura",
    sections: ["veiculos", "atribuicoes", "pontos", "vinculos"],
  },
  {
    key: "operacao",
    label: "Operação",
    sections: ["horarios", "viagens", "dias"],
  },
  {
    key: "embarque",
    label: "Embarque",
    sections: ["autorizacoes", "dispositivos", "presencas"],
  },
  {
    key: "conferencia",
    label: "Conferência",
    sections: ["solicitacoes", "tentativas", "auditoria"],
  },
  {
    key: "administracao",
    label: "Administração",
    sections: ["roles", "instituicoes", "indicadores"],
  },
];
