/**
 * DataContext - Gerenciamento centralizado de dados com cache
 *
 * Este contexto carrega os dados uma única vez e os mantém em cache,
 * reduzindo drasticamente as chamadas ao Firestore.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { IBudget } from "../interfaces/ibudget";
import { IClient } from "../interfaces/iclient";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";
import {
  getCache,
  setCache,
  invalidateCache,
  addItemToCache,
  updateItemInCache,
  removeItemFromCache,
  getCacheStats,
  CacheKey,
} from "../services/cacheService";

// Imports dos services originais para buscar dados do Firestore
import { getBudgets as fetchBudgetsFromFirestore } from "../services/budgetServices";
import { getClients as fetchClientsFromFirestore } from "../services/clientServices";
import { getProducts as fetchProductsFromFirestore } from "../services/productServices";
import { getRepresentatives as fetchRepresentativesFromFirestore } from "../services/representativeServices";

// =====================================================
// TIPOS
// =====================================================

interface DataContextState {
  // Dados
  budgets: IBudget[];
  clients: IClient[];
  products: IProduct[];
  representatives: IRepresentative[];

  // Estado de carregamento
  loading: boolean;
  loadingEntities: Record<CacheKey, boolean>;

  // Funções de refresh
  refreshAll: () => Promise<void>;
  refreshBudgets: () => Promise<void>;
  refreshClients: () => Promise<void>;
  refreshProducts: () => Promise<void>;
  refreshRepresentatives: () => Promise<void>;

  // Funções de busca local (sem chamar Firestore)
  searchBudgetsLocal: (term: string) => IBudget[];
  searchClientsLocal: (term: string) => IClient[];
  searchProductsLocal: (term: string) => IProduct[];
  searchRepresentativesLocal: (term: string) => IRepresentative[];

  // Funções de atualização do cache (após operações CRUD)
  addBudgetToCache: (budget: IBudget) => void;
  updateBudgetInCache: (budget: IBudget) => void;
  removeBudgetFromCache: (id: string | number) => void;

  addClientToCache: (client: IClient) => void;
  updateClientInCache: (client: IClient) => void;
  removeClientFromCache: (id: string | number) => void;

  addProductToCache: (product: IProduct) => void;
  updateProductInCache: (product: IProduct) => void;
  removeProductFromCache: (id: string | number) => void;

  addRepresentativeToCache: (representative: IRepresentative) => void;
  updateRepresentativeInCache: (representative: IRepresentative) => void;
  removeRepresentativeFromCache: (id: string | number) => void;

  // Estatísticas do cache
  getCacheStats: () => ReturnType<typeof getCacheStats>;
}

// =====================================================
// CONTEXTO
// =====================================================

const DataContext = createContext<DataContextState | null>(null);

// =====================================================
// PROVIDER
// =====================================================

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Estado dos dados
  const [budgets, setBudgets] = useState<IBudget[]>([]);
  const [clients, setClients] = useState<IClient[]>([]);
  const [products, setProducts] = useState<IProduct[]>([]);
  const [representatives, setRepresentatives] = useState<IRepresentative[]>([]);

  // Estado de carregamento
  const [loading, setLoading] = useState(true);
  const [loadingEntities, setLoadingEntities] = useState<
    Record<CacheKey, boolean>
  >({
    budgets: false,
    clients: false,
    products: false,
    representatives: false,
  });

  // =====================================================
  // FUNÇÕES DE FETCH COM CACHE
  // =====================================================

  const fetchWithCache = useCallback(
    async <T,>(
      key: CacheKey,
      fetcher: () => Promise<T[]>,
      setter: React.Dispatch<React.SetStateAction<T[]>>
    ): Promise<void> => {
      // Primeiro, tenta obter do cache
      const cached = getCache<T[]>(key);
      if (cached) {
        setter(cached);
        return;
      }

      // Se não tem cache válido, busca do Firestore
      setLoadingEntities((prev) => ({ ...prev, [key]: true }));

      try {
        console.log(`[DataContext] Fetching ${key} from Firestore...`);
        const data = await fetcher();
        setter(data);
        setCache(key, data);
        console.log(`[DataContext] Fetched ${data.length} ${key}`);
      } catch (error) {
        console.error(`[DataContext] Error fetching ${key}:`, error);
      } finally {
        setLoadingEntities((prev) => ({ ...prev, [key]: false }));
      }
    },
    []
  );

  // =====================================================
  // FUNÇÕES DE REFRESH
  // =====================================================

  const refreshBudgets = useCallback(async () => {
    invalidateCache("budgets");
    await fetchWithCache("budgets", fetchBudgetsFromFirestore, setBudgets);
  }, [fetchWithCache]);

  const refreshClients = useCallback(async () => {
    invalidateCache("clients");
    await fetchWithCache("clients", fetchClientsFromFirestore, setClients);
  }, [fetchWithCache]);

  const refreshProducts = useCallback(async () => {
    invalidateCache("products");
    await fetchWithCache("products", fetchProductsFromFirestore, setProducts);
  }, [fetchWithCache]);

  const refreshRepresentatives = useCallback(async () => {
    invalidateCache("representatives");
    await fetchWithCache(
      "representatives",
      fetchRepresentativesFromFirestore,
      setRepresentatives
    );
  }, [fetchWithCache]);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      refreshBudgets(),
      refreshClients(),
      refreshProducts(),
      refreshRepresentatives(),
    ]);
    setLoading(false);
  }, [refreshBudgets, refreshClients, refreshProducts, refreshRepresentatives]);

  // =====================================================
  // CARREGAMENTO INICIAL
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);

      await Promise.all([
        fetchWithCache("budgets", fetchBudgetsFromFirestore, setBudgets),
        fetchWithCache("clients", fetchClientsFromFirestore, setClients),
        fetchWithCache("products", fetchProductsFromFirestore, setProducts),
        fetchWithCache(
          "representatives",
          fetchRepresentativesFromFirestore,
          setRepresentatives
        ),
      ]);

      setLoading(false);
    };

    loadInitialData();
  }, [fetchWithCache]);

  // =====================================================
  // FUNÇÕES DE BUSCA LOCAL
  // =====================================================

  const searchBudgetsLocal = useCallback(
    (term: string): IBudget[] => {
      if (!term) return budgets;
      const lowerTerm = term.toLowerCase();
      return budgets.filter(
        (b) =>
          b.client?.name?.toLowerCase().includes(lowerTerm) ||
          b.representative?.name?.toLowerCase().includes(lowerTerm) ||
          b.id?.toString().includes(lowerTerm)
      );
    },
    [budgets]
  );

  const searchClientsLocal = useCallback(
    (term: string): IClient[] => {
      if (!term) return clients;
      const lowerTerm = term.toLowerCase();
      return clients.filter(
        (c) =>
          c.name?.toLowerCase().includes(lowerTerm) ||
          c.email?.toLowerCase().includes(lowerTerm) ||
          c.phone?.toLowerCase().includes(lowerTerm) ||
          c.cnpj?.toLowerCase().includes(lowerTerm)
      );
    },
    [clients]
  );

  const searchProductsLocal = useCallback(
    (term: string): IProduct[] => {
      if (!term) return products;
      const lowerTerm = term.toLowerCase();
      return products.filter(
        (p) =>
          p.name?.toLowerCase().includes(lowerTerm) ||
          p.description?.toLowerCase().includes(lowerTerm) ||
          p.ncm?.toLowerCase().includes(lowerTerm)
      );
    },
    [products]
  );

  const searchRepresentativesLocal = useCallback(
    (term: string): IRepresentative[] => {
      if (!term) return representatives;
      const lowerTerm = term.toLowerCase();
      return representatives.filter(
        (r) =>
          r.name?.toLowerCase().includes(lowerTerm) ||
          r.email?.toLowerCase().includes(lowerTerm) ||
          r.client?.name?.toLowerCase().includes(lowerTerm)
      );
    },
    [representatives]
  );

  // =====================================================
  // FUNÇÕES DE ATUALIZAÇÃO DO CACHE
  // =====================================================

  // Budgets
  const addBudgetToCacheHandler = useCallback((budget: IBudget) => {
    setBudgets((prev) => [...prev, budget]);
    addItemToCache("budgets", budget);
  }, []);

  const updateBudgetInCacheHandler = useCallback((budget: IBudget) => {
    setBudgets((prev) => prev.map((b) => (b.id === budget.id ? budget : b)));
    updateItemInCache("budgets", budget);
  }, []);

  const removeBudgetFromCacheHandler = useCallback((id: string | number) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
    removeItemFromCache("budgets", id);
  }, []);

  // Clients
  const addClientToCacheHandler = useCallback((client: IClient) => {
    setClients((prev) => [...prev, client]);
    addItemToCache("clients", client);
  }, []);

  const updateClientInCacheHandler = useCallback((client: IClient) => {
    setClients((prev) => prev.map((c) => (c.id === client.id ? client : c)));
    updateItemInCache("clients", client);
  }, []);

  const removeClientFromCacheHandler = useCallback((id: string | number) => {
    setClients((prev) => prev.filter((c) => c.id !== id));
    removeItemFromCache("clients", id);
  }, []);

  // Products
  const addProductToCacheHandler = useCallback((product: IProduct) => {
    setProducts((prev) => [...prev, product]);
    addItemToCache("products", product);
  }, []);

  const updateProductInCacheHandler = useCallback((product: IProduct) => {
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    updateItemInCache("products", product);
  }, []);

  const removeProductFromCacheHandler = useCallback((id: string | number) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    removeItemFromCache("products", id);
  }, []);

  // Representatives
  const addRepresentativeToCacheHandler = useCallback(
    (representative: IRepresentative) => {
      setRepresentatives((prev) => [...prev, representative]);
      addItemToCache("representatives", representative);
    },
    []
  );

  const updateRepresentativeInCacheHandler = useCallback(
    (representative: IRepresentative) => {
      setRepresentatives((prev) =>
        prev.map((r) => (r.id === representative.id ? representative : r))
      );
      updateItemInCache("representatives", representative);
    },
    []
  );

  const removeRepresentativeFromCacheHandler = useCallback(
    (id: string | number) => {
      setRepresentatives((prev) => prev.filter((r) => r.id !== id));
      removeItemFromCache("representatives", id);
    },
    []
  );

  // =====================================================
  // VALOR DO CONTEXTO
  // =====================================================

  const value: DataContextState = {
    // Dados
    budgets,
    clients,
    products,
    representatives,

    // Estado de carregamento
    loading,
    loadingEntities,

    // Funções de refresh
    refreshAll,
    refreshBudgets,
    refreshClients,
    refreshProducts,
    refreshRepresentatives,

    // Funções de busca local
    searchBudgetsLocal,
    searchClientsLocal,
    searchProductsLocal,
    searchRepresentativesLocal,

    // Funções de atualização do cache
    addBudgetToCache: addBudgetToCacheHandler,
    updateBudgetInCache: updateBudgetInCacheHandler,
    removeBudgetFromCache: removeBudgetFromCacheHandler,

    addClientToCache: addClientToCacheHandler,
    updateClientInCache: updateClientInCacheHandler,
    removeClientFromCache: removeClientFromCacheHandler,

    addProductToCache: addProductToCacheHandler,
    updateProductInCache: updateProductInCacheHandler,
    removeProductFromCache: removeProductFromCacheHandler,

    addRepresentativeToCache: addRepresentativeToCacheHandler,
    updateRepresentativeInCache: updateRepresentativeInCacheHandler,
    removeRepresentativeFromCache: removeRepresentativeFromCacheHandler,

    // Estatísticas
    getCacheStats,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

// =====================================================
// HOOK
// =====================================================

export const useData = (): DataContextState => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
};

export default DataContext;
