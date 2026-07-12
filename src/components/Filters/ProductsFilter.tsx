import React from "react";
import { InputAdornment } from "@mui/material";
import Field from "../../ui/Field";
import FilterPanel from "./FilterPanel";
import { brMoneyMask } from "../../utils/Masks";

export interface ProductFilters {
  name: string;
  description: string;
  ncm: string;
  icms: string;
  /** Valor em centavos (inteiro), como armazenado no produto. */
  minValue: string;
  maxValue: string;
}

interface ProductsFilterProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  onReset: () => void;
}

const ADVANCED_KEYS: (keyof ProductFilters)[] = [
  "description",
  "ncm",
  "icms",
  "minValue",
  "maxValue",
];

const ProductsFilter: React.FC<ProductsFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const set = (key: keyof ProductFilters, value: string) =>
    onFilterChange({ ...filters, [key]: value });

  // Campos de valor: o usuário digita em Reais (com máscara BRL), mas o valor
  // é guardado em centavos — mesma semântica do cadastro de produtos e da
  // comparação em Products.tsx. Ex.: digitar 1500 mostra "15,00" e guarda "1500".
  const setMoney = (key: "minValue" | "maxValue", raw: string) =>
    set(key, raw.replace(/\D/g, ""));
  const moneyValue = (key: "minValue" | "maxValue") =>
    filters[key] ? brMoneyMask(filters[key]) : "";

  const advancedCount = ADVANCED_KEYS.filter((key) => filters[key] !== "").length;

  const realAdornment = (
    <InputAdornment position="start">R$</InputAdornment>
  );

  return (
    <FilterPanel
      search={filters.name}
      onSearchChange={(v) => set("name", v)}
      searchPlaceholder="Buscar por nome do produto…"
      searchLabel="Buscar produto por nome"
      advancedCount={advancedCount}
      onReset={onReset}
    >
      <Field
        size="small"
        label="Descrição"
        value={filters.description}
        onChange={(e) => set("description", e.target.value)}
      />
      <Field
        size="small"
        label="NCM"
        value={filters.ncm}
        onChange={(e) => set("ncm", e.target.value)}
      />
      <Field
        size="small"
        label="ICMS (%)"
        value={filters.icms}
        onChange={(e) => set("icms", e.target.value)}
      />
      <Field
        size="small"
        label="Valor mínimo"
        value={moneyValue("minValue")}
        onChange={(e) => setMoney("minValue", e.target.value)}
        inputProps={{ inputMode: "numeric" }}
        InputProps={{ startAdornment: realAdornment }}
      />
      <Field
        size="small"
        label="Valor máximo"
        value={moneyValue("maxValue")}
        onChange={(e) => setMoney("maxValue", e.target.value)}
        inputProps={{ inputMode: "numeric" }}
        InputProps={{ startAdornment: realAdornment }}
      />
    </FilterPanel>
  );
};

export default ProductsFilter;
