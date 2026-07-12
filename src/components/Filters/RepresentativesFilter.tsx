import React from "react";
import Field from "../../ui/Field";
import FilterPanel from "./FilterPanel";

export interface RepresentativeFilters {
  name: string;
  email: string;
  phone: string;
  mobilePhone: string;
  cep: string;
  address: string;
  city: string;
  state: string;
  role: string;
  clientName: string;
}

interface RepresentativesFilterProps {
  filters: RepresentativeFilters;
  onFilterChange: (filters: RepresentativeFilters) => void;
  onReset: () => void;
}

/** Campos avançados de Representantes (a busca principal é por nome). */
const ADVANCED: { key: keyof RepresentativeFilters; label: string }[] = [
  { key: "role", label: "Cargo" },
  { key: "clientName", label: "Cliente" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "mobilePhone", label: "Celular" },
  { key: "cep", label: "CEP" },
  { key: "address", label: "Endereço" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado" },
];

const RepresentativesFilter: React.FC<RepresentativesFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const set = (key: keyof RepresentativeFilters, value: string) =>
    onFilterChange({ ...filters, [key]: value });

  const advancedCount = ADVANCED.filter(({ key }) => filters[key] !== "").length;

  return (
    <FilterPanel
      search={filters.name}
      onSearchChange={(v) => set("name", v)}
      searchPlaceholder="Buscar por nome do representante…"
      searchLabel="Buscar representante por nome"
      advancedCount={advancedCount}
      onReset={onReset}
    >
      {ADVANCED.map(({ key, label }) => (
        <Field
          key={key}
          size="small"
          label={label}
          value={filters[key]}
          onChange={(e) => set(key, e.target.value)}
        />
      ))}
    </FilterPanel>
  );
};

export default RepresentativesFilter;
