import { useState, useMemo } from "react";
import { Box } from "@mui/material";
import PageHeader from "./../../components/PageHeader/PageHeader";
import { ProductTable } from "../../components/Tables/ProductTable/ProductTable";
import CreateProductModal from "../../components/Modal/Create/CreateProductModal/CreateProductModal";
import { Storefront } from "@mui/icons-material";
import { IProduct } from "../../interfaces/iproduct";
import { deleteProduct } from "../../services/productServices";
import ProductsFilter, { ProductFilters } from "../../components/Filters/ProductsFilter";
import DeleteProductModal from "../../components/Modal/Delete/DeleteProductModal";
import { useData } from "../../context/DataContext";
import { TableSkeleton, EmptyState, notifyError, notifySuccess } from "../../ui";
import { logger } from "../../utils/logger";

const Products = () => {
  const [openModal, setOpenModal] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({
    name: "",
    description: "",
    ncm: "",
    icms: "",
    minValue: "",
    maxValue: "",
  });
  const [selectedProduct, setSelectedProduct] = useState<IProduct | null>(null);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);

  // Usa dados do cache via DataContext - SEM chamadas diretas ao Firestore!
  const { products: productsList, loading, removeProductFromCache } = useData();

  // Filtragem local dos produtos com filtros complexos
  const filteredProductsList = useMemo(() => {
    return productsList.filter((product) => {
      const matchesName =
        !filters.name ||
        product.name?.toLowerCase().includes(filters.name.toLowerCase());
      const matchesDescription =
        !filters.description ||
        product.description
          ?.toLowerCase()
          .includes(filters.description.toLowerCase());
      const matchesNcm =
        !filters.ncm ||
        product.ncm?.toLowerCase().includes(filters.ncm.toLowerCase());
      const matchesIcms =
        !filters.icms ||
        product.icms?.toLowerCase().includes(filters.icms.toLowerCase());
      const matchesMinValue =
        !filters.minValue || (product.unitValue || 0) >= parseInt(filters.minValue);
      const matchesMaxValue =
        !filters.maxValue || (product.unitValue || 0) <= parseInt(filters.maxValue);

      return (
        matchesName &&
        matchesDescription &&
        matchesNcm &&
        matchesIcms &&
        matchesMinValue &&
        matchesMaxValue
      );
    });
  }, [productsList, filters]);

  const handleOpen = () => setOpenModal(true);
  const handleClose = () => setOpenModal(false);
  const handleCloseDeleteModal = () => setOpenDeleteModal(false);

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
        notifySuccess("Sucesso!", "Produto excluído com sucesso!");
      } catch (error) {
        logger.error("Erro ao excluir produto:", error);
        notifyError(
          "Não foi possível excluir o produto",
          error
        );
      }
    }
  };

  const isEmpty = !loading && filteredProductsList.length === 0;
  const hasActiveFilters = Object.values(filters).some((v) => v !== "");

  return (
    <>
      <Box display="flex" flexDirection="column" gap={2} flex={1}>
        <PageHeader
          title="Produtos"
          description="Gerencie o catálogo de produtos: busque, edite ou exclua registros."
          icon={Storefront}
          actionLabel="Adicionar produto"
          onAction={handleOpen}
        />
        <ProductsFilter
          filters={filters}
          onFilterChange={setFilters}
          onReset={() =>
            setFilters({
              name: "",
              description: "",
              ncm: "",
              icms: "",
              minValue: "",
              maxValue: "",
            })
          }
        />
        {loading ? (
          <TableSkeleton />
        ) : isEmpty ? (
          hasActiveFilters ? (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Nenhum produto corresponde aos filtros aplicados."
            />
          ) : (
            <EmptyState
              title="Nenhum produto cadastrado"
              description="Comece cadastrando o primeiro produto."
              icon={Storefront}
              actionLabel="Cadastrar produto"
              onAction={handleOpen}
            />
          )
        ) : (
          <ProductTable rows={filteredProductsList} onDelete={handleDelete} />
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
