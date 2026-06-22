export type InscricaoStatus = "incompleto" | "Em analise" | string;

export type Inscricao = {
  id: number;
  name: string;
  cpf: string;
  rg: string | null;
  birth_date: string | null;
  father_name: string | null;
  mother_name: string | null;
  phone: string | null;
  email: string | null;
  cep: string | null;
  address: string | null;
  neighborhood: string | null;
  complement?: string | null;
  city: string | null;
  number: string | number | null;
  status: InscricaoStatus;
  accepted_terms: boolean | null;
  accepted_terms_2: boolean | null;
  observation: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InscricaoPayload = Partial<{
  name: string;
  cpf: string;
  rg: string;
  father_name: string;
  mother_name: string;
  birth_date: string;
  phone: string;
  email: string;
  cep: string;
  address: string;
  neighborhood: string;
  complement: string;
  city: string;
  number: number;
  accepted_terms: boolean;
  accepted_terms_2: boolean;
}>;

export type InscricaoInstituicao = {
  id: number;
  course: string | null;
  semester: string | null;
  expected_completion: string | null;
  instituicao_id: number | null;
  instituicao?: Instituicao | null;
  shift_label?: string | null;
  city_destination: string | null;
  used_transport: boolean | null;
  days_of_week_labels?: string[];
  line_id?: number | null;
  has_scholarship: boolean | null;
  scholarship_type: string | null;
  inscricao_id: number;
  created_at?: string | null;
  updated_at?: string | null;
};

export type InscricaoInstituicaoPayload = Partial<{
  course: string;
  semester: string;
  expected_completion: string;
  instituicao_id: number;
  shift: number;
  city_destination: string;
  used_transport: boolean;
  days_of_week: number[];
  has_scholarship: boolean;
  scholarship_type: string;
}>;

export type InscricaoDocumento = {
  id: number;
  name: string;
  type: string;
  file_path: string;
  status: string;
  inscricao_id: number;
};

export type Instituicao = {
  id: number;
  name: string;
  city?: string | null;
  linhas_ids?: (number | string)[] | null;
  [key: string]: unknown;
};

export type Curso = {
  id: number;
  name: string;
  [key: string]: unknown;
};

export type Linha = {
  id: number;
  name: string;
  description?: string | null;
  departure_time?: string | null;
  return_time?: string | null;
  max_capacity?: number | null;
  [key: string]: unknown;
};

export type CepAddress = {
  cep: string;
  state: string;
  city: string;
  neighborhood: string;
  address: string;
  complement: string;
};

export type InscricaoAnalisePayload =
  | {
      decisao: "Aprovado";
      documentos: null;
      motivo?: null;
    }
  | {
      decisao: "Rejeitado";
      documentos: string[] | null;
      motivo: string;
    };
