import { useEffect, useState } from "react";
import { IClient } from "../../interfaces/iclient";
import { IProduct } from "../../interfaces/iproduct";
import { IBudget } from "../../interfaces/ibudget";
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
import { fetchClients, fetchProducts } from "../../utils/firebaseUtils";
import {
  ArrowDropDown,
  ArrowDropUp,
  Delete,
  PersonAdd,
  Storefront,
} from "@mui/icons-material";
import ClientModal from "../Modal/ClientModal/ClientModal";
import ProductModal from "../Modal/ProductModal/ProductModal";
import "./CreateBudget.css";

// selected products
interface ISelectedProduct {
  product: IProduct;
  quantity: number;
}

const CreateBudget: React.FC = () => {
  const [budget, setBudget] = useState<IBudget>({} as IBudget);

  const [openClientModal, setOpenClientModal] = useState(false);
  const [openProductModal, setOpenProductModal] = useState(false);
  const [clientList, setClientList] = useState<IClient[]>([]);
  const [productList, setProductList] = useState<IProduct[]>([]);

  //selected client and products
  const [selectedProducts, setSelectedProducts] = useState<ISelectedProduct[]>(
    []
  );

  useEffect(() => {
    const fetchData = async () => {
      const clients = await fetchClients();
      const products = await fetchProducts();
      setClientList(clients);
      setProductList(products);
    };
    fetchData();
  }, []);

  useEffect(() => {
    console.log(budget);
  }, [budget]);

  useEffect(() => {
    const totalValue = selectedProducts.reduce((acc, product) => {
      return acc + product.product.unitValue * product.quantity;
    }, 0);

    console.log(totalValue);
    setBudget((prevBudget) => ({ ...prevBudget, totalValue }));
  }, [selectedProducts]);

  const handleOpenClientModal = () => setOpenClientModal(true);
  const handleCloseClientModal = () => setOpenClientModal(false);

  const handleOpenProductModal = () => setOpenProductModal(true);
  const handleCloseProductModal = () => setOpenProductModal(false);

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        Cadastro de Orçamento
      </Typography>

      <Paper sx={{ padding: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          <span style={{ borderBottom: "2px solid #1976d2" }}>
            Dados do Cliente
          </span>
        </Typography>

        <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          className="clienteContainer"
        >
          <Autocomplete
            options={clientList}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Cliente" />}
            onChange={(event, value) =>
              setBudget({ ...budget, client: value || ({} as IClient) })
            }
            sx={{ flexGrow: 0.99 }}
          />
          <Button variant="contained" onClick={handleOpenClientModal}>
            <Box display="flex" gap={0.5}>
              Adicionar <PersonAdd />
            </Box>
          </Button>
        </Container>

        {budget.client && budget.client.name && (
          <Box
            mt={2}
            sx={{
              border: "1px solid #ccc",
              padding: 2,
              borderRadius: 4,
              backgroundColor: "#f5f5f5",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="h6">Nome:</Typography>
                <Typography variant="body1">{budget.client.name}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Email:</Typography>
                <Typography variant="body1">{budget.client.email}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Telefone:</Typography>
                <Typography variant="body1">{budget.client.phone}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="h6">Endereço:</Typography>
                <Typography variant="body1">{budget.client.address}</Typography>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      <Paper sx={{ padding: 2, marginTop: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          <span style={{ borderBottom: "2px solid #1976d2" }}>Produtos</span>
        </Typography>

        <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          className="clienteContainer"
        >
          <Autocomplete
            options={productList}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => <TextField {...params} label="Produto" />}
            onChange={(event, value) => {
              if (value) {
                setSelectedProducts((prevProducts) => [
                  ...prevProducts,
                  { product: value, quantity: 1 },
                ]);
                setBudget({ ...budget, products: selectedProducts });
              }
            }}
            sx={{ flexGrow: 0.99 }}
          />
          <Button variant="contained" onClick={handleOpenProductModal}>
            <Box display="flex" gap={0.5}>
              Adicionar <Storefront />
            </Box>
          </Button>
        </Container>

        {selectedProducts.length > 0 && (
          <>
            {/* list all the items in selectedProducts each in a paper card */}
            {selectedProducts.map((product, index) => (
              <Paper
                key={index}
                sx={{
                  padding: 2,
                  marginTop: 2,
                  display: "flex",
                  flexDirection: "row",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ flexGrow: 0.49 }}>
                  <Typography variant="h6">{product.product.name}</Typography>
                  <Typography variant="body1">
                    Valor Unitário: R$ {product.product.unitValue}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", flexDirection: "row" }}>
                  <Box sx={{ display: "flex", flexDirection: "row" }}>
                    <Typography variant="h6">{product.quantity}</Typography>
                    <Box sx={{ display: "flex", flexDirection: "column" }}>
                      <Button
                        variant="contained"
                        sx={{}}
                        onClick={() => {
                          setSelectedProducts((prevProducts) => {
                            const newProducts = [...prevProducts];
                            newProducts[index].quantity++;
                            return newProducts;
                          });
                        }}
                      >
                        <ArrowDropUp />
                      </Button>
                      <Button
                        variant="contained"
                        sx={{}}
                        onClick={() => {
                          if (product.quantity > 1) {
                            setSelectedProducts((prevProducts) => {
                              const newProducts = [...prevProducts];
                              newProducts[index].quantity--;
                              return newProducts;
                            });

                          } else {
                            setSelectedProducts((prevProducts) => {
                              const newProducts = [...prevProducts];
                              newProducts.splice(index, 1);
                              return newProducts;
                            });
                          }
                        }}
                      >
                        <ArrowDropDown />
                      </Button>
                    </Box>
                  </Box>
                  <Button
                    variant="contained"
                    sx={{}}
                    onClick={() => {
                      setSelectedProducts((prevProducts) => {
                        const newProducts = [...prevProducts];
                        newProducts.splice(index, 1);
                        return newProducts;
                      });
                    }}
                  >
                    <Delete />
                  </Button>
                </Box>
              </Paper>
            ))}

            {/* total value */}

            <Box
              mt={2}
              sx={{
                border: "1px solid #ccc",
                padding: 2,
                borderRadius: 4,
                backgroundColor: "#f5f5f5",
              }}
            >
              <Typography variant="h6">Valor Total:</Typography>
              <Typography variant="body1">R$ {budget.totalValue}</Typography>
            </Box>
          </>
        )}

        {/* total value */}
      </Paper>

      {/* datas de aproximda de entrega e validade */}
      <Paper sx={{ padding: 2, marginTop: 2 }}>
        <Typography variant="h4" component="h2" gutterBottom>
          <span style={{ borderBottom: "2px solid #1976d2" }}>
            Datas e Observações
          </span>
        </Typography>

        <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
          }}
          className="clienteContainer"
        >
          <Box sx={{ flexGrow: 0.49 }}>
            {/*data de entrega */}
            <Typography variant="body1">Data de Entrega:</Typography>
            <TextField
              id="deliveryDate"
              type="date"
              sx={{ width: "100%" }}
              onChange={(event) =>
                setBudget({ ...budget, estimatedDate: event.target.value })
              }
            />
          </Box>

          <Box sx={{ flexGrow: 0.49 }}>
            {/*data de validade  */}
            <Typography variant="body1">Data de Validade:</Typography>
            <TextField
              id="validityDate"
              type="date"
              sx={{ width: "100%" }}
              onChange={(event) =>
                setBudget({ ...budget, maxDealDate: event.target.value })
              }
            />
          </Box>

        </Container>

        {/* Garantia */}
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body1">Garantia:</Typography>
          <TextField
            id="warranty"
            fullWidth
            onChange={(event) =>
              setBudget({ ...budget, guarantee: event.target.value })
            }
          />
        </Box>

        {/* imposto */}
        <Box sx={{ marginTop: 2 }}>
          <Typography variant="body1">Imposto:</Typography>
          <TextField
            id="tax"
            fullWidth
            value="NOS PREÇOS ACIMA JÁ ESTÃO INCLUSOS OS IMPOSTOS"
            onChange={(event) =>
              setBudget({ ...budget, tax: event.target.value })
            }
          />
        </Box>

      </Paper>

      <Button
        variant="contained"
        sx={{ marginTop: 2 }}
        onClick={() => console.log(budget)}
      >
        Salvar
      </Button>

      <ClientModal
        open={openClientModal}
        handleClose={handleCloseClientModal}
      />

      <ProductModal
        open={openProductModal}
        handleClose={handleCloseProductModal}
      />
    </Container>
  );
};

export default CreateBudget;
