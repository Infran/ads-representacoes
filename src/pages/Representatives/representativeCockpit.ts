// Lógica específica de Representantes para o cockpit (filtros, chips).
// A estrutura visual (barra/tabela/painel) vem de src/components/Cockpit.
import { IRepresentative } from "../../interfaces/irepresentative";
import { getEstadoNome, getUf } from "../../utils/ufs";
import { FilterChip, CountById } from "../../components/Cockpit/cockpitUtils";

export interface RepresentativeCockpitFilters {
  /** Busca livre por nome / função / e-mail / cliente. */
  search: string;
  /** Sigla da UF ("SP"), exata ("" = todas). Exibida como nome completo. */
  uf: string;
  /** Cidade exata ("" = todas). */
  city: string;
  /** Somente representantes com e-mail preenchido. */
  hasEmail: boolean;
  /** Somente representantes com ao menos um orçamento. */
  hasBudget: boolean;
}

export const EMPTY_REPRESENTATIVE_FILTERS: RepresentativeCockpitFilters = {
  search: "",
  uf: "",
  city: "",
  hasEmail: false,
  hasBudget: false,
};

export const applyRepresentativeFilters = (
  representatives: IRepresentative[],
  f: RepresentativeCockpitFilters,
  budgetCount: CountById
): IRepresentative[] => {
  const term = f.search.trim().toLowerCase();
  return representatives.filter((r) => {
    if (term) {
      const haystack = `${r.name ?? ""} ${r.role ?? ""} ${r.email ?? ""} ${
        r.client?.name ?? ""
      }`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (f.uf && getUf(r) !== f.uf) return false;
    if (f.city && r.city !== f.city) return false;
    if (f.hasEmail && !r.email) return false;
    if (f.hasBudget && !(budgetCount.get(r.id) ?? 0)) return false;
    return true;
  });
};

export const buildRepresentativeChips = (
  f: RepresentativeCockpitFilters,
  patch: (p: Partial<RepresentativeCockpitFilters>) => void
): FilterChip[] => {
  const chips: FilterChip[] = [];
  if (f.search)
    chips.push({ key: "search", label: `Busca: "${f.search}"`, onRemove: () => patch({ search: "" }) });
  if (f.uf)
    chips.push({ key: "uf", label: `Estado: ${getEstadoNome({ uf: f.uf })}`, onRemove: () => patch({ uf: "", city: "" }) });
  if (f.city)
    chips.push({ key: "city", label: `Cidade: ${f.city}`, onRemove: () => patch({ city: "" }) });
  if (f.hasEmail)
    chips.push({ key: "hasEmail", label: "Com e-mail", onRemove: () => patch({ hasEmail: false }) });
  if (f.hasBudget)
    chips.push({ key: "hasBudget", label: "Com orçamento", onRemove: () => patch({ hasBudget: false }) });
  return chips;
};
