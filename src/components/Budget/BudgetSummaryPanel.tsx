import React from "react";
import {
  Paper,
  Box,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from "@mui/material";
import {
  Person,
  Inventory2,
  Description,
  CheckCircle,
  RadioButtonUnchecked,
  AttachMoney,
} from "@mui/icons-material";
import { IBudget } from "../../interfaces/ibudget";
import { SectionValidation } from "../../hooks/useBudgetForm";
import { brMoneyMask } from "../../utils/Masks";

interface BudgetSummaryPanelProps {
  budget: IBudget;
  totalValue: number;
  sectionValidation: SectionValidation;
  productCount: number;
}

const StatusIcon: React.FC<{ isComplete: boolean }> = ({ isComplete }) => {
  if (isComplete) {
    return <CheckCircle sx={{ color: "success.main" }} />;
  }
  return <RadioButtonUnchecked sx={{ color: "text.disabled" }} />;
};

const BudgetSummaryPanel: React.FC<BudgetSummaryPanelProps> = ({
  budget,
  totalValue,
  sectionValidation,
  productCount,
}) => {
  const { representative, products, terms } = sectionValidation;

  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        borderRadius: 3,
        position: "sticky",
        top: 24,
        bgcolor: "background.paper",
      }}
    >
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Resumo do Orçamento
      </Typography>

      <Divider sx={{ my: 2 }} />

      {/* Status das Seções */}
      <List dense disablePadding>
        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <StatusIcon isComplete={representative.isComplete} />
          </ListItemIcon>
          <ListItemText
            primary="Representante"
            secondary={
              representative.isComplete
                ? budget.representative?.name || "Selecionado"
                : "Pendente"
            }
            primaryTypographyProps={{ fontWeight: 500 }}
            secondaryTypographyProps={{
              color: representative.isComplete
                ? "text.secondary"
                : "warning.main",
            }}
          />
        </ListItem>

        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <StatusIcon isComplete={products.isComplete} />
          </ListItemIcon>
          <ListItemText
            primary="Produtos"
            secondary={
              products.isComplete
                ? `${productCount} ${productCount === 1 ? "item" : "itens"}`
                : "Nenhum produto"
            }
            primaryTypographyProps={{ fontWeight: 500 }}
            secondaryTypographyProps={{
              color: products.isComplete ? "text.secondary" : "warning.main",
            }}
          />
          {products.isComplete && (
            <Chip
              size="small"
              label={productCount}
              color="primary"
              sx={{ ml: 1 }}
            />
          )}
        </ListItem>

        <ListItem disableGutters>
          <ListItemIcon sx={{ minWidth: 36 }}>
            <StatusIcon isComplete={terms.isComplete} />
          </ListItemIcon>
          <ListItemText
            primary="Condições"
            secondary={
              terms.isComplete
                ? "Completo"
                : `${terms.filledCount}/${terms.totalRequired} preenchidos`
            }
            primaryTypographyProps={{ fontWeight: 500 }}
            secondaryTypographyProps={{
              color: terms.isComplete ? "text.secondary" : "warning.main",
            }}
          />
        </ListItem>
      </List>

      <Divider sx={{ my: 2 }} />

      {/* Cliente selecionado */}
      {budget.client?.name && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Cliente
          </Typography>
          <Typography variant="body2" fontWeight={500}>
            {budget.client.name}
          </Typography>
          {budget.client.city && (
            <Typography variant="caption" color="text.secondary">
              {budget.client.city} - {budget.client.state}
            </Typography>
          )}
        </Box>
      )}

      {/* Valor Total */}
      <Box
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 2,
          bgcolor: totalValue > 0 ? "primary.main" : "grey.100",
          color: totalValue > 0 ? "primary.contrastText" : "text.secondary",
        }}
      >
        <Typography variant="caption" sx={{ opacity: 0.9 }}>
          Valor Total
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          R$ {brMoneyMask(totalValue.toFixed(0))}
        </Typography>
      </Box>

      {/* Indicador de completude geral */}
      <Box sx={{ mt: 2, textAlign: "center" }}>
        {representative.isComplete &&
        products.isComplete &&
        terms.isComplete ? (
          <Chip
            icon={<CheckCircle />}
            label="Pronto para salvar"
            color="success"
            variant="filled"
          />
        ) : (
          <Typography variant="caption" color="text.secondary">
            Preencha todos os campos obrigatórios
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

export default BudgetSummaryPanel;
