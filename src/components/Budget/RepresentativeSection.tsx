import React from "react";
import { Autocomplete, Box, Grid, TextField, Typography } from "@mui/material";
import { UseBudgetFormReturn } from "../../hooks/useBudgetForm";
import { getEstadoNome } from "../../utils/ufs";
import EntityInfoCard from "./EntityInfoCard";

interface RepresentativeSectionProps {
  form: UseBudgetFormReturn;
}

/**
 * Seção "Representante" do formulário de orçamento (EST F3.1).
 * Autocomplete de busca + cards de Cliente/Representante selecionados.
 */
const RepresentativeSection: React.FC<RepresentativeSectionProps> = ({
  form,
}) => {
  const { budget } = form;

  return (
    <Box>
      <Autocomplete
        options={form.representativeList}
        getOptionLabel={(option) => option.name || ""}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        inputValue={form.representativeSearchInput}
        onInputChange={(_, value) => form.setRepresentativeSearchInput(value)}
        value={budget.representative?.name ? budget.representative : null}
        onChange={(_, value) => form.handleSelectRepresentative(value)}
        openOnFocus
        noOptionsText="Nenhum representante encontrado"
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

      {budget.representative?.name && (
        <Grid container spacing={2}>
          {/* Card Cliente */}
          <Grid item xs={12} sm={6}>
            <EntityInfoCard caption="Cliente" title={budget.client?.name}>
              {budget.client?.cnpj && (
                <Typography variant="body2" color="text.secondary">
                  CNPJ: {budget.client.cnpj}
                </Typography>
              )}
              {budget.client?.phone && (
                <Typography variant="body2" color="text.secondary">
                  Tel: {budget.client.phone}
                </Typography>
              )}
              {budget.client?.email && (
                <Typography variant="body2" color="text.secondary">
                  {budget.client.email}
                </Typography>
              )}
              {budget.client?.address && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {budget.client.address}
                </Typography>
              )}
              {(budget.client?.city || getEstadoNome(budget.client)) && (
                <Typography variant="body2" color="text.secondary">
                  {[budget.client?.city, getEstadoNome(budget.client)]
                    .filter(Boolean)
                    .join(" - ")}
                </Typography>
              )}
            </EntityInfoCard>
          </Grid>

          {/* Card Representante */}
          <Grid item xs={12} sm={6}>
            <EntityInfoCard
              caption="Representante"
              title={budget.representative.name}
            >
              {budget.representative.role && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  fontStyle="italic"
                >
                  {budget.representative.role}
                </Typography>
              )}
              {budget.representative.email && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1 }}
                >
                  {budget.representative.email}
                </Typography>
              )}
              {budget.representative.phone && (
                <Typography variant="body2" color="text.secondary">
                  Tel: {budget.representative.phone}
                </Typography>
              )}
              {budget.representative.mobilePhone && (
                <Typography variant="body2" color="text.secondary">
                  Cel: {budget.representative.mobilePhone}
                </Typography>
              )}
            </EntityInfoCard>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default RepresentativeSection;
