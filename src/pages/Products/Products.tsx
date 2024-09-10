import { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField } from '@mui/material';
import { styled } from '@mui/system';
import PageHeader from './../../components/PageHeader/PageHeader';
import { ProductTable } from '../../components/ProductTable/ProductTable';
import ProductModal from '../../components/ProductModal/ProductModal';
import { Search, AddCircle, Storefront } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';
import { IProduct } from '../../interfaces/iproduct';
import { addProduct, fetchProducts } from '../../utils/firebaseUtils';
import ncmData from '../../../src/tabela_ncm.json';

const StyledPaper = styled(Paper)({
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
});

const ButtonGroup = styled(Box)({
  display: 'flex',
  gap: 16,
});

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [product, setProduct] = useState<IProduct>();
  const [productList, setProductList] = useState<IProduct[]>([]);

  // const produtos: IProduct[] = [
  //   {
  //     id: 1,
  //     name: "Produto A",
  //     description: "Este é o primeiro produto",
  //     ncm: "12345678",
  //     icms: "18%",
  //     quantity: 5,
  //     unitValue: 25.50,
  //     total: 127.50
  //   },
  //   {
  //     id: 2,
  //     name: "Produto B",
  //     description: "Este é o segundo produto",
  //     ncm: "87654321",
  //     icms: "12%",
  //     quantity: 8,
  //     unitValue: 35.75,
  //     total: 286.00
  //   },
  //   {
  //     id: 3,
  //     name: "Produto C",
  //     description: "Este é o terceiro produto",
  //     ncm: "54321678",
  //     icms: "15%",
  //     quantity: 3,
  //     unitValue: 42.90,
  //     total: 128.70
  //   },
  //   {
  //     id: 4,
  //     name: "Produto D",
  //     description: "Este é o quarto produto",
  //     ncm: "98765432",
  //     icms: "10%",
  //     quantity: 10,
  //     unitValue: 19.99,
  //     total: 199.90
  //   },
  //   {
  //     id: 5,
  //     name: "Produto E",
  //     description: "Este é o quinto produto",
  //     ncm: "13579246",
  //     icms: "20%",
  //     quantity: 2,
  //     unitValue: 55.00,
  //     total: 110.00
  //   }
  // ];

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setProduct(prevProduct => ({
      ...prevProduct,
      [name]: value,
    }));
  };

  const handleNcmChange = (event) => {
    const { value } = event.target;
    const ncm = value.replace(/\D/g, ''); // Remove todos os caracteres que não são dígitos

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
      console.error("NCM not found");
      setProduct((prevProduct) => ({
        ...prevProduct,
        ncm: value,
        description: "",
      }));
    }
  };

  const handleAddProduct = () => {
    console.log('Adicionar produto:', product);
    addProduct(product);
    handleClose();
  };

  useEffect(() => {
    const fetchData = async () => {
      const products = await fetchProducts();
      setProductList(products);
    };
    fetchData();
    console.log('Produtos:', productList);
  }, []);

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} sx={{ padding: 2, width:"94vw" }}>
        <PageHeader
          title="Produtos"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Produto."
          icon={Storefront}
        />
        <StyledPaper>
          <Box
            display="flex"
            flexDirection={isSmallScreen ? 'column' : 'row'}
            gap={2}
            alignItems="center"
            justifyContent="space-between"
          >
            <ButtonGroup>
              <Button variant="contained" type="submit">
                <Box display="flex" gap={0.5}>
                  Pesquisar
                  <Search />
                </Box>
              </Button>
              <Button variant="contained" onClick={handleOpen}>
                <Box display="flex" gap={0.5}>
                  Adicionar
                  <AddCircle />
                </Box>
              </Button>
            </ButtonGroup>
            <Box flex={1}>
              <TextField
                label="Digite o nome do produto"
                variant="outlined"
                size="small"
                fullWidth
              />
            </Box>
          </Box>
        </StyledPaper>
        <ProductTable rows={productList} />
      </Box>

      <ProductModal
        open={openModal}
        handleClose={handleClose}
        product={product}
        handleChange={handleChange}
        handleNcmChange={handleNcmChange}
        handleAddProduct={handleAddProduct}
      />
       
    </>
  );
};

export default Products;
