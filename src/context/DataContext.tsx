/**
 * DataContext - Gerenciamento centralizado de dados com cache
 *
 * Este contexto carrega os dados uma única vez e os mantém em cache,
 * reduzindo drasticamente as chamadas ao Firestore.
 *
 * EST F2.2: o provider agora compõe 4 `useEntityStore` (um por coleção) em vez
 * de repetir estado + refresh + searchLocal + handlers de cache 4×.
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from "react";
import { IBudget } from "../interfaces/ibudget";
import { IClient } from "../interfaces/iclient";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";
import { getCacheStats, CacheKey } from "../services/cacheService";
import { useEntityStore } from "./useEntityStore";

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

// Campos filtráveis por `searchLocal` de cada coleção (aceita caminhos com ponto).
const BUDGET_SEARCH_FIELDS = ["client.name", "representative.name", "id"];
const CLIENT_SEARCH_FIELDS = ["name", "email", "phone", "cnpj"];
const PRODUCT_SEARCH_FIELDS = ["name", "description", "ncm"];
const REPRESENTATIVE_SEARCH_FIELDS = ["name", "email", "client.name"];

// =====================================================
// PROVIDER
// =====================================================

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Um store por coleção (estado + refresh + searchLocal + handlers de cache).
  const budgetStore = useEntityStore<IBudget>(
    "budgets",
    fetchBudgetsFromFirestore,
    BUDGET_SEARCH_FIELDS
  );
  const clientStore = useEntityStore<IClient>(
    "clients",
    fetchClientsFromFirestore,
    CLIENT_SEARCH_FIELDS
  );
  const productStore = useEntityStore<IProduct>(
    "products",
    fetchProductsFromFirestore,
    PRODUCT_SEARCH_FIELDS
  );
  const representativeStore = useEntityStore<IRepresentative>(
    "representatives",
    fetchRepresentativesFromFirestore,
    REPRESENTATIVE_SEARCH_FIELDS
  );

  // Loading global (carregamento inicial / refreshAll).
  const [loading, setLoading] = useState(true);

  const { load: loadBudgets, refresh: refreshBudgets } = budgetStore;
  const { load: loadClients, refresh: refreshClients } = clientStore;
  const { load: loadProducts, refresh: refreshProducts } = productStore;
  const { load: loadRepresentatives, refresh: refreshRepresentatives } =
    representativeStore;

  // =====================================================
  // CARREGAMENTO INICIAL
  // =====================================================

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      await Promise.all([
        loadBudgets(),
        loadClients(),
        loadProducts(),
        loadRepresentatives(),
      ]);
      setLoading(false);
    };

    loadInitialData();
  }, [loadBudgets, loadClients, loadProducts, loadRepresentatives]);

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

  const loadingEntities = useMemo<Record<CacheKey, boolean>>(
    () => ({
      budgets: budgetStore.loading,
      clients: clientStore.loading,
      products: productStore.loading,
      representatives: representativeStore.loading,
    }),
    [
      budgetStore.loading,
      clientStore.loading,
      productStore.loading,
      representativeStore.loading,
    ]
  );

  // =====================================================
  // VALOR DO CONTEXTO
  // =====================================================

  const value: DataContextState = useMemo(
    () => ({
      // Dados
      budgets: budgetStore.items,
      clients: clientStore.items,
      products: productStore.items,
      representatives: representativeStore.items,

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
      searchBudgetsLocal: budgetStore.searchLocal,
      searchClientsLocal: clientStore.searchLocal,
      searchProductsLocal: productStore.searchLocal,
      searchRepresentativesLocal: representativeStore.searchLocal,

      // Funções de atualização do cache
      addBudgetToCache: budgetStore.addToCache,
      updateBudgetInCache: budgetStore.updateInCache,
      removeBudgetFromCache: budgetStore.removeFromCache,

      addClientToCache: clientStore.addToCache,
      updateClientInCache: clientStore.updateInCache,
      removeClientFromCache: clientStore.removeFromCache,

      addProductToCache: productStore.addToCache,
      updateProductInCache: productStore.updateInCache,
      removeProductFromCache: productStore.removeFromCache,

      addRepresentativeToCache: representativeStore.addToCache,
      updateRepresentativeInCache: representativeStore.updateInCache,
      removeRepresentativeFromCache: representativeStore.removeFromCache,

      // Estatísticas
      getCacheStats,
    }),
    // Deps granulares (não os objetos `*Store`, que trocam de identidade a cada
    // render): preserva a memoização de F0.5 — `value` só muda quando `items`,
    // `loading` ou `loadingEntities` mudam. As funções de cache/refresh e os
    // `searchLocal` já são estáveis por `useCallback`.
    [
      budgetStore.items,
      clientStore.items,
      productStore.items,
      representativeStore.items,
      loading,
      loadingEntities,
      refreshAll,
      refreshBudgets,
      refreshClients,
      refreshProducts,
      refreshRepresentatives,
      budgetStore.searchLocal,
      clientStore.searchLocal,
      productStore.searchLocal,
      representativeStore.searchLocal,
      budgetStore.addToCache,
      budgetStore.updateInCache,
      budgetStore.removeFromCache,
      clientStore.addToCache,
      clientStore.updateInCache,
      clientStore.removeFromCache,
      productStore.addToCache,
      productStore.updateInCache,
      productStore.removeFromCache,
      representativeStore.addToCache,
      representativeStore.updateInCache,
      representativeStore.removeFromCache,
    ]
  );

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
