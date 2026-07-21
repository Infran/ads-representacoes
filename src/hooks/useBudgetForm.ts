import { useState, useEffect, useMemo, useCallback } from "react";
import { IBudget, ISelectedProducts } from "../interfaces/ibudget";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";
import { IClient } from "../interfaces/iclient";
import useDebounce from "./useDebounce";
import { useData } from "../context/DataContext";
import {
  INITIAL_SELECT_OPTIONS_LIMIT,
  withSelected,
} from "../utils/selectOptions";

const DEFAULT_BUDGET: Partial<IBudget> = {
  tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
  guarantee:
    "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO ",
};

/**
 * Campos de termos/condições exigidos para o orçamento ser considerado completo.
 * Constante de configuração (F4.2): adicionar/remover um campo obrigatório é
 * editar esta lista — não a lógica de `sectionValidation`.
 */
export const REQUIRED_TERM_FIELDS: ReadonlyArray<{
  field: keyof IBudget;
  label: string;
}> = [
  { field: "estimatedDate", label: "Prazo para Entrega" },
  { field: "maxDealDate", label: "Validade da Proposta" },
  { field: "guarantee", label: "Garantia" },
  { field: "shippingTerms", label: "Condição de Entrega" },
  { field: "reference", label: "Referência" },
];

interface UseBudgetFormOptions {
  initialData?: IBudget | null;
}

/** Status de validação por seção do formulário */
export interface SectionValidation {
  representative: {
    isComplete: boolean;
    message?: string;
  };
  products: {
    isComplete: boolean;
    count: number;
    message?: string;
  };
  terms: {
    isComplete: boolean;
    filledCount: number;
    totalRequired: number;
    message?: string;
  };
}

export interface UseBudgetFormReturn {
  // Estado do orçamento
  budget: IBudget;
  setBudget: React.Dispatch<React.SetStateAction<IBudget>>;
  selectedProducts: ISelectedProducts[];

  // Busca de representantes
  representativeSearchInput: string;
  setRepresentativeSearchInput: (value: string) => void;
  representativeList: IRepresentative[];
  handleSelectRepresentative: (representative: IRepresentative | null) => void;

  // Busca de produtos
  productSearchTerm: string;
  setProductSearchTerm: (value: string) => void;
  productList: IProduct[];

  // Ações de produtos
  addProduct: (product: IProduct) => void;
  removeProduct: (index: number) => void;
  updateProductQuantity: (index: number, delta: number) => void;
  setProductQuantity: (index: number, quantity: number) => void;
  updateProductCustomValue: (index: number, value: string) => void;

  // Validação
  isValid: boolean;
  sectionValidation: SectionValidation;
  totalValue: number;

  // Reset do formulário (ex.: "Adicionar Outro" sem recarregar a página)
  reset: () => void;
}

export const useBudgetForm = (
  options: UseBudgetFormOptions = {}
): UseBudgetFormReturn => {
  const { initialData } = options;

  // Obtém dados do cache via DataContext
  const { products: cachedProducts, representatives: cachedRepresentatives } =
    useData();

  // Estado principal
  const [budget, setBudget] = useState<IBudget>(
    () =>
      ({
        ...DEFAULT_BUDGET,
        ...(initialData || {}),
      } as IBudget)
  );

  const [selectedProducts, setSelectedProducts] = useState<ISelectedProducts[]>(
    initialData?.selectedProducts || []
  );

  // Estado de busca de representantes
  const [representativeSearchInput, setRepresentativeSearchInput] =
    useState("");
  const debouncedRepresentativeSearch = useDebounce(
    representativeSearchInput,
    300
  );

  // Estado de busca de produtos
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const debouncedProductSearch = useDebounce(productSearchTerm, 300);

  // Efeito para atualizar quando initialData mudar (útil para edição)
  useEffect(() => {
    if (initialData) {
      setBudget(initialData);
      setSelectedProducts(initialData.selectedProducts || []);
    }
  }, [initialData]);

  // Filtrar representantes localmente do cache - SEM chamadas ao Firestore!
  // `withSelected` mantém o representante do orçamento nas opções mesmo quando
  // ele cai fora da janela truncada (ex.: edição de um orçamento antigo).
  const representativeList = useMemo(() => {
    // Se não há busca, retorna os primeiros representantes já carregados
    const lista = !debouncedRepresentativeSearch
      ? cachedRepresentatives.slice(0, INITIAL_SELECT_OPTIONS_LIMIT)
      : cachedRepresentatives.filter((rep) =>
          rep.name
            ?.toLowerCase()
            .includes(debouncedRepresentativeSearch.toLowerCase())
        );

    return withSelected(lista, budget.representative);
  }, [debouncedRepresentativeSearch, cachedRepresentatives, budget.representative]);

  // Filtrar produtos localmente do cache - SEM chamadas ao Firestore!
  const productList = useMemo(() => {
    // Se não há busca, retorna os primeiros produtos já carregados
    if (!debouncedProductSearch) {
      return cachedProducts.slice(0, INITIAL_SELECT_OPTIONS_LIMIT);
    }

    return cachedProducts.filter(
      (product) =>
        product.name
          ?.toLowerCase()
          .includes(debouncedProductSearch.toLowerCase()) ||
        product.ncm
          ?.toLowerCase()
          .includes(debouncedProductSearch.toLowerCase())
    );
  }, [debouncedProductSearch, cachedProducts]);

  // Calcular total - agora SEMPRE considera customUnitValue se existir
  const totalValue = useMemo(() => {
    return selectedProducts.reduce(
      (acc, { product, quantity, customUnitValue }) => {
        const unitPrice =
          customUnitValue !== undefined ? customUnitValue : product.unitValue;
        return acc + (unitPrice || 0) * quantity;
      },
      0
    );
  }, [selectedProducts]);

  // Sincronizar produtos selecionados com o budget
  useEffect(() => {
    setBudget((prev) => ({
      ...prev,
      totalValue,
      selectedProducts,
    }));
  }, [selectedProducts, totalValue]);

  // Handlers
  const handleSelectRepresentative = useCallback(
    (representative: IRepresentative | null) => {
      setBudget((prev) => ({
        ...prev,
        representative: representative || ({} as IRepresentative),
        client: representative?.client || ({} as IClient),
      }));
    },
    []
  );

  const addProduct = useCallback((product: IProduct) => {
    setSelectedProducts((prev) => [
      ...prev,
      { product, quantity: 1 } as ISelectedProducts,
    ]);
    setProductSearchTerm("");
  }, []);

  // F4.1: apenas remove — a confirmação (Swal/confirmDialog) fica na UI
  // (ProductsSection), deixando o hook testável sem `sweetalert2`.
  const removeProduct = useCallback((index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateProductQuantity = useCallback((index: number, delta: number) => {
    setSelectedProducts((prev) =>
      prev
        .map((p, i) =>
          i === index ? { ...p, quantity: p.quantity + delta } : p
        )
        .filter((p) => p.quantity > 0)
    );
  }, []);

  const setProductQuantity = useCallback((index: number, quantity: number) => {
    if (quantity < 1) return;
    setSelectedProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, quantity } : p))
    );
  }, []);

  // Edição de valor customizado - agora SEMPRE habilitado
  const updateProductCustomValue = useCallback(
    (index: number, newValue: string) => {
      const cleanValue = newValue.replace(/\D/g, "");
      const valueInCents = parseInt(cleanValue, 10);

      setSelectedProducts((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                customUnitValue: isNaN(valueInCents) ? undefined : valueInCents,
              }
            : p
        )
      );
    },
    []
  );

  // Validação por seção
  const sectionValidation = useMemo((): SectionValidation => {
    // Seção Representante
    const hasRepresentative = Boolean(budget?.representative?.name);
    const representativeSection = {
      isComplete: hasRepresentative,
      message: hasRepresentative ? undefined : "Selecione um representante",
    };

    // Seção Produtos
    const productCount = selectedProducts.length;
    const productsSection = {
      isComplete: productCount > 0,
      count: productCount,
      message: productCount > 0 ? undefined : "Adicione pelo menos um produto",
    };

    // Seção Termos/Condições (campos obrigatórios em REQUIRED_TERM_FIELDS — F4.2)
    const filledTerms = REQUIRED_TERM_FIELDS.filter(({ field }) =>
      Boolean(budget?.[field])
    );

    const missingFields = REQUIRED_TERM_FIELDS.filter(
      ({ field }) => !budget?.[field]
    ).map(({ label }) => label);

    const termsSection = {
      isComplete: filledTerms.length === REQUIRED_TERM_FIELDS.length,
      filledCount: filledTerms.length,
      totalRequired: REQUIRED_TERM_FIELDS.length,
      message:
        missingFields.length > 0
          ? `Campos obrigatórios: ${missingFields.join(", ")}`
          : undefined,
    };

    return {
      representative: representativeSection,
      products: productsSection,
      terms: termsSection,
    };
  }, [budget, selectedProducts]);

  // Reset do formulário para o estado inicial (sem recarregar a página)
  const reset = useCallback(() => {
    setBudget({ ...DEFAULT_BUDGET } as IBudget);
    setSelectedProducts([]);
    setRepresentativeSearchInput("");
    setProductSearchTerm("");
  }, []);

  // Validação geral (todas as seções completas)
  const isValid = useMemo(() => {
    return (
      sectionValidation.representative.isComplete &&
      sectionValidation.products.isComplete &&
      sectionValidation.terms.isComplete
    );
  }, [sectionValidation]);

  return {
    budget,
    setBudget,
    selectedProducts,
    representativeSearchInput,
    setRepresentativeSearchInput,
    representativeList,
    handleSelectRepresentative,
    productSearchTerm,
    setProductSearchTerm,
    productList,
    addProduct,
    removeProduct,
    updateProductQuantity,
    setProductQuantity,
    updateProductCustomValue,
    isValid,
    sectionValidation,
    totalValue,
    reset,
  };
};

export default useBudgetForm;
