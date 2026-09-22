import { Pencil, Power, PowerOff, Trash2 } from "lucide-react";

import { TableActionButton } from "@/components/table";
import {
  canChangeUserStatusOrDelete,
  getUserRoleLabel,
} from "@/components/ui/users/userPresentation";
import type { SystemUser } from "@/types/user";

type UsersTableProps = {
  users: SystemUser[];
  currentUserId?: number;
  canWrite: boolean;
  canDelete: boolean;
  loadingUserId: number | null;
  onEdit: (user: SystemUser) => void;
  onToggleStatus: (user: SystemUser) => void;
  onDelete: (user: SystemUser) => void;
};

export function UsersTable({
  users,
  currentUserId,
  canWrite,
  canDelete,
  loadingUserId,
  onEdit,
  onToggleStatus,
  onDelete,
}: UsersTableProps) {
  if (users.length === 0) {
    return (
      <p className="rounded-xl border border-border-subtle bg-white px-5 py-10 text-center text-sm text-content-muted">
        Nenhum usuário cadastrado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border-subtle bg-white shadow-sm">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead className="bg-surface-muted text-xs uppercase tracking-wide text-content-muted">
          <tr>
            <th className="px-5 py-4 font-semibold">Nome</th>
            <th className="px-5 py-4 font-semibold">E-mail</th>
            <th className="px-5 py-4 font-semibold">Papel</th>
            <th className="px-5 py-4 font-semibold">Situação</th>
            <th className="px-5 py-4 text-right font-semibold">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const canChangeStatusOrDelete = canChangeUserStatusOrDelete(
              user.id,
              currentUserId,
            );
            const isCurrentUser = !canChangeStatusOrDelete;
            const isLoading = loadingUserId === user.id;

            return (
              <tr
                className="border-t border-border-subtle text-content-secondary"
                key={user.id}
              >
                <td className="px-5 py-4 font-semibold text-brand-700">
                  {user.name}
                  {isCurrentUser && (
                    <span className="ml-2 text-xs font-medium text-content-muted">
                      (você)
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">{user.email}</td>
                <td className="px-5 py-4">{getUserRoleLabel(user.roles[0])}</td>
                <td className="px-5 py-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                      user.ativo
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {user.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex justify-end gap-2">
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
                        tooltip={
                          user.ativo ? "Inativar usuário" : "Ativar usuário"
                        }
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
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
