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
import Swal from "sweetalert2";
import {
  ArrowDropDown,
  ArrowDropUp,
  Delete,
} from "@mui/icons-material";
import { IProduct } from "../../interfaces/iproduct";
import { IBudget } from "../../interfaces/ibudget";
import { IClient } from "../../interfaces/iclient";
import { searchProducts } from "../../services/productServices";
import CreateClientModal from "../Modal/Create/CreateClientModal/CreateClientModal";
import CreateProductModal from "../Modal/Create/CreateProductModal/CreateProductModal";
import CreateRepresentativeModal from "../Modal/Create/CreateRepresentativeModal/CreateRepresentativeModal";
import useDebounce from "../../hooks/useDebounce";
import { addBudget } from "../../services/budgetServices";
import { IRepresentative } from "../../interfaces/irepresentative";
import { searchRepresentatives } from "../../services/representativeServices";
import { useNavigate } from "react-router";
import { moneyFormatter } from "../../utils/Masks";
import { BudgetPdfPage } from "../../utils/PDFGenerator/BudgetPdf";
import ReactDOM from "react-dom";

export interface ISelectedProducts {
  product: IProduct;
  quantity: number;
}

const CreateBudget: React.FC = () => {
  const navigate = useNavigate();
  const [budget, setBudget] = useState<IBudget>({
    tax: "NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS",
    guarantee:
      "06 MESES P/ PEÇAS REPOSIÇÃO / SERVIÇOS - 18 MESES DA ENTREGA / 12 MESES DA INSTALAÇÃO P/ PRODUTO ",
  } as IBudget);
  const [openClientModal, setOpenClientModal] = useState(false);
  const [openProductModal, setOpenProductModal] = useState(false);
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
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedQuantity, setEditedQuantity] = useState("");

  const handleEditQuantity = (index, quantity) => {
    setEditingIndex(index);
    setEditedQuantity(quantity);
  };

  const handleSaveQuantity = (index) => {
    updateProductQuantity(
      index,
      parseInt(editedQuantity, 10) - selectedProducts[index].quantity
    );
    setEditingIndex(null);
    setEditedQuantity("");
  };

  const debouncedRepresentativeSearchTerm = useDebounce(
    representativeSearchInput,
    1000
  );
  const debouncedProductSearchTerm = useDebounce(productSearchTerm, 1000);

  // Adicionar orçamento
  const handleAddBudget = (budget: IBudget) => {
    try {
      addBudget(budget);
      Swal.fire({
        icon: 'success',
        title: 'Sucesso!',
        text: 'Orçamento cadastrado com sucesso!',
        showCancelButton: true, // Mostra o botão de cancelar
        confirmButtonText: 'Ir para Orçamentos', // Texto do botão de confirmação
        cancelButtonText: 'Adicionar Outro Orçamento', // Texto do botão de cancelar
        reverseButtons: true, // Inverte a ordem dos botões (opcional)
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/Orcamentos"); // Redireciona para a página de orçamentos
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          window.location.reload(); // Recarrega a página para adicionar outro orçamento
        }
      });
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: 'Erro ao cadastrar orçamento.',
      });
      console.error(error);
    }
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
    Swal.fire({
      title: 'Tem certeza?',
      text: 'Tem certeza que deseja remover este produto?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim, remover!',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setSelectedProducts((prev) => prev.filter((_, i) => i !== index));
      }
    });
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
      budget.shippingTerms &&
      budget.reference
  );

  useEffect(() => {
    console.log(budget);
  }, [budget]);

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
            noOptionsText="Pesquise um representante cadastrado."
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
          {/* <Button
            variant="contained"
            onClick={() => setOpenClientModal(true)}
            startIcon={<PersonAdd />}
          >
            Adicionar
          </Button> */}
        </Box>

        {budget.representative?.name && (
          <Box mt={2} p={2} borderRadius={4} bgcolor="#f5f5f5">
            <Typography variant="subtitle1" marginBottom={2}>
              Cliente: {budget.client.name}
            </Typography>
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
          {/* <Button
            variant="contained"
            onClick={() => setOpenProductModal(true)}
            startIcon={<Storefront />}
          >
            Adicionar
          </Button> */}
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
                  {editingIndex === index ? (
                    <TextField
                      value={editedQuantity}
                      onChange={(e) => setEditedQuantity(e.target.value)}
                      onBlur={() => handleSaveQuantity(index)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          handleSaveQuantity(index);
                        }
                      }}
                      autoFocus
                      variant="outlined"
                      size="small"
                      sx={{ width: "60px", marginX: 1 }}
                    />
                  ) : (
                    <Typography
                      onClick={() =>
                        handleEditQuantity(index, product.quantity)
                      }
                    >
                      {product.quantity}
                    </Typography>
                  )}
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
              placeholder="Ex.: 15 DIAS ÚTEIS "
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

        <TextField
          label="Referência"
          fullWidth
          margin="normal"
          required
          value={budget.reference}
          onChange={(e) => setBudget({ ...budget, reference: e.target.value })}
          placeholder="Orçamento / Proposta de fornecimento"
        />
      </Paper>

      {/* Botão Salvar */}
      <Button
        variant="contained"
        sx={{ mt: 2 }}
        onClick={() => handleAddBudget(budget)}
        disabled={!budget || !isBudgetValid}
      >
        Salvar
      </Button>

      {/* Botão Preview */}
      <Button
        variant="contained"
        color="primary"
        sx={{ mt: 2, marginLeft: 2 }}
        disabled={!budget || !isBudgetValid}
        onClick={() => {
          const newTab = window.open("", "_blank");
          if (newTab) {
            newTab.document.write(`
                                <html>
                                  <head>
                                    <style>
                                      body, html { margin: 0; padding: 0; width: 100%; height: 100%; }
                                      #react-root { margin: 0; padding: 0; width: 100%; height: 100%; }
                                    </style>
                                  </head>
                                  <body>
                                    <div id="react-root"></div>
                                  </body>
                                </html>
                              `);
            newTab.document.close();
            ReactDOM.render(
              <BudgetPdfPage budget={budget} />,
              newTab.document.getElementById("react-root")
            );
          }
        }}
      >
        {" "}
        Preview
      </Button>

      {/* Botão Cancelar */}
      <Button
      variant="contained"
      color="error"
      sx={{ mt: 2, ml: 97 }}
      onClick={
        () => navigate("/Orcamentos")
      }>
        Cancelar
        </Button>

      <CreateClientModal
        open={openClientModal}
        handleClose={() => setOpenClientModal(false)}
      />

      <CreateRepresentativeModal
        open={openClientModal}
        handleClose={() => setOpenClientModal(false)}
      />

      <CreateProductModal
        open={openProductModal}
        handleClose={() => setOpenProductModal(false)}
      />
    </Container>
  );
};

export default CreateBudget;
