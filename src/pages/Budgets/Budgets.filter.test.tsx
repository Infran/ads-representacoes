import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { IBudget } from "../../interfaces/ibudget";

// Regressão do bug A-04 / EST F0.2 (EST F1.2): o filtro de valor recebe
// reais nos inputs, mas totalValue é armazenado em CENTAVOS. O fix converte
// min/máx (× 100) antes de comparar. Este teste trava esse comportamento
// antes de EST F3.2 extrair useBudgetFilters().

const budgets = [
  { id: "1", totalValue: 50000, client: { name: "Cliente A" }, representative: { name: "Rep A" } }, // R$ 500
  { id: "2", totalValue: 150000, client: { name: "Cliente B" }, representative: { name: "Rep B" } }, // R$ 1.500
  { id: "3", totalValue: 250000, client: { name: "Cliente C" }, representative: { name: "Rep C" } }, // R$ 2.500
] as unknown as IBudget[];

vi.mock("../../context/DataContext", () => ({
  useData: () => ({ budgets, removeBudgetFromCache: vi.fn() }),
}));

// Evita puxar @react-pdf/renderer (pesado) e o firebase via budgetServices.
vi.mock("../../utils/PDFGenerator/BudgetPdf", () => ({ openBudgetPdf: vi.fn() }));
vi.mock("../../components/Modal/Delete/DeleteBudgetModal", () => ({
  default: () => null,
}));

import Budgets from "./Budgets";

const renderBudgets = () =>
  render(
    <MemoryRouter>
      <Budgets />
    </MemoryRouter>
  );

describe("Budgets — filtro de valor em centavos", () => {
  it("lista todos os orçamentos sem filtro", () => {
    renderBudgets();
    expect(screen.getByText("#1")).toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });

  it("faixa 1000–2000 (reais) retorna só o orçamento de R$ 1.500 (150000 centavos)", () => {
    renderBudgets();

    fireEvent.change(screen.getByLabelText("Valor mín"), {
      target: { value: "1000" },
    });
    fireEvent.change(screen.getByLabelText("Valor máx"), {
      target: { value: "2000" },
    });

    expect(screen.queryByText("#1")).not.toBeInTheDocument(); // R$ 500 fora
    expect(screen.getByText("#2")).toBeInTheDocument(); // R$ 1.500 dentro
    expect(screen.queryByText("#3")).not.toBeInTheDocument(); // R$ 2.500 fora
  });

  it("só o mínimo (reais) filtra corretamente convertendo para centavos", () => {
    renderBudgets();

    fireEvent.change(screen.getByLabelText("Valor mín"), {
      target: { value: "1000" },
    });

    // >= R$ 1.000 → mantém 1.500 e 2.500, descarta 500
    expect(screen.queryByText("#1")).not.toBeInTheDocument();
    expect(screen.getByText("#2")).toBeInTheDocument();
    expect(screen.getByText("#3")).toBeInTheDocument();
  });
});
