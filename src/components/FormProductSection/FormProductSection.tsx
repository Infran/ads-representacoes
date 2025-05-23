import {
  Autocomplete,
  Box,
  Button,
  Divider,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import {
  ArrowDropDown,
  ArrowDropUp,
  Delete,
} from "@mui/icons-material";
import { IProduct } from "../../interfaces/iproduct";
import { ISelectedProducts } from "../CreateBudget/CreateBudget";
import { brMoneyMask } from "../../utils/Masks";
import { useEffect, useState } from "react";
import useDebounce from "../../hooks/useDebounce";
import { searchProducts } from "../../services/productServices";
import Swal from "sweetalert2";

interface ProductSectionProps {
selectedProducts: ISelectedProducts[];
  onProductsChange: (products: ISelectedProducts[]) => void;
}

const FormProductSection: React.FC<ProductSectionProps> = ({
  selectedProducts,
  onProductsChange,
}) => {
  const [searchInput, setSearchInput] = useState("");
  const [productList, setProductList] = useState<IProduct[]>([]);
  let debouncedSearch = useDebounce(searchInput, 800);

  useEffect(() => {
    if (debouncedSearch) {
      searchProducts(debouncedSearch).then((products) => {
        setProductList(products);
      });
    } else {
      setProductList([]);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    onProductsChange(selectedProducts);
    console.log(selectedProducts);
  }, [selectedProducts, onProductsChange]);

  const handleAddProduct = (product: IProduct) => {
    const exists = selectedProducts.find((p) => p.product.id === product.id);
    if (exists) return;
    onProductsChange([...selectedProducts, { product, quantity: 1 }]);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = selectedProducts.map((item, i) =>
      i === index
        ? { ...item, quantity: Math.max(1, item.quantity + delta) }
        : item
    );
    onProductsChange(updated);
  };

  const handleRemoveProduct = (index: number) => {
    Swal.fire({
      title: "Remover produto?",
      text: "Tem certeza que deseja remover este produto?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim",
      cancelButtonText: "Cancelar",
    }).then((result) => {
      if (result.isConfirmed) {
        const updated = selectedProducts.filter((_, i) => i !== index);
        onProductsChange(updated);
      }
    });
  };

  const totalValue = selectedProducts.reduce(
    (acc, { product, quantity }) => acc + product.unitValue * quantity,
    0
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Produtos
      </Typography>

      <Autocomplete
        options={productList}
        getOptionLabel={(option) => option.name}
        inputValue={searchInput}
        getOptionDisabled={(option) => selectedProducts.some((p) => p.product.id === option.id)}
        onInputChange={(_, value) => setSearchInput(value)}
        onChange={(_, value) => value && handleAddProduct(value)}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        noOptionsText="Nenhum produto encontrado"

        renderInput={(params) => (
          <TextField {...params} label="Buscar produto" fullWidth />
        )}
        sx={{ mb: 3 }}
      />

<Box sx={{ p: 1,}}>
  {selectedProducts.map((item, index) => (
    <>
      <Paper
        key={item.product.id}
        elevation={1}
        sx={{
          p: 3,
          mb: 2,
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderRadius: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            {item.product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Valor unitário: R$ {brMoneyMask(item.product.unitValue.toString())}
          </Typography>
        </Box>

        <Box display="flex" alignItems="center" gap={1}>
          <Button size="small" onClick={() => handleUpdateQuantity(index, 1)}>
            <ArrowDropUp />
          </Button>

          <Typography>{item.quantity}</Typography>

          <Button size="small" onClick={() => handleUpdateQuantity(index, -1)}>
            <ArrowDropDown />
          </Button>

          <Button
            variant="outlined"
            color="error"
            size="small"
            onClick={() => handleRemoveProduct(index)}
            startIcon={<Delete />}
            sx={{ ml: 2 }}
          >
            Remover
          </Button>
        </Box>
      </Paper>
    </>
  ))}
</Box>


      {selectedProducts.length > 0 && (
        <Paper
          elevation={1}
          sx={{
            mt: 3,
            p: 2,
            borderRadius: 2,
            bgcolor: "#f9f9f9",
            textAlign: "right",
          }}
        >
          <Typography variant="h6" color="primary">
            Total: R$ {brMoneyMask(totalValue.toFixed(0))}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default FormProductSection;
