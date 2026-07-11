import { useMemo, useState } from "react";
import { IBudget } from "../../interfaces/ibudget";
import useDebounce from "../../hooks/useDebounce";

export type SortOption =
  | "id-desc"
  | "id-asc"
  | "value-desc"
  | "value-asc"
  | "date-desc"
  | "date-asc";

/**
 * Mapa de comparadores de ordenação (resolve S-02: sem `switch`).
 * Adicionar um novo critério é só adicionar uma entrada aqui.
 */
export const budgetComparators: Record<
  SortOption,
  (a: IBudget, b: IBudget) => number
> = {
  "id-desc": (a, b) => Number(b.id) - Number(a.id),
  "id-asc": (a, b) => Number(a.id) - Number(b.id),
  "value-desc": (a, b) => (b.totalValue || 0) - (a.totalValue || 0),
  "value-asc": (a, b) => (a.totalValue || 0) - (b.totalValue || 0),
  "date-desc": (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
  "date-asc": (a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0),
};

/**
 * Estado + lógica de filtragem/ordenação da lista de orçamentos (EST F3.2).
 * Extraído de `Budgets.tsx` para deixar a página como orquestração.
 * Preserva a correção A-04/F0.2 (filtro de valor converte reais→centavos).
 */
export const useBudgetFilters = (budgetList: IBudget[]) => {
  const [search, setSearch] = useState<string>("");
  const [representativeFilter, setRepresentativeFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("id-desc");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");

  const debouncedSearch = useDebounce(search, 300);

  // Representantes e clientes únicos para os dropdowns de filtro
  const representatives = useMemo(() => {
    const names = new Set(
      budgetList.map((b) => b.representative?.name).filter(Boolean)
    );
    return Array.from(names).sort();
  }, [budgetList]);

  const clients = useMemo(() => {
    const names = new Set(
      budgetList.map((b) => b.client?.name).filter(Boolean)
    );
    return Array.from(names).sort();
  }, [budgetList]);

  const filteredBudgets = useMemo(() => {
    let result = [...budgetList];

    // Busca textual
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((budget) => {
        const clientMatch = budget.client?.name
          ?.toLowerCase()
          .includes(searchLower);
        const repMatch = budget.representative?.name
          ?.toLowerCase()
          .includes(searchLower);
        const productMatch = budget.selectedProducts
          ?.map((item) => item.product?.name)
          .join(", ")
          .toLowerCase()
          .includes(searchLower);
        const idMatch = budget.id?.toString().includes(searchLower);
        return clientMatch || repMatch || productMatch || idMatch;
      });
    }

    // Filtro por representante
    if (representativeFilter) {
      result = result.filter(
        (b) => b.representative?.name === representativeFilter
      );
    }

    // Filtro por cliente
    if (clientFilter) {
      result = result.filter((b) => b.client?.name === clientFilter);
    }

    // Faixa de valor — inputs são em reais; totalValue é em centavos
    const min = (parseFloat(minValue) || 0) * 100;
    const max = (parseFloat(maxValue) || Infinity) * 100;
    if (minValue || maxValue) {
      result = result.filter((b) => {
        const value = b.totalValue || 0;
        return value >= min && value <= max;
      });
    }

    // Ordenação por mapa de comparadores (S-02)
    result.sort(budgetComparators[sortBy]);

    return result;
  }, [
    budgetList,
    debouncedSearch,
    representativeFilter,
    clientFilter,
    sortBy,
    minValue,
    maxValue,
  ]);

  const clearFilters = () => {
    setSearch("");
    setRepresentativeFilter("");
    setClientFilter("");
    setSortBy("id-desc");
    setMinValue("");
    setMaxValue("");
  };

  const hasActiveFilters = Boolean(
    search || representativeFilter || clientFilter || minValue || maxValue
  );

  return {
    search,
    setSearch,
    representativeFilter,
    setRepresentativeFilter,
    clientFilter,
    setClientFilter,
    sortBy,
    setSortBy,
    minValue,
    setMinValue,
    maxValue,
    setMaxValue,
    representatives,
    clients,
    filteredBudgets,
    clearFilters,
    hasActiveFilters,
  };
};

export type UseBudgetFiltersReturn = ReturnType<typeof useBudgetFilters>;

export default useBudgetFilters;
