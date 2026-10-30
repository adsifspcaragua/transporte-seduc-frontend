"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { type CachedQuery, queryKey } from "@/services/api/query-cache";

export function useCachedQuery<Args extends unknown[], Result>(
  query: CachedQuery<Args, Result>,
  ...args: Args
) {
  const key = queryKey(args);
  const stableArgs = useMemo(() => JSON.parse(key) as Args, [key]);
  const getSnapshot = useCallback(
    () => query.getSnapshot(...stableArgs),
    [query, stableArgs],
  );
  const snapshot = useSyncExternalStore(
    query.subscribe,
    getSnapshot,
    query.getServerSnapshot,
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: Revalida quando uma mutação ou troca de sessão altera a revisão.
  useEffect(() => {
    void query.fetch(...stableArgs).catch(() => {
      // O erro fica no snapshot; dados anteriores continuam disponíveis.
    });
  }, [query, stableArgs, snapshot.revision]);

  const refresh = useCallback(
    () => query.refresh(...stableArgs).catch(() => undefined),
    [query, stableArgs],
  );

  return {
    ...snapshot,
    isLoading:
      snapshot.data === undefined &&
      (snapshot.isFetching || snapshot.error === undefined),
    refresh,
  };
}
