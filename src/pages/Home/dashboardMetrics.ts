import { IBudget } from "../../interfaces/ibudget";

// Métricas puras da dashboard (UI U3.1) — extraídas do `Home.tsx` para ficarem
// testáveis (EST F1). Todas operam sobre os orçamentos já carregados no cache
// (`useData().budgets`), sem tocar o Firestore. Valores em CENTAVOS (como
// `IBudget.totalValue`); a formatação em R$ fica com `brMoneyMask` na UI.

// Abreviações pt-BR fixas — não dependem de locale do ambiente (evita
// divergência de `toLocaleDateString` entre máquinas/CI nos testes).
const MONTH_ABBR_PT = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

export interface MonthlyPoint {
  /** Chave estável do mês, ex.: "2026-07". */
  key: string;
  /** Rótulo curto para o eixo, ex.: "jul/26". */
  label: string;
  /** Nº de orçamentos criados no mês. */
  count: number;
  /** Soma de `totalValue` (centavos) dos orçamentos do mês. */
  value: number;
}

export interface TopProduct {
  name: string;
  /** Quantidade total orçada do produto (soma de `quantity`). */
  count: number;
}

/** Soma de `totalValue` (centavos) de todos os orçamentos — KPI hero "Valor Total". */
export function computeTotalValue(budgets: IBudget[]): number {
  return budgets.reduce((acc, b) => acc + (b.totalValue || 0), 0);
}

/**
 * Série dos últimos `months` meses (default 12), do mais antigo ao mês atual.
 * `now` é injetável para testes determinísticos. Meses sem orçamento vêm
 * zerados (janela contínua, sem buracos).
 */
export function computeMonthlyTrend(
  budgets: IBudget[],
  months = 12,
  now: Date = new Date()
): MonthlyPoint[] {
  const buckets: MonthlyPoint[] = [];
  const index = new Map<string, MonthlyPoint>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point: MonthlyPoint = {
      key,
      label: `${MONTH_ABBR_PT[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
      count: 0,
      value: 0,
    };
    buckets.push(point);
    index.set(key, point);
  }

  for (const b of budgets) {
    const secs = b.createdAt?.seconds;
    if (!secs) continue;
    const d = new Date(secs * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const point = index.get(key);
    if (!point) continue; // fora da janela de `months` meses
    point.count += 1;
    point.value += b.totalValue || 0;
  }

  return buckets;
}

/**
 * Produtos mais orçados por quantidade somada (top `limit`, default 5).
 * Mantém a semântica do cálculo original do `Home.tsx` (soma `item.quantity`).
 */
export function computeTopProducts(budgets: IBudget[], limit = 5): TopProduct[] {
  const map = new Map<string, TopProduct>();

  for (const budget of budgets) {
    for (const item of budget.selectedProducts || []) {
      const id = item.product?.id;
      if (!id) continue;
      const name = item.product?.name || "Sem nome";
      const entry = map.get(id) || { name, count: 0 };
      entry.count += item.quantity;
      map.set(id, entry);
    }
  }

  return Array.from(map.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
