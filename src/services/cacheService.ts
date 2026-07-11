/**
 * Cache Service para otimização de chamadas ao Firestore
 *
 * Este serviço gerencia o cache em memória e localStorage para reduzir
 * drasticamente o número de reads no plano gratuito do Firestore.
 */

import { IBudget } from "../interfaces/ibudget";
import { IClient } from "../interfaces/iclient";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";

// Tipos de dados que podem ser cacheados
export type CacheKey = "budgets" | "clients" | "products" | "representatives";

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export interface CacheData {
  budgets: CacheEntry<IBudget[]> | null;
  clients: CacheEntry<IClient[]> | null;
  products: CacheEntry<IProduct[]> | null;
  representatives: CacheEntry<IRepresentative[]> | null;
}

// TTL padrão de 5 minutos (em milliseconds)
const DEFAULT_TTL = 5 * 60 * 1000;

// Chave base do localStorage. P1.3: uma chave POR coleção
// (`ads_representacoes_cache:budgets`, etc.) em vez de um único blob com as 4 —
// mutar 1 coleção passa a re-serializar só ela, não as quatro.
const STORAGE_PREFIX = "ads_representacoes_cache";
const storageKeyFor = (key: CacheKey): string => `${STORAGE_PREFIX}:${key}`;
// Blob único usado antes de P1.3; migrado para as chaves novas e removido na
// primeira carga do módulo (ver migrateLegacyStorage).
const LEGACY_STORAGE_KEY = STORAGE_PREFIX;

const CACHE_KEYS: CacheKey[] = [
  "budgets",
  "clients",
  "products",
  "representatives",
];

/** Detecta QuotaExceededError entre browsers (nome ou código legado 22/1014). */
const isQuotaExceeded = (error: unknown): boolean => {
  if (!(error instanceof DOMException)) return false;
  return (
    error.name === "QuotaExceededError" ||
    error.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    error.code === 22 ||
    error.code === 1014
  );
};

// Cache em memória
let memoryCache: CacheData = {
  budgets: null,
  clients: null,
  products: null,
  representatives: null,
};

/**
 * Verifica se um item do cache expirou
 */
export const isExpired = (key: CacheKey): boolean => {
  const entry = memoryCache[key];
  if (!entry) return true;
  return Date.now() > entry.expiresAt;
};

/**
 * Obtém dados do cache (memória primeiro, depois localStorage)
 */
export const getCache = <T>(key: CacheKey): T | null => {
  // Primeiro, tenta obter da memória
  const memoryEntry = memoryCache[key] as CacheEntry<T> | null;

  if (memoryEntry && !isExpired(key)) {
    console.log(`[Cache] HIT (memory): ${key}`);
    return memoryEntry.data;
  }

  // Se não está em memória, tenta localStorage
  const storageEntry = loadFromStorage(key);
  if (storageEntry && Date.now() < storageEntry.expiresAt) {
    console.log(`[Cache] HIT (storage): ${key}`);
    // Restaura para memória (type assertion necessária devido à natureza dinâmica)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (memoryCache as any)[key] = storageEntry;
    return storageEntry.data as T;
  }

  console.log(`[Cache] MISS: ${key}`);
  return null;
};

/**
 * Salva dados no cache (memória e localStorage)
 */
export const setCache = <T>(
  key: CacheKey,
  data: T,
  ttl: number = DEFAULT_TTL
): void => {
  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
    expiresAt: Date.now() + ttl,
  };

  // Salva em memória (type assertion necessária devido à natureza dinâmica)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (memoryCache as any)[key] = entry;

  // Persiste no localStorage
  persistToStorage(key, entry);

  console.log(`[Cache] SET: ${key} (expires in ${ttl / 1000}s)`);
};

/**
 * Invalida um cache específico
 */
export const invalidateCache = (key: CacheKey): void => {
  memoryCache[key] = null;

  try {
    localStorage.removeItem(storageKeyFor(key));
  } catch (error) {
    console.error(`[Cache] Error invalidating ${key}:`, error);
  }

  console.log(`[Cache] INVALIDATED: ${key}`);
};

/**
 * Limpa todo o cache
 */
export const invalidateAllCache = (): void => {
  memoryCache = {
    budgets: null,
    clients: null,
    products: null,
    representatives: null,
  };

  try {
    CACHE_KEYS.forEach((key) => localStorage.removeItem(storageKeyFor(key)));
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch (error) {
    console.error("[Cache] Error clearing all cache:", error);
  }

  console.log("[Cache] ALL INVALIDATED");
};

/**
 * Persiste um item do cache no localStorage (chave própria da coleção — P1.3).
 * Em QuotaExceededError, avisa e degrada para memória (não engole em silêncio):
 * o cache em memória segue válido; só a persistência entre reloads é perdida.
 */
const persistToStorage = <T>(key: CacheKey, entry: CacheEntry<T>): void => {
  try {
    localStorage.setItem(storageKeyFor(key), JSON.stringify(entry));
  } catch (error) {
    if (isQuotaExceeded(error)) {
      console.warn(
        `[Cache] Quota do localStorage excedida ao persistir "${key}". ` +
          "Seguindo apenas em memória."
      );
    } else {
      console.error(`[Cache] Error persisting ${key}:`, error);
    }
  }
};

/**
 * Carrega um item do localStorage (chave própria da coleção — P1.3).
 */
const loadFromStorage = <T>(key: CacheKey): CacheEntry<T> | null => {
  try {
    const stored = localStorage.getItem(storageKeyFor(key));
    if (!stored) return null;
    return (JSON.parse(stored) as CacheEntry<T>) || null;
  } catch (error) {
    console.error(`[Cache] Error loading ${key}:`, error);
    return null;
  }
};

/**
 * Migração única do blob legado (pré-P1.3): se existir o blob com as 4 coleções
 * sob a chave antiga, reescreve cada coleção na sua chave nova e remove o legado.
 * A TTL do cache é de 5 min, então no pior caso perde-se um refetch — baixo risco.
 */
const migrateLegacyStorage = (): void => {
  try {
    const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!legacy) return;

    const parsed = JSON.parse(legacy) as Partial<
      Record<CacheKey, CacheEntry<unknown>>
    >;
    CACHE_KEYS.forEach((key) => {
      const entry = parsed?.[key];
      if (entry && !localStorage.getItem(storageKeyFor(key))) {
        persistToStorage(key, entry);
      }
    });
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    console.log("[Cache] Blob legado migrado para chaves por coleção.");
  } catch (error) {
    console.error("[Cache] Erro migrando blob legado:", error);
  }
};

// Executa a migração uma vez ao importar o módulo (idempotente: some após migrar).
try {
  migrateLegacyStorage();
} catch {
  /* ambiente sem localStorage (ex.: SSR) — ignora */
}

/**
 * Obtém estatísticas do cache
 */
export const getCacheStats = (): Record<
  CacheKey,
  { cached: boolean; expired: boolean; itemCount: number }
> => {
  const keys: CacheKey[] = [
    "budgets",
    "clients",
    "products",
    "representatives",
  ];
  const stats: Record<
    string,
    { cached: boolean; expired: boolean; itemCount: number }
  > = {};

  for (const key of keys) {
    const entry = memoryCache[key];
    stats[key] = {
      cached: entry !== null,
      expired: isExpired(key),
      itemCount: entry ? (entry.data as unknown[]).length : 0,
    };
  }

  return stats as Record<
    CacheKey,
    { cached: boolean; expired: boolean; itemCount: number }
  >;
};

// =====================================================
// FUNÇÕES UTILITÁRIAS PARA MANIPULAÇÃO DE CACHE
// =====================================================

/**
 * Adiciona um item ao cache de uma coleção
 */
export const addItemToCache = <T extends { id: string | number }>(
  key: CacheKey,
  item: T
): void => {
  const cached = getCache<T[]>(key);
  if (cached) {
    const updated = [...cached, item];
    setCache(key, updated);
  }
};

/**
 * Atualiza um item no cache de uma coleção
 */
export const updateItemInCache = <T extends { id: string | number }>(
  key: CacheKey,
  item: T
): void => {
  const cached = getCache<T[]>(key);
  if (cached) {
    const updated = cached.map((existing) =>
      existing.id === item.id ? item : existing
    );
    setCache(key, updated);
  }
};

/**
 * Remove um item do cache de uma coleção
 */
export const removeItemFromCache = <T extends { id: string | number }>(
  key: CacheKey,
  id: string | number
): void => {
  const cached = getCache<T[]>(key);
  if (cached) {
    const updated = cached.filter((item) => item.id !== id);
    setCache(key, updated);
  }
};

/**
 * Filtra itens no cache localmente (para funções de busca)
 */
export const filterCacheLocally = <T>(
  key: CacheKey,
  predicate: (item: T) => boolean
): T[] => {
  const cached = getCache<T[]>(key);
  if (!cached) return [];
  return cached.filter(predicate);
};
