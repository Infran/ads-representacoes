import React from "react";
import Field from "../../ui/Field";
import FilterPanel from "./FilterPanel";

export interface ClientFilters {
  name: string;
  email: string;
  phone: string;
  cnpj: string;
  cep: string;
  address: string;
  city: string;
  state: string;
}

interface ClientsFilterProps {
  filters: ClientFilters;
  onFilterChange: (filters: ClientFilters) => void;
  onReset: () => void;
}

/** Campos avançados de Clientes (a busca principal é por nome). */
const ADVANCED: { key: keyof ClientFilters; label: string }[] = [
  { key: "email", label: "Email" },
  { key: "phone", label: "Telefone" },
  { key: "cnpj", label: "CNPJ" },
  { key: "cep", label: "CEP" },
  { key: "address", label: "Endereço" },
  { key: "city", label: "Cidade" },
  { key: "state", label: "Estado" },
];

const ClientsFilter: React.FC<ClientsFilterProps> = ({
  filters,
  onFilterChange,
  onReset,
}) => {
  const set = (key: keyof ClientFilters, value: string) =>
    onFilterChange({ ...filters, [key]: value });

  const advancedCount = ADVANCED.filter(({ key }) => filters[key] !== "").length;

  return (
    <FilterPanel
      search={filters.name}
      onSearchChange={(v) => set("name", v)}
      searchPlaceholder="Buscar por nome ou razão social…"
      searchLabel="Buscar cliente por nome"
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

export default ClientsFilter;
