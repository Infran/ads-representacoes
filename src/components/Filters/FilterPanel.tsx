import React, { useState } from "react";
import { Box, Collapse, IconButton, InputAdornment } from "@mui/material";
import { Search, Close, Tune, ExpandMore } from "@mui/icons-material";
import Card from "../../ui/Card";
import Button from "../../ui/Button";
import Field from "../../ui/Field";

/**
 * Casca compartilhada dos filtros de cadastro (Clientes, Produtos,
 * Representantes). Tokenizada (UI U2.1) e sem hex: consome `Card`/`Button`/
 * `Field` do tema. Substitui o antigo padrão de checkbox-para-revelar-campo.
 *
 * Estrutura: um campo de busca principal sempre visível (o caso de 90% — nome)
 * e um bloco de "Filtros" avançados que expande sob demanda, com contagem viva
 * de filtros ativos. Cada tela injeta seus campos avançados via `children`,
 * dispostos numa grade responsiva.
 */
interface FilterPanelProps {
  /** Valor do campo de busca principal (por nome). */
  search: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  /** Rótulo acessível do campo de busca (usa placeholder visível). */
  searchLabel?: string;
  /** Quantos filtros avançados estão preenchidos (para o selo de contagem). */
  advancedCount: number;
  /** Limpa todos os filtros (inclusive a busca principal). */
  onReset: () => void;
  /** Campos avançados (renderizados numa grade responsiva). */
  children?: React.ReactNode;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  search,
  onSearchChange,
  searchPlaceholder = "Buscar…",
  searchLabel = "Buscar",
  advancedCount,
  onReset,
  children,
}) => {
  const [expanded, setExpanded] = useState(false);
  const hasAdvanced = React.Children.count(children) > 0;
  const anyActive = advancedCount > 0 || search.trim() !== "";

  return (
    <Card padding={2} sx={{ display: "flex", flexDirection: "column" }}>
      <Box
        sx={{
          display: "flex",
          gap: 1.5,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <Field
          size="small"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          inputProps={{ "aria-label": searchLabel }}
          sx={{ flex: "1 1 260px", minWidth: 0 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ fontSize: 20, color: "text.secondary" }} />
              </InputAdornment>
            ),
            endAdornment: search ? (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  aria-label="Limpar busca"
                  onClick={() => onSearchChange("")}
                  edge="end"
                >
                  <Close sx={{ fontSize: 18 }} />
                </IconButton>
              </InputAdornment>
            ) : null,
          }}
        />

        {hasAdvanced && (
          <Button
            variant={expanded ? "contained" : "outlined"}
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            startIcon={<Tune />}
            endIcon={
              <ExpandMore
                sx={{
                  transform: expanded ? "rotate(180deg)" : "none",
                  transition: "transform .2s ease",
                  "@media (prefers-reduced-motion: reduce)": {
                    transition: "none",
                  },
                }}
              />
            }
            sx={{ flexShrink: 0 }}
          >
            Filtros
            {advancedCount > 0 && (
              <Box
                component="span"
                aria-label={`${advancedCount} filtros ativos`}
                sx={{
                  ml: 0.75,
                  minWidth: 18,
                  height: 18,
                  px: 0.5,
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 700,
                  lineHeight: "18px",
                  textAlign: "center",
                  bgcolor: expanded ? "primary.contrastText" : "primary.main",
                  color: expanded ? "primary.main" : "primary.contrastText",
                }}
              >
                {advancedCount}
              </Box>
            )}
          </Button>
        )}

        {anyActive && (
          <Button
            variant="text"
            onClick={onReset}
            startIcon={<Close />}
            sx={{ flexShrink: 0, color: "text.secondary" }}
          >
            Limpar
          </Button>
        )}
      </Box>

      {hasAdvanced && (
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: "1px solid",
              borderColor: "divider",
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              },
              gap: 2,
            }}
          >
            {children}
          </Box>
        </Collapse>
      )}
    </Card>
  );
};

export default FilterPanel;
