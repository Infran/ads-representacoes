import { useEffect, useState } from 'react';
import { Box, CircularProgress} from '@mui/material';
import PageHeader from './../../components/PageHeader/PageHeader';
import { ProductTable } from '../../components/Tables/ProductTable/ProductTable';
import CreateProductModal from '../../components/Modal/Create/CreateProductModal/CreateProductModal';
import {Storefront } from '@mui/icons-material';
import { IProduct } from '../../interfaces/iproduct';
import { deleteProduct, getProducts } from '../../services/productServices';
import SearchBar from '../../components/SearchBar/SearchBar';
import DeleteProductModal from '../../components/Modal/Delete/DeleteProductModal';

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [productsList, setProductsList] = useState<IProduct[]>([]);
  const [filteredProductsList, setFilteredProductsList] = useState<IProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false)

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const handleEdit = (id: string) => {
    console.log('Editando produto com ID:', id);
  };

  const handleDelete = (product: IProduct) => {
    setSelectedProduct(product);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      try {
        await deleteProduct(selectedProduct.id.toString());
        setProductsList((prevProducts) =>
          prevProducts.filter((product) => product.id !== selectedProduct.id)
        );
        setOpenDeleteModal(false);
        window.location.reload();
      } catch (error) {
        console.error('Erro ao excluir produto:', error);
      }
    }
    
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

      <CreateProductModal
        open={openModal}
        handleClose={handleClose}
      />

      <DeleteProductModal
        open={openDeleteModal}
        onClose={handleCloseDeleteModal}
        product={selectedProduct}
        onConfirm={handleConfirmDelete}
        />
    </>
  );
};

export default Products;
