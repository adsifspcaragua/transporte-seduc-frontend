export type AuthUser = {
  id: number;
  name: string;
  email: string;
  cpf?: string | null;
  matricula?: string | null;
  data_nascimento?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type LoginRequest = {
  login: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};
