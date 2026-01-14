import { useState, useEffect, useMemo, useCallback } from "react";
import { IBudget, ISelectedProducts } from "../interfaces/ibudget";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";
import { IClient } from "../interfaces/iclient";
import useDebounce from "./useDebounce";
import Swal from "sweetalert2";
import { useData } from "../context/DataContext";

const DEFAULT_BUDGET: Partial<IBudget> = {
  tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
  guarantee:
    "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO ",
};

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

interface UseBudgetFormReturn {
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
  const representativeList = useMemo(() => {
    // Se não há busca, retorna todos os representantes
    if (!debouncedRepresentativeSearch) return cachedRepresentatives;

    return cachedRepresentatives.filter((rep) =>
      rep.name
        ?.toLowerCase()
        .includes(debouncedRepresentativeSearch.toLowerCase())
    );
  }, [debouncedRepresentativeSearch, cachedRepresentatives]);

  // Filtrar produtos localmente do cache - SEM chamadas ao Firestore!
  const productList = useMemo(() => {
    // Se não há busca, retorna todos os produtos
    if (!debouncedProductSearch) return cachedProducts;

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

  const removeProduct = useCallback((index: number) => {
    Swal.fire({
      title: "Tem certeza?",
      text: "Tem certeza que deseja remover este produto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, remover!",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
      }
    });
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

    // Seção Termos/Condições
    const requiredTermFields = [
      { field: "estimatedDate", label: "Prazo para Entrega" },
      { field: "maxDealDate", label: "Validade da Proposta" },
      { field: "guarantee", label: "Garantia" },
      { field: "shippingTerms", label: "Condição de Entrega" },
      { field: "reference", label: "Referência" },
    ];

    const filledTerms = requiredTermFields.filter(({ field }) =>
      Boolean(budget?.[field as keyof IBudget])
    );

    const missingFields = requiredTermFields
      .filter(({ field }) => !budget?.[field as keyof IBudget])
      .map(({ label }) => label);

    const termsSection = {
      isComplete: filledTerms.length === requiredTermFields.length,
      filledCount: filledTerms.length,
      totalRequired: requiredTermFields.length,
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
  };
};

export default useBudgetForm;
