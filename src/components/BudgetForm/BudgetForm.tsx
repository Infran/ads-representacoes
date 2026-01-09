import { useEffect, useState } from "react";
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Divider,
} from "@mui/material";
import Swal from "sweetalert2";
import { useNavigate } from "react-router";
import { IBudget, ISelectedProducts } from "../../interfaces/ibudget";
import { IRepresentative } from "../../interfaces/irepresentative";
import { addBudget } from "../../services/budgetServices";
import FormProductSection from "../FormProductSection/FormProductSection";
import FormRepresentativeSection from "../FormRepresentativeSection/FormRepresentativeSection";
import FormDeliveryTermsSection from "../FormDeliveryTermsSection/FormDeliveryTermsSection";

interface BudgetFormProps {
  title: string;
  isEditing: boolean;
}

const BudgetForm: React.FC<BudgetFormProps> = ({ title }) => {
  const navigate = useNavigate();

  const [budget, setBudget] = useState<IBudget>({
    tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
    guarantee:
      "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO ",
  } as IBudget);

  const [selectedRepresentative, setSelectedRepresentative] =
    useState<IRepresentative | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProducts[]>(
    []
  );

  const handleBudgetChange = <K extends keyof IBudget>(
    field: K,
    value: IBudget[K]
  ) => {
    setBudget((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAddBudget = (budget: IBudget) => {
    try {
      addBudget(budget);
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
          // Re-render em vez de recarregar a página
          navigate("/Orcamentos/Adicionar");
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

  // Atualiza o valor total do orçamento sempre que os produtos selecionados mudam
  useEffect(() => {
    const totalValue = selectedProducts.reduce(
      (acc, { product, quantity }) => acc + product.unitValue * quantity,
      0
    );
    setBudget((prev) => ({
      ...prev,
      totalValue,
      selectedProducts,
    }));
  }, [selectedProducts]);

  useEffect(() => {
    setBudget((prev) => ({
      ...prev,
      representative: selectedRepresentative,
    }));
  }, [selectedRepresentative]);

  const isBudgetValid = Boolean(
    budget.representative &&
      selectedProducts.length > 0 &&
      budget.estimatedDate &&
      budget.maxDealDate &&
      budget.guarantee &&
      budget.shippingTerms &&
      budget.reference
  );

  return (
    <Container sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h4" gutterBottom>
          {title}
        </Typography>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mb: 4 }}>
          <FormRepresentativeSection
            selectedRepresentative={selectedRepresentative}
            onSelectRepresentative={setSelectedRepresentative}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ mb: 4 }}>
          <FormProductSection
            selectedProducts={selectedProducts}
            onProductsChange={setSelectedProducts}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box sx={{ mb: 4 }}>
          <FormDeliveryTermsSection
            budget={budget}
            onChange={handleBudgetChange}
          />
        </Box>

        <Divider sx={{ mb: 4 }} />

        <Box display="flex" justifyContent="flex-end" gap={2}>
          <Button
            variant="contained"
            onClick={() => handleAddBudget(budget)}
            disabled={!isBudgetValid}
          >
            Salvar
          </Button>
          <Button
            variant="outlined"
            color="error"
            onClick={() => {
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
                  navigate("/orcamentos");
                }
              });
            }}
          >
            Cancelar
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default BudgetForm;
