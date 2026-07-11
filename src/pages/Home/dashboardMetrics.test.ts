import { describe, it, expect } from "vitest";
import { IBudget } from "../../interfaces/ibudget";
import {
  computeTotalValue,
  computeMonthlyTrend,
  computeTopProducts,
} from "./dashboardMetrics";

// UI U3.1 — trava a lógica de agregação da dashboard (hero KPI + charts).
// totalValue é em CENTAVOS; createdAt usa { seconds } (Timestamp).

// Helper: cria um orçamento mínimo com data por (ano, mês 0-based).
const budgetOn = (
  year: number,
  month: number,
  totalValue: number,
  products: { id: string; name?: string; quantity: number }[] = []
) =>
  ({
    id: `${year}-${month}-${totalValue}`,
    totalValue,
    createdAt: { seconds: new Date(year, month, 15).getTime() / 1000 },
    selectedProducts: products.map((p) => ({
      product: { id: p.id, name: p.name },
      quantity: p.quantity,
    })),
  }) as unknown as IBudget;

describe("computeTotalValue", () => {
  it("soma totalValue (centavos) de todos os orçamentos", () => {
    const budgets = [
      budgetOn(2026, 6, 50000),
      budgetOn(2026, 6, 150000),
      budgetOn(2026, 5, 250000),
    ];
    expect(computeTotalValue(budgets)).toBe(450000);
  });

  it("retorna 0 sem orçamentos e ignora totalValue ausente", () => {
    expect(computeTotalValue([])).toBe(0);
    expect(computeTotalValue([{} as IBudget])).toBe(0);
  });
});

describe("computeMonthlyTrend", () => {
  const now = new Date(2026, 6, 20); // julho/2026 (mês 6, 0-based)

  it("produz uma janela contínua de N meses terminando no mês atual", () => {
    const trend = computeMonthlyTrend([], 12, now);
    expect(trend).toHaveLength(12);
    expect(trend[11].key).toBe("2026-07");
    expect(trend[11].label).toBe("jul/26");
    expect(trend[0].key).toBe("2025-08"); // 11 meses antes de jul/26
    expect(trend[0].label).toBe("ago/25");
    // meses sem orçamento vêm zerados (sem buracos)
    expect(trend.every((p) => p.count === 0 && p.value === 0)).toBe(true);
  });

  it("agrega count e value (centavos) no mês correto", () => {
    const budgets = [
      budgetOn(2026, 6, 50000), // jul/26
      budgetOn(2026, 6, 150000), // jul/26
      budgetOn(2026, 5, 250000), // jun/26
    ];
    const trend = computeMonthlyTrend(budgets, 12, now);
    const jul = trend.find((p) => p.key === "2026-07")!;
    const jun = trend.find((p) => p.key === "2026-06")!;
    expect(jul.count).toBe(2);
    expect(jul.value).toBe(200000);
    expect(jun.count).toBe(1);
    expect(jun.value).toBe(250000);
  });

  it("ignora orçamentos fora da janela e sem data", () => {
    const budgets = [
      budgetOn(2020, 0, 999999), // muito antigo → fora da janela
      { totalValue: 111, selectedProducts: [] } as unknown as IBudget, // sem createdAt
    ];
    const trend = computeMonthlyTrend(budgets, 12, now);
    expect(trend.reduce((a, p) => a + p.count, 0)).toBe(0);
    expect(trend.reduce((a, p) => a + p.value, 0)).toBe(0);
  });
});

describe("computeTopProducts", () => {
  it("soma quantidade por produto e ordena desc, respeitando o limite", () => {
    const budgets = [
      budgetOn(2026, 6, 0, [
        { id: "p1", name: "Parafuso", quantity: 3 },
        { id: "p2", name: "Porca", quantity: 1 },
      ]),
      budgetOn(2026, 6, 0, [
        { id: "p1", name: "Parafuso", quantity: 2 },
        { id: "p3", name: "Arruela", quantity: 10 },
      ]),
    ];
    const top = computeTopProducts(budgets, 2);
    expect(top).toHaveLength(2);
    expect(top[0]).toEqual({ name: "Arruela", count: 10 });
    expect(top[1]).toEqual({ name: "Parafuso", count: 5 });
  });

  it("usa 'Sem nome' quando o produto não tem nome e ignora itens sem id", () => {
    const budgets = [
      budgetOn(2026, 6, 0, [{ id: "p1", quantity: 4 }]),
    ];
    const top = computeTopProducts(budgets);
    expect(top).toEqual([{ name: "Sem nome", count: 4 }]);
  });
});
