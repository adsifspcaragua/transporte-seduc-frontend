import { useAuthStore } from "@/contexts/auth-store";

let revision = 0;

export function invalidatePendingRequests() {
  revision += 1;
}

// Compartilha somente leituras em andamento. Ao concluir ou falhar, uma nova
// chamada volta ao servidor; não mantém dados antigos após navegação ou edição.
export function sharePendingRequest<Args extends unknown[], Result>(
  request: (...args: Args) => Promise<Result>,
) {
  const pending = new Map<string, Promise<Result>>();
  let session = useAuthStore.getState();
  let currentRevision = revision;

  return (...args: Args): Promise<Result> => {
    const nextSession = useAuthStore.getState();
    if (session !== nextSession || currentRevision !== revision) {
      pending.clear();
      session = nextSession;
      currentRevision = revision;
    }

    const key = JSON.stringify(args);
    const existing = pending.get(key);
    if (existing) return existing;

    const promise = request(...args).finally(() => {
      if (pending.get(key) === promise) pending.delete(key);
    });
    pending.set(key, promise);
    return promise;
  };
}
