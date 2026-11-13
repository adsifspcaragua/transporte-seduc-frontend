import { estudanteService } from "@/services/api/modules/estudante";
import { inscricaoService } from "@/services/api/modules/inscricao";
import { linhaService } from "@/services/api/modules/linha";
import { recadastroService } from "@/services/api/modules/recadastro";
import { userService } from "@/services/api/modules/user";
import { createCachedQuery } from "@/services/api/query-cache";
import type { PaginatedEstudantes } from "@/types/estudante";
import type { SolicitacoesRecadastroParams } from "@/types/recadastro";

export const linhasQuery = createCachedQuery(linhaService.list);
export const driversQuery = createCachedQuery(async (canWrite: boolean) =>
  canWrite ? userService.listDrivers() : [],
);
export const usersQuery = createCachedQuery(userService.list);
export const studentsQuery = createCachedQuery(
  (page: number = 1, perPage: number = 10): Promise<PaginatedEstudantes> =>
    estudanteService.list(page, perPage),
);
export const studentSearchQuery = createCachedQuery(
  (search: string, page: number) => estudanteService.list(page, 15, search),
);
export const studentReferenceQuery = createCachedQuery((id: string) =>
  id ? estudanteService.detail(Number(id)) : Promise.resolve(null),
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
  async (
    canViewPeriodos: boolean,
    canViewSolicitacoes: boolean,
    filters: SolicitacoesRecadastroParams = {},
  ) => {
    const [periodos, solicitacoes] = await Promise.all([
      canViewPeriodos ? recadastroService.listPeriodos() : [],
      canViewSolicitacoes ? recadastroService.listSolicitacoes(filters) : null,
    ]);
    return {
      periodos,
      solicitacoes: solicitacoes?.data ?? [],
      solicitacoesMeta: solicitacoes?.meta ?? null,
    };
  },
);
