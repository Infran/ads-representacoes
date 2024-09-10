import React from "react";

import {Box, Button, FormControl, Grid, Modal, TextField, Typography} from "@mui/material";

import {styled} from "@mui/system";

import { IClient} from "../../interfaces/icliente";

const modalStyle = {
  position: "absolute" as "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const FormControlStyled = styled(FormControl)(({theme}) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface ClientModalProps {
  open: boolean;
  handleClose: () => void;
  client?: IClient; // Make client optional
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddClient: () => void;
}

const ClientModal: React.FC<ClientModalProps> = ({
  open,
  handleClose,
  client, // Client can be undefined, handle this case
  handleChange,
  handleAddClient,
}) => {
  // Provide default values or empty strings if client is undefined
  const clientName = client?.name || "";
  const clientPhone = client?.phone || "";
  const clientEmail = client?.email || "";
  const clientAddress = client?.address || "";

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h1" gutterBottom>
          Adicionar Cliente
        </Typography>
        <FormControlStyled>
          <TextField
            id="name"
            name="name"
            label="Nome"
            variant="outlined"
            value={clientName}
            onChange={handleChange}
          />
          <TextField
            id="phone"
            name="phone"
            label="Telefone"
            variant="outlined"
            value={clientPhone}
            onChange={handleChange}
          />
          <TextField
            id="email"
            name="email"
            label="Email"
            variant="outlined"
            value={clientEmail}
            onChange={handleChange}
          />
          <TextField
            id="address"
            name="address"
            label="Endereço"
            variant="outlined"
            value={clientAddress}
            onChange={handleChange}
          />
          <Grid container justifyContent="flex-end">
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