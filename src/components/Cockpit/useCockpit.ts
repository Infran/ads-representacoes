import { useCallback, useState } from "react";
import { useMediaQuery, useTheme } from "@mui/material";
import { Density } from "./cockpitUtils";

/**
 * Estado comum das telas em "cockpit" (filtros + seleção + densidade + página +
 * painel colapsável) mais o breakpoint que habilita o rail recolhível. `F` é o
 * shape de filtros específico da entidade; `emptyFilters` deve ser uma constante
 * de módulo (referência estável) para `resetFilters` continuar memoizado.
 */
export function useCockpit<F extends object>(emptyFilters: F) {
  const [filters, setFilters] = useState<F>(emptyFilters);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [density, setDensity] = useState<Density>("compact");
  const [page, setPage] = useState(0);
  const [detailCollapsed, setDetailCollapsed] = useState(false);

  const theme = useTheme();
  const isWide = useMediaQuery(theme.breakpoints.up("lg"));

  // Qualquer mudança de filtro volta para a primeira página.
  const patchFilters = useCallback((patch: Partial<F>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
    setPage(0);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(emptyFilters);
    setPage(0);
  }, [emptyFilters]);

  const select = useCallback((id: string | null) => {
    setSelectedId(id);
    setDetailCollapsed(false);
  }, []);

  return {
    filters,
    patchFilters,
    resetFilters,
    selectedId,
    setSelectedId,
    select,
    density,
    setDensity,
    page,
    setPage,
    detailCollapsed,
    setDetailCollapsed,
    isWide,
  };
}
