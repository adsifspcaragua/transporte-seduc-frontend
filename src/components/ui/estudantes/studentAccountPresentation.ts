import type { UpdateEstudantePayload } from "@/types/estudante";
import type { SystemUser } from "@/types/user";

export function buildStudentAccountPayload(
  value: string,
  previousUserId: number | null,
  canAssociate: boolean,
): Pick<UpdateEstudantePayload, "user_id"> {
  if (!canAssociate) return {};
  const userId = value === "" ? null : Number(value);
  if (userId !== null && (!Number.isSafeInteger(userId) || userId <= 0)) {
    return {};
  }
  return userId === previousUserId ? {} : { user_id: userId };
}

export function getStudentAccountOptions(
  users: SystemUser[],
  currentUserId: number | null,
) {
  const options = users
    .filter((user) => user.ativo && user.roles.includes("estudante"))
    .map((user) => ({
      value: String(user.id),
      label: `${user.name} — ${user.email}`,
      disabled: false,
    }));

  if (
    currentUserId &&
    !options.some((option) => option.value === String(currentUserId))
  ) {
    const current = users.find((user) => user.id === currentUserId);
    options.push({
      value: String(currentUserId),
      label: current
        ? `${current.name} — vínculo atual (conta inativa ou sem papel estudante)`
        : `Conta #${currentUserId} — vínculo atual indisponível`,
      disabled: true,
    });
  }
  return options;
}
