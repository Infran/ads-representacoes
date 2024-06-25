import React from 'react';
import {
  Box,
  Button,
  FormControl,
  Grid,
  Modal,
  TextField,
  Typography,
} from '@mui/material';
import { styled } from '@mui/system';
import { IProduct } from '../../interfaces/iproduct';

const modalStyle = {
  position: 'absolute' as 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
};

const FormControlStyled = styled(FormControl)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(2),
}));

interface ProductModalProps {
  open: boolean;
  handleClose: () => void;
  product?: IProduct; // Make product optional
  handleChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleAddProduct: () => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  open,
  handleClose,
  product, // Product can be undefined, handle this case
  handleChange,
  handleAddProduct,
}) => {
  // Provide default values or empty strings if product is undefined
  const productName = product?.name || '';
  const productDescription = product?.description || '';
  const productNcm = product?.ncm || '';
  const productIcms = product?.icms || '';
  const productQuantity = product?.quantity || '';
  const productUnitValue = product?.unitValue || '';
  const productTotal = product?.total || '';

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={modalStyle}>
        <Typography variant="h6" component="h1" gutterBottom>
          Adicionar Produto
        </Typography>
        <FormControlStyled>
          <TextField
            id="name"
            name="name"
            label="Nome do Produto"
            variant="outlined"
            value={productName}
            onChange={handleChange}
          />
          <TextField
            id="description"
            name="description"
            label="Descrição"
            variant="outlined"
            value={productDescription}
            onChange={handleChange}
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                id="ncm"
                name="ncm"
                label="NCM"
                variant="outlined"
                fullWidth
                value={productNcm}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                id="icms"
                name="icms"
                label="%ICMS"
                variant="outlined"
                fullWidth
                value={productIcms}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                id="quantity"
                name="quantity"
                label="Quantidade"
                variant="outlined"
                fullWidth
                value={productQuantity}
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
                value={productUnitValue}
                onChange={handleChange}
              />
            </Grid>
          </Grid>
          <TextField
            id="total"
            name="total"
            label="Total"
            variant="outlined"
            value={productTotal}
            onChange={handleChange}
          />
          <Button variant="contained" onClick={handleAddProduct}>
            Adicionar
          </Button>
        </FormControlStyled>
      </Box>
    </Modal>
  );
};

export default ProductModal;
