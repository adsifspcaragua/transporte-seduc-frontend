"use client";

import axios from "axios";
import { Plus, Users } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/buttons";
import { Modal } from "@/components/modal";
import { UserFormModal } from "@/components/ui/users/UserFormModal";
import { UsersSkeleton } from "@/components/ui/users/UsersSkeleton";
import { UsersTable } from "@/components/ui/users/UsersTable";
import { useAuthStore } from "@/contexts/auth-store";
import { useAuthz } from "@/hooks/use-authz";
import { authService } from "@/services/api/modules/auth";
import { userService } from "@/services/api/modules/user";
import type {
  SystemUser,
  UserFormErrors,
  UserFormValues,
  UserPayload,
} from "@/types/user";

type ApiError = { message?: string; errors?: Record<string, string[]> };

function errorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError<ApiError>(error)) return fallback;
  return (
    Object.values(error.response?.data?.errors ?? {})[0]?.[0] ??
    error.response?.data?.message ??
    fallback
  );
}

export function UsersWorkspace() {
  const currentUserId = useAuthStore((state) => state.user?.id);
  const setCurrentUser = useAuthStore((state) => state.setUser);
  const { can } = useAuthz();
  const canWrite = can("users.write");
  const canDelete = can("users.delete");
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<SystemUser | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<UserFormErrors>({});
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<SystemUser | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const requestId = useRef(0);

  const loadUsers = useCallback(async () => {
    const id = ++requestId.current;
    try {
      setLoading(true);
      setLoadError("");
      const data = await userService.list();
      if (id === requestId.current) setUsers(data);
    } catch (error) {
      if (id === requestId.current) {
        setLoadError(
          errorMessage(error, "Não foi possível carregar os usuários."),
        );
      }
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    return () => {
      requestId.current += 1;
    };
  }, [loadUsers]);

  function openForm(user: SystemUser | null) {
    setEditing(user);
    setFormError("");
    setFieldErrors({});
    setFormOpen(true);
  }

  function closeForm() {
    if (formLoading) return;
    setFormOpen(false);
    setEditing(null);
  }

  async function save(payload: UserPayload) {
    try {
      setFormLoading(true);
      setFormError("");
      setFieldErrors({});
      if (editing) {
        await userService.update(editing.id, payload);
      } else {
        await userService.create(payload);
      }
      setSuccessMessage(
        editing
          ? "Usuário atualizado com sucesso."
          : "Usuário cadastrado com sucesso.",
      );
      setFormOpen(false);
      const editedCurrentUser = editing?.id === currentUserId;
      setEditing(null);

      if (editedCurrentUser) {
        const currentUser = await authService.me();
        setCurrentUser(currentUser);
        if (!currentUser.permissions.includes("users.view")) return;
      }

      await loadUsers();
    } catch (error) {
      const apiErrors = axios.isAxiosError<ApiError>(error)
        ? error.response?.data?.errors
        : undefined;
      const nextErrors: UserFormErrors = {};
      for (const [field, messages] of Object.entries(apiErrors ?? {})) {
        if (messages[0]) {
          nextErrors[field as keyof UserFormValues] = messages[0];
        }
      }
      setFieldErrors(nextErrors);
      setFormError(
        Object.keys(nextErrors).length > 0
          ? "Revise os campos destacados."
          : errorMessage(error, "Não foi possível salvar o usuário."),
      );
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleStatus(user: SystemUser) {
    if (user.id === currentUserId || loadingUserId !== null) return;
    try {
      setLoadingUserId(user.id);
      setLoadError("");
      const updated = user.ativo
        ? await userService.inactivate(user.id)
        : await userService.activate(user.id);
      setUsers((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      setSuccessMessage(
        `Usuário ${user.ativo ? "inativado" : "ativado"} com sucesso.`,
      );
    } catch (error) {
      setLoadError(errorMessage(error, "Não foi possível alterar a situação."));
    } finally {
      setLoadingUserId(null);
    }
  }

  async function remove() {
    if (!deleting || deleting.id === currentUserId || loadingUserId !== null)
      return;
    try {
      setLoadingUserId(deleting.id);
      setDeleteError("");
      await userService.remove(deleting.id);
      setUsers((current) => current.filter((user) => user.id !== deleting.id));
      setSuccessMessage("Usuário excluído com sucesso.");
      setDeleting(null);
    } catch (error) {
      setDeleteError(
        errorMessage(error, "Não foi possível excluir o usuário."),
      );
    } finally {
      setLoadingUserId(null);
    }
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-content-muted">
            Administração
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-brand-700">
            <Users aria-hidden="true" className="size-6" />
            Usuários
          </h1>
          <p className="mt-2 text-sm text-content-secondary">
            Gerencie acessos, papéis e a situação dos usuários do sistema.
          </p>
        </div>
        {canWrite && (
          <Button
            fullWidth={false}
            leftIcon={<Plus aria-hidden="true" />}
            onClick={() => openForm(null)}
            variant="primary"
          >
            Novo usuário
          </Button>
        )}
      </header>

      {successMessage && (
        <output className="block rounded-lg border border-emerald-600/20 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          {successMessage}
        </output>
      )}
      {loadError && (
        <div
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3"
          role="alert"
        >
          <p className="text-sm font-medium text-danger-600">{loadError}</p>
          <Button
            fullWidth={false}
            onClick={() => void loadUsers()}
            size="sm"
            variant="ghost"
          >
            Tentar novamente
          </Button>
        </div>
      )}

      {loading ? (
        <UsersSkeleton />
      ) : (
        <UsersTable
          canDelete={canDelete}
          canWrite={canWrite}
          currentUserId={currentUserId}
          loadingUserId={loadingUserId}
          onDelete={(user) => {
            setDeleteError("");
            setDeleting(user);
          }}
          onEdit={(user) => openForm(user)}
          onToggleStatus={(user) => void toggleStatus(user)}
          users={users}
        />
      )}

      <UserFormModal
        error={formError}
        fieldErrors={fieldErrors}
        loading={formLoading}
        onClearError={(field) => {
          setFieldErrors((current) => ({ ...current, [field]: undefined }));
          setFormError("");
        }}
        onClose={closeForm}
        onSubmit={(payload) => void save(payload)}
        open={formOpen}
        user={editing}
      />

      <Modal
        onClose={() => !loadingUserId && setDeleting(null)}
        onSave={() => void remove()}
        open={Boolean(deleting)}
        saveLabel="Excluir usuário"
        saveLoading={loadingUserId === deleting?.id}
        saveVariant="danger"
        title="Excluir usuário"
      >
        <p className="text-sm text-content-secondary">
          Confirma a exclusão de <strong>{deleting?.name}</strong>? Esta ação
          não pode ser desfeita.
        </p>
        {deleteError && (
          <p
            className="mt-4 rounded-lg border border-danger-600/20 bg-danger-600/10 px-4 py-3 text-sm font-medium text-danger-600"
            role="alert"
          >
            {deleteError}
          </p>
        )}
      </Modal>
    </main>
  );
}
