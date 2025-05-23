import {
  Autocomplete,
  Grid,
  Paper,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { IBudget } from "../../interfaces/ibudget";

interface DeliveryTermsSectionProps {
  budget: IBudget;
  onChange: <K extends keyof IBudget>(field: K, value: IBudget[K]) => void;
}

const FormDeliveryTermsSection: React.FC<DeliveryTermsSectionProps> = ({
  budget,
  onChange,
}) => {
  const renderTextInput = (
    label: string,
    field: keyof IBudget,
    placeholder?: string,
    required = false
  ) => (
    <TextField
      label={label}
      placeholder={placeholder}
      fullWidth
      required={required}
      value={budget[field] ?? ""}
      onChange={(e) => onChange(field, e.target.value as IBudget[typeof field])}
      margin="normal"
      InputLabelProps={{ shrink: true }}
    />
  );

  return (
    <Box mb={4}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Prazos e Observações
      </Typography>

      <Paper
        elevation={1}
        sx={{
          p: 3,
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
          border: "1px solid #e0e0e0",
        }}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            {renderTextInput(
              "Prazo para Entrega",
              "estimatedDate",
              "Ex.: À combinar / 20 dias",
              true
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTextInput(
              "Validade da Proposta",
              "maxDealDate",
              "Ex.: 15 dias úteis",
              true
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            {renderTextInput(
              "Condição de Pagamento",
              "paymentTerms",
              "Ex.: 28 DDL"
            )}
          </Grid>
          <Grid item xs={12} md={6}>
            <Autocomplete
              options={["CIF", "FOB"]}
              value={budget.shippingTerms || ""}
              onChange={(_, value) =>
                onChange("shippingTerms", value as IBudget["shippingTerms"])
              }
              freeSolo
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Condição de Entrega"
                  fullWidth
                  margin="normal" 
                />
              )}
            />
          </Grid>
          <Grid item xs={12}>
            {renderTextInput("Garantia", "guarantee", undefined, true)}
          </Grid>
          <Grid item xs={12}>
            {renderTextInput("Imposto", "tax", undefined, true)}
          </Grid>
          <Grid item xs={12}>
            {renderTextInput(
              "Referência",
              "reference",
              "Orçamento / Proposta de fornecimento",
              true
            )}
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default FormDeliveryTermsSection;
