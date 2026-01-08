import React from "react";
import { Autocomplete, Box, Paper, TextField, Typography } from "@mui/material";
import { IProduct } from "../../interfaces/iproduct";

interface ProductSelectorProps {
  productList: IProduct[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onAddProduct: (product: IProduct) => void;
}

const ProductSelector: React.FC<ProductSelectorProps> = ({
  productList,
  searchTerm,
  onSearchChange,
  onAddProduct,
}) => {
  return (
    <Box display="flex" gap={2}>
      <Autocomplete
        options={productList}
        getOptionLabel={(option) => option.name}
        noOptionsText="Pesquise um produto cadastrado."
        inputValue={searchTerm}
        onInputChange={(_e, value) => onSearchChange(value)}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Busque um produto"
            required
            onChange={(e) => onSearchChange(e.target.value)}
          />
        )}
        onChange={(_event, value) => {
          if (value) {
            onAddProduct(value);
          }
        }}
        sx={{ flexGrow: 1 }}
        value={null}
      />
    </Box>
  );
};

export default ProductSelector;
