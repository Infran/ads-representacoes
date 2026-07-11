import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { IBudget } from "../interfaces/ibudget";
import { createCrudService } from "./createCrudService";

/**
 * Valida os dados do orçamento antes de salvar (add e update).
 * @throws Error se os dados forem inválidos
 */
const validateBudget = (budget: Partial<IBudget>): void => {
  if (!budget.representative || !budget.representative.name) {
    throw new Error("Representante é obrigatório");
  }
  if (!budget.selectedProducts || budget.selectedProducts.length === 0) {
    throw new Error("Pelo menos um produto deve ser selecionado");
  }
  if (!budget.estimatedDate) {
    throw new Error("Prazo de entrega é obrigatório");
  }
};

// Factory (EST F2.1): CRUD genérico + criação atômica (SEG S2.1).
// `idPattern: /^\d+$/` preserva a sanitização de ID de URL (SEG S1.2) —
// IDs de orçamento são numéricos (getNextBudgetId().toString()).
const budgetCrud = createCrudService<IBudget>({
  collectionName: "budgets",
  metaIdDoc: "lastBudgetId",
  validate: validateBudget,
  idPattern: /^\d+$/,
});

// ============================================================================
// API PÚBLICA (preservada — consumida por DataContext, BudgetFormPage, etc.)
// ============================================================================

/**
 * Busca todos os orçamentos do Firestore.
 * NOTA: Prefira usar useData().budgets do DataContext para evitar chamadas desnecessárias.
 */
export const getBudgets = budgetCrud.getAll;

/**
 * Busca um orçamento pelo ID (rejeita IDs não numéricos — SEG S1.2).
 * @returns Orçamento encontrado ou null se não existir ou for inválido
 */
export const getBudgetById = budgetCrud.getById;

/** Gera o próximo ID de orçamento de forma atômica. */
export const getNextBudgetId = budgetCrud.getNextId;

/**
 * Adiciona um novo orçamento (criação atômica: contador + doc na mesma transação).
 * @throws Error se a validação falhar
 */
export const addBudget = budgetCrud.add;

/**
 * Atualiza um orçamento existente. O fluxo de edição (BudgetFormPage) envia o
 * orçamento completo, então `validateBudget` aplica as mesmas regras de addBudget (SEG S1.1).
 */
export const updateBudget = budgetCrud.update;

/** Exclui um orçamento pelo ID. */
export const deleteBudget = budgetCrud.remove;

/**
 * Busca os N orçamentos mais recentes (ordenados por `createdAt` desc).
 * Query dedicada e indexada (orderBy + limit) — lê O(n) docs em vez da coleção
 * inteira. Mantida fora do factory por ser específica de orçamentos (PERF P0.3).
 *
 * NOTA DE ARQUITETURA (PERF P0.3): a dashboard (`Home`) hoje já carrega TODOS os
 * orçamentos via `useData()` para calcular os KPIs. Enquanto isso for verdade, o
 * widget `RecentBudgets` fatia os 5 do array já cacheado a custo zero de leitura;
 * trocá-lo por esta query *adicionaria* 5 reads sem reduzir o total. O ganho real
 * só aparece quando a dashboard deixar de carregar a coleção inteira (U3.1 + P2.1).
 */
export const getRecentBudgets = async (n = 5): Promise<IBudget[]> => {
  const budgetsCollection = collection(db, "budgets");
  const recentQuery = query(
    budgetsCollection,
    orderBy("createdAt", "desc"),
    limit(n)
  );
  const snapshot = await getDocs(recentQuery);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as IBudget[];
};

/**
 * Página de orçamentos por cursor (PERF P1.2) — `orderBy createdAt desc` +
 * `limit` + `startAfter`, indexado por campo único (sem índice composto).
 *
 * NOTA DE ARQUITETURA / DEFERRAL (igual ao bloqueio de P0.3): o boot do app hoje
 * carrega TODOS os orçamentos via `DataContext` porque a `Home` calcula KPIs
 * sobre a coleção inteira, e a `GlobalSearch` + os filtros de `Budgets.tsx`
 * varrem o array completo. Trocar o boot para paginar aqui reduziria os reads a
 * O(página), MAS quebraria os KPIs (contariam só a 1ª página), a busca global e
 * os filtros locais (só veriam as páginas carregadas). Esse acoplamento é o
 * mesmo que adia P0.3: o ganho real de "ler O(página)" só é seguro quando o hero
 * KPI (U3.1) e a coleção-resumo (P2.1) tirarem a dependência da coleção inteira.
 * Por isso a **capacidade** de paginação fica pronta e preservável agora, e o
 * **rewire** do `DataContext`/`Budgets` fica acoplado a U3.1/P2.1.
 */
export const getBudgetsPage = (
  pageSize: number,
  cursor?: QueryDocumentSnapshot
) => budgetCrud.getPage(pageSize, cursor);
