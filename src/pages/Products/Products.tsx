import { useEffect, useState } from 'react';
import { Box, Button, Paper, TextField } from '@mui/material';
import { styled } from '@mui/system';
import PageHeader from './../../components/PageHeader/PageHeader';
import { DataTable } from '../../components/DataTable/DataTable';
import ProductModal from '../../components/ProductModal/ProductModal';
import { Search, AddCircle, Storefront } from '@mui/icons-material';
import { useTheme, useMediaQuery } from '@mui/material';
import { IProduct } from '../../interfaces/iproduct';
import { addProduct, fetchProducts } from '../../utils/firebaseUtils';

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
      <Box display="flex" flexDirection="column" gap={2} sx={{ width: "94vw", padding: 2 }}>
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
        <DataTable rows={productList} />
      </Box>

      <ProductModal
        open={openModal}
        handleClose={handleClose}
        product={product}
        handleChange={handleChange}
        handleAddProduct={handleAddProduct}
      />
       
    
    </>
  );
};

export default Products;
