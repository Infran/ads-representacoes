import React from "react";
import {
  Box,
  Button,
  Chip,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { FilterAltOff, Search } from "@mui/icons-material";
import { SortOption, UseBudgetFiltersReturn } from "./useBudgetFilters";

interface BudgetFiltersProps {
  filters: UseBudgetFiltersReturn;
  totalCount: number;
}

/**
 * UI de filtros da lista de orçamentos (EST F3.2) — apresentacional,
 * consome o estado de `useBudgetFilters`. A ação de cadastro vive no
 * PageHeader (não aqui): esta barra é só para *operar* a lista.
 */
const BudgetFilters: React.FC<BudgetFiltersProps> = ({
  filters,
  totalCount,
}) => (
  <Box className="filters-container">
    <Box className="filters-row">
      <TextField
        className="search-input"
        label="Pesquisar orçamentos..."
        variant="outlined"
        size="small"
        value={filters.search}
        onChange={(e) => filters.setSearch(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      <FormControl size="small" sx={{ minWidth: 180 }}>
        <InputLabel>Representante</InputLabel>
        <Select
          value={filters.representativeFilter}
          label="Representante"
          onChange={(e) => filters.setRepresentativeFilter(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {filters.representatives.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Cliente</InputLabel>
        <Select
          value={filters.clientFilter}
          label="Cliente"
          onChange={(e) => filters.setClientFilter(e.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {filters.clients.map((name) => (
            <MenuItem key={name} value={name}>
              {name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel>Ordenar por</InputLabel>
        <Select
          value={filters.sortBy}
          label="Ordenar por"
          onChange={(e) => filters.setSortBy(e.target.value as SortOption)}
        >
          <MenuItem value="id-desc">ID ↓ (Mais recente)</MenuItem>
          <MenuItem value="id-asc">ID ↑ (Mais antigo)</MenuItem>
          <MenuItem value="value-desc">Valor ↓ (Maior)</MenuItem>
          <MenuItem value="value-asc">Valor ↑ (Menor)</MenuItem>
          <MenuItem value="date-desc">Data ↓ (Recente)</MenuItem>
          <MenuItem value="date-asc">Data ↑ (Antiga)</MenuItem>
        </Select>
      </FormControl>

      <Box className="value-filter">
        <TextField
          className="value-input"
          label="Valor mín"
          variant="outlined"
          size="small"
          type="number"
          value={filters.minValue}
          onChange={(e) => filters.setMinValue(e.target.value)}
        />
        <TextField
          className="value-input"
          label="Valor máx"
          variant="outlined"
          size="small"
          type="number"
          value={filters.maxValue}
          onChange={(e) => filters.setMaxValue(e.target.value)}
        />
      </Box>
    </Box>

    <Box
      className="results-counter"
      display="flex"
      justifyContent="space-between"
      alignItems="center"
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2">
          Mostrando <strong>{filters.filteredBudgets.length}</strong> de{" "}
          <strong>{totalCount}</strong> orçamentos
        </Typography>
        {filters.hasActiveFilters && (
          <Chip size="small" color="primary" variant="outlined" label="Filtros ativos" />
        )}
      </Box>
      {filters.hasActiveFilters && (
        <Button
          size="small"
          startIcon={<FilterAltOff />}
          onClick={filters.clearFilters}
        >
          Limpar filtros
        </Button>
      )}
    </Box>
  </Box>
);

export default BudgetFilters;
