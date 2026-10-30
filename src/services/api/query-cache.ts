import { useAuthStore } from "@/contexts/auth-store";

export const QUERY_STALE_TIME_MS = 60_000;

export type QuerySnapshot<Result> = {
  data: Result | undefined;
  error: unknown;
  isFetching: boolean;
  revision: number;
};

const invalidators = new Set<(clear: boolean) => void>();

function sessionKey() {
  const { status, user } = useAuthStore.getState();
  return JSON.stringify([
    status,
    user?.id,
    [...(user?.permissions ?? [])].sort(),
    [...(user?.roles ?? [])].sort(),
  ]);
}

let currentSession = sessionKey();
let sessionVersion = 0;

export function getQuerySessionVersion() {
  return sessionVersion;
}

// Perfil atualizado mantém os dados; logout, conta ou autorização diferente limpa tudo.
useAuthStore.subscribe(() => {
  const nextSession = sessionKey();
  if (nextSession === currentSession) return;
  currentSession = nextSession;
  sessionVersion++;
  for (const invalidate of invalidators) invalidate(true);
});

export function invalidateQueries() {
  for (const invalidate of invalidators) invalidate(false);
}

export function queryKey(args: readonly unknown[]) {
  return JSON.stringify(args, (_key, value: unknown) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).sort(([left], [right]) =>
          left.localeCompare(right),
        ),
      );
    }
    return value;
  });
}

export function createCachedQuery<Args extends unknown[], Result>(
  request: (...args: Args) => Promise<Result>,
  staleTime = QUERY_STALE_TIME_MS,
) {
  type Entry = {
    snapshot: QuerySnapshot<Result>;
    updatedAt: number;
    pending?: Promise<Result>;
  };
  const entries = new Map<string, Entry>();
  const listeners = new Set<() => void>();
  let revision = 0;
  let latestArgs: Args | undefined;
  let empty: QuerySnapshot<Result> = {
    data: undefined,
    error: undefined,
    isFetching: false,
    revision,
  };

  function notify() {
    for (const listener of listeners) listener();
  }

  invalidators.add((clear) => {
    revision++;
    empty = { ...empty, revision };
    if (clear) {
      entries.clear();
      latestArgs = undefined;
    } else {
      for (const entry of entries.values()) {
        entry.updatedAt = Number.NEGATIVE_INFINITY;
        entry.pending = undefined;
        entry.snapshot = { ...entry.snapshot, isFetching: false, revision };
      }
    }
    notify();
  });

  function fetchData(force: boolean, ...args: Args): Promise<Result> {
    const key = queryKey(args);
    const entry = entries.get(key) ?? {
      snapshot: empty,
      updatedAt: Number.NEGATIVE_INFINITY,
    };
    latestArgs = args;
    entries.set(key, entry);
    if (entry.pending) return entry.pending;
    if (
      !force &&
      entry.snapshot.data !== undefined &&
      Date.now() - entry.updatedAt < staleTime
    ) {
      return Promise.resolve(entry.snapshot.data);
    }

    const requestRevision = revision;
    entry.snapshot = { ...entry.snapshot, error: undefined, isFetching: true };
    // Adia a execução para compartilhar inclusive requisições que falham de forma síncrona.
    const pending = Promise.resolve().then(() => request(...args));
    const result = pending.then(
      (data) => {
        if (requestRevision === revision && entry.pending === result) {
          entry.updatedAt = Date.now();
          entry.pending = undefined;
          entry.snapshot = {
            data,
            error: undefined,
            isFetching: false,
            revision,
          };
          notify();
        }
        return data;
      },
      (error: unknown) => {
        if (requestRevision === revision && entry.pending === result) {
          entry.pending = undefined;
          entry.snapshot = { ...entry.snapshot, error, isFetching: false };
          notify();
        }
        throw error;
      },
    );
    entry.pending = result;
    notify();
    return result;
  }

  return {
    fetch: (...args: Args) => fetchData(false, ...args),
    refresh: (...args: Args) => fetchData(true, ...args),
    getSnapshot: (...args: Args) =>
      entries.get(queryKey(args))?.snapshot ?? empty,
    getServerSnapshot: () => empty,
    getLatestArgs: () => latestArgs,
    updateData: (
      originSession: number,
      update: (data: Result) => Result,
      ...args: Args
    ) => {
      if (originSession !== sessionVersion) return;
      const entry = entries.get(queryKey(args));
      if (!entry || entry.snapshot.data === undefined) return;
      entry.snapshot = { ...entry.snapshot, data: update(entry.snapshot.data) };
      notify();
    },
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}

export type CachedQuery<Args extends unknown[], Result> = ReturnType<
  typeof createCachedQuery<Args, Result>
>;
