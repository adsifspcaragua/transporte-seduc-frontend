export type Estudante = {
  id: number;
  name: string;
  email: string | null;
  cpf: string | null;
  birth_date: string | null;
  phone: string | null;
  address: string | null;
  rg?: string | null;
  mother_name?: string | null;
  father_name?: string | null;
  cep?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  number?: string | null;
  complement?: string | null;
  days_of_week:
    | number[]
    | string[]
    | { day?: number | string; id?: number | string; value?: number | string }[]
    | string
    | null;
  observation: string | null;
  status: string | null;
  linha_id: number | null;
  user_id: number | null;
  instituicao_id: number | null;
  instituicao?: {
    id?: number | null;
    name?: string | null;
  } | null;
  instituicao_name?: string | null;
  institution?: {
    id?: number | null;
    name?: string | null;
  } | null;
  institution_name?: string | null;
  inscricao_id: number | null;
  course?: string | null;
  semester?: string | null;
  expected_completion?: string | null;
  shift?: number | null;
  city_destination?: string | null;
  used_transport?: boolean | number | string | null;
  has_scholarship?: boolean | number | string | null;
  scholarship_type?: string | null;
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

export type UpdateEstudantePayload = {
  address?: string;
  birth_date?: string;
  cep?: string;
  city?: string;
  city_destination?: string | null;
  complement?: string | null;
  course?: string | null;
  cpf?: string;
  days_of_week?: number[];
  email?: string;
  expected_completion?: string | null;
  father_name?: string | null;
  has_scholarship?: boolean | null;
  instituicao_id?: number;
  mother_name?: string | null;
  name?: string;
  neighborhood?: string;
  number?: string | null;
  observation?: string | null;
  phone?: string;
  rg?: string | null;
  scholarship_type?: string | null;
  semester?: string | null;
  shift?: number | null;
  status?: string;
  used_transport?: boolean | null;
};
