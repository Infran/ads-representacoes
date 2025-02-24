import { useEffect, useState } from 'react';
import { Box, CircularProgress} from '@mui/material';
import PageHeader from './../../components/PageHeader/PageHeader';
import { ProductTable } from '../../components/Tables/ProductTable/ProductTable';
import ProductModal from '../../components/Modal/ProductModal/ProductModal';
import {Storefront } from '@mui/icons-material';
import { IProduct } from '../../interfaces/iproduct';
import { getProducts } from '../../services/productServices';
import SearchBar from '../../components/SearchBar/SearchBar';

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [productsList, setProductsList] = useState<IProduct[]>([]);
  const [filteredProductsList, setFilteredProductsList] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);

  const handleEdit = (id: string) => {
    console.log('Editando produto com ID:', id);
  };

  const handleDelete = (id: string) => {
    console.log('Excluindo produto com ID:', id);
  };

  const handleSearch = () => {
    const filtered = productsList.filter((product) => {
      return (
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.unitValue.toString().includes(searchTerm)
      );
    });
    setFilteredProductsList(filtered);
  };

  useEffect(() => {
      const fetchData = async () => {
        try {
          const products = await getProducts();
          setProductsList(products);
          setFilteredProductsList(products);
        } catch (error) {
          console.error('Erro ao buscar clientes:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }, []);

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Produtos"
          description="Utilize esta seção para Adicionar, Editar ou Excluir um Produto."
          icon={Storefront}
        />
       <SearchBar
       search={searchTerm}
       onSearchChange={(e) => setSearchTerm(e.target.value)}
       onSearch={handleSearch}
       onAdd={handleOpen}
       inputLabel='Digite o nome do produto'
       />
       {loading ? (
                 <Box display="flex" justifyContent="center" alignItems="center" height={200}>
                   {/* loading spinner */}
                   Carregando... <CircularProgress />
                 </Box>
               ) : (
        <ProductTable rows={filteredProductsList} onEdit={handleEdit} onDelete={handleDelete} />
        )}
      </Box>

      <ProductModal
        open={openModal}
        handleClose={handleClose}
      />
       
    </>
  );
};

export default Products;
