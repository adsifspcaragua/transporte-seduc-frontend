import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { DataTable, TableActionButton } from "@/components/table";
import { UsersTableSkeleton } from "@/components/ui/users/UsersSkeleton";
import {
  canChangeUserStatusOrDelete,
  getUserRoleLabel,
} from "@/components/ui/users/userPresentation";
import type { SystemUser } from "@/types/user";
import { cn } from "@/utils/cn";

type UsersTableProps = {
  data: SystemUser[];
  currentUserId?: number;
  canWrite: boolean;
  canDelete: boolean;
  errorMessage?: string;
  loading?: boolean;
  loadingUserId: number | null;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
  onRetry: () => void;
};

const columns = [
  { key: "name", label: "Nome" },
  { key: "email", label: "E-mail" },
  { key: "role", label: "Papel" },
  { key: "status", label: "Situação" },
  { key: "actions", label: "Ações" },
];

const gridClassName =
  "md:grid-cols-[minmax(0,1.2fr)_minmax(0,1.35fr)_9rem_7rem_10rem] md:gap-3";

export function UsersTable({
  data,
  currentUserId,
  canWrite,
  canDelete,
  errorMessage = "",
  loading = false,
  loadingUserId,
  onEdit,
  onToggleStatus,
  onDelete,
  onRetry,
}: UsersTableProps) {
  return (
    <DataTable
      columns={columns}
      data={data}
      emptyMessage="Nenhum usuário cadastrado."
      errorMessage={errorMessage}
      errorTitle="Não foi possível carregar os usuários"
      getRowKey={(user) => user.id}
      gridClassName={gridClassName}
      loading={loading}
      onRetry={onRetry}
      skeleton={<UsersTableSkeleton />}
      renderRow={(user) => {
        const canChangeStatusOrDelete = canChangeUserStatusOrDelete(
          user.id,
          currentUserId,
        );
        const isCurrentUser = !canChangeStatusOrDelete;
        const isLoading = loadingUserId === user.id;

        return (
          <article
            className={cn(
              "grid gap-4 border-b border-border-subtle px-5 py-4 last:border-b-0 md:items-center",
              gridClassName,
            )}
          >
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase text-content-muted md:hidden">
                Nome
              </span>
              <p className="truncate text-sm font-bold text-brand-700">
                {user.name}
                {isCurrentUser && (
                  <span className="ml-2 text-xs font-medium text-content-muted">
                    (você)
                  </span>
                )}
              </p>
            </div>
            <p className="min-w-0 truncate text-sm text-content-secondary">
              <span className="block text-xs font-semibold uppercase text-content-muted md:hidden">
                E-mail
              </span>
              {user.email}
            </p>
            <p className="text-sm text-content-secondary">
              <span className="block text-xs font-semibold uppercase text-content-muted md:hidden">
                Papel
              </span>
              {getUserRoleLabel(user.roles[0])}
            </p>
            <div>
              <span className="block text-xs font-semibold uppercase text-content-muted md:hidden">
                Situação
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full px-2.5 py-1 text-xs font-bold",
                  user.ativo
                    ? "bg-green-100 text-green-800"
                    : "bg-surface-muted text-content-muted",
                )}
              >
                {user.ativo ? "Ativo" : "Inativo"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {canWrite && (
                <TableActionButton
                  ariaLabel={`Editar ${user.name}`}
                  icon={<Pencil aria-hidden="true" />}
                  onClick={() => onEdit(user)}
                  tooltip="Editar usuário"
                  variant="light"
                />
              )}
              {canWrite && canChangeStatusOrDelete && (
                <TableActionButton
                  ariaLabel={`${user.ativo ? "Inativar" : "Ativar"} ${user.name}`}
                  icon={
                    user.ativo ? (
                      <PowerOff aria-hidden="true" />
                    ) : (
                      <Power aria-hidden="true" />
                    )
                  }
                  loading={isLoading}
                  onClick={() => onToggleStatus(user)}
                  tooltip={user.ativo ? "Inativar usuário" : "Ativar usuário"}
                  variant={user.ativo ? "neutral" : "approved"}
                />
              )}
              {canDelete && canChangeStatusOrDelete && (
                <TableActionButton
                  ariaLabel={`Excluir ${user.name}`}
                  icon={<Trash2 aria-hidden="true" />}
                  onClick={() => onDelete(user)}
                  tooltip="Excluir usuário"
                  variant="danger"
                />
              )}
            </div>
          </article>
        );
      }}
    />
  );
}
