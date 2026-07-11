import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";
import { IBudget } from "../interfaces/ibudget";

// Characterization tests do useBudgetForm (EST F1.2).
// Trava o comportamento atual antes de EST F3.1 (fatiar BudgetFormPage):
// cálculo do total (com override customUnitValue), validação por seção e
// filtro local de produtos/representantes vindo do cache.

// --- Fixtures controláveis, injetadas via mock do DataContext ---
const mockProducts: IProduct[] = [
  { id: "p1", name: "Bomba", ncm: "8413", unitValue: 1000 },
  { id: "p2", name: "Motor", ncm: "8501", unitValue: 2500 },
];
const mockRepresentatives: IRepresentative[] = [
  {
    id: "r1",
    name: "João",
    client: { id: "c1", name: "Cliente A" },
  } as IRepresentative,
  {
    id: "r2",
    name: "Maria",
    client: { id: "c2", name: "Cliente B" },
  } as IRepresentative,
];

vi.mock("../context/DataContext", () => ({
  useData: () => ({
    products: mockProducts,
    representatives: mockRepresentatives,
  }),
}));

// Evita abrir o SweetAlert de confirmação em removeProduct durante o teste.
vi.mock("sweetalert2", () => ({
  default: { fire: vi.fn().mockResolvedValue({ isConfirmed: true }) },
}));

import { useBudgetForm } from "./useBudgetForm";

describe("useBudgetForm — totalValue", () => {
  it("soma preço unitário base × quantidade quando não há customUnitValue", () => {
    const initialData = {
      selectedProducts: [
        { product: mockProducts[0], quantity: 2 }, // 1000 x 2 = 2000
        { product: mockProducts[1], quantity: 1 }, // 2500 x 1 = 2500
      ],
    } as IBudget;

    const { result } = renderHook(() => useBudgetForm({ initialData }));
    expect(result.current.totalValue).toBe(4500);
  });

  it("usa customUnitValue quando presente, ignorando o preço base do produto", () => {
    const initialData = {
      selectedProducts: [
        { product: mockProducts[0], quantity: 3, customUnitValue: 500 }, // 500 x 3 = 1500
      ],
    } as IBudget;

    const { result } = renderHook(() => useBudgetForm({ initialData }));
    expect(result.current.totalValue).toBe(1500);
  });

  it("recalcula o total ao adicionar um produto (quantidade 1)", () => {
    const { result } = renderHook(() => useBudgetForm());
    expect(result.current.totalValue).toBe(0);

    act(() => result.current.addProduct(mockProducts[1])); // 2500 x 1
    expect(result.current.totalValue).toBe(2500);
  });
});

describe("useBudgetForm — sectionValidation", () => {
  it("marca todas as seções incompletas num formulário vazio", () => {
    const { result } = renderHook(() => useBudgetForm());
    const v = result.current.sectionValidation;

    expect(v.representative.isComplete).toBe(false);
    expect(v.products.isComplete).toBe(false);
    expect(v.products.count).toBe(0);
    expect(v.terms.isComplete).toBe(false);
    expect(result.current.isValid).toBe(false);
  });

  it("marca todas as seções completas quando representante, produtos e termos estão preenchidos", () => {
    const initialData = {
      representative: mockRepresentatives[0],
      client: mockRepresentatives[0].client,
      selectedProducts: [{ product: mockProducts[0], quantity: 1 }],
      estimatedDate: "30 dias",
      maxDealDate: "15 dias",
      guarantee: "12 meses",
      shippingTerms: "CIF",
      reference: "REF-001",
    } as IBudget;

    const { result } = renderHook(() => useBudgetForm({ initialData }));
    const v = result.current.sectionValidation;

    expect(v.representative.isComplete).toBe(true);
    expect(v.products.isComplete).toBe(true);
    expect(v.products.count).toBe(1);
    expect(v.terms.isComplete).toBe(true);
    expect(v.terms.filledCount).toBe(v.terms.totalRequired);
    expect(result.current.isValid).toBe(true);
  });

  it("lista os campos de termos faltantes na mensagem", () => {
    const initialData = {
      representative: mockRepresentatives[0],
      selectedProducts: [{ product: mockProducts[0], quantity: 1 }],
      guarantee: "12 meses", // só um dos 5 preenchido
    } as IBudget;

    const { result } = renderHook(() => useBudgetForm({ initialData }));
    const terms = result.current.sectionValidation.terms;

    expect(terms.isComplete).toBe(false);
    expect(terms.filledCount).toBe(1);
    expect(terms.message).toContain("Prazo para Entrega");
    expect(terms.message).toContain("Referência");
  });
});

describe("useBudgetForm — reset (usado por 'Adicionar Outro')", () => {
  it("limpa produtos e volta o total a zero sem recarregar a página", () => {
    const initialData = {
      representative: mockRepresentatives[0],
      selectedProducts: [{ product: mockProducts[0], quantity: 2 }],
    } as IBudget;

    const { result } = renderHook(() => useBudgetForm({ initialData }));
    expect(result.current.totalValue).toBe(2000);

    act(() => result.current.reset());
    expect(result.current.selectedProducts).toHaveLength(0);
    expect(result.current.totalValue).toBe(0);
  });
});

describe("useBudgetForm — filtro local de cache (debounce 300ms)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("sem busca, retorna todo o cache de produtos e representantes", () => {
    const { result } = renderHook(() => useBudgetForm());
    expect(result.current.productList).toHaveLength(2);
    expect(result.current.representativeList).toHaveLength(2);
  });

  it("filtra produtos por nome/ncm após o debounce", () => {
    const { result } = renderHook(() => useBudgetForm());

    act(() => result.current.setProductSearchTerm("motor"));
    // antes do debounce, ainda mostra tudo
    expect(result.current.productList).toHaveLength(2);

    act(() => vi.advanceTimersByTime(300));
    expect(result.current.productList).toHaveLength(1);
    expect(result.current.productList[0].name).toBe("Motor");
  });
});
