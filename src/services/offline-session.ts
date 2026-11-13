import axios from "axios";
import { isStudentAccount } from "@/services/navigation/account-navigation";
import type { AuthUser } from "@/types/auth";

/**
 * Conta do estudante lembrada neste aparelho, para o portal abrir sem internet.
 *
 * O estudante entra em casa e, na van, pode estar sem sinal: sem isto, recarregar
 * o portal offline cairia no login. Só vale para conta de estudante e só quando
 * a API não respondeu; 401 ou sair da conta apagam o registro. Não guarda
 * senha nem token: a sessão continua sendo a do cookie, e as chamadas que
 * precisarem dela voltam a funcionar quando a conexão volta.
 */

const CHAVE = "sigtu:conta-offline";
const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;

export function lembrarConta(user: AuthUser) {
  if (!isStudentAccount(user)) return;
  try {
    window.localStorage.setItem(
      CHAVE,
      JSON.stringify({ user, salvaEm: Date.now() }),
    );
  } catch {
    // Sem armazenamento (navegação privada): o portal só não abre offline.
  }
}

export function contaLembrada(): AuthUser | null {
  try {
    const salva = JSON.parse(window.localStorage.getItem(CHAVE) ?? "null") as {
      user: AuthUser;
      salvaEm: number;
    } | null;
    if (!salva || Date.now() - salva.salvaEm > VALIDADE_MS) return null;
    return isStudentAccount(salva.user) ? salva.user : null;
  } catch {
    return null;
  }
}

export function esquecerConta() {
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // nada a apagar
  }
}

/** A requisição nem chegou à API. */
export function semConexao(error: unknown) {
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    return true;
  return axios.isAxiosError(error) && !error.response;
}
