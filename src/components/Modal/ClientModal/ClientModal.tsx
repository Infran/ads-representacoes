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
import { IClient } from "../../../interfaces/iclient";
import { addClient } from "../../../utils/firebaseUtils";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const FormControlStyled = styled(FormControl)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ClientModalProps {
  open: boolean;
  handleClose: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({ open, handleClose }) => {
  const [client, setClient] = useState<IClient>({} as IClient);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setClient({ ...client, [name]: value });
  };

  const handleAddClient = async () => {
    if (!client.name || !client.phone || !client.email || !client.address) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await addClient(client);
      handleClose();
      setClient({} as IClient); // Limpa o estado ao fechar o modal
      setError(null);
    } catch (error) {
      console.error("Erro ao adicionar cliente:", error);
      setError("Ocorreu um erro ao adicionar o cliente. Tente novamente.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setClient({} as IClient); // Limpa o estado ao fechar o modal
      }}
    >
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h1" gutterBottom>
          Adicionar Cliente
        </Typography>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <FormControlStyled>
          <TextField
            id="name"
            name="name"
            label="Nome"
            variant="outlined"
            value={client.name || ""}
            onChange={handleChange}
          />
          <TextField
            id="phone"
            name="phone"
            label="Telefone"
            variant="outlined"
            value={client.phone || ""}
            onChange={handleChange}
          />
          <TextField
            id="email"
            name="email"
            label="Email"
            variant="outlined"
            value={client.email || ""}
            onChange={handleChange}
          />
          <TextField
            id="address"
            name="address"
            label="Endereço"
            variant="outlined"
            value={client.address || ""}
            onChange={handleChange}
          />
          <Grid container justifyContent="flex-end" gap={2}>
            <Button variant="contained" onClick={handleClose}>
              Cancelar
            </Button>
            <Button variant="contained" onClick={handleAddClient}>
              Adicionar
            </Button>
          </Grid>
        </FormControlStyled>
      </Box>
    </Modal>
  );
};

export default ClientModal;
