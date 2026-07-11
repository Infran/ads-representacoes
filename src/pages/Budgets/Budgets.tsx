import { useState } from "react";
import "./Budgets.css";
import PageHeader from "../../components/PageHeader/PageHeader";
import { NoteAdd, SearchOff } from "@mui/icons-material";
import { Box } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useData } from "../../context/DataContext";
import { IBudget } from "../../interfaces/ibudget";
import { openBudgetPdf } from "../../utils/PDFGenerator/BudgetPdf";
import DeleteBudgetModal from "../../components/Modal/Delete/DeleteBudgetModal";
import { useBudgetFilters } from "./useBudgetFilters";
import BudgetFilters from "./BudgetFilters";
import BudgetListItem from "./BudgetListItem";

const Budgets = () => {
  const navigate = useNavigate();

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const { budgets: budgetList, removeBudgetFromCache } = useData();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleteModalId, setDeleteModalId] = useState<string | null>(null);

  const filters = useBudgetFilters(budgetList);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  const handleOpenPdf = (budget: IBudget) => openBudgetPdf(budget);

  const handleDeleteSuccess = (deletedId: string) => {
    // Atualiza o cache local em vez de recarregar a página
    removeBudgetFromCache(deletedId);
    setDeleteModalId(null);
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
      />

      <BudgetFilters
        filters={filters}
        totalCount={budgetList.length}
        onAdd={() => navigate("/Orcamentos/Adicionar")}
      />

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
        {filters.filteredBudgets.length > 0 ? (
          filters.filteredBudgets.map((budget) => (
            <BudgetListItem
              key={budget.id}
              budget={budget}
              expanded={expandedId === budget.id}
              onToggle={toggleExpand}
              onOpenPdf={handleOpenPdf}
              onEdit={(id) => navigate(`/Orcamentos/Editar/${id}`)}
              onDelete={(id) => setDeleteModalId(id)}
            />
          ))
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
