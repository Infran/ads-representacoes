import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useData } from "../context/DataContext";
import { addBudget, updateBudget } from "../services/budgetServices";
import { confirmDialog } from "../ui";
import { UseBudgetFormReturn } from "./useBudgetForm";

interface UseBudgetActionsOptions {
  form: UseBudgetFormReturn;
  isEditing: boolean;
  budgetId?: string;
}

/**
 * Encapsula as ações de persistência do formulário de orçamento (EST F3.1):
 * salvar (create/edit) e cancelar, com confirmações (Swal) e navegação.
 * Preserva o contrato do CLAUDE.md: escrita via *Services + função de cache
 * do useData(); "Adicionar Outro" reseta o form sem recarregar a página.
 */
export const useBudgetActions = ({
  form,
  isEditing,
  budgetId,
}: UseBudgetActionsOptions) => {
  const navigate = useNavigate();
  const { updateBudgetInCache, addBudgetToCache } = useData();

  const handleSave = async () => {
    if (!form.isValid) {
      Swal.fire({
        icon: "warning",
        title: "Campos obrigatórios",
        text: "Preencha todos os campos obrigatórios antes de salvar.",
      });
      return;
    }

    try {
      if (isEditing && budgetId) {
        await updateBudget(budgetId, form.budget);
        updateBudgetInCache({ ...form.budget, id: budgetId });
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Orçamento atualizado com sucesso!",
        }).then(() => navigate("/Orcamentos"));
      } else {
        const newBudget = await addBudget(form.budget);
        addBudgetToCache(newBudget);
        Swal.fire({
          icon: "success",
          title: "Sucesso!",
          text: "Orçamento cadastrado com sucesso!",
          showCancelButton: true,
          confirmButtonText: "Ir para Orçamentos",
          cancelButtonText: "Adicionar Outro",
          reverseButtons: true,
        }).then((result) => {
          if (result.isConfirmed) {
            navigate("/Orcamentos");
          } else {
            form.reset();
          }
        });
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: `Erro ao ${isEditing ? "atualizar" : "cadastrar"} o orçamento.`,
      });
      console.error(error);
    }
  };

  const handleCancel = async () => {
    const confirmed = await confirmDialog({
      title: isEditing
        ? "Deseja descartar as alterações?"
        : "Deseja descartar o orçamento?",
      confirmText: "Sim, descartar!",
      cancelText: "Continuar Editando",
    });
    if (confirmed) {
      navigate("/Orcamentos");
    }
  };

  return { handleSave, handleCancel };
};

export default useBudgetActions;
