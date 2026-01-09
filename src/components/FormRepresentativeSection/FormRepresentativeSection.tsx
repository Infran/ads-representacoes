import { useState, useMemo } from "react";
import {
  Autocomplete,
  Box,
  Grid,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { IRepresentative } from "../../interfaces/irepresentative";
import { useData } from "../../context/DataContext";
import useDebounce from "../../hooks/useDebounce";

interface RepresentativeSectionProps {
  selectedRepresentative: IRepresentative | null;
  onSelectRepresentative: (rep: IRepresentative | null) => void;
}

const FormRepresentativeSection: React.FC<RepresentativeSectionProps> = ({
  selectedRepresentative,
  onSelectRepresentative,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const debouncedSearchTerm = useDebounce(searchInput, 300);

  // Usa dados do cache via DataContext - SEM chamadas ao Firestore!
  const { representatives: allRepresentatives } = useData();

  // Filtragem local dos representantes baseada no termo de busca
  const representativeList = useMemo(() => {
    if (!debouncedSearchTerm) return [];

    return allRepresentatives.filter((representative) =>
      representative.name
        ?.toLowerCase()
        .includes(debouncedSearchTerm.toLowerCase())
    );
  }, [allRepresentatives, debouncedSearchTerm]);

  return (
    <Box mb={4}>
      <Typography variant="h5" fontWeight={600} gutterBottom>
        Representante
      </Typography>

      <Autocomplete
        options={representativeList}
        getOptionLabel={(option) => option.name || ""}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        inputValue={searchInput}
        onInputChange={(_, value) => setSearchInput(value)}
        value={selectedRepresentative}
        onChange={(_, value) => onSelectRepresentative(value)}
        noOptionsText={
          debouncedSearchTerm
            ? "Nenhum representante encontrado"
            : "Digite para buscar"
        }
        renderInput={(params) => (
          <TextField {...params} label="Selecione o representante" fullWidth />
        )}
        sx={{ mb: 3 }}
      />

      {selectedRepresentative && (
        <Paper
          elevation={1}
          sx={{
            p: 3,
            borderRadius: 2,
            backgroundColor: "#f9f9f9",
            border: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="h6" fontWeight={600} gutterBottom>
            {selectedRepresentative.client?.name}
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography
                variant="body2"
                fontWeight={500}
                color="text.secondary"
              >
                Representante
              </Typography>
              <Typography variant="body1">
                {selectedRepresentative.name}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="body2"
                fontWeight={500}
                color="text.secondary"
              >
                Email
              </Typography>
              <Typography variant="body1">
                {selectedRepresentative.email}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="body2"
                fontWeight={500}
                color="text.secondary"
              >
                Telefone
              </Typography>
              <Typography variant="body1">
                {selectedRepresentative.phone}
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography
                variant="body2"
                fontWeight={500}
                color="text.secondary"
              >
                Endereço
              </Typography>
              <Typography variant="body1">
                {selectedRepresentative.client?.address}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default FormRepresentativeSection;
