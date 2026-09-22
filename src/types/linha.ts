import type { Estudante, PaginatedEstudantes } from "@/types/estudante";

export type LinhaEstudante = Pick<
  Estudante,
  "id" | "name" | "email" | "phone" | "status"
> & {
  course: string | null;
  semester: string | null;
  instituicao_name: string | null;
  faltas: number;
  ultima_presenca: string | null;
};

export type PaginatedLinhaEstudantes = {
  data: LinhaEstudante[];
  meta: NonNullable<PaginatedEstudantes["meta"]>;
};
