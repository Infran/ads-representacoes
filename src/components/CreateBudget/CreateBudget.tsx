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
import { searchClients } from "../../services/clientServices";
import { searchProducts } from "../../services/productServices";
import ClientModal from "../Modal/ClientModal/ClientModal";
import ProductModal from "../Modal/ProductModal/ProductModal";
import useDebounce from "../../hooks/useDebounce";
import { addBudget } from "../../services/budgetServices";

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
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProduct[]>([]);

  const debouncedClientSearchTerm = useDebounce(clientSearchTerm, 1000);
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 1000);

  // Adicionar orçamento
  const handleAddBudget = (budget: IBudget) => {
    try {
      addBudget(budget);
      alert("Orçamento cadastrado com sucesso!");
    } catch (error) {
      alert("Erro ao cadastrar orçamento.");
      console.error(error);
    }
  };

  const moneyFormatter = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }

  // Atualizar lista de clientes ao pesquisar
  useEffect(() => {
    if (debouncedClientSearchTerm) {
      searchClients(debouncedClientSearchTerm).then(setClientList);
    } else {
      setClientList([]);
    }
  }, [debouncedClientSearchTerm]);

  // Atualizar lista de produtos ao pesquisar
  useEffect(() => {
    if (debouncedProductSearchTerm) {
      searchProducts(debouncedProductSearchTerm).then(setProductList);
    } else {
      setProductList([]);
    }
  }, [debouncedProductSearchTerm]);

  // Calcular valor total do orçamento ao alterar produtos
  useEffect(() => {
    const totalValue = selectedProducts.reduce(
      (acc, { product, quantity }) => acc + product.unitValue * quantity,
      0
    );
    setBudget((prev) => ({ ...prev, totalValue, products: selectedProducts }));
  }, [selectedProducts]);

  const handleAddProduct = (product: IProduct) => {
    setSelectedProducts((prev) => [
      ...prev,
      { product, quantity: 1 } as ISelectedProduct,
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    if (window.confirm("Tem certeza que deseja remover este produto?")) {
      setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
    }
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

  

  const isBudgetValid = Boolean(
    budget.client &&
      selectedProducts.length > 0 &&
      budget.estimatedDate &&
      budget.maxDealDate
  );

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Cadastro de Orçamento
      </Typography>

      {/* Dados do Cliente */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Dados do Cliente
        </Typography>
        <Box display="flex" gap={2}>
          <Autocomplete
            options={clientList}
            getOptionLabel={(option) => option.name}
            noOptionsText="Pesquise um cliente cadastrado."
            inputValue={clientSearchTerm}
            onInputChange={(_e, value) => setClientSearchTerm(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Busque um cliente"
                required
                onChange={(e) => setClientSearchTerm(e.target.value)}
              />
            )}
            onChange={(_event, value) =>
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
                {budget.client.email && (
                <Typography variant="subtitle1">
                  Email: {budget.client.email}
                </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                {budget.client.phone && (
                <Typography variant="subtitle1">
                  Telefone: {budget.client.phone}
                </Typography>  
                )}
                <Typography variant="subtitle1">
                  Endereço: {budget.client.address}
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Produtos */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Produtos
        </Typography>
        <Box display="flex" gap={2}>
          <Autocomplete
            options={productList}
            getOptionLabel={(option) => option.name}
            noOptionsText="Pesquise um produto cadastrado."
            inputValue={productSearchTerm}
            onInputChange={(_e, value) => setProductSearchTerm(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Busque um produto"
                required
                onChange={(e) => setProductSearchTerm(e.target.value)}
              />
            )}
            onChange={(_event, value) => value && handleAddProduct(value)}
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
                    Valor Unitário: {moneyFormatter(product.product.unitValue)}
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
                Valor Total: {moneyFormatter(budget.totalValue)}
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Datas e Observações */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Prazos e Observações
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <TextField
              label="Prazo para Entrega"
              type="text"
              placeholder="EX.: Á COMBINAR / 20 DIAS"
              fullWidth
              required
              value={budget.estimatedDate}
              onChange={(e) =>
                setBudget({ ...budget, estimatedDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Validade da Proposta"
              type="text"
              fullWidth
              required
              placeholder="Ex.: 28 DDL"
              value={budget.maxDealDate}
              onChange={(e) =>
                setBudget({ ...budget, maxDealDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
        </Grid>
        <TextField
          label="Garantia"
          fullWidth
          margin="normal"
          required
          onChange={(e) => setBudget({ ...budget, guarantee: e.target.value })}
        />
        <TextField
          label="Imposto"
          fullWidth
          margin="normal"
          required
          defaultValue="NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS"
          onChange={(e) => setBudget({ ...budget, tax: e.target.value })}
        />
      </Paper>

      {/* Botão Salvar */}
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => handleAddBudget(budget)}
        disabled={!isBudgetValid}
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
