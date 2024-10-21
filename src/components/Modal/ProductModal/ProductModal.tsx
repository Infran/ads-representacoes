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
import { IProduct } from "../../../interfaces/iproduct";
import { addProduct } from "../../../utils/firebaseUtils";
import ncmData from "../../../tabela_ncm.json";

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

interface ProductModalProps {
  open: boolean;
  handleClose: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ open, handleClose }) => {
  const [product, setProduct] = useState<IProduct>({} as IProduct);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setProduct({ ...product, [name]: value });
  };

  const handleAddProduct = async () => {
    if (!product.name || !product.ncm || !product.quantity || !product.unitValue) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await addProduct(product);
      handleClose();
      setProduct({} as IProduct); // Limpa o estado ao fechar o modal
      setError(null);
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      setError("Ocorreu um erro ao adicionar o produto. Tente novamente.");
    }
  };

  const handleNcmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const ncm = value.replace(/\D/g, '');

    const ncmEntry = ncmData.Nomenclaturas.find(item =>
      item.Codigo.replace(/\D/g, '') === ncm
    );

    if (ncmEntry) {
      setProduct((prevProduct) => ({
        ...prevProduct,
        ncm: value,
        description: ncmEntry.Descricao,
      }));
    } else {
      setProduct((prevProduct) => ({
        ...prevProduct,
        ncm: value,
        description: "",
      }));
    }
  };

  return (
    <Modal open={open} onClose={() => { handleClose(); setProduct({} as IProduct); }}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h1" gutterBottom>
          Adicionar Produto
        </Typography>
        {error && (
          <Typography color="error" variant="body2">
            {error}
          </Typography>
        )}
        <FormControlStyled>
          <TextField
            id="ncm"
            name="ncm"
            label="NCM"
            variant="outlined"
            fullWidth
            value={product.ncm || ""}
            onChange={handleNcmChange}
          />
          <TextField
            id="name"
            name="name"
            label="Nome do Produto"
            variant="outlined"
            value={product.name || ""}
            onChange={handleChange}
          />
          <TextField
            id="description"
            name="description"
            label="Descrição"
            variant="outlined"
            value={product.description || ""}
            onChange={handleChange}
          />
          <TextField
            id="icms"
            name="icms"
            label="ICMS"
            variant="outlined"
            fullWidth
            value={product.icms || "18"}
            onChange={handleChange}
            InputProps={{
              endAdornment: "%",
            }}
            sx={{ textAlign: "end" }}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                id="quantity"
                name="quantity"
                label="Quantidade"
                variant="outlined"
                fullWidth
                value={product.quantity || ""}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="unitValue"
                name="unitValue"
                label="Valor (Unit)"
                variant="outlined"
                fullWidth
                value={product.unitValue || ""}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Button variant="contained" onClick={handleAddProduct}>
            Adicionar
          </Button>
        </FormControlStyled>
      </Box>
    </Modal>
  );
};

export default ProductModal;
