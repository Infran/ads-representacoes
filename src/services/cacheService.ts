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

// Chave para localStorage
const STORAGE_KEY = "ads_representacoes_cache";

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
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      delete parsed[key];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
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
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("[Cache] Error clearing all cache:", error);
  }

  console.log("[Cache] ALL INVALIDATED");
};

/**
 * Persiste um item do cache no localStorage
 */
const persistToStorage = <T>(key: CacheKey, entry: CacheEntry<T>): void => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : {};
    parsed[key] = entry;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch (error) {
    console.error(`[Cache] Error persisting ${key}:`, error);
  }
};

/**
 * Carrega um item do localStorage
 */
const loadFromStorage = <T>(key: CacheKey): CacheEntry<T> | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed[key] || null;
  } catch (error) {
    console.error(`[Cache] Error loading ${key}:`, error);
    return null;
  }
};

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
