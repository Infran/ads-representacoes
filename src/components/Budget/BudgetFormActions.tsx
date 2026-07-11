import React from "react";
import { Box, Button } from "@mui/material";
import { Save, Cancel, Visibility } from "@mui/icons-material";

interface BudgetFormActionsProps {
  isEditing: boolean;
  isValid: boolean;
  onPreview: () => void;
  onSave: () => void;
  onCancel: () => void;
}

/**
 * Barra de ações do formulário de orçamento (EST F3.1):
 * pré-visualizar PDF, salvar e cancelar.
 */
const BudgetFormActions: React.FC<BudgetFormActionsProps> = ({
  isEditing,
  isValid,
  onPreview,
  onSave,
  onCancel,
}) => (
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
      onClick={onPreview}
      disabled={!isValid}
    >
      Pré-visualizar PDF
    </Button>

    <Button
      variant="contained"
      color="primary"
      startIcon={<Save />}
      onClick={onSave}
      disabled={!isValid}
    >
      {isEditing ? "Salvar Alterações" : "Salvar Orçamento"}
    </Button>

    <Button
      variant="outlined"
      color="error"
      startIcon={<Cancel />}
      onClick={onCancel}
    >
      Cancelar
    </Button>
  </Box>
);

export default BudgetFormActions;
