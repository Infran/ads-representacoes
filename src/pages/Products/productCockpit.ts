// Lógica específica de Produtos para o cockpit (filtros, formatação, chips).
// A estrutura visual (barra/tabela/painel) vem de src/components/Cockpit.
import { brMoneyMask } from "../../utils/Masks";
import { IProduct } from "../../interfaces/iproduct";
import { FilterChip } from "../../components/Cockpit/cockpitUtils";

export interface ProductCockpitFilters {
  /** Busca livre por nome / descrição / NCM. */
  search: string;
  /** Código NCM exato ("" = todos). */
  ncm: string;
  /** Alíquota de ICMS exata ("" = todas). */
  icms: string;
  /** Somente produtos com descrição preenchida. */
  hasDescription: boolean;
  /** Somente produtos com valor unitário informado (> 0). */
  hasPrice: boolean;
}

export const EMPTY_PRODUCT_FILTERS: ProductCockpitFilters = {
  search: "",
  ncm: "",
  icms: "",
  hasDescription: false,
  hasPrice: false,
};

// `unitValue` é guardado em centavos inteiros (mesma semântica de Masks.ts).
export const formatCents = (cents?: number): string =>
  cents ? `R$ ${brMoneyMask(String(cents))}` : "—";

export const formatIcms = (icms?: string): string => {
  if (!icms) return "";
  const trimmed = icms.trim();
  return /%$/.test(trimmed) ? trimmed : `${trimmed}%`;
};

export const applyProductFilters = (
  products: IProduct[],
  f: ProductCockpitFilters
): IProduct[] => {
  const term = f.search.trim().toLowerCase();
  return products.filter((p) => {
    if (term) {
      const haystack = `${p.name ?? ""} ${p.description ?? ""} ${
        p.ncm ?? ""
      }`.toLowerCase();
      if (!haystack.includes(term)) return false;
    }
    if (f.ncm && p.ncm !== f.ncm) return false;
    if (f.icms && p.icms !== f.icms) return false;
    if (f.hasDescription && !p.description) return false;
    if (f.hasPrice && !(p.unitValue && p.unitValue > 0)) return false;
    return true;
  });
};

/** Chips dos filtros ativos + ações de remoção. */
export const buildProductChips = (
  f: ProductCockpitFilters,
  patch: (p: Partial<ProductCockpitFilters>) => void
): FilterChip[] => {
  const chips: FilterChip[] = [];
  if (f.search)
    chips.push({ key: "search", label: `Busca: "${f.search}"`, onRemove: () => patch({ search: "" }) });
  if (f.ncm)
    chips.push({ key: "ncm", label: `NCM: ${f.ncm}`, onRemove: () => patch({ ncm: "" }) });
  if (f.icms)
    chips.push({ key: "icms", label: `ICMS: ${formatIcms(f.icms)}`, onRemove: () => patch({ icms: "" }) });
  if (f.hasDescription)
    chips.push({ key: "hasDescription", label: "Com descrição", onRemove: () => patch({ hasDescription: false }) });
  if (f.hasPrice)
    chips.push({ key: "hasPrice", label: "Com valor", onRemove: () => patch({ hasPrice: false }) });
  return chips;
};
