import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  Modal,
  TextField,
  Typography,
} from "@mui/material";
import { styled } from "@mui/system";
import { IClient } from "../../../../interfaces/iclient";
import { addClient } from "../../../../services/clientServices";

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
  gap: "16px", // Substituí theme.spacing(2) por um valor fixo
});

const StyledButton = styled(Button)({
  textTransform: "none",
  fontWeight: "bold",
  borderRadius: 4,
  padding: "12px 24px", // Substituí theme.spacing(1.5, 3) por valores fixos
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
      borderColor: "#1976d2", // Cor primária do Material-UI
    },
    "&.Mui-focused fieldset": {
      borderColor: "#1976d2", // Cor primária do Material-UI
      borderWidth: 2,
    },
  },
});

interface CreateClientModalProps {
  open: boolean;
  handleClose: () => void;
}

const CreateClientModal: React.FC<CreateClientModalProps> = ({ open, handleClose }) => {
  const [client, setClient] = useState<IClient>({} as IClient);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
  };

  const handleAddClient = async () => {
    // Validação básica de campos obrigatórios
    if (!client.name || !client.cep) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      console.log("Adicionando cliente:", client);
      await addClient(client);

      // Limpa o formulário e o erro após a adição bem-sucedida
      handleClose();
      setClient({} as IClient);
      setError(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      setError("Ocorreu um erro ao adicionar o cliente. Tente novamente.");
    }
  };

  const isFormValid = client.name && client.cep;

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setClient({} as IClient);
      }}
    >
      <Box sx={modalStyle}>
        <Typography
          variant="h6"
          component="h1"
          gutterBottom
          sx={{
            borderBottom: "2px solid",
            borderColor: "#1976d2", // Cor primária do Material-UI
            pb: 1,
            mb: 2,
            fontWeight: "bold",
            color: "#1976d2", // Cor primária do Material-UI
          }}
        >
          Adicionar Cliente
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
          {/* Seção: Informações do Cliente */}
          <Typography
            variant="subtitle1"
            sx={{ mt: 2, fontWeight: "bold", color: "text.secondary" }}
          >
            Informações:
          </Typography>

          <StyledTextField
            id="name"
            name="name"
            label="Nome"
            variant="outlined"
            value={client.name || ""}
            onChange={handleChange}
            required
          />
          <StyledTextField
            id="cnpj"
            name="cnpj"
            label="CNPJ"
            variant="outlined"
            value={client.cnpj || ""}
            onChange={handleChange}
            fullWidth
          />

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
                id="phone"
                name="phone"
                label="Telefone"
                variant="outlined"
                value={client.phone || ""}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={6}>
              <StyledTextField
                id="email"
                name="email"
                label="Email"
                type="email"
                variant="outlined"
                value={client.email || ""}
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
                value={client.cep || ""}
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
                value={client.address || ""}
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
                value={client.city || ""}
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
                value={client.state || ""}
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
              sx={{ bgcolor: "#1976d2", "&:hover": { bgcolor: "#1565c0" } }} // Cores primárias do Material-UI
              onClick={handleAddClient}
              disabled={!isFormValid}
            >
              Adicionar
            </StyledButton>
          </Grid>
        </FormControlStyled>
      </Box>
    </Modal>
  );
};

export default CreateClientModal;
