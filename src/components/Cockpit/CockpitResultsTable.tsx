import { ReactNode } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  ChevronLeft,
  ChevronRight,
  Close,
  DeleteOutline,
  DensityMedium,
  DensitySmall,
  Download,
  EditOutlined,
  SearchOff,
} from "@mui/icons-material";
import { Density, FilterChip, initials, tintForId } from "./cockpitUtils";

/** Mapeia uma linha genérica para as 4 colunas do cockpit. */
export interface CockpitColumns<T> {
  getRowId: (row: T) => string;
  /** Cabeçalho da primeira coluna (ex.: "Produto", "Empresa", "Nome"). */
  primaryHeader: string;
  /** Título em negrito (primeira coluna). */
  getPrimary: (row: T) => string;
  /** Subtítulo esmaecido sob o título. */
  getSubtitle: (row: T) => string;
  middleHeader: string;
  renderMiddle: (row: T) => ReactNode;
  badgeHeader: string;
  /** Pílula da 3ª coluna; `active` decide o tom (marca vs. neutro). */
  getBadge: (row: T) => { label: string; active: boolean };
}

interface CockpitResultsTableProps<T> {
  rows: T[];
  columns: CockpitColumns<T>;
  page: number;
  perPage: number;
  onPageChange: (page: number) => void;
  density: Density;
  onDensityChange: (density: Density) => void;
  chips: FilterChip[];
  selectedId: string | null;
  onSelect: (row: T) => void;
  onEdit: (row: T) => void;
  onDelete: (row: T) => void;
  onExport: () => void;
  emptyLabel: string;
}

const GRID_COLUMNS = "minmax(0, 2fr) 1.1fr 1fr 84px";

const headerCellSx = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: ".3px",
  textTransform: "uppercase" as const,
  color: "text.secondary",
};

function CockpitResultsTable<T>({
  rows,
  columns,
  page,
  perPage,
  onPageChange,
  density,
  onDensityChange,
  chips,
  selectedId,
  onSelect,
  onEdit,
  onDelete,
  onExport,
  emptyLabel,
}: CockpitResultsTableProps<T>) {
  const total = rows.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(page, pages - 1);
  const start = safePage * perPage;
  const slice = rows.slice(start, start + perPage);
  const rangeLabel =
    total === 0 ? "0 de 0" : `${start + 1}–${start + slice.length} de ${total}`;

  const densityButtonSx = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    px: 1.25,
    py: 0.5,
    borderRadius: 1.5,
    cursor: "pointer",
    color: active ? "primary.main" : "text.secondary",
    bgcolor: active ? "background.paper" : "transparent",
    boxShadow: active ? 1 : "none",
  });

  return (
    <Box sx={{ flex: 1, display: "flex", flexDirection: "column", gap: 1.5, minWidth: 0 }}>
      {/* Toolbar: chips de filtros ativos + densidade + exportar */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap" }}>
        <Typography sx={{ fontSize: 12, fontWeight: 500, color: "text.secondary" }}>
          {chips.length
            ? `${chips.length} ${chips.length > 1 ? "filtros ativos" : "filtro ativo"}:`
            : "Nenhum filtro ativo"}
        </Typography>
        {chips.map((chip) => (
          <Box
            key={chip.key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              fontSize: 11.5,
              fontWeight: 600,
              px: 1.1,
              py: 0.6,
              borderRadius: 999,
              bgcolor: (t) => alpha(t.palette.primary.main, 0.1),
              color: "primary.dark",
            }}
          >
            {chip.label}
            <Close
              onClick={chip.onRemove}
              role="button"
              aria-label={`Remover filtro ${chip.label}`}
              sx={{ fontSize: 15, cursor: "pointer" }}
            />
          </Box>
        ))}

        <Box sx={{ ml: "auto", display: "flex", alignItems: "center", gap: 1 }}>
          <Box
            sx={{
              display: "flex",
              p: "2px",
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              bgcolor: (t) => alpha(t.palette.text.primary, 0.03),
            }}
          >
            <Box
              onClick={() => onDensityChange("comfortable")}
              role="button"
              aria-label="Densidade confortável"
              sx={densityButtonSx(density === "comfortable")}
            >
              <DensityMedium sx={{ fontSize: 16 }} />
            </Box>
            <Box
              onClick={() => onDensityChange("compact")}
              role="button"
              aria-label="Densidade compacta"
              sx={densityButtonSx(density === "compact")}
            >
              <DensitySmall sx={{ fontSize: 16 }} />
            </Box>
          </Box>
          <Box
            onClick={onExport}
            role="button"
            aria-label="Exportar resultados em CSV"
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.75,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 2,
              px: 1.5,
              py: 1,
              fontSize: 12,
              fontWeight: 500,
              color: "text.secondary",
              cursor: "pointer",
              "&:hover": { bgcolor: (t) => alpha(t.palette.text.primary, 0.03) },
            }}
          >
            <Download sx={{ fontSize: 17 }} />
            Exportar
          </Box>
        </Box>
      </Box>

      {/* Tabela */}
      <Paper
        elevation={0}
        sx={{
          flex: 1,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        <Box sx={{ overflowX: "auto", flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ minWidth: 620, flex: 1, display: "flex", flexDirection: "column" }}>
            {/* Cabeçalho */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: GRID_COLUMNS,
                gap: 1,
                px: 2.25,
                py: 1.5,
                bgcolor: (t) => alpha(t.palette.divider, 0.35),
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography sx={headerCellSx}>{columns.primaryHeader}</Typography>
              <Typography sx={headerCellSx}>{columns.middleHeader}</Typography>
              <Typography sx={{ ...headerCellSx, textAlign: "center" }}>
                {columns.badgeHeader}
              </Typography>
              <Typography sx={{ ...headerCellSx, textAlign: "right" }}>Ações</Typography>
            </Box>

            {/* Corpo */}
            <Box sx={{ flex: 1, overflowY: "auto" }}>
              {slice.map((row) => {
                const id = columns.getRowId(row);
                const isSelected = id === selectedId;
                const primary = columns.getPrimary(row);
                const badge = columns.getBadge(row);
                return (
                  <Box
                    key={id}
                    onClick={() => onSelect(row)}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: GRID_COLUMNS,
                      gap: 1,
                      alignItems: "center",
                      px: 2.25,
                      py: density === "compact" ? 1.1 : 1.75,
                      borderBottom: "1px solid",
                      borderColor: (t) => alpha(t.palette.divider, 0.5),
                      borderLeft: "3px solid",
                      borderLeftColor: isSelected ? "primary.main" : "transparent",
                      bgcolor: isSelected
                        ? (t) => alpha(t.palette.primary.main, 0.06)
                        : "transparent",
                      cursor: "pointer",
                      "&:hover": {
                        bgcolor: isSelected
                          ? (t) => alpha(t.palette.primary.main, 0.08)
                          : (t) => alpha(t.palette.text.primary, 0.02),
                      },
                    }}
                  >
                    {/* Coluna primária: avatar + título + subtítulo */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
                      <Box
                        sx={{
                          width: 34,
                          height: 34,
                          borderRadius: 2,
                          flexShrink: 0,
                          bgcolor: tintForId(id),
                          color: "common.white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {initials(primary)}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          sx={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "text.primary",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {primary}
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: 11,
                            color: "text.secondary",
                            opacity: 0.85,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {columns.getSubtitle(row)}
                        </Typography>
                      </Box>
                    </Box>

                    {/* Coluna do meio */}
                    <Box sx={{ fontSize: 12.5, color: "text.primary", minWidth: 0 }}>
                      {columns.renderMiddle(row)}
                    </Box>

                    {/* Badge */}
                    <Box sx={{ textAlign: "center" }}>
                      <Box
                        component="span"
                        sx={{
                          fontSize: 11.5,
                          fontWeight: 600,
                          px: 1.25,
                          py: 0.4,
                          borderRadius: 999,
                          color: badge.active ? "primary.dark" : "text.secondary",
                          bgcolor: badge.active
                            ? (t) => alpha(t.palette.primary.main, 0.1)
                            : (t) => alpha(t.palette.text.primary, 0.05),
                        }}
                      >
                        {badge.label}
                      </Box>
                    </Box>

                    {/* Ações */}
                    <Box sx={{ display: "flex", gap: 1.25, justifyContent: "flex-end" }}>
                      <EditOutlined
                        role="button"
                        aria-label={`Editar ${primary}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(row);
                        }}
                        sx={{ fontSize: 18, color: "primary.main", cursor: "pointer" }}
                      />
                      <DeleteOutline
                        role="button"
                        aria-label={`Excluir ${primary}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(row);
                        }}
                        sx={{ fontSize: 18, color: "error.main", cursor: "pointer" }}
                      />
                    </Box>
                  </Box>
                );
              })}

              {total === 0 && (
                <Box sx={{ px: 2.25, py: 6, textAlign: "center", color: "text.secondary" }}>
                  <SearchOff sx={{ fontSize: 40, opacity: 0.4 }} />
                  <Typography sx={{ fontSize: 13, mt: 1 }}>{emptyLabel}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        {/* Rodapé / paginação */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 2,
            px: 2.25,
            py: 1.4,
            borderTop: "1px solid",
            borderColor: "divider",
            bgcolor: (t) => alpha(t.palette.divider, 0.35),
            fontSize: 12,
            color: "text.secondary",
          }}
        >
          {rangeLabel}
          <ChevronLeft
            role="button"
            aria-label="Página anterior"
            onClick={() => safePage > 0 && onPageChange(safePage - 1)}
            sx={{
              fontSize: 18,
              cursor: safePage > 0 ? "pointer" : "default",
              color: safePage > 0 ? "primary.main" : "text.disabled",
            }}
          />
          <ChevronRight
            role="button"
            aria-label="Próxima página"
            onClick={() => safePage < pages - 1 && onPageChange(safePage + 1)}
            sx={{
              fontSize: 18,
              cursor: safePage < pages - 1 ? "pointer" : "default",
              color: safePage < pages - 1 ? "primary.main" : "text.disabled",
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}

export default CockpitResultsTable;
