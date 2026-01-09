import { useState, useEffect, useMemo, useCallback } from "react";
import { IBudget, ISelectedProducts } from "../interfaces/ibudget";
import { IProduct } from "../interfaces/iproduct";
import { IRepresentative } from "../interfaces/irepresentative";
import { IClient } from "../interfaces/iclient";
import useDebounce from "./useDebounce";
import Swal from "sweetalert2";

const DEFAULT_BUDGET: Partial<IBudget> = {
  tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
  guarantee:
    "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO ",
};

interface UseBudgetFormOptions {
  initialData?: IBudget | null;
  /** Se true, permite editar o valor unitário dos produtos (apenas no modo edição) */
  allowCustomProductValue?: boolean;
  /** Lista de produtos do cache para busca local */
  cachedProducts?: IProduct[];
  /** Lista de representantes do cache para busca local */
  cachedRepresentatives?: IRepresentative[];
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
  updateProductCustomValue: (index: number, value: string) => void;

  // Validação
  isValid: boolean;
  totalValue: number;
}

export const useBudgetForm = (
  options: UseBudgetFormOptions = {}
): UseBudgetFormReturn => {
  const {
    initialData,
    allowCustomProductValue = false,
    cachedProducts = [],
    cachedRepresentatives = [],
  } = options;

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
    if (!debouncedRepresentativeSearch) return [];

    return cachedRepresentatives.filter((rep) =>
      rep.name
        ?.toLowerCase()
        .includes(debouncedRepresentativeSearch.toLowerCase())
    );
  }, [debouncedRepresentativeSearch, cachedRepresentatives]);

  // Filtrar produtos localmente do cache - SEM chamadas ao Firestore!
  const productList = useMemo(() => {
    if (!debouncedProductSearch) return [];

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

  // Calcular total
  const totalValue = useMemo(() => {
    return selectedProducts.reduce(
      (acc, { product, quantity, customUnitValue }) => {
        const unitPrice =
          allowCustomProductValue && customUnitValue !== undefined
            ? customUnitValue
            : product.unitValue;
        return acc + (unitPrice || 0) * quantity;
      },
      0
    );
  }, [selectedProducts, allowCustomProductValue]);

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

  const updateProductCustomValue = useCallback(
    (index: number, newValue: string) => {
      if (!allowCustomProductValue) return;

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
    [allowCustomProductValue]
  );

  // Validação
  const isValid = useMemo(() => {
    return Boolean(
      budget?.representative?.name &&
        selectedProducts.length > 0 &&
        budget?.estimatedDate &&
        budget?.maxDealDate &&
        budget?.guarantee &&
        budget?.shippingTerms &&
        budget?.reference
    );
  }, [budget, selectedProducts]);

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
    updateProductCustomValue,
    isValid,
    totalValue,
  };
};

export default useBudgetForm;
