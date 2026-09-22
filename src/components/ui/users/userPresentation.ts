import type {
  UserFormErrors,
  UserFormMode,
  UserFormValues,
  UserPayload,
  UserRole,
} from "@/types/user";

export const USER_ROLE_OPTIONS: { value: UserRole; label: string }[] = [
  { value: "admin", label: "Administrador" },
  { value: "gestor", label: "Gestor" },
  { value: "operador", label: "Operador" },
  { value: "motorista", label: "Motorista" },
  { value: "estudante", label: "Estudante" },
];

export function getUserRoleLabel(role?: string) {
  return (
    USER_ROLE_OPTIONS.find((option) => option.value === role)?.label ??
    "Sem papel"
  );
}

export function validateUserForm(values: UserFormValues, mode: UserFormMode) {
  const errors: UserFormErrors = {};
  const cpf = values.cpf.replace(/\D/g, "");

  if (!values.name.trim()) errors.name = "Informe o nome.";
  if (!/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }
  if (
    (mode === "create" || values.password.length > 0) &&
    values.password.length < 8
  ) {
    errors.password = "A senha deve ter pelo menos 8 caracteres.";
  }
  if (cpf && cpf.length !== 11) {
    errors.cpf = "Informe um CPF com 11 dígitos.";
  }
  if (values.matricula && !/^\d+$/.test(values.matricula)) {
    errors.matricula = "A matrícula deve conter apenas números.";
  }
  if (
    values.data_nascimento &&
    values.data_nascimento >= new Date().toISOString().slice(0, 10)
  ) {
    errors.data_nascimento = "Informe uma data de nascimento anterior a hoje.";
  }
  if (!values.role) errors.role = "Selecione um papel.";

  return errors;
}

export function buildUserPayload(
  values: UserFormValues,
  mode: UserFormMode,
): UserPayload {
  const cpf = values.cpf.replace(/\D/g, "");
  const matricula = values.matricula.trim();
  const password = values.password;

  return {
    name: values.name.trim(),
    email: values.email.trim().toLocaleLowerCase("pt-BR"),
    role: values.role as UserRole,
    ...(mode === "create" || password ? { password } : {}),
    ...(cpf ? { cpf } : {}),
    ...(matricula ? { matricula: Number(matricula) } : {}),
    ...(values.data_nascimento
      ? { data_nascimento: values.data_nascimento }
      : {}),
  };
}
