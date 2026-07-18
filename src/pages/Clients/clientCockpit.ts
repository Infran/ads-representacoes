// Lógica específica de Clientes para o cockpit (filtros, chips, formatação).
// A estrutura visual (barra/tabela/painel) vem de src/components/Cockpit.
import { IClient } from "../../interfaces/iclient";
import { cnpjMask } from "../../utils/Masks";
import { CountById, FilterChip } from "../../components/Cockpit/cockpitUtils";

export interface ClientCockpitFilters {
  /** Busca livre por nome / e-mail / CNPJ. */
  search: string;
  /** UF exata ("" = todas). */
  state: string;
  /** Cidade exata ("" = todas). */
  city: string;
  /** Somente clientes com CNPJ preenchido. */
  hasCnpj: boolean;
  /** Somente clientes com ao menos um orçamento. */
  hasBudget: boolean;
}

export const EMPTY_CLIENT_FILTERS: ClientCockpitFilters = {
  search: "",
  state: "",
  city: "",
  hasCnpj: false,
  hasBudget: false,
};

export const formatCnpj = (cnpj?: string): string =>
  cnpj ? cnpjMask(cnpj) : "";

export const applyClientFilters = (
  clients: IClient[],
  f: ClientCockpitFilters,
  budgetCount: CountById
): IClient[] => {
  const term = f.search.trim().toLowerCase();
  return clients.filter((c) => {
    if (term) {
      const haystack = `${c.name ?? ""} ${c.email ?? ""} ${c.cnpj ?? ""}`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (f.state && c.state !== f.state) return false;
    if (f.city && c.city !== f.city) return false;
    if (f.hasCnpj && !c.cnpj) return false;
    if (f.hasBudget && !(budgetCount.get(c.id) ?? 0)) return false;
    return true;
  });
};

export const buildClientChips = (
  f: ClientCockpitFilters,
  patch: (p: Partial<ClientCockpitFilters>) => void
): FilterChip[] => {
  const chips: FilterChip[] = [];
  if (f.search)
    chips.push({ key: "search", label: `Busca: "${f.search}"`, onRemove: () => patch({ search: "" }) });
  if (f.state)
    chips.push({ key: "state", label: `Estado: ${f.state}`, onRemove: () => patch({ state: "", city: "" }) });
  if (f.city)
    chips.push({ key: "city", label: `Cidade: ${f.city}`, onRemove: () => patch({ city: "" }) });
  if (f.hasCnpj)
    chips.push({ key: "hasCnpj", label: "Com CNPJ", onRemove: () => patch({ hasCnpj: false }) });
  if (f.hasBudget)
    chips.push({ key: "hasBudget", label: "Com orçamento", onRemove: () => patch({ hasBudget: false }) });
  return chips;
};
