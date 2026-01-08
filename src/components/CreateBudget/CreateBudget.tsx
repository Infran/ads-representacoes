import React from "react";
import { Container, Typography, Button, Box, Paper } from "@mui/material";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import { addBudget } from "../../services/budgetServices";
import { useBudgetForm } from "../../hooks/useBudgetForm";
import {
  RepresentativeSelector,
  ProductSelector,
  ProductList,
  BudgetTermsForm,
  BudgetSummary,
} from "../../components/Budget";

const CreateBudget: React.FC = () => {
  const navigate = useNavigate();

  const form = useBudgetForm({
    allowCustomProductValue: false, // Criação não permite editar valor dos produtos
  });

  const handleSubmit = async () => {
    try {
      await addBudget(form.budget);
      Swal.fire({
        icon: "success",
        title: "Sucesso!",
        text: "Orçamento cadastrado com sucesso!",
        showCancelButton: true,
        confirmButtonText: "Ir para Orçamentos",
        cancelButtonText: "Adicionar Outro Orçamento",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/Orcamentos");
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          window.location.reload();
        }
      });
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro",
        text: "Erro ao cadastrar orçamento.",
      });
      console.error(error);
    }
  };

  const handleCancel = () => {
    Swal.fire({
      title: "Deseja mesmo descartar o orçamento atual?",
      icon: "warning",
      showCancelButton: true,
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sim, descartar!",
    }).then((result) => {
      if (result.isConfirmed) {
        navigate("/Orcamentos");
      }
    });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Cadastro de Orçamento
      </Typography>

      {/* Seletor de Representante */}
      <RepresentativeSelector
        representativeList={form.representativeList}
        searchInput={form.representativeSearchInput}
        onSearchChange={form.setRepresentativeSearchInput}
        onSelect={form.handleSelectRepresentative}
        selectedRepresentative={form.budget.representative}
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
          // Não passa onValueChange - criação não permite editar valor
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
      <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!form.isValid}
        >
          Salvar
        </Button>
        <Button variant="contained" color="error" onClick={handleCancel}>
          Cancelar
        </Button>
      </Box>
    </Container>
  );
};

export default CreateBudget;
