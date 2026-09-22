"use client";

import { useEffect, useRef, useState } from "react";

import {
  CpfInput,
  DateInput,
  Input,
  PasswordInput,
  Select,
} from "@/components/form/inputs";
import { Modal } from "@/components/modal";
import {
  buildUserPayload,
  USER_ROLE_OPTIONS,
  validateUserForm,
} from "@/components/ui/users/userPresentation";
import type {
  SystemUser,
  UserFormErrors,
  UserFormValues,
  UserPayload,
} from "@/types/user";
import { scheduleFocusFirstFieldError } from "@/utils/focus-first-field-error";

const EMPTY_FORM: UserFormValues = {
  name: "",
  email: "",
  password: "",
  cpf: "",
  matricula: "",
  data_nascimento: "",
  role: "",
};

type UserFormModalProps = {
  open: boolean;
  user: SystemUser | null;
  loading: boolean;
  error: string;
  fieldErrors: UserFormErrors;
  onClose: () => void;
  onClearError: (field: keyof UserFormValues) => void;
  onSubmit: (payload: UserPayload) => void;
};

export function UserFormModal({
  open,
  user,
  loading,
  error,
  fieldErrors,
  onClose,
  onClearError,
  onSubmit,
}: UserFormModalProps) {
  const [values, setValues] = useState<UserFormValues>(EMPTY_FORM);
  const [localErrors, setLocalErrors] = useState<UserFormErrors>({});
  const formRef = useRef<HTMLDivElement>(null);
  const mode = user ? "edit" : "create";

  useEffect(() => {
    if (!open) return;
    setValues(
      user
        ? {
            name: user.name,
            email: user.email,
            password: "",
            cpf: user.cpf ?? "",
            matricula: user.matricula ? String(user.matricula) : "",
            data_nascimento: user.data_nascimento?.slice(0, 10) ?? "",
            role: user.roles[0] ?? "",
          }
        : EMPTY_FORM,
    );
    setLocalErrors({});
  }, [open, user]);

  function setField(field: keyof UserFormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setLocalErrors((current) => ({ ...current, [field]: undefined }));
    onClearError(field);
  }

  function submit() {
    const nextErrors = validateUserForm(values, mode);
    setLocalErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scheduleFocusFirstFieldError(formRef.current);
      return;
    }
    onSubmit(buildUserPayload(values, mode));
  }

  function fieldError(field: keyof UserFormValues) {
    return localErrors[field] ?? fieldErrors[field];
  }

  return (
    <Modal
      onClose={onClose}
      onSave={submit}
      open={open}
      saveLabel={user ? "Salvar alterações" : "Cadastrar usuário"}
      saveLoading={loading}
      title={user ? "Editar usuário" : "Novo usuário"}
    >
      <div className="space-y-4" ref={formRef}>
        {error && (
          <p
            className="rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
            role="alert"
          >
            {error}
          </p>
        )}
        <Input
          error={fieldError("name")}
          label="Nome"
          onChange={(event) => setField("name", event.target.value)}
          required
          value={values.name}
        />
        <Input
          autoComplete="email"
          error={fieldError("email")}
          label="E-mail"
          onChange={(event) => setField("email", event.target.value)}
          required
          type="email"
          value={values.email}
        />
        <PasswordInput
          autoComplete="new-password"
          error={fieldError("password")}
          hint={user ? "Deixe em branco para manter a senha atual." : undefined}
          label={user ? "Nova senha" : "Senha"}
          onChange={(event) => setField("password", event.target.value)}
          required={!user}
          value={values.password}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <CpfInput
            error={fieldError("cpf")}
            label="CPF"
            onChange={(event) => setField("cpf", event.target.value)}
            value={values.cpf}
          />
          <Input
            error={fieldError("matricula")}
            inputMode="numeric"
            label="Matrícula"
            onChange={(event) => setField("matricula", event.target.value)}
            value={values.matricula}
          />
        </div>
        <DateInput
          error={fieldError("data_nascimento")}
          label="Data de nascimento"
          onChange={(event) => setField("data_nascimento", event.target.value)}
          value={values.data_nascimento}
        />
        <Select
          error={fieldError("role")}
          label="Papel"
          onChange={(event) => setField("role", event.target.value)}
          options={[
            { value: "", label: "Selecione um papel" },
            ...USER_ROLE_OPTIONS,
          ]}
          required
          value={values.role}
        />
      </div>
    </Modal>
  );
}
