import { useState, useMemo } from "react";
import { Box, CircularProgress } from "@mui/material";
import PageHeader from "./../../components/PageHeader/PageHeader";
import { ProductTable } from "../../components/Tables/ProductTable/ProductTable";
import CreateProductModal from "../../components/Modal/Create/CreateProductModal/CreateProductModal";
import { Storefront } from "@mui/icons-material";
import { IProduct } from "../../interfaces/iproduct";
import { deleteProduct } from "../../services/productServices";
import SearchBar from "../../components/SearchBar/SearchBar";
import DeleteProductModal from "../../components/Modal/Delete/DeleteProductModal";
import { useData } from "../../context/DataContext";

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const { products: productsList, loading, removeProductFromCache } = useData();

  // Filtragem local dos produtos
  const filteredProductsList = useMemo(() => {
    if (!searchTerm) return productsList;

    return productsList.filter((product) => {
      return (
        product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.unitValue?.toString().includes(searchTerm)
      );
    });
  }, [productsList, searchTerm]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

  const handleEdit = (id: string) => {
    console.log("Editando produto com ID:", id);
  };

  const handleDelete = (product: IProduct) => {
    setSelectedProduct(product);
    setOpenDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedProduct) {
      try {
        await deleteProduct(selectedProduct.id.toString());
        // Atualiza o cache local em vez de recarregar a página
        removeProductFromCache(selectedProduct.id);
        setOpenDeleteModal(false);
        setSelectedProduct(null);
      } catch (error) {
        console.error("Erro ao excluir produto:", error);
      }
    }
  };

  const handleSearch = () => {
    // A filtragem já é feita pelo useMemo, então não precisa fazer nada aqui
    // Mantido para compatibilidade com SearchBar
  };

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
          inputLabel="Digite o nome do produto"
        />
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={200}
          >
            Carregando... <CircularProgress />
          </Box>
        ) : (
          <ProductTable
            rows={filteredProductsList}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </Box>

      <CreateProductModal open={openModal} handleClose={handleClose} />

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
