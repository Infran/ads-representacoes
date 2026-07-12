import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { UseBudgetFormReturn } from "../../hooks/useBudgetForm";
import { brMoneyMask } from "../../utils/Masks";
import { confirmDialog } from "../../ui";
import ProductSelector from "./ProductSelector";
import ProductList from "./ProductList";

interface ProductsSectionProps {
  form: UseBudgetFormReturn;
}

/**
 * Seção "Produtos" do formulário de orçamento (EST F3.1).
 * Seletor de produtos + lista selecionada + total.
 */
const ProductsSection: React.FC<ProductsSectionProps> = ({ form }) => {
  // F4.1/U3.4: a confirmação de remoção vive aqui (na UI), via átomo
  // tokenizado `confirmDialog` — o hook `useBudgetForm` só remove.
  const handleRemove = async (index: number) => {
    const confirmed = await confirmDialog({
      title: "Tem certeza?",
      text: "Tem certeza que deseja remover este produto?",
      confirmText: "Sim, remover!",
    });
    if (confirmed) form.removeProduct(index);
  };

  return (
  <Box>
    <ProductSelector
      productList={form.productList}
      searchTerm={form.productSearchTerm}
      onSearchChange={form.setProductSearchTerm}
      onAddProduct={form.addProduct}
    />

    <ProductList
      products={form.selectedProducts}
      onRemove={handleRemove}
      onQuantityChange={form.updateProductQuantity}
      onSetQuantity={form.setProductQuantity}
      onValueChange={form.updateProductCustomValue}
      showOriginalValue={true}
    />

    {form.selectedProducts.length > 0 && (
      <Paper
        elevation={1}
        sx={{
          mt: 2,
          p: 2,
          borderRadius: 2,
          bgcolor: "primary.light",
          color: "primary.contrastText",
          textAlign: "right",
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Total: R$ {brMoneyMask(form.totalValue.toFixed(0))}
        </Typography>
      </Paper>
    )}
  </Box>
  );
};

export default ProductsSection;
