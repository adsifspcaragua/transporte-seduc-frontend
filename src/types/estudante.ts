export type Estudante = {
  id: number;
  name: string;
  email: string | null;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  start_time: string | null;
  end_time: string | null;
  days_of_week: number[] | string[] | null;
  observation: string | null;
  status: string | null;
  linha_id: number | null;
  user_id: number | null;
  instituicao_id: number | null;
  inscricao_id: number | null;
};

export type PaginatedEstudantes = {
  data: Estudante[];
  meta?: {
    current_page: number;
    from: number | null;
    last_page: number;
    per_page: number;
    to: number | null;
    total: number;
  };
  links?: {
    first?: string | null;
    last?: string | null;
    prev?: string | null;
    next?: string | null;
  };
};
