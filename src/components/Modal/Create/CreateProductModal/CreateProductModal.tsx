import React, { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  Grid,
  Modal,
  TextField,
  Typography,
  InputAdornment,
} from "@mui/material";
import { styled } from "@mui/system";
import { IProduct } from "../../../../interfaces/iproduct";
import { addProduct } from "../../../../services/productServices";
import ncmData from "../../../../tabela_ncm.json";
import { brMoneyMask } from "../../../../utils/Masks";

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 600,
  bgcolor: "background.paper",
  borderRadius: 4,
  boxShadow: 24,
  p: 4,
};

const FormControlStyled = styled(FormControl)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}));

interface CreateProductModalProps {
  open: boolean;
  handleClose: () => void;
}

const CreateProductModal: React.FC<CreateProductModalProps> = ({ open, handleClose }) => {
  const [product, setProduct] = useState<IProduct>({} as IProduct);
  const [error, setError] = useState<string | null>(null);
  const [maskedUnitValue, setMaskedUnitValue] = useState<string>("");

  const handleGenericChange = (name: string, value: string) => {
    setProduct((prevProduct) => ({ ...prevProduct, [name]: value }));
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;

    if (name === "unitValue") {
      handleUnitValueChange(value);
    } else {
      handleGenericChange(name, value);
    }
  };

  const handleUnitValueChange = (value: string) => {
    setMaskedUnitValue(brMoneyMask(value)); // Formata a máscara no valor exibido
    setProduct((prevProduct) => {
      const cleanedValue = value
        .replace(/\./g, "") // Remove os pontos (separadores de milhar)
        .replace(",", "."); // Substitui a vírgula decimal por ponto

      return {
        ...prevProduct,
        unitValue: parseFloat(cleanedValue), // Converte corretamente para float
      };
    });
  };

  const handleNcmChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    const ncm = value.replace(/\D/g, "");

    const ncmEntry = ncmData.Nomenclaturas.find(
      (item) => item.Codigo.replace(/\D/g, "") === ncm
    );

    setProduct((prevProduct) => ({
      ...prevProduct,
      ncm: value,
      description: ncmEntry ? ncmEntry.Descricao : "",
    }));
  };

  const handleAddProduct = async () => {
    if (
      !product.name ||
      !product.ncm ||
      !product.unitValue
    ) {
      setError("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    try {
      await addProduct(product);
      handleClose();
      setProduct({} as IProduct);
      setError(null);
      window.location.reload();
    } catch (error) {
      console.error("Erro ao adicionar produto:", error);
      setError("Ocorreu um erro ao adicionar o produto. Tente novamente.");
    }
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        handleClose();
        setProduct({} as IProduct);
      }}
    >
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h1" gutterBottom>
          Adicionar Produto
        </Typography>
        {error && (
          <Typography color="error" variant="body2" sx={{ mb: 2 }}>
            {error}
          </Typography>
        )}
        <FormControlStyled>
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                id="ncm"
                name="ncm"
                label="NCM"
                variant="outlined"
                fullWidth
                value={product.ncm || ""}
                onChange={handleNcmChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="icms"
                name="icms"
                label="ICMS"
                variant="outlined"
                fullWidth
                value={product.icms || ""}
                onChange={handleChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">%</InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
          <TextField
            id="name"
            name="name"
            label="Nome do Produto"
            variant="outlined"
            value={product.name || ""}
            onChange={handleChange}
          />

          <Grid container spacing={1}>
            <Grid item xs={6}>
              <TextField
                id="quantity"
                name="quantity"
                label="Quantidade em Estoque"
                variant="outlined"
                fullWidth
                value={"0"}
                onChange={handleChange}
                disabled
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="unitValue"
                name="unitValue"
                label="Valor (Unitário)"
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">R$</InputAdornment>
                  ),
                }}
                value={maskedUnitValue || ""}
                fullWidth
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <TextField
            id="description"
            name="description"
            label="Descrição"
            variant="outlined"
            value={product.description || ""}
            onChange={handleChange}
          />

          <Button
            variant="contained"
            onClick={handleAddProduct}
            disabled={
              !product.name ||
              !product.ncm ||
              !maskedUnitValue
            }
          >
            Adicionar
          </Button>
          <Button
            variant="contained"
            sx={{ backgroundColor: "grey" }}
            onClick={handleClose}
          >
            Cancelar
          </Button>
        </FormControlStyled>
      </Box>
    </Modal>
  );
};

export default CreateProductModal;
