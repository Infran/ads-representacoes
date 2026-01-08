import React from "react";
import {
  Autocomplete,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { IBudget } from "../../interfaces/ibudget";

interface BudgetTermsFormProps {
  budget: IBudget;
  onChange: (updates: Partial<IBudget>) => void;
}

const BudgetTermsForm: React.FC<BudgetTermsFormProps> = ({
  budget,
  onChange,
}) => {
  const handleChange = (field: keyof IBudget, value: string | null) => {
    onChange({ [field]: value });
  };

  return (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h5" gutterBottom>
        Prazos e Observações
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <TextField
            label="Prazo para Entrega"
            type="text"
            placeholder="EX.: Á COMBINAR / 20 DIAS"
            fullWidth
            required
            value={budget.estimatedDate || ""}
            onChange={(e) => handleChange("estimatedDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Validade da Proposta"
            type="text"
            fullWidth
            required
            placeholder="Ex.: 15 DIAS ÚTEIS"
            value={budget.maxDealDate || ""}
            onChange={(e) => handleChange("maxDealDate", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6}>
          <TextField
            label="Condição de Pagamento"
            type="text"
            fullWidth
            placeholder="28 DDL"
            value={budget.paymentTerms || ""}
            onChange={(e) => handleChange("paymentTerms", e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={6}>
          <Autocomplete
            options={["CIF", "FOB"]}
            value={budget.shippingTerms || null}
            onChange={(_, value) => handleChange("shippingTerms", value)}
            renderInput={(params) => (
              <TextField {...params} label="Condição de Entrega" fullWidth />
            )}
          />
        </Grid>
      </Grid>
      <TextField
        label="Garantia"
        fullWidth
        margin="normal"
        required
        value={budget.guarantee || ""}
        onChange={(e) => handleChange("guarantee", e.target.value)}
      />
      <TextField
        label="Imposto"
        fullWidth
        margin="normal"
        required
        value={budget.tax || ""}
        onChange={(e) => handleChange("tax", e.target.value)}
      />
      <TextField
        label="Referência"
        fullWidth
        margin="normal"
        required
        value={budget.reference || ""}
        onChange={(e) => handleChange("reference", e.target.value)}
        placeholder="Orçamento / Proposta de fornecimento"
      />
    </Paper>
  );
};

export default BudgetTermsForm;
