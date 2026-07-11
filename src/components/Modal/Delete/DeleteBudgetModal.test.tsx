import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { IBudget } from "../../../interfaces/ibudget";

// Regressão do bug A-01 / EST F0.1 (EST F1.2).
// Contrato: onClose SÓ fecha (cancelar/backdrop); onDeleted SÓ dispara após
// a exclusão real. Antes do fix, cancelar removia o item da lista porque
// onClose estava ligado ao removeFromCache.

const deleteBudget = vi.fn().mockResolvedValue(undefined);
vi.mock("../../../services/budgetServices", () => ({
  deleteBudget: (id: string) => deleteBudget(id),
}));

import DeleteBudgetModal from "./DeleteBudgetModal";

const budget = {
  id: "42",
  client: { id: "c1", name: "Cliente Teste" },
  selectedProducts: [
    { product: { id: "p1", name: "Bomba", unitValue: 1000 }, quantity: 2 },
  ],
} as IBudget;

beforeEach(() => {
  deleteBudget.mockClear();
});

describe("DeleteBudgetModal — contrato onClose vs onDeleted", () => {
  it("cancelar chama onClose e NÃO exclui nem chama onDeleted", () => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();
    render(
      <DeleteBudgetModal
        open
        onClose={onClose}
        onDeleted={onDeleted}
        budget={budget}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(deleteBudget).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it("excluir chama deleteBudget(id) e depois onDeleted, sem chamar onClose", async () => {
    const onClose = vi.fn();
    const onDeleted = vi.fn();
    render(
      <DeleteBudgetModal
        open
        onClose={onClose}
        onDeleted={onDeleted}
        budget={budget}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledTimes(1));
    expect(deleteBudget).toHaveBeenCalledWith("42");
    expect(onClose).not.toHaveBeenCalled();
  });

  it("renderiza o resumo do orçamento (cliente e produto)", () => {
    render(
      <DeleteBudgetModal
        open
        onClose={vi.fn()}
        onDeleted={vi.fn()}
        budget={budget}
      />
    );
    expect(screen.getByText(/Cliente Teste/)).toBeInTheDocument();
    expect(screen.getByText("Bomba")).toBeInTheDocument();
  });
});
