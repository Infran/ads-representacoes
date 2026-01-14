import React, { useState, useEffect, useMemo } from "react";
import {
  Autocomplete,
  Box,
  Button,
  FormControl,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import { IRepresentative } from "../../../../interfaces/irepresentative";
import {
  getRepresentativeById,
  updateRepresentative,
} from "../../../../services/representativeServices";
import { useData } from "../../../../context/DataContext";
import useDebounce from "../../../../hooks/useDebounce";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  maxHeight: "90vh",
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
  overflowY: "auto",
  background: "linear-gradient(145deg, #f5f5f5, #ffffff)",
  border: "1px solid #e0e0e0",
};

const FormControlStyled = styled(FormControl)({
  display: "flex",
  flexDirection: "column",
  gap: "16px", // Fixed gap value
});

const StyledButton = styled(Button)({
  textTransform: "none",
  fontWeight: "bold",
  borderRadius: 4,
  padding: "12px 24px", // Fixed padding
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
  },
});

const StyledTextField = styled(TextField)({
  "& .MuiOutlinedInput-root": {
    borderRadius: 8,
    "& fieldset": {
      borderColor: "#e0e0e0",
    },
    "&:hover fieldset": {
      borderColor: "#1976d2", // Primary color
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1976d2", // Primary color
      borderWidth: 2,
    },
  },
});

interface EditRepresentativeModalProps {
  open: boolean;
  handleClose: () => void;
  id: string;
}

const EditRepresentativeModal: React.FC<EditRepresentativeModalProps> = ({
  open,
  handleClose,
  id,
}) => {
  const [representative, setRepresentative] = useState<IRepresentative>(
    {} as IRepresentative
  );
  const [error, setError] = useState<string | null>(null);
  const [clientSearchTerm, setClientSearchTerm] = useState<string>("");
  const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 300);

  // Usa dados do cache - SEM chamadas ao Firestore!
  const { clients: allClients, updateRepresentativeInCache } = useData();

  // Filtra clientes localmente
  const clientList = useMemo(() => {
    if (!debouncedClientSearchTerm) return [];
    return allClients.filter((client) =>
      client.name
        ?.toLowerCase()
        .includes(debouncedClientSearchTerm.toLowerCase())
    );
  }, [allClients, debouncedClientSearchTerm]);

  useEffect(() => {
    const fetchRepresentativeData = async () => {
      try {
        const representativeData = await getRepresentativeById(id);
        setRepresentative(representativeData);
        if (representativeData.client) {
          setClientSearchTerm(representativeData.client.name);
        }
      } catch (error) {
        console.error("Erro ao buscar representante:", error);
      }
    };

    if (id) {
      fetchRepresentativeData();
    }
  }, [id]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setRepresentative({ ...representative, [name]: value });
  };

  const handleEditRepresentative = async () => {
    if (!representative.name) {
      setError("Por favor, preencha o nome do representante.");
      return;
    }

    try {
      await updateRepresentative(representative);

      // IMPORTANTE: Atualiza o cache para refletir as alterações imediatamente
      updateRepresentativeInCache(representative);

      handleClose();
      setRepresentative({} as IRepresentative);
      setError(null);
    } catch (error) {
      console.error("Erro ao editar representante:", error);
      setError("Ocorreu um erro ao editar o representante. Tente novamente.");
    }
  };

  const isFormValid = representative.name;

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setRepresentative({} as IRepresentative);
      }}
    >
      <Box sx={modalStyle}>
        <Typography
          variant="h6"
          component="h1"
          gutterBottom
          sx={{
            borderBottom: "2px solid",
            borderColor: "#1976d2", // Primary color
            pb: 1,
            mb: 2,
            fontWeight: "bold",
            color: "#1976d2", // Primary color
          }}
        >
          Editar Representante
        </Typography>

        {error && (
          <Typography
            color="error"
            variant="body2"
            sx={{ mb: 2, fontWeight: "bold" }}
          >
            {error}
          </Typography>
        )}

        <FormControlStyled>
          {/* Seção: Informações do Representante */}
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, fontWeight: "bold", color: "text.secondary" }}
          >
            Selecione um cliente:
          </Typography>
          <Autocomplete
            options={clientList}
            getOptionLabel={(option) => option.name}
            onInputChange={(_event, value) => setClientSearchTerm(value)}
            onChange={(_event, value) =>
              setRepresentative({
                ...representative,
                client: value,
                address: value?.address,
                city: value?.city,
                state: value?.state,
                cep: value?.cep,
              })
            }
            noOptionsText="Digite o nome do Cliente."
            value={representative.client || null}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Cliente"
                variant="outlined"
                fullWidth
              />
            )}
          />
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, fontWeight: "bold", color: "text.secondary" }}
          >
            Informações:
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={6}>
              <StyledTextField
                id="name"
                name="name"
                label="Nome"
                variant="outlined"
                value={representative.name || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="role"
                name="role"
                label="Cargo"
                variant="outlined"
                value={representative.role || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Seção: Contato */}
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, fontWeight: "bold", color: "text.secondary" }}
          >
            Contato:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <StyledTextField
                id="email"
                name="email"
                label="Email"
                type="email"
                variant="outlined"
                value={representative.email || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="phone"
                name="phone"
                label="Telefone"
                variant="outlined"
                value={representative.phone || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="mobilePhone"
                name="mobilePhone"
                label="Celular"
                variant="outlined"
                value={representative.mobilePhone || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Seção: Endereço */}
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, fontWeight: "bold", color: "text.secondary" }}
          >
            Endereço:
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <StyledTextField
                id="cep"
                name="cep"
                label="CEP"
                variant="outlined"
                value={representative.cep || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="address"
                name="address"
                label="Endereço"
                variant="outlined"
                value={representative.address || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="state"
                name="state"
                label="Estado"
                variant="outlined"
                value={representative.state || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="city"
                name="city"
                label="Cidade"
                variant="outlined"
                value={representative.city || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
          </Grid>

          {/* Botões de Ação */}
          <Grid container justifyContent="flex-end" gap={2} sx={{ mt: 4 }}>
            <StyledButton
              variant="contained"
              sx={{ bgcolor: "grey", "&:hover": { bgcolor: "darkgrey" } }}
              onClick={handleClose}
            >
              Cancelar
            </StyledButton>
            <StyledButton
              variant="contained"
              sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" } }} // Primary color
              onClick={handleEditRepresentative}
              disabled={!isFormValid}
            >
              Salvar
            </StyledButton>
          </Grid>
        </FormControlStyled>
      </Box>
    </Modal>
  );
};

export default EditRepresentativeModal;
