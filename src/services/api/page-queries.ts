import { estudanteService } from "@/services/api/modules/estudante";
import { frequenciaService } from "@/services/api/modules/frequencia";
import { inscricaoService } from "@/services/api/modules/inscricao";
import { linhaService } from "@/services/api/modules/linha";
import { recadastroService } from "@/services/api/modules/recadastro";
import { userService } from "@/services/api/modules/user";
import { createCachedQuery } from "@/services/api/query-cache";
import type { PaginatedEstudantes } from "@/types/estudante";

export const linhasQuery = createCachedQuery(linhaService.list);
export const driversQuery = createCachedQuery(async (canWrite: boolean) =>
  canWrite ? userService.listDrivers() : [],
);
export const usersQuery = createCachedQuery(userService.list);
export const studentsQuery = createCachedQuery(
  (page: number = 1, perPage: number = 10): Promise<PaginatedEstudantes> =>
    estudanteService.list(page, perPage),
);

export const studentOptionsQuery = createCachedQuery(async () => {
  const [cursos, instituicoes, linhas] = await Promise.all([
    inscricaoService.listCursos(),
    inscricaoService.listInstituicoes(),
    linhasQuery.fetch().catch(() => linhasQuery.getSnapshot().data ?? []),
  ]);
  return { cursos, instituicoes, linhas };
});

export const solicitacoesQuery = createCachedQuery(async () => {
  const [solicitacoes, options] = await Promise.all([
    inscricaoService.listInscricoes(),
    studentOptionsQuery.fetch(),
  ]);
  return { solicitacoes, ...options };
});

// As permissões fazem parte da chave; não solicitamos coleções sem autorização.
export const recadastroQuery = createCachedQuery(
  async (canViewPeriodos: boolean, canViewSolicitacoes: boolean) => {
    const [periodos, solicitacoes] = await Promise.all([
      canViewPeriodos ? recadastroService.listPeriodos() : [],
      canViewSolicitacoes ? recadastroService.listSolicitacoes() : [],
    ]);
    return { periodos, solicitacoes };
  },
);

// O endpoint contém chamada_hoje: uma nova data nunca reutiliza o dia anterior.
export const frequenciaLinhasQuery = createCachedQuery(async (_today: string) =>
  frequenciaService.listLinhas(),
);
export const chamadasQuery = createCachedQuery(frequenciaService.list);
export const justificativasQuery = createCachedQuery(
  frequenciaService.listJustificativas,
);
export const relatorioQuery = createCachedQuery(frequenciaService.report);
