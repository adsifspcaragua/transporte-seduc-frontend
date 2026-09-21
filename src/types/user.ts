export type SystemUser = {
  id: number;
  name: string;
  email: string;
  cpf?: string | null;
  matricula?: string | number | null;
  data_nascimento?: string | null;
  ativo: boolean;
  roles: string[];
};
