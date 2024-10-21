import { useEffect, useState } from "react";
import {
  Autocomplete,
  Container,
  Paper,
  TextField,
  Typography,
  Button,
  Box,
  Grid,
} from "@mui/material";
import {
  ArrowDropDown,
  ArrowDropUp,
  Delete,
  PersonAdd,
  Storefront,
} from "@mui/icons-material";
import { IClient } from "../../interfaces/iclient";
import { IProduct } from "../../interfaces/iproduct";
import { IBudget } from "../../interfaces/ibudget";
import { fetchClients, fetchProducts } from "../../utils/firebaseUtils";
import ClientModal from "../Modal/ClientModal/ClientModal";
import ProductModal from "../Modal/ProductModal/ProductModal";
import "./CreateBudget.css";

export interface ISelectedProduct {
  product: IProduct;
  quantity: number;
}

const CreateBudget: React.FC = () => {
  const [budget, setBudget] = useState<IBudget>({} as IBudget);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openProductModal, setOpenProductModal] = useState(false);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [productList, setProductList] = useState<IProduct[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProduct[]>(
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      const [clients, products] = await Promise.all([
        fetchClients(),
        fetchProducts(),
      ]);
      setClientList(clients);
      setProductList(products);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const totalValue = selectedProducts.reduce(
      (acc, { product, quantity }) => acc + product.unitValue * quantity,
      0
    );
    setBudget((prev) => ({ ...prev, totalValue }));
  }, [selectedProducts]);

  const handleAddProduct = (product: IProduct) => {
    setSelectedProducts((prev) => [
      ...prev,
      { product, quantity: 1 } as ISelectedProduct,
    ]);
    
  };

  const handleRemoveProduct = (index: number) => {
    setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProductQuantity = (index: number, delta: number) => {
    setSelectedProducts((prev) =>
      prev
        .map((p, i) =>
          i === index ? { ...p, quantity: p.quantity + delta } : p
        )
        .filter((p) => p.quantity > 0)
    );
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Cadastro de Orçamento
      </Typography>

      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Dados do Cliente
        </Typography>
        <Box display="flex" gap={2}>
          <Autocomplete
            options={clientList}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Cliente" />}
            onChange={(event, value) =>
              setBudget({ ...budget, client: value || ({} as IClient) })
            }
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => setOpenClientModal(true)}
            startIcon={<PersonAdd />}
          >
            Adicionar
          </Button>
        </Box>

        {budget.client?.name && (
          <Box mt={2} p={2} borderRadius={4} bgcolor="#f5f5f5">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  Nome: {budget.client.name}
                </Typography>
                <Typography variant="subtitle1">
                  Email: {budget.client.email}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  Telefone: {budget.client.phone}
                </Typography>
                <Typography variant="subtitle1">
                  Endereço: {budget.client.address}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Produtos
        </Typography>
        <Box display="flex" gap={2}>
          <Autocomplete
            options={productList}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Produto" />}
            onChange={(event, value) => value && handleAddProduct(value)}
            sx={{ flexGrow: 1 }}
          />
          <Button
            variant="contained"
            onClick={() => setOpenProductModal(true)}
            startIcon={<Storefront />}
          >
            Adicionar
          </Button>
        </Box>

        {selectedProducts.length > 0 && (
          <>
            {selectedProducts.map((product, index) => (
              <Paper
                key={index}
                sx={{
                  padding: 2,
                  marginY: 2,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <Box flexGrow={1}>
                  <Typography variant="subtitle1">
                    {product.product.name}
                  </Typography>
                  <Typography variant="body2">
                    Valor Unitário: R$ {product.product.unitValue}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center">
                  <Button
                    size="small"
                    onClick={() => updateProductQuantity(index, 1)}
                  >
                    <ArrowDropUp />
                  </Button>
                  <Typography>{product.quantity}</Typography>
                  <Button
                    size="small"
                    onClick={() => updateProductQuantity(index, -1)}
                  >
                    <ArrowDropDown />
                  </Button>
                  <Button
                    color="secondary"
                    onClick={() => handleRemoveProduct(index)}
                    startIcon={<Delete />}
                  >
                    Remover
                  </Button>
                </Box>
              </Paper>
            ))}
            <Box mt={2} p={2} borderRadius={4} bgcolor="#f9f9f9">
              <Typography variant="h6">
                Valor Total: R$ {budget.totalValue}
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Datas e Observações
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Data de Entrega"
              type="date"
              fullWidth
              onChange={(e) =>
                setBudget({ ...budget, estimatedDate: e.target.value })
              }
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Data de Validade"
              type="date"
              fullWidth
              onChange={(e) =>
                setBudget({ ...budget, maxDealDate: e.target.value })
              }
            />
          </Grid>
        </Grid>
        <TextField
          label="Garantia"
          fullWidth
          margin="normal"
          onChange={(e) => setBudget({ ...budget, guarantee: e.target.value })}
        />
        <TextField
          label="Imposto"
          fullWidth
          margin="normal"
          defaultValue="NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS"
          onChange={(e) => setBudget({ ...budget, tax: e.target.value })}
        />
      </Paper>

      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => console.log(budget)}
      >
        Salvar
      </Button>

      <ClientModal
        open={openClientModal}
        handleClose={() => setOpenClientModal(false)}
      />
      <ProductModal
        open={openProductModal}
        handleClose={() => setOpenProductModal(false)}
      />
    </Container>
  );
};

export default CreateBudget;
