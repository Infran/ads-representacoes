import React, { useState, useEffect } from "react";
import {
  Container,
  Grid,
  Typography,
  Button,
  Box,
  CircularProgress,
  Autocomplete,
  TextField,
  Paper,
} from "@mui/material";
import {
  Save,
  Cancel,
  Visibility,
  Person,
  Inventory2,
  Description,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { useBudgetForm } from "../../hooks/useBudgetForm";
import { useData } from "../../context/DataContext";
import { IBudget } from "../../interfaces/ibudget";
import {
  getBudgetById,
  addBudget,
  updateBudget,
} from "../../services/budgetServices";
import { BudgetTemplate } from "../../utils/PDFGenerator/BudgetPdf";

import {
  BudgetAccordion,
  BudgetSummaryPanel,
  BudgetPreviewModal,
  ProductSelector,
  ProductList,
  BudgetTermsForm,
} from "../../components/Budget";
import { AccordionSectionProps } from "../../components/Budget/BudgetAccordion";
import { IRepresentative } from "../../interfaces/irepresentative";

interface BudgetFormPageProps {
  mode: "create" | "edit";
}

const BudgetFormPage: React.FC<BudgetFormPageProps> = ({ mode }) => {
  const navigate = useNavigate();
  const { id: budgetId } = useParams<{ id: string }>();
  const isEditing = mode === "edit";

  // Estado para dados iniciais (modo edição)
  const [initialData, setInitialData] = useState<IBudget | null>(null);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Estado do acordeão - agora suporta múltiplos painéis abertos
  const [expandedPanels, setExpandedPanels] = useState<string[]>([
    "representative",
    "products",
    "terms",
  ]);

  // Dados do contexto
  const { updateBudgetInCache, addBudgetToCache } = useData();

  // Carregar dados do orçamento para edição
  useEffect(() => {
    if (isEditing && budgetId) {
      setIsLoading(true);
      getBudgetById(budgetId)
        .then((data) => {
          setInitialData(data);
        })
        .catch((error) => {
          console.error("Erro ao carregar orçamento:", error);
          Swal.fire({
            icon: "error",
            title: "Erro",
            text: "Não foi possível carregar o orçamento.",
          }).then(() => navigate("/Orcamentos"));
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isEditing, budgetId, navigate]);

  // Hook do formulário
  const form = useBudgetForm({
    initialData,
  });

  // Handler para mudança de painel do acordeão (múltiplos podem estar abertos)
  const handlePanelChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanels((prev) =>
        isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
      );
    };

  // Handlers para expandir/recolher todos
  const handleExpandAll = () => {
    setExpandedPanels(["representative", "products", "terms"]);
  };

  const handleCollapseAll = () => {
    setExpandedPanels([]);
  };

  // Handler para salvar
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
            window.location.reload();
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

  // Handler para cancelar
  const handleCancel = () => {
    Swal.fire({
      title: isEditing
        ? "Deseja descartar as alterações?"
        : "Deseja descartar o orçamento?",
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

  // Loading state
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

  // Configuração das seções do acordeão
  const accordionSections: AccordionSectionProps[] = [
    {
      id: "representative",
      title: "Representante",
      isComplete: form.sectionValidation.representative.isComplete,
      statusText: form.sectionValidation.representative.isComplete
        ? form.budget.representative?.name
        : undefined,
      children: (
        <Box>
          <Autocomplete
            options={form.representativeList}
            getOptionLabel={(option) => option.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            inputValue={form.representativeSearchInput}
            onInputChange={(_, value) =>
              form.setRepresentativeSearchInput(value)
            }
            value={
              form.budget.representative?.name
                ? form.budget.representative
                : null
            }
            onChange={(_, value) => form.handleSelectRepresentative(value)}
            noOptionsText={
              form.representativeSearchInput
                ? "Nenhum representante encontrado"
                : "Digite para buscar"
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Buscar representante"
                placeholder="Digite o nome do representante..."
                fullWidth
              />
            )}
            sx={{ mb: 3 }}
          />

          {form.budget.representative?.name && (
            <Grid container spacing={2}>
              {/* Card Cliente */}
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Cliente
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {form.budget.client?.name}
                  </Typography>
                  {form.budget.client?.cnpj && (
                    <Typography variant="body2" color="text.secondary">
                      CNPJ: {form.budget.client.cnpj}
                    </Typography>
                  )}
                  {form.budget.client?.phone && (
                    <Typography variant="body2" color="text.secondary">
                      Tel: {form.budget.client.phone}
                    </Typography>
                  )}
                  {form.budget.client?.email && (
                    <Typography variant="body2" color="text.secondary">
                      {form.budget.client.email}
                    </Typography>
                  )}
                  {form.budget.client?.address && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {form.budget.client.address}
                    </Typography>
                  )}
                  {(form.budget.client?.city || form.budget.client?.state) && (
                    <Typography variant="body2" color="text.secondary">
                      {[form.budget.client?.city, form.budget.client?.state]
                        .filter(Boolean)
                        .join(" - ")}
                    </Typography>
                  )}
                </Paper>
              </Grid>

              {/* Card Representante */}
              <Grid item xs={12} sm={6}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ mb: 0.5, display: "block" }}
                >
                  Representante
                </Typography>
                <Paper
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: "background.paper",
                    border: "1px solid",
                    borderColor: "divider",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                    {form.budget.representative.name}
                  </Typography>
                  {form.budget.representative.role && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      fontStyle="italic"
                    >
                      {form.budget.representative.role}
                    </Typography>
                  )}
                  {form.budget.representative.email && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {form.budget.representative.email}
                    </Typography>
                  )}
                  {form.budget.representative.phone && (
                    <Typography variant="body2" color="text.secondary">
                      Tel: {form.budget.representative.phone}
                    </Typography>
                  )}
                  {form.budget.representative.mobilePhone && (
                    <Typography variant="body2" color="text.secondary">
                      Cel: {form.budget.representative.mobilePhone}
                    </Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
          )}
        </Box>
      ),
    },
    {
      id: "products",
      title: "Produtos",
      isComplete: form.sectionValidation.products.isComplete,
      statusText: form.sectionValidation.products.isComplete
        ? `${form.sectionValidation.products.count} ${
            form.sectionValidation.products.count === 1 ? "item" : "itens"
          }`
        : undefined,
      children: (
        <Box>
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
            onSetQuantity={form.setProductQuantity}
            onValueChange={form.updateProductCustomValue}
            showOriginalValue={true}
          />

          {form.selectedProducts.length > 0 && (
            <Paper
              elevation={1}
              sx={{
                mt: 2,
                p: 2,
                borderRadius: 2,
                bgcolor: "primary.light",
                color: "primary.contrastText",
                textAlign: "right",
              }}
            >
              <Typography variant="h6" fontWeight={600}>
                Total: R${" "}
                {form.totalValue.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </Typography>
            </Paper>
          )}
        </Box>
      ),
    },
    {
      id: "terms",
      title: "Condições Comerciais",
      isComplete: form.sectionValidation.terms.isComplete,
      statusText: !form.sectionValidation.terms.isComplete
        ? `${form.sectionValidation.terms.filledCount}/${form.sectionValidation.terms.totalRequired}`
        : "Completo",
      children: (
        <BudgetTermsForm
          budget={form.budget}
          onChange={(updates) =>
            form.setBudget((prev) => ({ ...prev, ...updates }))
          }
        />
      ),
    },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Título */}
      <Typography variant="h4" fontWeight={600} gutterBottom>
        {isEditing ? `Editar Orçamento #${budgetId}` : "Novo Orçamento"}
      </Typography>

      {/* Layout principal */}
      <Grid container spacing={3}>
        {/* Coluna do Acordeão */}
        <Grid item xs={12} lg={8}>
          <BudgetAccordion
            sections={accordionSections}
            expandedPanels={expandedPanels}
            onPanelChange={handlePanelChange}
            onExpandAll={handleExpandAll}
            onCollapseAll={handleCollapseAll}
          />

          {/* Botões de Ação */}
          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: 3,
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            <Button
              variant="outlined"
              color="info"
              startIcon={<Visibility />}
              onClick={() => setPreviewOpen(true)}
              disabled={!form.isValid}
            >
              Pré-visualizar PDF
            </Button>

            <Button
              variant="contained"
              color="primary"
              startIcon={<Save />}
              onClick={handleSave}
              disabled={!form.isValid}
            >
              {isEditing ? "Salvar Alterações" : "Salvar Orçamento"}
            </Button>

            <Button
              variant="outlined"
              color="error"
              startIcon={<Cancel />}
              onClick={handleCancel}
            >
              Cancelar
            </Button>
          </Box>
        </Grid>

        {/* Coluna do Resumo */}
        <Grid item xs={12} lg={4}>
          <BudgetSummaryPanel
            budget={form.budget}
            totalValue={form.totalValue}
            sectionValidation={form.sectionValidation}
            productCount={form.selectedProducts.length}
          />
        </Grid>
      </Grid>

      {/* Modal de Preview */}
      <BudgetPreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        budget={form.budget}
        pdfDocument={<BudgetTemplate budget={form.budget} />}
      />
    </Container>
  );
};

export default BudgetFormPage;
