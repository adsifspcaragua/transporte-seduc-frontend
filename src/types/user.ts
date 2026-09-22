export type DriverOption = {
  id: number;
  name: string;
};

export type UserRole =
  | "admin"
  | "gestor"
  | "operador"
  | "motorista"
  | "estudante";

export type SystemUser = {
  id: number;
  name: string;
  email: string;
  cpf: string | null;
  matricula: number | null;
  data_nascimento: string | null;
  ativo: boolean;
  roles: UserRole[];
};

export type UserFormMode = "create" | "edit";

export type UserFormValues = {
  name: string;
  email: string;
  password: string;
  cpf: string;
  matricula: string;
  data_nascimento: string;
  role: UserRole | "";
};

export type UserPayload = {
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  cpf?: string;
  matricula?: number;
  data_nascimento?: string;
};

export type UserFormErrors = Partial<Record<keyof UserFormValues, string>>;
