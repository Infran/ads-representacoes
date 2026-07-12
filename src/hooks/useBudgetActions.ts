import { useNavigate } from "react-router-dom";

import { useData } from "../context/DataContext";
import { addBudget, updateBudget } from "../services/budgetServices";
import { confirmDialog, notifySuccess, notifyWarning, notifyError } from "../ui";
import { logger } from "../utils/logger";
import { UseBudgetFormReturn } from "./useBudgetForm";

interface UseBudgetActionsOptions {
  form: UseBudgetFormReturn;
  isEditing: boolean;
  budgetId?: string;
}

/**
 * Encapsula as ações de persistência do formulário de orçamento (EST F3.1):
 * salvar (create/edit) e cancelar, com feedback via átomos tokenizados de
 * `src/ui` (`confirmDialog`/`notify*` — U3.4) e navegação.
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
      notifyWarning(
        "Campos obrigatórios",
        "Preencha todos os campos obrigatórios antes de salvar."
      );
      return;
    }

    try {
      if (isEditing && budgetId) {
        await updateBudget(budgetId, form.budget);
        updateBudgetInCache({ ...form.budget, id: budgetId });
        await notifySuccess("Sucesso!", "Orçamento atualizado com sucesso!");
        navigate("/Orcamentos");
      } else {
        const newBudget = await addBudget(form.budget);
        addBudgetToCache(newBudget);
        // Sucesso com escolha: "Ir para Orçamentos" (confirmar) ou "Adicionar Outro".
        const goToList = await confirmDialog({
          icon: "success",
          title: "Sucesso!",
          text: "Orçamento cadastrado com sucesso!",
          confirmText: "Ir para Orçamentos",
          cancelText: "Adicionar Outro",
        });
        if (goToList) {
          navigate("/Orcamentos");
        } else {
          form.reset();
        }
      }
    } catch (error) {
      notifyError(
        "Erro",
        `Erro ao ${isEditing ? "atualizar" : "cadastrar"} o orçamento.`
      );
      logger.error(error);
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
