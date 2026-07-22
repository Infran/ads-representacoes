import { useEffect, useMemo, useState } from "react";
import "./Budgets.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import { NoteAdd, SearchOff } from "@mui/icons-material";
import { Box, TablePagination } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { IBudget } from "../../interfaces/ibudget";
import { openBudgetPdf } from "../../utils/PDFGenerator/BudgetPdf";
import DeleteBudgetModal from "../../components/Modal/Delete/DeleteBudgetModal";
import { useBudgetFilters } from "./useBudgetFilters";
import BudgetFilters from "./BudgetFilters";
import BudgetListItem from "./BudgetListItem";
import { ListSkeleton, notifySuccess } from "../../ui";

const Budgets = () => {
  const navigate = useNavigate();

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const { budgets: budgetList, loading, removeBudgetFromCache } = useData();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  // Paginação client-side sobre o resultado já filtrado/ordenado.
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filters = useBudgetFilters(budgetList);
  const { filteredBudgets } = filters;

  // Sempre que o conjunto filtrado muda (busca/ordenação/faixa), volta à
  // primeira página para não ficar "preso" numa página que deixou de existir.
  useEffect(() => {
    setPage(0);
  }, [filteredBudgets]);

  const pageBudgets = useMemo(
    () =>
      filteredBudgets.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
      ),
    [filteredBudgets, page, rowsPerPage]
  );

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleOpenPdf = (budget: IBudget) => openBudgetPdf(budget);

  const handleDeleteSuccess = (deletedId: string) => {
    // Atualiza o cache local em vez de recarregar a página
    removeBudgetFromCache(deletedId);
    setDeleteModalId(null);
    notifySuccess("Sucesso!", "Orçamento excluído com sucesso!");
  };

  // PERF P1.1: um único modal de exclusão (fora do .map). Busca no array
  // completo (não no filtrado) — o item existe no cache até ser de fato excluído.
  const budgetToDelete = deleteModalId
    ? budgetList.find((b) => b.id === deleteModalId)
    : undefined;

  return (
    <Box className="budgets-container">
      <PageHeader
        title="Orçamentos"
        description="Gerencie seus orçamentos"
        icon={NoteAdd}
        actionLabel="Novo orçamento"
        actionIcon={NoteAdd}
        onAction={() => navigate("/Orcamentos/Adicionar")}
      />

      <BudgetFilters filters={filters} totalCount={budgetList.length} />

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
        {loading ? (
          <Box sx={{ p: 2 }}>
            <ListSkeleton rows={6} />
          </Box>
        ) : filteredBudgets.length > 0 ? (
          <>
            {pageBudgets.map((budget) => (
              <BudgetListItem
                key={budget.id}
                budget={budget}
                expanded={expandedId === budget.id}
                onToggle={toggleExpand}
                onOpenPdf={handleOpenPdf}
                onEdit={(id) => navigate(`/Orcamentos/Editar/${id}`)}
                onDelete={(id) => setDeleteModalId(id)}
              />
            ))}

            <TablePagination
              className="budget-pagination"
              component="div"
              count={filteredBudgets.length}
              page={page}
              onPageChange={(_, next) => setPage(next)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
              labelRowsPerPage="Por página:"
              labelDisplayedRows={({ from, to, count }) =>
                `${from}–${to} de ${count}`
              }
            />
          </>
        ) : (
          <Box className="empty-state">
            <SearchOff />
            <h3>Nenhum orçamento encontrado</h3>
            <p>Tente ajustar os filtros ou adicione um novo orçamento.</p>
          </Box>
        )}
      </Box>

      {/* PERF P1.1: uma única instância do modal de exclusão para toda a lista */}
      {budgetToDelete && (
        <DeleteBudgetModal
          open
          onClose={() => setDeleteModalId(null)}
          onDeleted={() => handleDeleteSuccess(budgetToDelete.id)}
          budget={budgetToDelete}
        />
      )}
    </Box>
  );
};

export default Budgets;
