import React, { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import { getBudgetById, updateBudget } from "../../services/budgetServices";
import { useBudgetForm } from "../../hooks/useBudgetForm";
import { IBudget } from "../../interfaces/ibudget";
import {
  RepresentativeSelector,
  ProductSelector,
  ProductList,
  BudgetTermsForm,
  BudgetSummary,
} from "../../components/Budget";
import { useData } from "../../context/DataContext";

const EditBudget: React.FC = () => {
  const navigate = useNavigate();
  const { id: budgetId } = useParams<{ id: string }>();
  const [initialData, setInitialData] = useState<IBudget | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Obtém dados do cache para busca local
  const {
    products: cachedProducts,
    representatives: cachedRepresentatives,
    updateBudgetInCache,
  } = useData();

  // Carregar dados do orçamento para edição
  useEffect(() => {
    if (budgetId) {
      setIsLoading(true);
      getBudgetById(budgetId)
        .then((data) => {
          setInitialData(data);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [budgetId]);

  const form = useBudgetForm({
    initialData,
    allowCustomProductValue: true,
    cachedProducts,
    cachedRepresentatives,
  });

  const handleSubmit = async () => {
    if (!budgetId) return;

    try {
      await updateBudget(budgetId, form.budget);
      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Orçamento atualizado com sucesso!",
      }).then(() => {
        navigate("/Orcamentos");
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao atualizar o orçamento.",
      });
      console.error(error);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Deseja descartar as alterações?",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Continuar Editando",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, descartar!",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/Orcamentos");
      }
    });
  };

  if (isLoading) {
    return (
      <Container>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Editar Orçamento #{budgetId}
      </Typography>

      {/* Seletor de Representante */}
      <RepresentativeSelector
        representativeList={form.representativeList}
        searchInput={form.representativeSearchInput}
        onSearchChange={form.setRepresentativeSearchInput}
        onSelect={form.handleSelectRepresentative}
        selectedRepresentative={form.budget.representative}
        // No modo edição, pode-se desabilitar a troca de representante se necessário:
        // disabled={true}
      />

      {/* Produtos */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Produtos
        </Typography>

        <ProductSelector
          productList={form.productList}
          searchTerm={form.productSearchTerm}
          onSearchChange={form.setProductSearchTerm}
          onAddProduct={form.addProduct}
        />

        <ProductList
          products={form.selectedProducts}
          onRemove={form.removeProduct}
          onQuantityChange={form.updateProductQuantity}
          onValueChange={form.updateProductCustomValue} // Edição permite alterar valor
          showOriginalValue={true} // Mostra valor original para referência
        />

        {form.selectedProducts.length > 0 && (
          <BudgetSummary totalValue={form.totalValue} />
        )}
      </Paper>

      {/* Prazos e Observações */}
      <BudgetTermsForm
        budget={form.budget}
        onChange={(updates) =>
          form.setBudget((prev) => ({ ...prev, ...updates }))
        }
      />

      {/* Botões de Ação */}
      <Box display="flex" justifyContent="flex-end" gap={2} mt={2} mb={4}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!form.isValid}
        >
          Salvar Alterações
        </Button>
        <Button variant="contained" color="error" onClick={handleCancel}>
          Cancelar
        </Button>
      </Box>
    </Container>
  );
};

export default EditBudget;
