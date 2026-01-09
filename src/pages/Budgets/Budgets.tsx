import React, { useMemo, useState } from "react";
import "./Budgets.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import {
  FileOpen,
  NoteAdd,
  KeyboardArrowDown,
  Inventory,
  Info,
  SearchOff,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Collapse,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { IBudget } from "../../interfaces/ibudget";
import { BudgetPdfPage } from "../../utils/PDFGenerator/BudgetPdf";
import ReactDOM from "react-dom";
import { brMoneyMask } from "../../utils/Masks";
import DeleteBudgetModal from "../../components/Modal/Delete/DeleteBudgetModal";
import useDebounce from "../../hooks/useDebounce";

type SortOption =
  | "id-desc"
  | "id-asc"
  | "value-desc"
  | "value-asc"
  | "date-desc"
  | "date-asc";

const Budgets = () => {
  const navigate = useNavigate();

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const { budgets: budgetList, removeBudgetFromCache } = useData();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>("");
  const [representativeFilter, setRepresentativeFilter] = useState<string>("");
  const [clientFilter, setClientFilter] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("id-desc");
  const [minValue, setMinValue] = useState<string>("");
  const [maxValue, setMaxValue] = useState<string>("");

  const debouncedSearch = useDebounce(search, 300);

  // Extract unique representatives and clients for filter dropdowns
  const representatives = useMemo(() => {
    const names = new Set(
      budgetList.map((b) => b.representative?.name).filter(Boolean)
    );
    return Array.from(names).sort();
  }, [budgetList]);

  const clients = useMemo(() => {
    const names = new Set(
      budgetList.map((b) => b.client?.name).filter(Boolean)
    );
    return Array.from(names).sort();
  }, [budgetList]);

  // Filter and sort budgets
  const filteredBudgets = useMemo(() => {
    let result = [...budgetList];

    // Search filter
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      result = result.filter((budget) => {
        const clientMatch = budget.client?.name
          ?.toLowerCase()
          .includes(searchLower);
        const repMatch = budget.representative?.name
          ?.toLowerCase()
          .includes(searchLower);
        const productMatch = budget.selectedProducts
          ?.map((item) => item.product?.name)
          .join(", ")
          .toLowerCase()
          .includes(searchLower);
        const idMatch = budget.id?.toString().includes(searchLower);
        return clientMatch || repMatch || productMatch || idMatch;
      });
    }

    // Representative filter
    if (representativeFilter) {
      result = result.filter(
        (b) => b.representative?.name === representativeFilter
      );
    }

    // Client filter
    if (clientFilter) {
      result = result.filter((b) => b.client?.name === clientFilter);
    }

    // Value range filter
    const min = parseFloat(minValue) || 0;
    const max = parseFloat(maxValue) || Infinity;
    if (minValue || maxValue) {
      result = result.filter((b) => {
        const value = b.totalValue || 0;
        return value >= min && value <= max;
      });
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "id-desc":
          return Number(b.id) - Number(a.id);
        case "id-asc":
          return Number(a.id) - Number(b.id);
        case "value-desc":
          return (b.totalValue || 0) - (a.totalValue || 0);
        case "value-asc":
          return (a.totalValue || 0) - (b.totalValue || 0);
        case "date-desc":
          return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
        case "date-asc":
          return (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [
    budgetList,
    debouncedSearch,
    representativeFilter,
    clientFilter,
    sortBy,
    minValue,
    maxValue,
  ]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const handleOpenPdf = (budget: IBudget) => {
    const newTab = window.open("", "_blank");
    if (newTab) {
      newTab.document.write(`
        <html>
          <head>
            <style>
              body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
              #react-root { margin: 0; padding: 0; width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <div id="react-root"></div>
          </body>
        </html>
      `);
      newTab.document.close();
      ReactDOM.render(
        <BudgetPdfPage budget={budget} />,
        newTab.document.getElementById("react-root")
      );
    }
  };

  const clearFilters = () => {
    setSearch("");
    setRepresentativeFilter("");
    setClientFilter("");
    setSortBy("id-desc");
    setMinValue("");
    setMaxValue("");
  };

  const handleDeleteSuccess = (deletedId: string) => {
    // Atualiza o cache local em vez de recarregar a página
    removeBudgetFromCache(deletedId);
    setDeleteModalId(null);
  };

  const formatDate = (timestamp: { seconds: number } | undefined) => {
    if (!timestamp?.seconds) return "-";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("pt-BR");
  };

  return (
    <Box className="budgets-container">
      <PageHeader
        title="Orçamentos"
        description="Gerencie seus orçamentos"
        icon={NoteAdd}
      />

      {/* Filters Section */}
      <Box className="filters-container">
        <Box className="filters-row">
          <TextField
            className="search-input"
            label="Pesquisar orçamentos..."
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Representante</InputLabel>
            <Select
              value={representativeFilter}
              label="Representante"
              onChange={(e) => setRepresentativeFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {representatives.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Cliente</InputLabel>
            <Select
              value={clientFilter}
              label="Cliente"
              onChange={(e) => setClientFilter(e.target.value)}
            >
              <MenuItem value="">Todos</MenuItem>
              {clients.map((name) => (
                <MenuItem key={name} value={name}>
                  {name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Ordenar por</InputLabel>
            <Select
              value={sortBy}
              label="Ordenar por"
              onChange={(e) => setSortBy(e.target.value as SortOption)}
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
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
            />
            <TextField
              className="value-input"
              label="Valor máx"
              variant="outlined"
              size="small"
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
            />
          </Box>

          <Button
            variant="contained"
            onClick={() => navigate("/Orcamentos/Adicionar")}
          >
            Adicionar
          </Button>
        </Box>

        <Box
          className="results-counter"
          display="flex"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2">
            Mostrando <strong>{filteredBudgets.length}</strong> de{" "}
            <strong>{budgetList.length}</strong> orçamentos
          </Typography>
          {(search ||
            representativeFilter ||
            clientFilter ||
            minValue ||
            maxValue) && (
            <Button size="small" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </Box>
      </Box>

      {/* Budget List */}
      <Box className="budget-list-container">
        {/* Header */}
        <Box className="budget-list-header">
          <span>ID</span>
          <span>Cliente</span>
          <span>Representante</span>
          <span>Valor Total</span>
          <span>Data</span>
          <span></span>
        </Box>

        {/* List Items */}
        {filteredBudgets.length > 0 ? (
          filteredBudgets.map((budget) => (
            <React.Fragment key={budget.id}>
              <Box
                className={`budget-list-item ${
                  expandedId === budget.id ? "expanded" : ""
                }`}
              >
                <Box
                  className="budget-row"
                  onClick={() => toggleExpand(budget.id)}
                >
                  <span className="budget-id">#{budget.id}</span>
                  <span className="budget-client" title={budget.client?.name}>
                    {budget.client?.name || "-"}
                  </span>
                  <span
                    className="budget-representative"
                    title={budget.representative?.name}
                  >
                    {budget.representative?.name || "-"}
                  </span>
                  <span className="budget-value">
                    R$ {brMoneyMask((budget.totalValue || 0).toFixed(0))}
                  </span>
                  <span className="budget-date">
                    {formatDate(budget.createdAt)}
                  </span>
                  <span
                    className={`expand-icon ${
                      expandedId === budget.id ? "rotated" : ""
                    }`}
                  >
                    <KeyboardArrowDown />
                  </span>
                </Box>

                <Collapse
                  in={expandedId === budget.id}
                  timeout="auto"
                  unmountOnExit
                >
                  <Box className="budget-details">
                    <Box className="details-grid">
                      {/* Products Section */}
                      <Box className="detail-section">
                        <h4>
                          <Inventory /> Produtos
                        </h4>
                        <ul className="products-list">
                          {budget.selectedProducts?.map((item, idx) => {
                            const unitValue =
                              item.customUnitValue ??
                              item.product?.unitValue ??
                              0;
                            return (
                              <li key={idx}>
                                <span className="product-name">
                                  {item.product?.name}
                                </span>
                                <span className="product-price">
                                  {item.quantity}x R${" "}
                                  {brMoneyMask(unitValue.toFixed(0))}
                                </span>
                              </li>
                            );
                          })}
                        </ul>
                      </Box>

                      {/* Details Section */}
                      <Box className="detail-section">
                        <h4>
                          <Info /> Detalhes
                        </h4>
                        <Box className="detail-row">
                          <span className="detail-label">
                            Prazo de Entrega:
                          </span>
                          <span className="detail-value">
                            {budget.estimatedDate || "-"}
                          </span>
                        </Box>
                        <Box className="detail-row">
                          <span className="detail-label">Validade:</span>
                          <span className="detail-value">
                            {budget.maxDealDate || "-"}
                          </span>
                        </Box>
                        <Box className="detail-row">
                          <span className="detail-label">Pagamento:</span>
                          <span className="detail-value">
                            {budget.paymentTerms || "-"}
                          </span>
                        </Box>
                        <Box className="detail-row">
                          <span className="detail-label">Frete:</span>
                          <span className="detail-value">
                            {budget.shippingTerms || "-"}
                          </span>
                        </Box>
                        <Box className="detail-row">
                          <span className="detail-label">Garantia:</span>
                          <span className="detail-value">
                            {budget.guarantee || "-"}
                          </span>
                        </Box>
                      </Box>
                    </Box>

                    {/* Actions */}
                    <Box className="budget-actions">
                      <Button
                        variant="outlined"
                        startIcon={<FileOpen />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPdf(budget);
                        }}
                      >
                        Ver PDF
                      </Button>
                      <Button
                        variant="contained"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/Orcamentos/Editar/${budget.id}`);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteModalId(budget.id);
                        }}
                      >
                        Excluir
                      </Button>
                    </Box>
                  </Box>
                </Collapse>
              </Box>

              <DeleteBudgetModal
                open={deleteModalId === budget.id}
                onClose={() => {
                  handleDeleteSuccess(budget.id);
                }}
                budget={budget}
              />
            </React.Fragment>
          ))
        ) : (
          <Box className="empty-state">
            <SearchOff />
            <h3>Nenhum orçamento encontrado</h3>
            <p>Tente ajustar os filtros ou adicione um novo orçamento.</p>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default Budgets;
