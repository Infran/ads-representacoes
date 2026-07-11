import React, { useState, useEffect } from "react";
import { Container, Grid, Typography, Box, CircularProgress } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";

import { useBudgetForm } from "../../hooks/useBudgetForm";
import { useBudgetActions } from "../../hooks/useBudgetActions";
import { IBudget } from "../../interfaces/ibudget";
import { getBudgetById } from "../../services/budgetServices";
import { BudgetTemplate } from "../../utils/PDFGenerator/BudgetPdf";

import {
  BudgetAccordion,
  BudgetSummaryPanel,
  BudgetPreviewModal,
  BudgetFormActions,
  RepresentativeSection,
  ProductsSection,
  TermsSection,
} from "../../components/Budget";
import { AccordionSectionProps } from "../../components/Budget/BudgetAccordion";

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

  // Hook do formulário + ações de persistência (create/edit)
  const form = useBudgetForm({ initialData });
  const { handleSave, handleCancel } = useBudgetActions({
    form,
    isEditing,
    budgetId,
  });

  // Handler para mudança de painel do acordeão (múltiplos podem estar abertos)
  const handlePanelChange =
    (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
      setExpandedPanels((prev) =>
        isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)
      );
    };

  const handleExpandAll = () =>
    setExpandedPanels(["representative", "products", "terms"]);
  const handleCollapseAll = () => setExpandedPanels([]);

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

  // Configuração das seções do acordeão (conteúdo em componentes dedicados — EST F3.1)
  const accordionSections: AccordionSectionProps[] = [
    {
      id: "representative",
      title: "Representante",
      isComplete: form.sectionValidation.representative.isComplete,
      statusText: form.sectionValidation.representative.isComplete
        ? form.budget.representative?.name
        : undefined,
      children: <RepresentativeSection form={form} />,
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
      children: <ProductsSection form={form} />,
    },
    {
      id: "terms",
      title: "Condições Comerciais",
      isComplete: form.sectionValidation.terms.isComplete,
      statusText: !form.sectionValidation.terms.isComplete
        ? `${form.sectionValidation.terms.filledCount}/${form.sectionValidation.terms.totalRequired}`
        : "Completo",
      children: <TermsSection form={form} />,
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

          <BudgetFormActions
            isEditing={isEditing}
            isValid={form.isValid}
            onPreview={() => setPreviewOpen(true)}
            onSave={handleSave}
            onCancel={handleCancel}
          />
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
