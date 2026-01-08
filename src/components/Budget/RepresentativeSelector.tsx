import React from "react";
import {
  Autocomplete,
  Box,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { IRepresentative } from "../../interfaces/irepresentative";

interface RepresentativeSelectorProps {
  representativeList: IRepresentative[];
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSelect: (representative: IRepresentative | null) => void;
  selectedRepresentative?: IRepresentative | null;
  disabled?: boolean;
}

const RepresentativeSelector: React.FC<RepresentativeSelectorProps> = ({
  representativeList,
  searchInput,
  onSearchChange,
  onSelect,
  selectedRepresentative,
  disabled = false,
}) => {
  return (
    <Paper sx={{ padding: 2, marginBottom: 2 }}>
      <Typography variant="h5" gutterBottom>
        Dados do Representante
      </Typography>
      <Box display="flex" gap={2}>
        <Autocomplete
          options={representativeList}
          getOptionLabel={(option) => option.name}
          noOptionsText="Pesquise um representante cadastrado."
          inputValue={searchInput}
          onInputChange={(_e, value) => onSearchChange(value)}
          disabled={disabled}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Busque um representante"
              required
              onChange={(e) => onSearchChange(e.target.value)}
            />
          )}
          onChange={(_event, value) => onSelect(value)}
          sx={{ flexGrow: 1 }}
        />
      </Box>

      {selectedRepresentative?.name && (
        <Box mt={2} p={2} borderRadius={4} bgcolor="#f5f5f5">
          {selectedRepresentative.client?.name && (
            <Typography variant="subtitle1" marginBottom={2}>
              Cliente: {selectedRepresentative.client.name}
            </Typography>
          )}
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Typography variant="subtitle1">
                Nome: {selectedRepresentative.name}
              </Typography>
              {selectedRepresentative.email && (
                <Typography variant="subtitle1">
                  Email: {selectedRepresentative.email}
                </Typography>
              )}
            </Grid>
            <Grid item xs={6}>
              {selectedRepresentative.phone && (
                <Typography variant="subtitle1">
                  Telefone: {selectedRepresentative.phone}
                </Typography>
              )}
              {selectedRepresentative.address && (
                <Typography variant="subtitle1">
                  Endereço: {selectedRepresentative.address}
                </Typography>
              )}
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default RepresentativeSelector;
