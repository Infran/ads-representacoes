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
import { IProduct } from "../../interfaces/iproduct";
import { IBudget } from "../../interfaces/ibudget";
import { IClient } from "../../interfaces/iclient";
import { searchProducts } from "../../services/productServices";
import ClientModal from "../Modal/Create/CreateClientModal/CreateClientModal";
import ProductModal from "../Modal/Create/CreateProductModal/CreateProductModal";
import useDebounce from "../../hooks/useDebounce";
import { getBudgetById, updateBudget } from "../../services/budgetServices";
import { IRepresentative } from "../../interfaces/irepresentative";
import { searchRepresentatives } from "../../services/representativeServices";
import RepresentativeModal from "../Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal";
import { useLocation } from "react-router-dom";

export interface ISelectedProducts {
  product: IProduct;
  quantity: number;
}

const EditBudget: React.FC = () => {
  const [budget, setBudget] = useState<IBudget>({
    tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
    guarantee: "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO ",
  } as IBudget);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openProductModal, setOpenProductModal] = useState(false);
  const location = useLocation();
  const budgetId = location.pathname.split("/")[3];
  const [representativeList, setRepresentativeList] = useState<
    IRepresentative[]
  >([]);
  const [productList, setProductList] = useState<IProduct[]>([]);
  const [representativeSearchInput, setRepresentativeSearchInput] =
    useState("");
  const [productSearchTerm, setProductSearchTerm] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProducts[]>(
    []
  );

  const debouncedRepresentativeSearchTerm = useDebounce(
    representativeSearchInput,
    1000
  );
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 1000);

  // Adicionar orçamento
  const handleUpdateBudget = async () => {
    try {
      updateBudget(budgetId, budget);
      alert("Orçamento Atualizado com sucesso!");
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
  };

  // Atualizar lista de clientes ao pesquisar
  useEffect(() => {
    if (debouncedRepresentativeSearchTerm) {
      searchRepresentatives(debouncedRepresentativeSearchTerm).then(
        setRepresentativeList
      );
    } else {
      setRepresentativeList([]);
    }
  }, [debouncedRepresentativeSearchTerm]);

  // Atualizar lista de produtos ao pesquisar
  useEffect(() => {
    if (debouncedProductSearchTerm) {
      searchProducts(debouncedProductSearchTerm).then((products) => {
        const mappedProducts: IProduct[] = products.map((product) => ({
          id: product.id,
          name: product.name,
          description: product.description,
          ncm: product.ncm,
          icms: product.icms,
          quantity: product.quantity,
          unitValue: product.unitValue,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        }));
        setProductList(mappedProducts);
      });
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
    setBudget((prev) => ({
      ...prev,
      totalValue,
      selectedProducts: selectedProducts,
    }));
  }, [selectedProducts]);

  const handleAddProduct = (product: IProduct) => {
    setSelectedProducts((prev) => [
      ...prev,
      { product, quantity: 1 } as ISelectedProducts,
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
    budget.representative &&
      selectedProducts.length > 0 &&
      budget.estimatedDate &&
      budget.maxDealDate &&
      budget.guarantee &&
      budget.shippingTerms
  );

  useEffect(() => {
    if (budgetId) {
      getBudgetById(budgetId).then((budget) => {
        setBudget(budget);
        setSelectedProducts(budget.selectedProducts);
      });
    }
  }, [budgetId]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Cadastro de Orçamento
      </Typography>

      {/* Dados do Cliente */}
      <Paper sx={{ padding: 2, marginBottom: 2 }}>
        <Typography variant="h5" gutterBottom>
          Dados do Representante
        </Typography>
        <Box display="flex" gap={2}>
          <Autocomplete
            options={representativeList}
            getOptionLabel={(option) => option.name}
            noOptionsText="Pesquise um cliente cadastrado."
            inputValue={representativeSearchInput}
            onInputChange={(_e, value) => setRepresentativeSearchInput(value)}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Busque um cliente"
                required
                onChange={(e) => setRepresentativeSearchInput(e.target.value)}
              />
            )}
            onChange={(_event, value) =>
              setBudget({
                ...budget,
                representative: value || ({} as IRepresentative),
                client: value?.client || ({} as IClient),
              })
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

        {budget.representative?.name && (
          <Box mt={2} p={2} borderRadius={4} bgcolor="#f5f5f5">
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  Nome: {budget.representative.name}
                </Typography>
                {budget.representative.email && (
                  <Typography variant="subtitle1">
                    Email: {budget.representative.email}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={6}>
                {budget.representative.phone && (
                  <Typography variant="subtitle1">
                    Telefone: {budget.representative.phone}
                  </Typography>
                )}
                <Typography variant="subtitle1">
                  Endereço: {budget.representative.address}
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
              value={budget.estimatedDate || ""}
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
              value={budget.maxDealDate || ""}
              onChange={(e) =>
                setBudget({ ...budget, maxDealDate: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              label="Condição de Pagamento"
              type="text"
              fullWidth
              placeholder="28 DDL"
              value={budget.paymentTerms}
              onChange={(e) =>
                setBudget({ ...budget, paymentTerms: e.target.value })
              }
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={6}>
            <Autocomplete
              options={["CIF", "FOB"]}
              value={budget.shippingTerms}
              onChange={(_, value) =>
                setBudget({ ...budget, shippingTerms: value })
              }
              renderInput={(params) => (
                <TextField {...params} label="Condição de Entrega" fullWidth />
              )}
            />
          </Grid>
        </Grid>
        <TextField
          label="Garantia"
          fullWidth
          margin="normal"
          required
          value={budget.guarantee}
          onChange={(e) => setBudget({ ...budget, guarantee: e.target.value })}
        />
        <TextField
          label="Imposto"
          fullWidth
          margin="normal"
          required
          value={budget.tax}
          onChange={(e) => setBudget({ ...budget, tax: e.target.value })}
        />
      </Paper>

      {/* Botão Salvar */}
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => handleUpdateBudget()}
        disabled={!budget || !isBudgetValid}
      >
        Salvar Edição
      </Button>

      <ClientModal
        open={openClientModal}
        handleClose={() => setOpenClientModal(false)}
      />

      <RepresentativeModal
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

export default EditBudget;
