import { useState, useEffect, useCallback, useRef } from "react";
import { QueryDocumentSnapshot } from "firebase/firestore";
import { IAuditLog, AuditAction } from "../interfaces/iaudit";
import { fetchAuditLogs } from "../services/auditService";
import { logger } from "../utils/logger";

export interface UseAuditLogsReturn {
  logs: IAuditLog[];
  loading: boolean;
  /** Diferente do `DataContext`, aqui o erro é exposto — ver nota abaixo. */
  error: unknown | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  reload: () => Promise<void>;
}

/**
 * Leitura paginada de `auditLogs`, DELIBERADAMENTE fora do cache global.
 *
 * O `cacheService` espelha coleções inteiras no localStorage com TTL de 5 min —
 * o oposto do que serve para um log append-only sem teto, que bateria na cota
 * de storage. Aqui a busca é por cursor, só quando a tela monta: zero leitura
 * no boot do app e zero leitura para quem não é admin.
 *
 * `error` é exposto de propósito. `useEntityStore.load` engole o catch, e é por
 * isso que hoje uma leitura negada aparece como lista vazia — indistinguível de
 * "não há registros". Num painel de diagnóstico, esse silêncio seria o pior
 * defeito possível.
 *
 * @param action quando informado, filtra no SERVIDOR (índice composto
 * `{action ASC, at DESC}`). A tela de Erros depende disso: o log é dominado por
 * CRUD, e peneirar `action == "error"` no cliente esconderia justamente o
 * evento raro que se está caçando.
 */
export const useAuditLogs = (
  pageSize = 50,
  action?: AuditAction
): UseAuditLogsReturn => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursor = useRef<QueryDocumentSnapshot | undefined>(undefined);

  const load = useCallback(
    async (append: boolean) => {
      setLoading(true);
      if (!append) setError(null);

      try {
        const page = await fetchAuditLogs(
          pageSize,
          append ? cursor.current : undefined,
          action
        );
        cursor.current = page.lastDoc;
        setHasMore(page.hasMore);
        setLogs((prev) => (append ? [...prev, ...page.logs] : page.logs));
      } catch (err) {
        logger.error("[useAuditLogs] falha ao carregar registros:", err);
        setError(err);
        if (!append) setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [pageSize, action]
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  return {
    logs,
    loading,
    error,
    hasMore,
    loadMore: () => load(true),
    reload: () => load(false),
  };
};
