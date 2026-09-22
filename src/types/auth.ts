export type AuthUser = {
  id: number;
  name: string;
  email: string;
  cpf?: string | null;
  matricula?: string | null;
  data_nascimento?: string | null;
  roles: string[];
  permissions: string[];
  created_at?: string;
  updated_at?: string;
};

export type AuthStatus = "unknown" | "authenticated" | "guest";

export type LoginRequest = {
  login: string;
  password: string;
};

export type LoginResponse = {
  user: AuthUser;
};
