/**
 * useEntityStore — store por entidade para o DataContext (EST F2.2).
 *
 * Colapsa a repetição 4× que existia no `DataContext` (um bloco de estado +
 * refresh + searchLocal + add/update/remove por coleção) em um único hook
 * parametrizado. O `DataContext` passa a compor 4 chamadas deste hook.
 *
 * Precisa ser um HOOK (não uma função pura) porque cada store é dono do seu
 * próprio `useState`/`useCallback` — daí o nome `useEntityStore` em vez do
 * `createEntityStore` do plano. É chamado um número fixo de vezes, no topo do
 * provider, respeitando as regras dos hooks.
 */
import { useCallback, useRef, useState } from "react";
import {
  getCache,
  setCache,
  invalidateCache,
  addItemToCache,
  updateItemInCache,
  removeItemFromCache,
  CacheKey,
} from "../services/cacheService";

/** Lê um campo por caminho com ponto (ex.: "client.name"). */
const getByPath = (obj: unknown, path: string): unknown =>
  path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object") {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);

export interface EntityStore<T> {
  items: T[];
  loading: boolean;
  /** Carrega do cache (se válido) ou do Firestore, populando o cache. */
  load: () => Promise<void>;
  /** Invalida o cache e recarrega do Firestore. */
  refresh: () => Promise<void>;
  /** Filtro local (cache) pelos campos configurados; zero reads. */
  searchLocal: (term: string) => T[];
  addToCache: (item: T) => void;
  updateInCache: (item: T) => void;
  removeFromCache: (id: string | number) => void;
}

export function useEntityStore<T extends { id: string | number }>(
  key: CacheKey,
  fetcher: () => Promise<T[]>,
  /** Campos filtráveis pelo `searchLocal` (aceita caminhos com ponto). */
  searchFields: string[]
): EntityStore<T> {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  // `searchFields` é conceitualmente constante por store — congela na 1ª render
  // para manter `searchLocal` estável (sem re-render em cascata) sem lint.
  const searchFieldsRef = useRef(searchFields);

  const load = useCallback(async (): Promise<void> => {
    const cached = getCache<T[]>(key);
    if (cached) {
      setItems(cached);
      return;
    }

    setLoading(true);
    try {
      console.log(`[DataContext] Fetching ${key} from Firestore...`);
      const data = await fetcher();
      setItems(data);
      setCache(key, data);
      console.log(`[DataContext] Fetched ${data.length} ${key}`);
    } catch (error) {
      console.error(`[DataContext] Error fetching ${key}:`, error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher]);

  const refresh = useCallback(async (): Promise<void> => {
    invalidateCache(key);
    await load();
  }, [key, load]);

  const searchLocal = useCallback(
    (term: string): T[] => {
      if (!term) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFieldsRef.current.some((field) => {
          const value = getByPath(item, field);
          return value != null && String(value).toLowerCase().includes(lower);
        })
      );
    },
    [items]
  );

  const addToCache = useCallback(
    (item: T) => {
      setItems((prev) => [...prev, item]);
      addItemToCache(key, item);
    },
    [key]
  );

  const updateInCache = useCallback(
    (item: T) => {
      setItems((prev) => prev.map((it) => (it.id === item.id ? item : it)));
      updateItemInCache(key, item);
    },
    [key]
  );

  const removeFromCache = useCallback(
    (id: string | number) => {
      setItems((prev) => prev.filter((it) => it.id !== id));
      removeItemFromCache(key, id);
    },
    [key]
  );

  return {
    items,
    loading,
    load,
    refresh,
    searchLocal,
    addToCache,
    updateInCache,
    removeFromCache,
  };
}
